// ------------------------------------------------------------------
// OIDC signing key management — encrypted at rest + overlapping rotation.
//
// Keys live in the `system_config` row `oidc_keys` as a SET (v3) of envelopes.
// Each envelope:  { kid, publicJwk, iv, ct, createdAt }
//   - PRIVATE key (ct) is AES-256-GCM encrypted with a KEK derived from the
//     OIDC_KEK Worker secret. A DB-only leak does not expose the signing key.
//   - PUBLIC key + kid are stored in clear (published via JWKS anyway).
//
// Rotation (overlapping, kid-based):
//   - Signing always uses the NEWEST key.
//   - After ROTATION_INTERVAL the next request mints a fresh key and signs
//     with it; the previous public key stays in JWKS until RETENTION so that
//     tokens already issued under it still verify. Then it is pruned.
//
// Manual rotation: delete the `oidc_keys` row (regenerates from scratch).
// Changing OIDC_KEK forces regeneration (old envelopes can't be decrypted).
// ------------------------------------------------------------------

const KEYS_ROW = 'oidc_keys'
const te = new TextEncoder()
const td = new TextDecoder()

// Sign with a fresh key after this age; keep older PUBLIC keys this long for
// overlap so in-flight tokens still verify. RETENTION > ROTATION guarantees a
// window where both the old and new key are in JWKS.
const ROTATION_INTERVAL_S = 30 * 24 * 3600
const RETENTION_S = ROTATION_INTERVAL_S + 7 * 24 * 3600

export interface OidcKeys {
  kid: string
  privateJwk: JsonWebKey
  publicJwk: { kty: string; n: string; e: string }
}

interface KeyEnvelope {
  kid: string
  publicJwk: { kty: string; n: string; e: string }
  iv: string // base64url, 12 bytes
  ct: string // base64url, AES-256-GCM ciphertext of JSON.stringify(privateJwk)
  createdAt: number // seconds
}
interface StoredSet { v: 3; keys: KeyEnvelope[] }

export interface Keyset {
  active: OidcKeys // newest key, used for signing (decrypted private)
  jwks: Array<{ kty: string; n: string; e: string; kid: string }> // all retained public keys
}

// Per-isolate cache (short TTL) so we don't hit D1/crypto on every request,
// while still picking up a rotation/manual change within a few minutes even
// on a long-lived isolate.
let cache: { keyset: Keyset; expires: number } | null = null
const CACHE_TTL_S = 300

const b64u = (b: ArrayBuffer | Uint8Array): string => {
  const bytes = b instanceof Uint8Array ? b : new Uint8Array(b)
  let bin = ''
  for (const x of bytes) bin += String.fromCharCode(x)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
const fromB64u = (s: string): Uint8Array => {
  s = s.replace(/-/g, '+').replace(/_/g, '/')
  while (s.length % 4) s += '='
  const bin = atob(s)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

// Derive a 32-byte AES-GCM key from the (any-length) KEK secret material.
// Local dev falls back to a fixed value, mirroring how JWT_SECRET is handled.
async function deriveKek(kek: string | undefined): Promise<CryptoKey> {
  if (!kek) throw new Error('Missing OIDC_KEK');
  const material = kek;
  const hash = await crypto.subtle.digest('SHA-256', te.encode(material))
  return crypto.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
}

async function decryptPrivate(env: KeyEnvelope, kekKey: CryptoKey): Promise<JsonWebKey | null> {
  try {
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64u(env.iv) }, kekKey, fromB64u(env.ct))
    return JSON.parse(td.decode(pt)) as JsonWebKey
  } catch {
    return null
  }
}

async function buildEnvelope(kekKey: CryptoKey, now: number): Promise<KeyEnvelope> {
  const pair = (await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify']
  )) as CryptoKeyPair
  const privateJwk = (await crypto.subtle.exportKey('jwk', pair.privateKey)) as JsonWebKey
  const pub = (await crypto.subtle.exportKey('jwk', pair.publicKey)) as JsonWebKey
  const publicJwk = { kty: pub.kty!, n: pub.n!, e: pub.e! }
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, kekKey, te.encode(JSON.stringify(privateJwk)))
  return { kid: crypto.randomUUID(), publicJwk, iv: b64u(iv), ct: b64u(ct), createdAt: now }
}

