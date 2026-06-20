import { describe, it, expect } from 'vitest'
import {
  isAllowedRedirectUri,
  buildRedirect,
  computeAtHash,
  buildOidcClaims,
  safeEqual,
  parseBasicAuth,
  isSafeReturnTo,
} from '../../src/index'
import type { User } from '../../src/types'

// OIDC / OAuth2 のエンドポイントが使う純粋ヘルパ群。DB を介さないロジックのみ。

describe('OIDC: isAllowedRedirectUri', () => {
  it('redirect_uris が登録済みなら完全一致のみ許可', () => {
    const app = {
      base_url: 'https://app.example.com',
      redirect_uris: 'https://app.example.com/cb\nhttps://app.example.com/cb2',
    }
    expect(isAllowedRedirectUri('https://app.example.com/cb', app)).toBe(true)
    expect(isAllowedRedirectUri('https://app.example.com/cb2', app)).toBe(true)
    // 登録リストがある場合は base_url のプレフィックス一致では許可しない。
    expect(isAllowedRedirectUri('https://app.example.com/other', app)).toBe(false)
  })

  it('登録リストが無ければ base_url の origin + パスプレフィックスで許可', () => {
    const app = { base_url: 'https://app.example.com/app', redirect_uris: null }
    expect(isAllowedRedirectUri('https://app.example.com/app', app)).toBe(true)
    expect(isAllowedRedirectUri('https://app.example.com/app/callback', app)).toBe(true)
    // 別オリジンは不可。
    expect(isAllowedRedirectUri('https://evil.example.com/app', app)).toBe(false)
    // パスプレフィックスの外は不可(/app の兄弟 /application を弾く)。
    expect(isAllowedRedirectUri('https://app.example.com/application', app)).toBe(false)
  })

  it('http は localhost/127.0.0.1 のみ許可、それ以外の http は拒否', () => {
    expect(
      isAllowedRedirectUri('http://localhost:3000/cb', { base_url: 'http://localhost:3000', redirect_uris: null }),
    ).toBe(true)
    expect(
      isAllowedRedirectUri('http://app.example.com/cb', { base_url: 'http://app.example.com', redirect_uris: null }),
    ).toBe(false)
  })

  it('不正な URL は false', () => {
    expect(isAllowedRedirectUri('not a url', { base_url: 'https://app.example.com', redirect_uris: null })).toBe(false)
  })

  it('base_url が origin ルートなら任意のパスを許可', () => {
    const app = { base_url: 'https://app.example.com', redirect_uris: null }
    expect(isAllowedRedirectUri('https://app.example.com/any/deep/path', app)).toBe(true)
  })

  it('base_url 末尾のスラッシュは正規化される', () => {
    const app = { base_url: 'https://app.example.com/app/', redirect_uris: null }
    expect(isAllowedRedirectUri('https://app.example.com/app', app)).toBe(true)
    expect(isAllowedRedirectUri('https://app.example.com/app/cb', app)).toBe(true)
  })

  it('プレフィックス一致モードでは redirect_uri のクエリ文字列は無視される', () => {
    // 登録リストが無い場合はパス前方一致で判定し、クエリは比較対象外。
    const app = { base_url: 'https://app.example.com/app', redirect_uris: null }
    expect(isAllowedRedirectUri('https://app.example.com/app?foo=1', app)).toBe(true)
  })

  it('登録リストモードでは完全一致が必要でクエリ違いは拒否(プレフィックスモードとの非対称)', () => {
    const app = { base_url: 'https://app.example.com', redirect_uris: 'https://app.example.com/cb' }
    expect(isAllowedRedirectUri('https://app.example.com/cb', app)).toBe(true)
    expect(isAllowedRedirectUri('https://app.example.com/cb?foo=1', app)).toBe(false)
  })
})

describe('OIDC: buildRedirect', () => {
  it('query モード(既定)はクエリ文字列で連結する', () => {
    expect(buildRedirect('https://rp/cb', undefined, { code: 'abc', state: 'xyz' })).toBe(
      'https://rp/cb?code=abc&state=xyz',
    )
  })

  it('既にクエリがある redirect_uri には & で追加する', () => {
    expect(buildRedirect('https://rp/cb?foo=1', undefined, { code: 'abc' })).toBe('https://rp/cb?foo=1&code=abc')
  })

  it('fragment モードは # で連結する', () => {
    expect(buildRedirect('https://rp/cb', 'fragment', { error: 'access_denied' })).toBe(
      'https://rp/cb#error=access_denied',
    )
  })

  it('null/空のパラメータは省く', () => {
    expect(buildRedirect('https://rp/cb', undefined, { code: 'abc', state: undefined })).toBe('https://rp/cb?code=abc')
  })
})

