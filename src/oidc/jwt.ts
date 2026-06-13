import { KID, PRIVATE_JWK } from './keys'

// ------------------------------------------------------------------
// Minimal RS256 JWT signer + PKCE helpers, built on WebCrypto.
// Kept dependency-free so we control the exact header (kid) that the
// JWKS endpoint advertises.
// ------------------------------------------------------------------

function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function strToBase64Url(str: string): string {
  return bytesToBase64Url(new TextEncoder().encode(str))
}

let signingKeyPromise: Promise<CryptoKey> | null = null
function getSigningKey(): Promise<CryptoKey> {
  if (!signingKeyPromise) {
    signingKeyPromise = crypto.subtle.importKey(
      'jwk',
      PRIVATE_JWK,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    )
  }
  return signingKeyPromise
}

/** Sign a JWT with RS256 using the embedded mock key. */
export async function signRS256(payload: Record<string, unknown>): Promise<string> {
  const header = { alg: 'RS256', typ: 'JWT', kid: KID }
  const signingInput = `${strToBase64Url(JSON.stringify(header))}.${strToBase64Url(JSON.stringify(payload))}`
  const key = await getSigningKey()
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
  challenge: string,
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