// Parse the stored row into a list of envelopes. Returns wasV3=false for an
// absent row, a legacy v2 single-envelope (migrated in place), or anything
// unrecognised (legacy plaintext) — so the caller persists the v3 format.
function parseStored(value: string | undefined, now: number): { envs: KeyEnvelope[]; wasV3: boolean } {
  if (!value) return { envs: [], wasV3: false }
  let v: any
  try { v = JSON.parse(value) } catch { return { envs: [], wasV3: false } }
  if (v && v.v === 3 && Array.isArray(v.keys)) return { envs: v.keys as KeyEnvelope[], wasV3: true }
  if (v && v.v === 2 && v.iv && v.ct && v.kid && v.publicJwk) {
    return { envs: [{ kid: v.kid, publicJwk: v.publicJwk, iv: v.iv, ct: v.ct, createdAt: now }], wasV3: false }
  }
  return { envs: [], wasV3: false }
}

async function loadKeyset(db: D1Database, kek: string | undefined): Promise<Keyset> {
  const now = Math.floor(Date.now() / 1000)
  const kekKey = await deriveKek(kek)

  const read = async () => {
    const row = await db.prepare('SELECT value FROM system_config WHERE key = ?').bind(KEYS_ROW).first<{ value: string }>()
    const { envs, wasV3 } = parseStored(row?.value, now)
    envs.sort((a, b) => b.createdAt - a.createdAt) // newest first
    return { envs, wasV3, hadRow: !!row?.value }
  }
  const findActive = async (envs: KeyEnvelope[]): Promise<{ env: KeyEnvelope; priv: JsonWebKey } | null> => {
    for (const e of envs) {
      const priv = await decryptPrivate(e, kekKey)
      if (priv) return { env: e, priv }
    }
    return null
  }

  let { envs, wasV3, hadRow } = await read()
  let act = await findActive(envs)
  let changed = hadRow && !wasV3 // migrated legacy/v2 → persist as v3

  // Cold start (no usable key): seed race-safely with INSERT OR IGNORE.
  if (!act) {
    const fresh = await buildEnvelope(kekKey, now)
    await db.prepare('INSERT OR IGNORE INTO system_config (key, value) VALUES (?, ?)')
      .bind(KEYS_ROW, JSON.stringify({ v: 3, keys: [fresh] } as StoredSet)).run()
    ;({ envs } = await read())
    act = await findActive(envs)
    if (!act) {
      // A stale/undecryptable row (legacy plaintext or old KEK) is occupying
      // the slot — replace it wholesale so the IdP can sign.
      await db.prepare('INSERT OR REPLACE INTO system_config (key, value) VALUES (?, ?)')
        .bind(KEYS_ROW, JSON.stringify({ v: 3, keys: [fresh] } as StoredSet)).run()
      envs = [fresh]
      act = { env: fresh, priv: (await decryptPrivate(fresh, kekKey))! }
    }
    changed = false // already persisted above
  }

  // Time-based rotation: mint a fresh key and sign with it once the active key
  // ages past the interval. The old public key stays for verification (below).
  if (act.env.createdAt < now - ROTATION_INTERVAL_S) {
    const fresh = await buildEnvelope(kekKey, now)
    envs = [fresh, ...envs]
    act = { env: fresh, priv: (await decryptPrivate(fresh, kekKey))! }
    changed = true
  }

  // Prune public keys past retention (never drop the active one).
  const kept = envs.filter(e => e.kid === act!.env.kid || e.createdAt >= now - RETENTION_S)
  if (kept.length !== envs.length) changed = true
  envs = kept

  if (changed) {
    await db.prepare('INSERT OR REPLACE INTO system_config (key, value) VALUES (?, ?)')
      .bind(KEYS_ROW, JSON.stringify({ v: 3, keys: envs } as StoredSet)).run()
  }

  return {
    active: { kid: act.env.kid, privateJwk: act.priv, publicJwk: act.env.publicJwk },
    jwks: envs.map(e => ({ ...e.publicJwk, kid: e.kid })),
  }
}

async function getKeyset(db: D1Database, kek: string | undefined): Promise<Keyset> {
  const now = Math.floor(Date.now() / 1000)
  if (cache && cache.expires > now) return cache.keyset
  const keyset = await loadKeyset(db, kek)
  cache = { keyset, expires: now + CACHE_TTL_S }
  return keyset
}

/** The active (newest) key, used for signing. */
export async function getOidcKeys(db: D1Database, kek?: string): Promise<OidcKeys> {
  return (await getKeyset(db, kek)).active
}

/** All retained public keys, for the JWKS endpoint. */
export async function getJwksKeys(db: D1Database, kek?: string): Promise<Keyset['jwks']> {
  return (await getKeyset(db, kek)).jwks
}
