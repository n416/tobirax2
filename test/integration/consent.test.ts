// ------------------------------------------------------------------
// 統合テスト: OIDC ユーザー同意(consent)フロー。
//
// 実 D1 + src/index.tsx を SELF で起動し、GET /authorize → 同意画面 →
// POST /authorize/decision の経路を本番コードで通す。
//   - 記憶方式(consents テーブル)・prompt=consent 再要求・prompt=none の consent_required・
//     deny の access_denied・CSRF(Origin)保護 を検証。
// ------------------------------------------------------------------
import { env, SELF, reset } from 'cloudflare:test'
import { beforeEach, describe, it, expect } from 'vitest'
import { applySchema, seedUser, seedApp, seedPermission, seedSession } from './helpers'

const ISSUER = 'https://idp.test'
const REDIRECT_URI = 'https://rp.example/callback'

beforeEach(async () => {
  await reset()
  await applySchema(env.DB)
})

// 認証済みユーザー + アプリ + 権限 + SSO セッションを用意し、cookie 値を返す。
async function setup(opts: { scope?: string } = {}) {
  const userId = await seedUser(env.DB, { email: 'alice@example.com' })
  const appId = await seedApp(env.DB, { name: 'Smart City Portal', redirect_uris: REDIRECT_URI })
  await seedPermission(env.DB, { user_id: userId, app_id: appId })
  const sid = `sess-${crypto.randomUUID()}`
  await seedSession(env.DB, { plainSessionId: sid, user_id: userId, auth_time: Math.floor(Date.now() / 1000) })
  return { userId, appId, sid }
}

function authorizeUrl(appId: string, scope: string, extra: Record<string, string> = {}) {
  const p = new URLSearchParams({
    response_type: 'code',
    client_id: appId,
    redirect_uri: REDIRECT_URI,
    scope,
    state: 'st-123',
    ...extra,
  })
  return `${ISSUER}/authorize?${p.toString()}`
}

const cookie = (sid: string) => ({ Cookie: `__Host-idp_session=${sid}` })

async function getAuthorize(appId: string, sid: string, scope = 'openid email', extra = {}) {
  return SELF.fetch(authorizeUrl(appId, scope, extra), { headers: cookie(sid), redirect: 'manual' })
}

async function postDecision(
  fields: Record<string, string>,
  sid: string,
  origin: string = ISSUER,
) {
  return SELF.fetch(`${ISSUER}/authorize/decision`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Origin: origin,
      ...cookie(sid),
    },
    body: new URLSearchParams(fields).toString(),
    redirect: 'manual',
  })
}

