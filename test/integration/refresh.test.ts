// ------------------------------------------------------------------
// 統合テスト 第二弾: /oauth/token の refresh_token 更新。
//
// 実 D1 で refresh の回転(古い refresh を消し新しいものを発行)と、その安全性
// (再利用拒否 / 権限失効時の拒否)を検証する。ここで初めて checkPermission を踏む。
//
// 範囲: ハッピーパス(回転 + offline_access で新 refresh 返却 + auth_time 維持) +
//       負例2種(古い refresh の再利用拒否 / 権限なしで拒否)。
// ------------------------------------------------------------------
import { env, SELF, reset } from 'cloudflare:test'
import { beforeEach, describe, it, expect } from 'vitest'
import { verifyRS256 } from '../../src/oidc/jwt'
import {
  applySchema,
  seedUser,
  seedApp,
  seedAppSession,
  seedPermission,
  formBody,
} from './helpers'

const ISSUER = 'https://idp.test'
const TOKEN_URL = `${ISSUER}/oauth/token`

beforeEach(async () => {
  await reset()
  await applySchema(env.DB)
})

describe('/oauth/token refresh_token 更新', () => {
  it('ハッピーパス: refresh を回転し、offline_access で新 refresh を返し、auth_time を維持する', async () => {
    const authTime = Math.floor(Date.now() / 1000) - 120
    const userId = await seedUser(env.DB)
    const appId = await seedApp(env.DB)
    await seedPermission(env.DB, { user_id: userId, app_id: appId })
    const refreshToken = `rt-${crypto.randomUUID()}`
    await seedAppSession(env.DB, {
      plainRefreshToken: refreshToken,
      user_id: userId,
      app_id: appId,
      // offline_access が付いていると issueOidcTokens は新 refresh_token を返す。
      scope: 'openid offline_access',
      auth_time: authTime,
    })

    const res = await SELF.fetch(
      TOKEN_URL,
      formBody({ grant_type: 'refresh_token', refresh_token: refreshToken, client_id: appId }),
    )

    expect(res.status).toBe(200)
    const json = (await res.json()) as Record<string, any>
    expect(typeof json.access_token).toBe('string')
    expect(typeof json.id_token).toBe('string')
    // offline_access なので新しい refresh_token が返り、かつ元とは別物(=回転)。
    expect(typeof json.refresh_token).toBe('string')
    expect(json.refresh_token).not.toBe(refreshToken)

    // id_token は当初の認証時刻(auth_time)を更新後も維持する。
    const payload = await verifyRS256(json.id_token, env.DB, env.OIDC_KEK)
    expect(payload).not.toBeNull()
    expect(payload!.sub).toBe(userId)
    expect(payload!.auth_time).toBe(authTime)

    // DB 上は当該アプリのセッションが 1 行(古いものは消え、新しいものに置き換わった)。
    const cnt = await env.DB.prepare('SELECT COUNT(*) AS n FROM app_sessions WHERE app_id = ?')
      .bind(appId)
      .first<{ n: number }>()
    expect(cnt?.n).toBe(1)
  })

  it('負例: 回転後に古い refresh_token を再利用すると invalid_grant', async () => {
    const userId = await seedUser(env.DB)
    const appId = await seedApp(env.DB)
    await seedPermission(env.DB, { user_id: userId, app_id: appId })
    const refreshToken = `rt-${crypto.randomUUID()}`
    await seedAppSession(env.DB, {
      plainRefreshToken: refreshToken,
      user_id: userId,
      app_id: appId,
      scope: 'openid offline_access',
    })

    const first = await SELF.fetch(
      TOKEN_URL,
      formBody({ grant_type: 'refresh_token', refresh_token: refreshToken, client_id: appId }),
    )
    expect(first.status).toBe(200)

    // 同じ(古い)refresh をもう一度。回転で消えているので引き当たらない。
    const reuse = await SELF.fetch(
      TOKEN_URL,
      formBody({ grant_type: 'refresh_token', refresh_token: refreshToken, client_id: appId }),
    )
    expect(reuse.status).toBe(400)
    const json = (await reuse.json()) as Record<string, any>
    expect(json.error).toBe('invalid_grant')
  })

  it('負例: 権限が無い(checkPermission 拒否)と invalid_grant、かつセッションは破棄される', async () => {
    const userId = await seedUser(env.DB)
    const appId = await seedApp(env.DB)
    // permissions は付与しない → checkPermission は拒否する。
    const refreshToken = `rt-${crypto.randomUUID()}`
    await seedAppSession(env.DB, {
      plainRefreshToken: refreshToken,
      user_id: userId,
      app_id: appId,
      scope: 'openid offline_access',
    })

    const res = await SELF.fetch(
      TOKEN_URL,
      formBody({ grant_type: 'refresh_token', refresh_token: refreshToken, client_id: appId }),
    )
    expect(res.status).toBe(400)
    const json = (await res.json()) as Record<string, any>
    expect(json.error).toBe('invalid_grant')

    // 拒否時は当該 refresh のセッション行が削除される(本番の防御挙動)。
    const cnt = await env.DB.prepare('SELECT COUNT(*) AS n FROM app_sessions WHERE app_id = ?')
      .bind(appId)
      .first<{ n: number }>()
    expect(cnt?.n).toBe(0)
  })
})
