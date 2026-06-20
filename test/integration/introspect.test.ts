// ------------------------------------------------------------------
// 統合テスト 第五弾: /oauth/introspect（RFC 7662 トークンイントロスペクション）。
//
// 呼び出し元クライアントを認証し、提示トークンが active かとメタデータを返す。
// 他クライアントに属するトークンは inactive として返す(§4 プライバシー)。
//
// 範囲: active な access(Bearer + exp + auth_time) / active な refresh(token_type ラベル) /
//       他クライアントのトークンは inactive / 失効 access は inactive / client_id 欠落は 401。
// ------------------------------------------------------------------
import { env, SELF, reset } from 'cloudflare:test'
import { beforeEach, describe, it, expect } from 'vitest'
import { applySchema, seedUser, seedApp, seedAppSession, formBody } from './helpers'

const ISSUER = 'https://idp.test'
const INTROSPECT_URL = `${ISSUER}/oauth/introspect`

beforeEach(async () => {
  await reset()
  await applySchema(env.DB)
})

describe('/oauth/introspect', () => {
  it('自クライアントの有効な access_token は active(Bearer, exp, auth_time 付き)', async () => {
    const authTime = Math.floor(Date.now() / 1000) - 300
    const userId = await seedUser(env.DB)
    const appId = await seedApp(env.DB)
    const accessToken = `at-${crypto.randomUUID()}`
    await seedAppSession(env.DB, {
      plainRefreshToken: `rt-${crypto.randomUUID()}`,
      plainAccessToken: accessToken,
      user_id: userId,
      app_id: appId,
      scope: 'openid profile',
      auth_time: authTime,
    })

    const res = await SELF.fetch(
      INTROSPECT_URL,
      formBody({ token: accessToken, client_id: appId }),
    )
    expect(res.status).toBe(200)
    const json = (await res.json()) as Record<string, any>
    expect(json.active).toBe(true)
    expect(json.token_type).toBe('Bearer')
    expect(json.client_id).toBe(appId)
    expect(json.sub).toBe(userId)
    expect(json.scope).toBe('openid profile')
    expect(typeof json.exp).toBe('number')
    expect(json.auth_time).toBe(authTime)
  })

  it('自クライアントの refresh_token は active(token_type=refresh_token, exp なし)', async () => {
    const userId = await seedUser(env.DB)
    const appId = await seedApp(env.DB)
    const refreshToken = `rt-${crypto.randomUUID()}`
    await seedAppSession(env.DB, {
      plainRefreshToken: refreshToken,
      user_id: userId,
      app_id: appId,
    })

    const res = await SELF.fetch(
      INTROSPECT_URL,
      formBody({ token: refreshToken, client_id: appId }),
    )
    expect(res.status).toBe(200)
    const json = (await res.json()) as Record<string, any>
    expect(json.active).toBe(true)
    expect(json.token_type).toBe('refresh_token')
    expect(json.exp).toBeUndefined()
  })

  it('他クライアントに属するトークンは inactive(§4 プライバシー)', async () => {
    const userId = await seedUser(env.DB)
    const ownerApp = await seedApp(env.DB, { id: 'app-owner' })
    const callerApp = await seedApp(env.DB, { id: 'app-caller' }) // 別の登録済みパブリッククライアント
    const accessToken = `at-${crypto.randomUUID()}`
    await seedAppSession(env.DB, {
      plainRefreshToken: `rt-${crypto.randomUUID()}`,
      plainAccessToken: accessToken,
      user_id: userId,
      app_id: ownerApp,
    })

    // caller は自分の client_id で認証するが、トークンは ownerApp のもの。
    const res = await SELF.fetch(
      INTROSPECT_URL,
      formBody({ token: accessToken, client_id: callerApp }),
    )
    expect(res.status).toBe(200)
    const json = (await res.json()) as Record<string, any>
    expect(json.active).toBe(false)
  })

  it('失効した access_token は inactive', async () => {
    const userId = await seedUser(env.DB)
    const appId = await seedApp(env.DB)
    const accessToken = `at-${crypto.randomUUID()}`
    await seedAppSession(env.DB, {
      plainRefreshToken: `rt-${crypto.randomUUID()}`,
      plainAccessToken: accessToken,
      user_id: userId,
      app_id: appId,
      expires_at: Math.floor(Date.now() / 1000) - 10,
    })

    const res = await SELF.fetch(
      INTROSPECT_URL,
      formBody({ token: accessToken, client_id: appId, token_type_hint: 'access_token' }),
    )
    expect(res.status).toBe(200)
    const json = (await res.json()) as Record<string, any>
    expect(json.active).toBe(false)
  })

  it('負例: client_id(呼び出し元の認証)が無ければ 401 invalid_client', async () => {
    const res = await SELF.fetch(INTROSPECT_URL, formBody({ token: 'whatever' }))
    expect(res.status).toBe(401)
    const json = (await res.json()) as Record<string, any>
    expect(json.error).toBe('invalid_client')
  })
})
