// ------------------------------------------------------------------
// 統合テスト 第一弾: /oauth/token の authorization_code 交換。
//
// 実 D1(miniflare)に schema.sql を流し、src/index.tsx をそのまま workerd 上で
// 起動して SELF.fetch でエンドポイントを叩く。DB 密結合の経路
// (auth_codes 照合 / used_at 更新 / authenticateClient / issueOidcTokens /
//  署名鍵の cold-start シード)を、本番と同じコードで通す。
//
// 範囲: ハッピーパス + 負例3種(code 再利用拒否 / redirect_uri 不一致 / PKCE 失敗)。
// ------------------------------------------------------------------
import { env, SELF, reset } from 'cloudflare:test'
import { beforeEach, describe, it, expect } from 'vitest'
import { verifyRS256 } from '../../src/oidc/jwt'
import {
  applySchema,
  makePkce,
  seedUser,
  seedApp,
  seedAuthCode,
  formBody,
} from './helpers'

// id_token の iss はリクエストの origin。テストでは固定ホストを使う。
const ISSUER = 'https://idp.test'
const TOKEN_URL = `${ISSUER}/oauth/token`
const REDIRECT_URI = 'https://rp.example/callback'

beforeEach(async () => {
  // 全バインディングのデータを消去してテスト間を隔離し、本番投入の正本 schema.sql を
  // 実 D1 に流し直す。CREATE TABLE IF NOT EXISTS なので安全・高速。
  await reset()
  await applySchema(env.DB)
})

describe('/oauth/token authorization_code 交換', () => {
  it('ハッピーパス: パブリッククライアント + PKCE で access_token / id_token を発行する', async () => {
    const { verifier, challenge } = await makePkce()
    const userId = await seedUser(env.DB, { email: 'alice@example.com' })
    const appId = await seedApp(env.DB, { redirect_uris: REDIRECT_URI })
    const code = `code-${crypto.randomUUID()}`
    await seedAuthCode(env.DB, {
      plainCode: code,
      user_id: userId,
      app_id: appId,
      redirect_uri: REDIRECT_URI,
      scope: 'openid',
      code_challenge: challenge,
      code_challenge_method: 'S256',
    })

    const res = await SELF.fetch(
      TOKEN_URL,
      formBody({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        code_verifier: verifier,
        client_id: appId,
      }),
    )

    expect(res.status).toBe(200)
    const json = (await res.json()) as Record<string, any>
    expect(json.token_type).toBe('Bearer')
    expect(typeof json.access_token).toBe('string')
    expect(typeof json.id_token).toBe('string')
    // offline_access を要求していないので refresh_token は返らない。
    expect(json.refresh_token).toBeUndefined()

    // id_token が DB 由来の署名鍵で検証でき、主要クレームが正しいこと。
    const payload = await verifyRS256(json.id_token, env.DB, env.OIDC_KEK)
    expect(payload).not.toBeNull()
    expect(payload!.iss).toBe(ISSUER)
    expect(payload!.sub).toBe(userId)
    expect(payload!.aud).toBe(appId)

    // app_sessions に行が作られている（不透明トークンの引き当て元）。
    const sess = await env.DB.prepare('SELECT user_id, app_id, scope FROM app_sessions WHERE app_id = ?')
      .bind(appId)
      .first<{ user_id: string; app_id: string; scope: string }>()
    expect(sess?.user_id).toBe(userId)
    expect(sess?.scope).toBe('openid')
  })

  it('負例: 認可コードの再利用は invalid_grant で拒否する', async () => {
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
    const req = () =>
      SELF.fetch(
        TOKEN_URL,
        formBody({
          grant_type: 'authorization_code',
          code,
          redirect_uri: REDIRECT_URI,
          code_verifier: verifier,
          client_id: appId,
        }),
      )

    const first = await req()
    expect(first.status).toBe(200)

    const second = await req()
    expect(second.status).toBe(400)
    const json = (await second.json()) as Record<string, any>
    expect(json.error).toBe('invalid_grant')
  })

  it('負例: redirect_uri 不一致は invalid_grant で拒否する', async () => {
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

    const res = await SELF.fetch(
      TOKEN_URL,
      formBody({
        grant_type: 'authorization_code',
        code,
        redirect_uri: 'https://rp.example/EVIL',
        code_verifier: verifier,
        client_id: appId,
      }),
    )
    expect(res.status).toBe(400)
    const json = (await res.json()) as Record<string, any>
    expect(json.error).toBe('invalid_grant')
  })

  it('負例: PKCE 検証失敗(誤った code_verifier)は invalid_grant で拒否する', async () => {
    const { challenge } = await makePkce()
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

    const res = await SELF.fetch(
      TOKEN_URL,
      formBody({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        code_verifier: 'wrong-verifier-does-not-match-challenge',
        client_id: appId,
      }),
    )
    expect(res.status).toBe(400)
    const json = (await res.json()) as Record<string, any>
    expect(json.error).toBe('invalid_grant')
  })
})