describe('OIDC consent flow', () => {
  it('初回(未同意)は同意画面を表示する(コード即発行しない)', async () => {
    const { appId, sid } = await setup()
    const res = await getAuthorize(appId, sid)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type') || '').toMatch(/text\/html/)
    const body = await res.text()
    expect(body).toContain('action="/authorize/decision"')
    expect(body).toContain('Smart City Portal') // クライアント名
    expect(body).toContain('Allow') // 許可ボタン(既定 en)
    // この時点ではまだ consent 行は無い。
    const row = await env.DB.prepare('SELECT * FROM consents WHERE app_id = ?').bind(appId).first()
    expect(row).toBeNull()
  })

  it('approve でコードが発行され、consent が記録される', async () => {
    const { userId, appId, sid } = await setup()
    const res = await postDecision(
      {
        decision: 'approve',
        client_id: appId,
        redirect_uri: REDIRECT_URI,
        scope: 'openid email',
        state: 'st-123',
      },
      sid,
    )
    expect(res.status).toBe(302)
    const loc = res.headers.get('location') || ''
    expect(loc.startsWith(REDIRECT_URI)).toBe(true)
    const u = new URL(loc)
    expect(u.searchParams.get('code')).toBeTruthy()
    expect(u.searchParams.get('state')).toBe('st-123')
    // consent が記録され、付与スコープが保存されている。
    const row = await env.DB.prepare('SELECT scope FROM consents WHERE user_id = ? AND app_id = ?')
      .bind(userId, appId).first<{ scope: string }>()
    expect(row?.scope).toBe('openid email')
  })

  it('記憶: 同意済みなら次回の authorize は同意画面を出さずコードを直接返す', async () => {
    const { userId, appId, sid } = await setup()
    // 事前に同意を記録(approve 相当)。
    await env.DB.prepare('INSERT INTO consents (user_id, app_id, scope, granted_at) VALUES (?, ?, ?, ?)')
      .bind(userId, appId, 'openid email', Math.floor(Date.now() / 1000)).run()
    const res = await getAuthorize(appId, sid, 'openid email')
    expect(res.status).toBe(302)
    const loc = res.headers.get('location') || ''
    expect(loc.startsWith(REDIRECT_URI)).toBe(true)
    expect(new URL(loc).searchParams.get('code')).toBeTruthy()
  })

  it('記憶: 保存済みに無い新しいスコープを要求すると再び同意画面', async () => {
    const { userId, appId, sid } = await setup()
    await env.DB.prepare('INSERT INTO consents (user_id, app_id, scope, granted_at) VALUES (?, ?, ?, ?)')
      .bind(userId, appId, 'openid', Math.floor(Date.now() / 1000)).run()
    const res = await getAuthorize(appId, sid, 'openid email') // email は未同意
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('action="/authorize/decision"')
  })

  it('prompt=consent は同意済みでも再同意を要求する', async () => {
    const { userId, appId, sid } = await setup()
    await env.DB.prepare('INSERT INTO consents (user_id, app_id, scope, granted_at) VALUES (?, ?, ?, ?)')
      .bind(userId, appId, 'openid email', Math.floor(Date.now() / 1000)).run()
    const res = await getAuthorize(appId, sid, 'openid email', { prompt: 'consent' })
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('action="/authorize/decision"')
  })

  it('deny は access_denied で RP へ戻し、consent を記録しない', async () => {
    const { appId, sid } = await setup()
    const res = await postDecision(
      { decision: 'deny', client_id: appId, redirect_uri: REDIRECT_URI, scope: 'openid email', state: 'st-123' },
      sid,
    )
    expect(res.status).toBe(302)
    const u = new URL(res.headers.get('location') || '')
    expect(u.searchParams.get('error')).toBe('access_denied')
    expect(u.searchParams.get('state')).toBe('st-123')
    const row = await env.DB.prepare('SELECT * FROM consents WHERE app_id = ?').bind(appId).first()
    expect(row).toBeNull()
  })

  it('prompt=none で未同意なら consent_required を返す(UI を出さない)', async () => {
    const { appId, sid } = await setup()
    const res = await getAuthorize(appId, sid, 'openid email', { prompt: 'none' })
    expect(res.status).toBe(302)
    const u = new URL(res.headers.get('location') || '')
    expect(u.searchParams.get('error')).toBe('consent_required')
  })

  it('CSRF: 別オリジンからの decision POST は拒否される', async () => {
    const { appId, sid } = await setup()
    const res = await postDecision(
      { decision: 'approve', client_id: appId, redirect_uri: REDIRECT_URI, scope: 'openid', state: 'st-123' },
      sid,
      'https://evil.example', // 不一致 Origin
    )
    expect(res.status).toBe(403)
    // 同意は記録されない。
    const row = await env.DB.prepare('SELECT * FROM consents WHERE app_id = ?').bind(appId).first()
    expect(row).toBeNull()
  })

  it('Account /account 画面で付与済み consent を取得できる', async () => {
    const { userId, appId, sid } = await setup()
    await env.DB.prepare('INSERT INTO consents (user_id, app_id, scope, granted_at) VALUES (?, ?, ?, ?)')
      .bind(userId, appId, 'openid email', Math.floor(Date.now() / 1000)).run()

    const res = await SELF.fetch(`${ISSUER}/account`, { headers: cookie(sid) })
    expect(res.status).toBe(200)
    const body = await res.text()
    expect(body).toContain('Smart City Portal')
    expect(body).toContain('action="/account/revoke-consent"')
  })

  it('Account /account/revoke-consent で同意と関連セッションを削除できる', async () => {
    const { userId, appId, sid } = await setup()
    await env.DB.prepare('INSERT INTO consents (user_id, app_id, scope, granted_at) VALUES (?, ?, ?, ?)')
      .bind(userId, appId, 'openid email', Math.floor(Date.now() / 1000)).run()
    
    // session も作っておく
    await env.DB.prepare('INSERT INTO app_sessions (token, refresh_token, user_id, app_id, expires_at) VALUES (?, ?, ?, ?, ?)')
      .bind('tok123', 'ref123', userId, appId, Math.floor(Date.now() / 1000) + 3600).run()

    const res = await SELF.fetch(`${ISSUER}/account/revoke-consent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Origin: ISSUER,
        ...cookie(sid),
      },
      body: new URLSearchParams({ app_id: appId }).toString(),
      redirect: 'manual'
    })

    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toContain('/account?msg=success_consent_revoked')

    const c = await env.DB.prepare('SELECT * FROM consents WHERE app_id = ?').bind(appId).first()
    expect(c).toBeNull()
    const s = await env.DB.prepare('SELECT * FROM app_sessions WHERE app_id = ?').bind(appId).first()
    expect(s).toBeNull()
  })
})
