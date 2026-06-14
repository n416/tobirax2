import { getOidcKeys } from './keys'

// ------------------------------------------------------------------
// Minimal RS256 JWT signer + PKCE helpers, built on WebCrypto.
// The signing key is resolved per-request from the database (see keys.ts)
// so no private key material lives in source.
// ------------------------------------------------------------------

function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function strToBase64Url(str: string): string {
  return bytesToBase64Url(new TextEncoder().encode(str))
}

// Cache the imported CryptoKey per isolate, keyed by kid.
let signingKeyCache: { kid: string; key: CryptoKey } | null = null

async function getSigningKey(db: D1Database, kek?: string): Promise<{ kid: string; key: CryptoKey }> {
  const { kid, privateJwk } = await getOidcKeys(db, kek)
  if (signingKeyCache && signingKeyCache.kid === kid) return signingKeyCache
  const key = await crypto.subtle.importKey(
    'jwk',
    privateJwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )
  signingKeyCache = { kid, key }
  return signingKeyCache
}

/** Sign a JWT with RS256 using the database-backed mock key. */
export async function signRS256(payload: Record<string, unknown>, db: D1Database, kek?: string): Promise<string> {
  const { kid, key } = await getSigningKey(db, kek)
  const header = { alg: 'RS256', typ: 'JWT', kid }
  const signingInput = `${strToBase64Url(JSON.stringify(header))}.${strToBase64Url(JSON.stringify(payload))}`
  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signingInput)
  )
  return `${signingInput}.${bytesToBase64Url(new Uint8Array(sig))}`
}

/** Verify a PKCE code_verifier against the stored code_challenge. */
export async function verifyPkce(
  verifier: string,
  challenge: string | null | undefined,
  method: string | null | undefined
): Promise<boolean> {
  if (!challenge) return true // no PKCE was requested
  if (!verifier) return false
  if (!method || method.toUpperCase() === 'PLAIN') {
    return verifier === challenge
  }
  // S256: BASE64URL(SHA256(verifier)) === challenge
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return bytesToBase64Url(new Uint8Array(digest)) === challenge
}
