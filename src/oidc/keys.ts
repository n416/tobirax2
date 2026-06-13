// ------------------------------------------------------------------
// OIDC signing key management.
//
// The RSA keypair is NOT stored in this repo. Instead it is generated
// once per database (lazily, on first use) and persisted in the
// `system_config` table. That means:
//   - no private key material lives in source control
//   - every deployment / database gets its own unique key
//   - an accidentally-public instance cannot be forged against using
//     repo knowledge alone
//
// To rotate the key: delete the `oidc_keys` row from system_config;
// the next request regenerates it (existing tokens become invalid).
// ------------------------------------------------------------------

const KEYS_ROW = 'oidc_keys'

export interface OidcKeys {
  kid: string
  privateJwk: JsonWebKey
  publicJwk: { kty: string; n: string; e: string }
}

// Per-isolate cache so we don't hit D1 on every sign/JWKS request.
let cache: OidcKeys | null = null

async function readKeys(db: D1Database): Promise<OidcKeys | null> {
  const row = await db.prepare('SELECT value FROM system_config WHERE key = ?')
    .bind(KEYS_ROW).first<{ value: string }>()
  if (!row || !row.value) return null
  try { return JSON.parse(row.value) as OidcKeys } catch { return null }
}

async function generateAndStore(db: D1Database): Promise<OidcKeys> {
  const pair = (await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify']
  )) as CryptoKeyPair

  const privateJwk = (await crypto.subtle.exportKey('jwk', pair.privateKey)) as JsonWebKey
  const pub = (await crypto.subtle.exportKey('jwk', pair.publicKey)) as JsonWebKey
  const keys: OidcKeys = {
    kid: crypto.randomUUID(),
    privateJwk,
    publicJwk: { kty: pub.kty!, n: pub.n!, e: pub.e! },
  }

  // Single-row INSERT OR IGNORE: if two isolates race on first use, one
  // wins and both then read back the same (winning) keypair — never a
  // mismatched public/private pair.
  await db.prepare('INSERT OR IGNORE INTO system_config (key, value) VALUES (?, ?)')
    .bind(KEYS_ROW, JSON.stringify(keys)).run()

  return (await readKeys(db))!
}

export async function getOidcKeys(db: D1Database): Promise<OidcKeys> {
  if (cache) return cache
  cache = (await readKeys(db)) || (await generateAndStore(db))
  return cache
}
