// ------------------------------------------------------------------
// 統合テスト 第三弾: /userinfo（OIDC UserInfo エンドポイント）。
//
// 不透明 access_token を Bearer で受け、app_sessions から引き当て、トークンに
// 付与された scope に応じたクレームを返す（OIDC Core 5.3 / 5.4）。
//
// 範囲:
//   - 実トークン経路: authorization_code 交換で得た access_token を /userinfo に提示し、
//     openid profile email のクレームが返ること（issueOidcTokens→userinfo の連結）。
//   - scope=openid のみなら sub 以外は漏れないこと（スコープ別クレーム）。
//   - Bearer 無し / 失効トークンは 401。
// ------------------------------------------------------------------
import { env, SELF, reset } from 'cloudflare:test'
import { beforeEach, describe, it, expect } from 'vitest'
import {
  applySchema,
  makePkce,
  seedUser,
  seedApp,
  seedAuthCode,
  seedAppSession,
  formBody,
} from './helpers'

const ISSUER = 'https://idp.test'
const TOKEN_URL = `${ISSUER}/oauth/token`
const USERINFO_URL = `${ISSUER}/userinfo`
const REDIRECT_URI = 'https://rp.example/callback'

beforeEach(async () => {
  await reset()
  await applySchema(env.DB)
})

describe('/userinfo', () => {
  it('実トークン経路: authorization_code で得た access_token で profile/email クレームを返す', async () => {
    const { verifier, challenge } = await makePkce()
    const userId = await seedUser(env.DB, {
      email: 'alice@example.com',
      name: 'Alice Example',
      preferred_username: 'alice',
      email_verified: 1,
    })
    const appId = await seedApp(env.DB, { redirect_uris: REDIRECT_URI })
    const code = `code-${crypto.randomUUID()}`
    await seedAuthCode(env.DB, {
      plainCode: code,
      user_id: userId,
      app_id: appId,
      redirect_uri: REDIRECT_URI,
      scope: 'openid profile email',
      code_challenge: challenge,
      code_challenge_method: 'S256',
    })

    const tokenRes = await SELF.fetch(
      TOKEN_URL,
      formBody({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        code_verifier: verifier,
        client_id: appId,
      }),
    )
    expect(tokenRes.status).toBe(200)
    const accessToken = ((await tokenRes.json()) as Record<string, any>).access_token as string

    const res = await SELF.fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${accessToken}` } })
    expect(res.status).toBe(200)
    const claims = (await res.json()) as Record<string, any>
    expect(claims.sub).toBe(userId)
    expect(claims.name).toBe('Alice Example')
    expect(claims.preferred_username).toBe('alice')
    expect(claims.email).toBe('alice@example.com')
    expect(claims.email_verified).toBe(true)
  })

  it('scope=openid のみなら sub 以外のクレームは返さない', async () => {
    const userId = await seedUser(env.DB, { email: 'bob@example.com', name: 'Bob' })
    const appId = await seedApp(env.DB)
    const accessToken = `at-${crypto.randomUUID()}`
    await seedAppSession(env.DB, {
      plainRefreshToken: `rt-${crypto.randomUUID()}`,
      plainAccessToken: accessToken,
      user_id: userId,
      app_id: appId,
      scope: 'openid',
    })

    const res = await SELF.fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${accessToken}` } })
    expect(res.status).toBe(200)
    const claims = (await res.json()) as Record<string, any>
    expect(claims.sub).toBe(userId)
    expect(claims.email).toBeUndefined()
    expect(claims.name).toBeUndefined()
    expect(claims.preferred_username).toBeUndefined()
  })

  it('負例: Bearer ヘッダが無ければ 401', async () => {
    const res = await SELF.fetch(USERINFO_URL)
    expect(res.status).toBe(401)
  })

  it('負例: 失効した access_token は 401 invalid_token', async () => {
    const userId = await seedUser(env.DB)
    const appId = await seedApp(env.DB)
    const accessToken = `at-${crypto.randomUUID()}`
    await seedAppSession(env.DB, {
      plainRefreshToken: `rt-${crypto.randomUUID()}`,
      plainAccessToken: accessToken,
      user_id: userId,
      app_id: appId,
      scope: 'openid',
      // 既に失効（expires_at は過去）。
      expires_at: Math.floor(Date.now() / 1000) - 10,
    })

    const res = await SELF.fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${accessToken}` } })
    expect(res.status).toBe(401)
    const json = (await res.json()) as Record<string, any>
    expect(json.error).toBe('invalid_token')
  })
})