describe('OIDC: computeAtHash (at_hash)', () => {
  it('access_token から base64url の at_hash を生成する', async () => {
    const hash = await computeAtHash('some-access-token')
    expect(hash).toMatch(/^[A-Za-z0-9_-]+$/) // パディング無し base64url
    expect(hash).not.toContain('=')
  })

  it('同じトークンは同じ at_hash、違うトークンは違う at_hash', async () => {
    expect(await computeAtHash('tok-a')).toBe(await computeAtHash('tok-a'))
    expect(await computeAtHash('tok-a')).not.toBe(await computeAtHash('tok-b'))
  })

  it('SHA-256 の左半分(128ビット=16バイト)なので 22 文字の base64url', async () => {
    expect((await computeAtHash('x')).length).toBe(22)
  })

  it('OIDC Core 仕様の例と一致する(既知ベクタ)', async () => {
    // OIDC Core 1.0: access_token のこの値に対する at_hash の公式例。
    expect(await computeAtHash('jHkWEdUXMU1BwAsC4vtUsZwnNvTIxEl0z9K3vx5KF0Y')).toBe('77QmUPtjPfzWtF2AnpK9RQ')
  })
})

describe('OIDC: buildOidcClaims (scope→クレーム写像, OIDC Core 5.4)', () => {
  const user = {
    id: 'u1',
    email: 'alice@example.com',
    email_verified: 1,
    name: 'Alice',
    preferred_username: 'alice',
    picture: 'https://img/alice.png',
    updated_at: 1700000000,
  } as unknown as User

  it('openid のみでは profile/email クレームを漏らさない', () => {
    expect(buildOidcClaims(user, 'openid')).toEqual({})
  })

  it('email スコープで email と email_verified を返す', () => {
    expect(buildOidcClaims(user, 'openid email')).toEqual({
      email: 'alice@example.com',
      email_verified: true,
    })
  })

  it('profile スコープで name 等を返す', () => {
    const claims = buildOidcClaims(user, 'openid profile')
    expect(claims.name).toBe('Alice')
    expect(claims.preferred_username).toBe('alice')
    expect(claims.picture).toBe('https://img/alice.png')
    expect(claims.email).toBeUndefined()
  })

  it('name 未設定なら email にフォールバックする', () => {
    const u = { ...(user as any), name: null, preferred_username: null } as unknown as User
    const claims = buildOidcClaims(u, 'profile')
    expect(claims.name).toBe('alice@example.com')
    expect(claims.preferred_username).toBe('alice@example.com')
  })

  it('scope が null/空なら何も返さない', () => {
    expect(buildOidcClaims(user, null)).toEqual({})
    expect(buildOidcClaims(user, '')).toEqual({})
  })

  it('offline_access はクレームを生まない(リフレッシュトークン用の scope)', () => {
    expect(buildOidcClaims(user, 'openid offline_access')).toEqual({})
  })

  it('profile + email を同時に要求すれば両方返す', () => {
    const claims = buildOidcClaims(user, 'openid profile email')
    expect(claims.name).toBe('Alice')
    expect(claims.email).toBe('alice@example.com')
    expect(claims.email_verified).toBe(true)
  })

  it('picture 未設定なら picture クレームは付かない', () => {
    const u = { ...(user as any), picture: null } as unknown as User
    expect(buildOidcClaims(u, 'profile')).not.toHaveProperty('picture')
  })
})

describe('OIDC: safeEqual (定数時間比較)', () => {
  it('等しい文字列は true、異なるものは false', () => {
    expect(safeEqual('secret', 'secret')).toBe(true)
    expect(safeEqual('secret', 'secreT')).toBe(false)
  })
  it('長さが違えば false', () => {
    expect(safeEqual('abc', 'abcd')).toBe(false)
  })
  it('非文字列は false', () => {
    expect(safeEqual(undefined as any, 'x')).toBe(false)
  })
})

describe('OIDC: parseBasicAuth (client_secret_basic)', () => {
  const ctx = (header: string | undefined) => ({ req: { header: () => header } }) as any

  it('Basic ヘッダから clientId と secret を取り出す', () => {
    const creds = btoa('client123:s3cr3t')
    expect(parseBasicAuth(ctx('Basic ' + creds))).toEqual({ clientId: 'client123', secret: 's3cr3t' })
  })

  it('パーセントエンコードされた資格情報をデコードする', () => {
    const creds = btoa('cli%40ent:pa%3Ass')
    expect(parseBasicAuth(ctx('Basic ' + creds))).toEqual({ clientId: 'cli@ent', secret: 'pa:ss' })
  })

  it('Basic でなければ空オブジェクト', () => {
    expect(parseBasicAuth(ctx('Bearer xyz'))).toEqual({})
    expect(parseBasicAuth(ctx(undefined))).toEqual({})
  })
})

describe('OIDC: isSafeReturnTo', () => {
  it('/authorize で始まる相対パスのみ安全', () => {
    expect(isSafeReturnTo('/authorize?client_id=x')).toBe(true)
    expect(isSafeReturnTo('https://evil.com/authorize')).toBe(false)
    expect(isSafeReturnTo('/dashboard')).toBe(false)
    expect(isSafeReturnTo(null)).toBe(false)
  })
})
