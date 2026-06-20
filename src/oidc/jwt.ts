import { getOidcKeys, getJwksKeys } from './keys'

// ------------------------------------------------------------------
// WebCrypto ベースの最小限の RS256 JWT 署名器 + PKCE ヘルパー。
// 署名鍵はリクエストごとにデータベースから取得する(keys.ts 参照)ため、
// 秘密鍵の実体はソース上に存在しない。
// ------------------------------------------------------------------

// base64url コーデック群。署名/検証の土台であり JWT の各セグメントを符号化する。
// 純粋関数なのでパディング/バイナリのエッジを直接ユニットテストできるよう export する。
export function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function strToBase64Url(str: string): string {
  return bytesToBase64Url(new TextEncoder().encode(str))
}

export function base64UrlToBytes(s: string): Uint8Array {
  s = s.replace(/-/g, '+').replace(/_/g, '/')
  while (s.length % 4) s += '='
  const bin = atob(s)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

// インポート済み CryptoKey を kid をキーに isolate ごとにキャッシュする。
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

// 検証で受け取る公開 JWK の最小形。JWKS エンドポイント(getJwksKeys)が返す形と揃える。
type PublicJwk = { kty: string; n: string; e: string; kid: string }

/**
 * 注入された署名鍵で JWT を RS256 署名する内部コア。DB に触れないため、テストで任意の
 * CryptoKey を渡して署名→検証のラウンドトリップを純粋に検証できる(公開 API は signRS256)。
 */
export async function signJwtRS256(
  payload: Record<string, unknown>,
  signingKey: { kid: string; key: CryptoKey },
  typ = 'JWT'
): Promise<string> {
  const { kid, key } = signingKey
  const header = { alg: 'RS256', typ, kid }
  const signingInput = `${strToBase64Url(JSON.stringify(header))}.${strToBase64Url(JSON.stringify(payload))}`
  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signingInput)
  )
  return `${signingInput}.${bytesToBase64Url(new Uint8Array(sig))}`
}

/**
 * DBに保持したモック鍵で JWT を RS256 署名する。`typ` は既定で `JWT`。
 * OIDC Back-Channel Logout のトークンには `logout+jwt` を渡す(仕様 §2.4)。
 * 署名鍵を DB から解決し、コア(signJwtRS256)に注入する薄いラッパ。
 */
export async function signRS256(payload: Record<string, unknown>, db: D1Database, kek?: string, typ = 'JWT'): Promise<string> {
  return signJwtRS256(payload, await getSigningKey(db, kek), typ)
}

// インポート済みの検証用鍵を kid をキーに isolate ごとにキャッシュする。
const verifyKeyCache = new Map<string, CryptoKey>()

// テスト用フック: 署名/検証鍵のインポート済みキャッシュを破棄する。これらは kid をキーに
// しているため(kid が変われば再 import / Map は kid 別)異なる鍵を取り違えはしないが、
// テストでキャッシュを完全に cold-start させたいときのために用意する。本番経路では使わない。
export function resetSigningKeyCachesForTests(): void {
  signingKeyCache = null
  verifyKeyCache.clear()
}

/**
 * 注入された JWKS(公開鍵集合)で RS256 JWT を検証する内部コア。DB に触れないため、テストで
 * 任意の公開鍵を渡せる。署名のみ検証で有効期限(exp)は確認しない(理由は verifyRS256 参照)。
 * 現行 JWKS のどの鍵とも署名が一致しなければ null。
 */
export async function verifyJwtRS256(
  token: string,
  jwks: PublicJwk[]
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

  // kid があればそれで照合し、無ければ保持中の全鍵を順に試す。
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

/**
 * 自身が発行した RS256 JWT を検証してペイロードを返す。現行 JWKS のどの鍵とも
 * 署名が一致しなければ null。署名のみ検証で有効期限(exp)は確認しない。主な呼び出し元が
 * RP起点ログアウト(OIDC `id_token_hint`)であり、その id_token は通常すでに失効している
 * ためである。JWKS を DB から解決し、コア(verifyJwtRS256)に注入する薄いラッパ。
 */
export async function verifyRS256(
  token: string,
  db: D1Database,
  kek?: string
): Promise<Record<string, unknown> | null> {
  return verifyJwtRS256(token, await getJwksKeys(db, kek))
}

/** 保存済みの code_challenge に対して PKCE の code_verifier を検証する。 */
export async function verifyPkce(
  verifier: string,
  challenge: string | null | undefined,
  method: string | null | undefined
): Promise<boolean> {
  if (!challenge) return true // PKCE が要求されていない
  if (!verifier) return false
  // S256 のみ対応。`plain` は廃止済み(OAuth 2.1 / RFC 7636 のセキュリティBCP)。
  // /authorize の時点で S256 以外の challenge は既に拒否しているため、これはトークン
  // エンドポイントに到達したコードに対する多層防御。
  if (!method || method.toUpperCase() !== 'S256') return false
  // S256: BASE64URL(SHA256(verifier)) === challenge
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return bytesToBase64Url(new Uint8Array(digest)) === challenge
}
