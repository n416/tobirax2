import { describe, it, expect } from 'vitest'
import { signJwtRS256, verifyJwtRS256 } from '../../src/oidc/jwt'

// RS256 署名→検証のラウンドトリップ。鍵注入コア(signJwtRS256 / verifyJwtRS256)は
// DB に触れないので、テストで生成した RSA 鍵を直接渡して crypto コアだけを検証できる。
type PublicJwk = { kty: string; n: string; e: string; kid: string }

// テスト用に新鮮な RSA 鍵対を作り、署名鍵(秘密)と JWKS 1件(公開)を返す。
async function freshKey(kid = crypto.randomUUID()): Promise<{
  signingKey: { kid: string; key: CryptoKey }
  jwk: PublicJwk
}> {
  const pair = (await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify']
  )) as CryptoKeyPair
  const pub = (await crypto.subtle.exportKey('jwk', pair.publicKey)) as JsonWebKey
  return {
    signingKey: { kid, key: pair.privateKey },
    jwk: { kty: pub.kty!, n: pub.n!, e: pub.e!, kid },
  }
}

// JWT のヘッダ部(base64url)をデコードして返す。
function decodeHeader(token: string): any {
  const b = token.split('.')[0].replace(/-/g, '+').replace(/_/g, '/')
  return JSON.parse(Buffer.from(b, 'base64').toString('utf-8'))
}

describe('OIDC: RS256 署名→検証ラウンドトリップ(鍵注入)', () => {
  it('署名した JWT を同じ鍵の JWKS で検証するとペイロードが復元される', async () => {
    const { signingKey, jwk } = await freshKey()
    const payload = { iss: 'https://idp.example', sub: 'u1', aud: 'app1', exp: 9999999999 }
    const token = await signJwtRS256(payload, signingKey)
    expect(token.split('.')).toHaveLength(3)
    expect(await verifyJwtRS256(token, [jwk])).toEqual(payload)
  })

  it('ヘッダに alg=RS256 / kid / typ が入る(typ 既定は JWT)', async () => {
    const { signingKey } = await freshKey('kid-abc')
    const token = await signJwtRS256({ sub: 'u1' }, signingKey)
    expect(decodeHeader(token)).toEqual({ alg: 'RS256', typ: 'JWT', kid: 'kid-abc' })
  })

  it('typ を指定すると反映される(Back-Channel Logout の logout+jwt)', async () => {
    const { signingKey } = await freshKey()
    const token = await signJwtRS256({ sub: 'u1' }, signingKey, 'logout+jwt')
    expect(decodeHeader(token).typ).toBe('logout+jwt')
  })

  it('別の鍵で署名されたトークンは検証に失敗して null', async () => {
    const signer = await freshKey()
    const other = await freshKey() // 公開鍵だけ別物(kid も別)
    const token = await signJwtRS256({ sub: 'u1' }, signer.signingKey)
    expect(await verifyJwtRS256(token, [other.jwk])).toBeNull()
  })

  it('kid が JWKS に存在しなければ候補ゼロで null', async () => {
    const { signingKey } = await freshKey('signed-with-this-kid')
    const stranger = await freshKey('different-kid')
    const token = await signJwtRS256({ sub: 'u1' }, signingKey)
    // 署名は stranger の鍵では一致しないが、そもそも kid 不一致で候補に挙がらない。
    expect(await verifyJwtRS256(token, [stranger.jwk])).toBeNull()
  })

  it('複数鍵の JWKS から kid で正しい鍵を選んで検証できる', async () => {
    const a = await freshKey('kid-a')
    const b = await freshKey('kid-b')
    const token = await signJwtRS256({ sub: 'u-b' }, b.signingKey)
    // 並びに関係なく kid=kid-b の鍵で検証が通る。
    expect(await verifyJwtRS256(token, [a.jwk, b.jwk])).toEqual({ sub: 'u-b' })
  })

  it('3 セグメントでないトークンは null', async () => {
    const { jwk } = await freshKey()
    expect(await verifyJwtRS256('not-a-jwt', [jwk])).toBeNull()
    expect(await verifyJwtRS256('a.b', [jwk])).toBeNull()
  })

  it('ヘッダ/ペイロードが壊れた base64 の場合 null', async () => {
    const { jwk } = await freshKey()
    expect(await verifyJwtRS256('@@@.@@@.@@@', [jwk])).toBeNull()
  })
})
