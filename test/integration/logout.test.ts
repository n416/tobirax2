// ------------------------------------------------------------------
// 統合テスト 第六弾: /oidc/logout（RP-Initiated Logout 1.0）。
//
// 検証対象は「セッション失効」と「リダイレクト挙動」:
//   - SSO セッション Cookie でユーザーを特定し、app_sessions(OIDCトークン)と
//     sessions(ブラウザSSO)を失効させる。
//   - Cookie が無くても id_token_hint(自身が発行した検証済みトークン)の sub で
//     フォールバックしてトークン失効する。
//   - post_logout_redirect_uri は登録済みのときだけ許可し state をエコー(オープン
//     リダイレクト防止)。
//
// 切り分け: Back-Channel Logout の外部送信(sendBackchannelLogouts)は対象外。seed する
//   アプリに backchannel_logout_uri を設定しないので、送信経路には入らない
//   (targets.length===0 で early return)。redirect は手動(redirect:'manual')で観測する。
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
  seedSession,
  formBody,
} from './helpers'

const ISSUER = 'https://idp.test'
const LOGOUT_URL = `${ISSUER}/oidc/logout`
const TOKEN_URL = `${ISSUER}/oauth/token`
const REDIRECT_URI = 'https://rp.example/callback'

const countAppSessions = (userId: string) =>
  env.DB.prepare('SELECT COUNT(*) AS n FROM app_sessions WHERE user_id = ?')
    .bind(userId)
    .first<{ n: number }>()
const countSessions = (userId: string) =>
  env.DB.prepare('SELECT COUNT(*) AS n FROM sessions WHERE user_id = ?')
    .bind(userId)
    .first<{ n: number }>()

beforeEach(async () => {
  await reset()
  await applySchema(env.DB)
})

describe('/oidc/logout', () => {
  it('SSO Cookie でユーザーを特定し、app_sessions と sessions を失効させて /login へ', async () => {
    const userId = await seedUser(env.DB)
    const appId = await seedApp(env.DB)
    await seedAppSession(env.DB, {
      plainRefreshToken: `rt-${crypto.randomUUID()}`,
      user_id: userId,
      app_id: appId,
    })
    const sid = `sid-${crypto.randomUUID()}`
    await seedSession(env.DB, { plainSessionId: sid, user_id: userId })

    const res = await SELF.fetch(LOGOUT_URL, {
      headers: { Cookie: `__Host-idp_session=${sid}` },
      redirect: 'manual',
    })

    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/login')
    expect((await countAppSessions(userId))?.n).toBe(0)
    expect((await countSessions(userId))?.n).toBe(0)
  })

  it('Cookie が無くても id_token_hint の sub でフォールバックしてトークン失効', async () => {
    // 実 id_token を得るため authorization_code 交換を通す。
    const { verifier, challenge } = await makePkce()
    const userId = await seedUser(env.DB)
    const appId = await seedApp(env.DB, { redirect_uris: REDIRECT_URI })
    const code = `code-${crypto.randomUUID()}`
    await seedAuthCode(env.DB, {
      plainCode: code,
      user_id: userId,
      app_id: appId,
      redirect_uri: REDIRECT_URI,
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
    const idToken = ((await tokenRes.json()) as Record<string, any>).id_token as string
    // 交換で app_sessions が 1 行できている。
    expect((await countAppSessions(userId))?.n).toBe(1)

    // Cookie 無しで id_token_hint だけ渡す。
    const res = await SELF.fetch(`${LOGOUT_URL}?id_token_hint=${encodeURIComponent(idToken)}`, {
      redirect: 'manual',
    })
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/login')
    expect((await countAppSessions(userId))?.n).toBe(0)
  })

  it('登録済み post_logout_redirect_uri なら state をエコーしてそこへリダイレクト', async () => {
    const dest = 'https://rp.example/after-logout'
    const userId = await seedUser(env.DB)
    await seedApp(env.DB, { redirect_uris: dest })
    const sid = `sid-${crypto.randomUUID()}`
    await seedSession(env.DB, { plainSessionId: sid, user_id: userId })

    const res = await SELF.fetch(
      `${LOGOUT_URL}?post_logout_redirect_uri=${encodeURIComponent(dest)}&state=xyz123`,
      { headers: { Cookie: `__Host-idp_session=${sid}` }, redirect: 'manual' },
    )
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe(`${dest}?state=xyz123`)
  })

  it('負例: 未登録の post_logout_redirect_uri はオープンリダイレクト防止で /login', async () => {
    const userId = await seedUser(env.DB)
    await seedApp(env.DB, { redirect_uris: 'https://rp.example/after-logout' })
    const sid = `sid-${crypto.randomUUID()}`
    await seedSession(env.DB, { plainSessionId: sid, user_id: userId })

    const res = await SELF.fetch(
      `${LOGOUT_URL}?post_logout_redirect_uri=${encodeURIComponent('https://evil.example/steal')}`,
      { headers: { Cookie: `__Host-idp_session=${sid}` }, redirect: 'manual' },
    )
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/login')
  })
})
