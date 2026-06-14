// ------------------------------------------------------------------
// OIDC signing key management.
//
// The RSA keypair is NOT stored in this repo. It is generated once per
// database (lazily, on first use) and persisted in the `system_config`
// table. Defense in depth at rest:
//   - the PRIVATE key is encrypted with AES-256-GCM before storage, using
//     a key-encryption-key (KEK) derived from the OIDC_KEK Worker secret.
//     A leak of the database alone (backup/export, read-only token) does
//     NOT expose the signing key — the attacker also needs the Worker secret.
//   - the PUBLIC key + kid are stored in clear (they are published via JWKS
//     anyway, so there is nothing to protect there).
//
// To rotate the signing key: delete the `oidc_keys` row from system_config;
// the next request regenerates it (existing tokens become invalid).
// Rotating OIDC_KEK also forces regeneration (the old envelope can no longer
// be decrypted and is transparently replaced).
// ------------------------------------------------------------------

const KEYS_ROW = 'oidc_keys'
const te = new TextEncoder()
const td = new TextDecoder()

export interface OidcKeys {
  kid: string
  privateJwk: JsonWebKey
  publicJwk: { kty: string; n: string; e: string }
}

// Stored envelope (v2): public parts in clear, private key AES-GCM encrypted.
interface Envelope {
  v: 2
  kid: string
  publicJwk: { kty: string; n: string; e: string }
  iv: string // base64url, 12 bytes
  ct: string // base64url, AES-256-GCM ciphertext of JSON.stringify(privateJwk)
}

// Per-isolate cache so we don't hit D1/crypto on every sign/JWKS request.
let cache: OidcKeys | null = null

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
  const material = kek || 'dev-only-insecure-oidc-kek-change-me'
  const hash = await crypto.subtle.digest('SHA-256', te.encode(material))
  return crypto.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
}

async function readKeys(db: D1Database, kek: string | undefined): Promise<OidcKeys | null> {
  const row = await db.prepare('SELECT value FROM system_config WHERE key = ?')
    .bind(KEYS_ROW).first<{ value: string }>()
  if (!row || !row.value) return null
  let env: any
  try { env = JSON.parse(row.value) } catch { return null }
  // Only the encrypted (v2) envelope is accepted. Legacy plaintext rows, or
  // rows encrypted under a different KEK, are reported as absent so they get
  // regenerated/replaced (see generateAndStore).
  if (env.v !== 2 || !env.iv || !env.ct) return null
  try {
    const key = await deriveKek(kek)
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64u(env.iv) }, key, fromB64u(env.ct))
    const privateJwk = JSON.parse(td.decode(pt)) as JsonWebKey
    return { kid: env.kid, privateJwk, publicJwk: env.publicJwk }
  } catch {
    return null
  }
}

async function buildEnvelope(kek: string | undefined): Promise<{ env: Envelope; keys: OidcKeys }> {
  const pair = (await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify']
  )) as CryptoKeyPair

  const privateJwk = (await crypto.subtle.exportKey('jwk', pair.privateKey)) as JsonWebKey
  const pub = (await crypto.subtle.exportKey('jwk', pair.publicKey)) as JsonWebKey
  const publicJwk = { kty: pub.kty!, n: pub.n!, e: pub.e! }
  const kid = crypto.randomUUID()

  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKek(kek)
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, te.encode(JSON.stringify(privateJwk)))

  const env: Envelope = { v: 2, kid, publicJwk, iv: b64u(iv), ct: b64u(ct) }
  return { env, keys: { kid, privateJwk, publicJwk } }
}

async function generateAndStore(db: D1Database, kek: string | undefined): Promise<OidcKeys> {
  const { env } = await buildEnvelope(kek)

  // Single-row INSERT OR IGNORE: if two isolates race on first use, one wins
  // and both then read back the same (winning) envelope — never a mismatched
  // public/private pair.
  await db.prepare('INSERT OR IGNORE INTO system_config (key, value) VALUES (?, ?)')
    .bind(KEYS_ROW, JSON.stringify(env)).run()

  const stored = await readKeys(db, kek)
  if (stored) return stored

  // The slot is occupied by a row we can't decrypt (legacy plaintext, or an
  // envelope under an old KEK). Replace it so the IdP can keep signing.
  await db.prepare('INSERT OR REPLACE INTO system_config (key, value) VALUES (?, ?)')
    .bind(KEYS_ROW, JSON.stringify(env)).run()
  return (await readKeys(db, kek))!
}

export async function getOidcKeys(db: D1Database, kek?: string): Promise<OidcKeys> {
  if (cache) return cache
  cache = (await readKeys(db, kek)) || (await generateAndStore(db, kek))
  return cache
}
