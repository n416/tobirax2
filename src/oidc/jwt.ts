import { getOidcKeys, getJwksKeys } from './keys'

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

function base64UrlToBytes(s: string): Uint8Array {
  s = s.replace(/-/g, '+').replace(/_/g, '/')
  while (s.length % 4) s += '='
  const bin = atob(s)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
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

/**
 * Sign a JWT with RS256 using the database-backed mock key. `typ` defaults to
 * `JWT`; pass `logout+jwt` for OIDC Back-Channel Logout tokens (spec §2.4).
 */
export async function signRS256(payload: Record<string, unknown>, db: D1Database, kek?: string, typ = 'JWT'): Promise<string> {
  const { kid, key } = await getSigningKey(db, kek)
  const header = { alg: 'RS256', typ, kid }
  const signingInput = `${strToBase64Url(JSON.stringify(header))}.${strToBase64Url(JSON.stringify(payload))}`
  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signingInput)
  )
  return `${signingInput}.${bytesToBase64Url(new Uint8Array(sig))}`
}

// Cache imported verification keys per isolate, keyed by kid.
const verifyKeyCache = new Map<string, CryptoKey>()

/**
 * Verify an RS256 JWT we issued and return its payload, or null if the
 * signature does not match any current JWKS key. Signature-only: expiry is NOT
 * checked, since the main caller is RP-initiated logout (OIDC `id_token_hint`),
 * where the hint id_token is routinely already expired.
 */
export async function verifyRS256(
  token: string,
  db: D1Database,
  kek?: string
): Promise<Record<string, unknown> | null> {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  let header: { kid?: string; alg?: string }
  let payload: Record<string, unknown>
  try {
    header = JSON.parse(new TextDecoder().decode(base64UrlToBytes(parts[0])))
    payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(parts[1])))
  } catch {
    return null
  }
  if (header.alg !== 'RS256') return null

  const jwks = await getJwksKeys(db, kek)
  // Match by kid when present; otherwise try every retained key.
  const candidates = header.kid ? jwks.filter(k => k.kid === header.kid) : jwks
  const sig = base64UrlToBytes(parts[2])
  const signedBytes = new TextEncoder().encode(`${parts[0]}.${parts[1]}`)

  for (const jwk of candidates) {
    let key = verifyKeyCache.get(jwk.kid)
    if (!key) {
      try {
        key = await crypto.subtle.importKey(
          'jwk',
          { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
          { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
          false,
          ['verify']
        )
      } catch {
        continue
      }
      verifyKeyCache.set(jwk.kid, key)
    }
    const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, sig, signedBytes)
    if (ok) return payload
  }
  return null
}

/** Verify a PKCE code_verifier against the stored code_challenge. */
export async function verifyPkce(
  verifier: string,
  challenge: string | null | undefined,
  method: string | null | undefined
): Promise<boolean> {
  if (!challenge) return true // no PKCE was requested
  if (!verifier) return false
  // Only S256 is supported; `plain` is abolished (OAuth 2.1 / RFC 7636 BCP).
  // /authorize already rejects non-S256 challenges, so this is defense in depth
  // for any code that reaches the token endpoint.
  if (!method || method.toUpperCase() !== 'S256') return false
  // S256: BASE64URL(SHA256(verifier)) === challenge
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return bytesToBase64Url(new Uint8Array(digest)) === challenge
}
