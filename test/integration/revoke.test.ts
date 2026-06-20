// ------------------------------------------------------------------
// 統合テスト 第四弾: /oauth/revoke（RFC 7009 トークン失効）。
//
// access_token / refresh_token を提示して該当 app_session を削除する。RFC 7009 §2.2 に
// より、形式が正しければ未知トークンでも 200(=トークンの有効性を探らせない)。機密
// クライアントは認証必須(authenticateClient)。
//
// 範囲: access での失効 / refresh での失効 / 未知トークンも 200 / token 欠落は 400 /
//       機密クライアントが誤シークレットなら 401 かつ失効しない。
// ------------------------------------------------------------------
import { env, SELF, reset } from 'cloudflare:test'
import { beforeEach, describe, it, expect } from 'vitest'
import { applySchema, seedUser, seedApp, seedAppSession, formBody } from './helpers'

const ISSUER = 'https://idp.test'
const REVOKE_URL = `${ISSUER}/oauth/revoke`

const countSessions = (appId: string) =>
  env.DB.prepare('SELECT COUNT(*) AS n FROM app_sessions WHERE app_id = ?')
    .bind(appId)
    .first<{ n: number }>()

beforeEach(async () => {
  await reset()
  await applySchema(env.DB)
})

describe('/oauth/revoke', () => {
  it('access_token を提示するとセッションが失効する', async () => {
    const userId = await seedUser(env.DB)
    const appId = await seedApp(env.DB)
    const accessToken = `at-${crypto.randomUUID()}`
    await seedAppSession(env.DB, {
      plainRefreshToken: `rt-${crypto.randomUUID()}`,
      plainAccessToken: accessToken,
      user_id: userId,
      app_id: appId,
    })

    const res = await SELF.fetch(
      REVOKE_URL,
      formBody({ token: accessToken, token_type_hint: 'access_token', client_id: appId }),
    )
    expect(res.status).toBe(200)
    expect((await countSessions(appId))?.n).toBe(0)
  })

  it('refresh_token を提示してもセッションが失効する', async () => {
    const userId = await seedUser(env.DB)
    const appId = await seedApp(env.DB)
    const refreshToken = `rt-${crypto.randomUUID()}`
    await seedAppSession(env.DB, {
      plainRefreshToken: refreshToken,
      user_id: userId,
      app_id: appId,
    })

    const res = await SELF.fetch(
      REVOKE_URL,
      formBody({ token: refreshToken, token_type_hint: 'refresh_token', client_id: appId }),
    )
    expect(res.status).toBe(200)
    expect((await countSessions(appId))?.n).toBe(0)
  })

  it('未知のトークンでも 200 を返す(RFC 7009 §2.2: 有効性を探らせない)', async () => {
    const res = await SELF.fetch(REVOKE_URL, formBody({ token: 'no-such-token' }))
    expect(res.status).toBe(200)
  })

  it('負例: token が無ければ 400 invalid_request', async () => {
    const res = await SELF.fetch(REVOKE_URL, formBody({ token_type_hint: 'access_token' }))
    expect(res.status).toBe(400)
    const json = (await res.json()) as Record<string, any>
    expect(json.error).toBe('invalid_request')
  })

  it('負例: 機密クライアントが誤シークレットなら 401 かつ失効しない', async () => {
    const userId = await seedUser(env.DB)
    const appId = await seedApp(env.DB, { client_secret: 'topsecret' })
    const accessToken = `at-${crypto.randomUUID()}`
    await seedAppSession(env.DB, {
      plainRefreshToken: `rt-${crypto.randomUUID()}`,
      plainAccessToken: accessToken,
      user_id: userId,
      app_id: appId,
    })

    const res = await SELF.fetch(
      REVOKE_URL,
      formBody({ token: accessToken, client_id: appId, client_secret: 'WRONG' }),
    )
    expect(res.status).toBe(401)
    const json = (await res.json()) as Record<string, any>
    expect(json.error).toBe('invalid_client')
    // 認証に失敗したので失効していない。
    expect((await countSessions(appId))?.n).toBe(1)
  })
})
