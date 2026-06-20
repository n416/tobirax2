import { Hono } from 'hono';
import type { Env, User, App, AuthCode, Session } from '../types';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { getJwksKeys } from '../oidc/keys';
import { requireSecret } from '../utils/env';
import { writeAuditLog } from '../utils/logger';
import { signRS256, verifyPkce, verifyRS256 } from '../oidc/jwt';
import { generateToken, hashToken } from '../utils/auth';
import {
  checkPermission,
  getUser,
  logAudit,
  authenticateClient,
  issueOidcTokens,
  getEntitlements,
  getSessionRow,
} from '../index';
import {
  isSafeReturnTo,
  buildRedirect,
  tokenError,
  bearerUnauthorized,
  safeEqual,
  parseBasicAuth,
  parseClientBody,
  buildOidcClaims,
  computeAtHash,
  isAllowedRedirectUri,
} from '../oidc/helpers';

export const oidcRouter = new Hono<{ Bindings: Env }>();

oidcRouter.get('/.well-known/openid-configuration', (c) => {
    const issuer = new URL(c.req.url).origin
    return c.json({
        issuer,
        authorization_endpoint: `${issuer}/authorize`,
        token_endpoint: `${issuer}/oauth/token`,
        userinfo_endpoint: `${issuer}/userinfo`,
        jwks_uri: `${issuer}/.well-known/jwks.json`,
        end_session_endpoint: `${issuer}/oidc/logout`,
        // OIDC Back-Channel Logout 1.0: 各 RP の登録エンドポイントへ logout_token を
        // POST する。subject ベース(sid なし)なので session_supported=false。
        backchannel_logout_supported: true,
        backchannel_logout_session_supported: false,
        revocation_endpoint: `${issuer}/oauth/revoke`,
        revocation_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic', 'none'],
        introspection_endpoint: `${issuer}/oauth/introspect`,
        introspection_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic', 'none'],
        response_types_supported: ['code'],
        grant_types_supported: ['authorization_code', 'refresh_token'],
        subject_types_supported: ['public'],
        id_token_signing_alg_values_supported: ['RS256'],
        scopes_supported: ['openid', 'profile', 'email', 'offline_access'],
        token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic', 'none'],
        code_challenge_methods_supported: ['S256'],
        claims_supported: ['sub', 'email', 'email_verified', 'name', 'preferred_username', 'iss', 'aud', 'exp', 'iat', 'nonce', 'auth_time', 'at_hash'],
    })
})

oidcRouter.get('/.well-known/jwks.json', async (c) => {
    const keys = await getJwksKeys(c.env.DB, requireSecret(c.env, 'OIDC_KEK', 'dev-only-insecure-oidc-kek-change-me'))
    return c.json({ keys: keys.map(k => ({ ...k, alg: 'RS256', use: 'sig' })) })
})

oidcRouter.get('/authorize', async (c) => {
    const q = c.req.query()
    const { client_id: clientId, redirect_uri: redirectUri, state, nonce, response_mode: responseMode } = q
    const responseType = q.response_type
    const scope = q.scope || 'openid'

    if (!clientId || !redirectUri) {
        await writeAuditLog(c, 'OIDC_AUTHORIZE_ERROR', { error: 'invalid_request', reason: 'client_id and redirect_uri are required' });
        return c.text('invalid_request: client_id and redirect_uri are required', 400)
    }

    const app = await c.env.DB.prepare('SELECT * FROM apps WHERE id = ?').bind(clientId).first() as App | null
    if (!app) {
        await writeAuditLog(c, 'OIDC_AUTHORIZE_ERROR', { error: 'invalid_client', reason: 'unknown client_id' }, null, clientId as string);
        return c.text('invalid_client: unknown client_id', 400)
    }
    if (!isAllowedRedirectUri(redirectUri, app)) {
        await writeAuditLog(c, 'OIDC_AUTHORIZE_ERROR', { error: 'invalid_request', reason: 'redirect_uri is not registered' }, null, app.id);
        return c.text('invalid_request: redirect_uri is not registered for this client', 400)
    }

    if (responseType && responseType !== 'code') {
        await writeAuditLog(c, 'OIDC_AUTHORIZE_ERROR', { error: 'unsupported_response_type' }, null, app.id);
        return c.redirect(buildRedirect(redirectUri, responseMode, { error: 'unsupported_response_type', error_description: 'only response_type=code is supported', state }))
    }

    // PKCE: S256 のみ受理。`plain` は廃止済み(OAuth 2.1 / RFC 7636 のセキュリティBCP)。
    // code_challenge を渡す場合は明示的に S256 メソッドを伴う必要がある — メソッド省略は
    // 従来 `plain` の既定だった(RFC 7636 §4.3)が、それも許可しない。
    if (q.code_challenge && q.code_challenge_method !== 'S256') {
        await writeAuditLog(c, 'OIDC_AUTHORIZE_ERROR', { error: 'invalid_request', reason: 'code_challenge_method must be S256' }, null, app.id);
        return c.redirect(buildRedirect(redirectUri, responseMode, {
            error: 'invalid_request',
            error_description: 'code_challenge_method must be S256 (plain is not supported)',
            state,
        }))
    }

    // OIDC Core 3.1.2.1: prompt + max_age が(再)認証の要否を決める。
    const now = Math.floor(Date.now() / 1000)
    const promptValues = (q.prompt || '').split(/\s+/).filter(Boolean)
    const promptNone = promptValues.includes('none')
    // 同意(consent)UI が無いので prompt=consent は何もしない。login/select_account は
    // どちらも「ユーザーを再度認証させる」を意味する。
    const forceLogin = promptValues.includes('login') || promptValues.includes('select_account')
    const maxAge = /^\d+$/.test(q.max_age || '') ? parseInt(q.max_age, 10) : null

    // 認証済みセッションを要求。無ければログインへ飛ばし、ここに戻って再開する。
    const session = await getSessionRow(c)
    const user = session
        ? await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(session.user_id).first() as User | null
        : null

    const maxAgeExceeded = !!(user && maxAge !== null && now - (session?.auth_time ?? 0) > maxAge)
    const needReauth = !user || forceLogin || maxAgeExceeded

    if (needReauth) {
        // prompt=none は一切の UI を禁止する: ログインフォームを出さずエラーを返す。
        if (promptNone) {
            await writeAuditLog(c, 'OIDC_AUTHORIZE_ERROR', { error: 'login_required' }, user?.id, app.id);
            return c.redirect(buildRedirect(redirectUri, responseMode, {
                error: 'login_required',
                error_description: user ? 're-authentication required but prompt=none' : 'no active session and prompt=none',
                state,
            }))
        }
        // ログイン後にこのリクエストをそのまま再開する。ただし `prompt` は除去する。
        // 再開後の authorize が再びログインを強制してループしないようにするため。max_age は
        // 残す: 新しいセッションなら自然に満たされる。`reauth=1` は /login に対し、まだ有効な
        // セッションを黙って再利用しないよう伝える(prompt=login / max_age 超過時)。
        const resume = new URL(c.req.url)
        resume.searchParams.delete('prompt')
        const returnTo = '/authorize' + resume.search
        // login_hint を /login へ渡し、メール欄を初期表示する(OIDC 3.1.2.1)。
        const hint = q.login_hint ? '&login_hint=' + encodeURIComponent(q.login_hint) : ''
        return c.redirect('/login?reauth=1' + hint + '&return_to=' + encodeURIComponent(returnTo))
    }

    // tobira のアプリ別権限ゲートを適用する。
    const check = await checkPermission(c, user.id, app.id)
    if (!check.allowed) {
        await writeAuditLog(c, 'OIDC_AUTHORIZE_ERROR', { error: 'access_denied', reason: check.reason }, user.id, app.id);
        return c.redirect(buildRedirect(redirectUri, responseMode, { error: 'access_denied', error_description: check.reason || 'access denied', state }))
    }

    const code = generateToken()
    const hashedCode = await hashToken(code)
    const expires = Math.floor(Date.now() / 1000) + 300
    // セッションの実際の auth_time を code に持ち込み、id_token がユーザーの実認証時刻を
    // 反映するようにする(OIDC auth_time)。
    await c.env.DB.prepare(
        'INSERT INTO auth_codes (code, user_id, app_id, expires_at, nonce, code_challenge, code_challenge_method, redirect_uri, scope, auth_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(hashedCode, user.id, app.id, expires, nonce || null, q.code_challenge || null, q.code_challenge_method || null, redirectUri, scope, session?.auth_time ?? null).run()

    await writeAuditLog(c, 'OIDC_AUTHORIZE_SUCCESS', { redirect_uri: redirectUri, scope }, user.id, app.id);
    return c.redirect(buildRedirect(redirectUri, responseMode, { code, state }))
})

oidcRouter.post('/oauth/token', async (c) => {
    // RFC 6749 §5.1: トークンエンドポイントの応答はキャッシュしてはならない。
    c.header('Cache-Control', 'no-store')
    c.header('Pragma', 'no-cache')
    const body = await parseClientBody(c)

    // クライアント認証: client_secret_post(ボディ)または client_secret_basic(ヘッダ)。
    let basicClientId: string | undefined
    let basicClientSecret: string | undefined
    const authz = c.req.header('Authorization')
    if (authz && authz.startsWith('Basic ')) {
        try {
            const dec = atob(authz.slice(6))
            const i = dec.indexOf(':')
            basicClientId = decodeURIComponent(dec.slice(0, i))
            basicClientSecret = decodeURIComponent(dec.slice(i + 1))
        } catch { /* ignore */ }
    }
    const providedSecret = (body.client_secret as string) || basicClientSecret

    const grantType = body.grant_type

    if (grantType === 'authorization_code') {
        const code = body.code
        if (!code) return tokenError(c, 'invalid_request', 'missing code')
        const hashedCode = await hashToken(code)
        const ac = await c.env.DB.prepare('SELECT * FROM auth_codes WHERE code = ?').bind(hashedCode).first() as AuthCode | null
        const nowSec = Math.floor(Date.now() / 1000)
        if (!ac || ac.used_at || ac.expires_at < nowSec) {
            await writeAuditLog(c, 'OIDC_TOKEN_ERROR', { error: 'invalid_grant', reason: 'code invalid or expired' });
            return tokenError(c, 'invalid_grant', 'authorization code is invalid or expired')
        }
        
        const updateRes = await c.env.DB.prepare('UPDATE auth_codes SET used_at = ? WHERE code = ? AND used_at IS NULL AND expires_at >= ?').bind(nowSec, hashedCode, nowSec).run()
        if ((updateRes as any)?.meta?.changes === 0) {
            await writeAuditLog(c, 'OIDC_TOKEN_ERROR', { error: 'invalid_grant', reason: 'code already used or expired' });
            return tokenError(c, 'invalid_grant', 'authorization code is already used or expired')
        }

        const clientId = body.client_id || basicClientId
        if (clientId && clientId !== ac.app_id) {
            await writeAuditLog(c, 'OIDC_TOKEN_ERROR', { error: 'invalid_grant', reason: 'client_id mismatch' }, null, clientId as string);
            return tokenError(c, 'invalid_grant', 'client_id does not match the authorization code')
        }
        // RFC 6749 §4.1.3 / OIDC: 認可リクエストで redirect_uri が使われた場合
        // (/authorize では常に該当)、トークンリクエストにも同一のものを含めなければ
        // ならない。以前はクライアントが送る選択をしたときだけ検証していたため、
        // redirect_uri を省略すると検証を素通りしていた。
        if (ac.redirect_uri) {
            if (!body.redirect_uri) {
                await writeAuditLog(c, 'OIDC_TOKEN_ERROR', { error: 'invalid_grant', reason: 'redirect_uri is required' }, null, ac.app_id);
                return tokenError(c, 'invalid_grant', 'redirect_uri is required')
            }
            if (body.redirect_uri !== ac.redirect_uri) {
                await writeAuditLog(c, 'OIDC_TOKEN_ERROR', { error: 'invalid_grant', reason: 'redirect_uri mismatch' }, null, ac.app_id);
                return tokenError(c, 'invalid_grant', 'redirect_uri does not match')
            }
        }

        const pkceOk = await verifyPkce(body.code_verifier, ac.code_challenge as any, ac.code_challenge_method as any)
        if (!pkceOk) {
            await writeAuditLog(c, 'OIDC_TOKEN_ERROR', { error: 'invalid_grant', reason: 'PKCE verification failed' }, null, ac.app_id);
            return tokenError(c, 'invalid_grant', 'PKCE verification failed')
        }

        const auth = await authenticateClient(c, ac.app_id, providedSecret, !!ac.code_challenge)
        if (!auth.ok) return auth.res

        const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(ac.user_id).first() as User | null
        if (!user) {
            await writeAuditLog(c, 'OIDC_TOKEN_ERROR', { error: 'invalid_grant', reason: 'user not found' }, ac.user_id, ac.app_id);
            return tokenError(c, 'invalid_grant', 'user not found')
        }

        await writeAuditLog(c, 'OIDC_TOKEN_GRANTED', { grant_type: 'authorization_code' }, user.id, ac.app_id);
        return issueOidcTokens(c, user, ac.app_id, (ac.nonce as any) || null, (ac.scope as any) || null, (ac.auth_time as any) ?? null)
    }

    if (grantType === 'refresh_token') {
        const refreshToken = body.refresh_token
        if (!refreshToken) return tokenError(c, 'invalid_request', 'missing refresh_token')
        const hashedRefreshToken = await hashToken(refreshToken)
        const session = await c.env.DB.prepare('SELECT * FROM app_sessions WHERE refresh_token = ?').bind(hashedRefreshToken).first() as any
        if (!session) return tokenError(c, 'invalid_grant', 'invalid refresh_token')
        // パブリッククライアントはシークレット無しで更新可。機密クライアントは認証必須。
        const auth = await authenticateClient(c, session.app_id, providedSecret, true)
        if (!auth.ok) return auth.res
        const check = await checkPermission(c, session.user_id, session.app_id)
        if (!check.allowed) {
            await c.env.DB.prepare('DELETE FROM app_sessions WHERE refresh_token = ?').bind(hashedRefreshToken).run()
            return tokenError(c, 'invalid_grant', check.reason || 'access denied')
        }
        const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(session.user_id).first() as User | null
        if (!user) return tokenError(c, 'invalid_grant', 'user not found')
        
        const delRes = await c.env.DB.prepare('DELETE FROM app_sessions WHERE refresh_token = ?').bind(hashedRefreshToken).run()
        if ((delRes as any)?.meta?.changes === 0) {
            return tokenError(c, 'invalid_grant', 'refresh token already used')
        }
        
        // 更新をまたいで当初付与の scope と auth_time を保持し、更新後の id_token が
        // 元の認証時刻を保つようにする。
        await writeAuditLog(c, 'OIDC_TOKEN_GRANTED', { grant_type: 'refresh_token' }, user.id, session.app_id);
        return issueOidcTokens(c, user, session.app_id, null, (session.scope as string) || null, (session.auth_time as number) ?? null)
    }

    return tokenError(c, 'unsupported_grant_type', grantType ? `grant_type '${grantType}' is not supported` : 'missing grant_type')
})

oidcRouter.on(['GET', 'POST'], '/userinfo', async (c) => {
    const auth = c.req.header('Authorization') || ''
    if (!auth.startsWith('Bearer ')) return bearerUnauthorized(c)
    const token = auth.slice(7)
    const hashedToken = await hashToken(token)
    const session = await c.env.DB.prepare('SELECT * FROM app_sessions WHERE token = ? AND expires_at > ?')
        .bind(hashedToken, Math.floor(Date.now() / 1000)).first() as any
    if (!session) return bearerUnauthorized(c, 'invalid_token', 'the access token is invalid or expired')
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(session.user_id).first() as User | null
    if (!user) return bearerUnauthorized(c, 'invalid_token', 'the access token is invalid or expired')
    // sub は常に返す。その他のクレームはトークンに付与された scope に依存する。
    return c.json({
        sub: user.id,
        ...buildOidcClaims(user, (session.scope as string) || null),
    })
})

// ============================================================
// ランタイム・エンタイトルメントAPI (v1: ユーザーコンテキスト)
//   外部サービス(点検等)が、OIDCログインで得たユーザーのアクセストークンを Bearer 転送し、
//   「このユーザーは今どのグループ・どの建物で・何の役割か(=①②③全通過)」を問い合わせる。
//   - 認証: /userinfo と同じく app_sessions から不透明トークンを引き当てる。
//   - サービス束縛: トークンの app_id(=OIDCクライアント) → apps.service_id。
//     NULL のクライアントはエンタイトルメント問い合わせ用に紐付いていない = 403。
//     これにより点検会社のトークンは点検サービスのエンタイトルメントしか読めない(テナント分離)。
//   - 結果: ①②③を now 時点で全通過した割当の列挙。空配列でも 200 を返す(=権限なし)。
// ============================================================
oidcRouter.get('/entitlements/me', async (c) => {
    const auth = c.req.header('Authorization') || ''
    if (!auth.startsWith('Bearer ')) return bearerUnauthorized(c)
    const token = auth.slice(7)
    const hashedToken = await hashToken(token)
    const session = await c.env.DB.prepare('SELECT * FROM app_sessions WHERE token = ? AND expires_at > ?')
        .bind(hashedToken, Math.floor(Date.now() / 1000)).first() as any
    if (!session) return bearerUnauthorized(c, 'invalid_token', 'the access token is invalid or expired')

    // トークンを発行した OIDC クライアント → 組み込まれているドメインサービスを service_apps から引く。
    //   アプリは多対多で複数サービスに属しうる。承認済み(active)サービスのみ対象。
    const { results: svcRows } = await c.env.DB.prepare(`
        SELECT s.id AS id, s.name AS name FROM service_apps sa
        JOIN services s ON s.id = sa.service_id
        WHERE sa.app_id = ? AND (s.status IS NULL OR s.status = 'active')
        ORDER BY s.name
    `).bind(session.app_id).all()
    const boundServices = (svcRows as { id: string; name: string }[]) || []
    if (boundServices.length === 0) {
        // 403: このクライアントはどの(承認済み)サービスにも組み込まれていない = エンタイトルメント用ではない。
        return c.json({ error: 'not_entitlement_client', error_description: 'this client is not part of any service' }, 403)
    }

    // 各サービスについて ①②③ 全通過の割当を列挙する。
    const services = [] as any[]
    for (const s of boundServices) {
        services.push({ service: { id: s.id, name: s.name }, entitlements: await getEntitlements(c, session.user_id, s.id) })
    }
    const asOf = Math.floor(Date.now() / 1000)
    // 単一サービスのクライアントは従来通り service / entitlements をトップレベルにも出す(後方互換)。
    if (services.length === 1) {
        return c.json({ subject: session.user_id, service: services[0].service, as_of: asOf, entitlements: services[0].entitlements, services })
    }
    return c.json({ subject: session.user_id, as_of: asOf, services })
})

// OIDC Back-Channel Logout 1.0 §2.4: logout_token は `events` メンバーを持ち subject を
// 特定する署名付き JWT。ここでは subject 単位でログアウトする(そのユーザーの app_sessions
// を全て失効)ので `sid` は省略し、backchannel_logout_session_supported:false を広告する
// — RP はこの sub の自分の全セッションをログアウトする。
async function backchannelLogoutToken(c: any, issuer: string, clientId: string, userId: string): Promise<string> {
    return signRS256({
        iss: issuer,
        aud: clientId,
        sub: userId,
        iat: Math.floor(Date.now() / 1000),
        jti: generateToken(),
        events: { 'http://schemas.openid.net/event/backchannel-logout': {} },
    }, c.env.DB, requireSecret(c.env, 'OIDC_KEK', 'dev-only-insecure-oidc-kek-change-me'), 'logout+jwt')
}

// ユーザーがログイン中の RP のうち、backchannel_logout_uri を登録しているもの全てに
// 通知する。同一アカウントの Worker はその *.workers.dev ホストへ直接 fetch しても届かない
// (Cloudflare エラー 1042)ため、RP_<APP_ID> という名前のサービスバインディングがあれば
// それ経由で送り、外部 RP は通常の fetch を使う。短いタイムアウトでベストエフォート —
// 到達不能な RP でログアウトが固まってはならない。
async function sendBackchannelLogouts(c: any, issuer: string, userId: string): Promise<void> {
    const { results } = await c.env.DB.prepare(
        `SELECT DISTINCT a.id AS app_id, a.backchannel_logout_uri AS uri
           FROM app_sessions s JOIN apps a ON a.id = s.app_id
          WHERE s.user_id = ? AND a.backchannel_logout_uri IS NOT NULL AND a.backchannel_logout_uri != ''`
    ).bind(userId).all() as any
    const targets = (results as any[]) || []
    if (targets.length === 0) return
    await Promise.allSettled(targets.map(async (t: any) => {
        const logoutToken = await backchannelLogoutToken(c, issuer, t.app_id, userId)
        const bindingName = 'RP_' + String(t.app_id).toUpperCase().replace(/[^A-Z0-9]/g, '_')
        const fetcher = (c.env as any)[bindingName]?.fetch ? (c.env as any)[bindingName] : { fetch }
        const ctrl = new AbortController()
        const timer = setTimeout(() => ctrl.abort(), 4000)
        try {
            await fetcher.fetch(t.uri, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ logout_token: logoutToken }).toString(),
                signal: ctrl.signal,
            })
        } catch { /* RP unreachable — best effort */ } finally { clearTimeout(timer) }
    }))
}

// RP起点ログアウト(OIDC RP-Initiated Logout 1.0)。GET と POST に対応。
// パラメータ: post_logout_redirect_uri(+ Auth0風の returnTo エイリアス)、id_token_hint、
// state。ブラウザの SSO セッションを終了し、かつ発行済み OIDC トークン(app_sessions)を
// 失効させるので、ログアウトで実際に access/refresh が無効になる。さらにユーザーがログイン
// 中の全 RP へ OIDC Back-Channel Logout を送出する。
oidcRouter.on(['GET', 'POST'], '/oidc/logout', async (c) => {
    // パラメータはクエリ文字列から読み、POST フォーム送信ならボディからも読む。
    const q = c.req.query()
    let p: Record<string, string> = { ...q }
    if (c.req.method === 'POST') {
        try {
            const body = await c.req.parseBody()
            for (const [k, v] of Object.entries(body)) if (typeof v === 'string') p[k] = v
        } catch { /* ignore */ }
    }
    const idTokenHint = p.id_token_hint
    const state = p.state
    const dest = p.post_logout_redirect_uri || p.returnTo

    // エンドユーザーを特定する。有効な SSO セッションを優先し、無ければ id_token_hint
    // (自身が発行した検証済みトークン)内の sub にフォールバックする。これにより、
    // ブラウザのセッションCookieが既に消えていてもトークン失効は機能する。
    const sessionId = getCookie(c, '__Host-idp_session')
    const hashedSessionId = sessionId ? await hashToken(sessionId) : null
    let userId: string | null = null
    if (hashedSessionId) {
        const session = await c.env.DB.prepare('SELECT user_id FROM sessions WHERE id = ?').bind(hashedSessionId).first() as Session | null
        if (session) userId = session.user_id
    }

    // id_token_hint を検証する(署名のみ — ログアウト時には通常すでに失効している)。
    let hintAud: string | null = null
    const ID_TOKEN_LOGOUT_GRACE_SEC = 24 * 3600; // 24 hours
    if (idTokenHint) {
        const payload = await verifyRS256(idTokenHint, c.env.DB, requireSecret(c.env, 'OIDC_KEK', 'dev-only-insecure-oidc-kek-change-me'))
        if (payload) {
            hintAud = typeof payload.aud === 'string' ? payload.aud
                : Array.isArray(payload.aud) ? String(payload.aud[0]) : null
            
            // exp検証（猶予期間つき）
            const nowSec = Math.floor(Date.now() / 1000)
            const exp = typeof payload.exp === 'number' ? payload.exp : 0
            const isWithinGracePeriod = exp + ID_TOKEN_LOGOUT_GRACE_SEC >= nowSec

            // クッキーにセッションがなく、かつ猶予期間内なら sub を信用する
            if (!userId && isWithinGracePeriod && typeof payload.sub === 'string') {
                userId = payload.sub
            }
        }
    }

    // バックチャネルログアウト: app_sessions を削除する前に、ユーザーがログイン中の各 RP へ
    // 通知する(どの RP に届けるかを知るために app_sessions を読むため)。
    if (userId) {
        try { await sendBackchannelLogouts(c, new URL(c.req.url).origin, userId) } catch (e) { }
    }
    // #9: このユーザーの OIDC トークンを失効させ、access/refresh を無効化する。
    if (userId) {
        try { await c.env.DB.prepare('DELETE FROM app_sessions WHERE user_id = ?').bind(userId).run() } catch (e) { }
    }
    // ブラウザの SSO セッションを終了し Cookie をクリアする。
    if (hashedSessionId) {
        try { await c.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(hashedSessionId).run() } catch (e) { }
    }
    setCookie(c, '__Host-idp_session', '', { path: '/', secure: true, httpOnly: true, expires: new Date(0) })

    // 遷移先が登録済みの場合のみ RP へリダイレクトする(オープンリダイレクト防止)。
    // id_token_hint がある場合は、遷移先がそのトークンのクライアント(aud)に属することも
    // 要求する。#11: state はそのままエコーする。
    if (dest) {
        const { results } = await c.env.DB.prepare('SELECT id, base_url, redirect_uris FROM apps WHERE status = ?').bind('active').all() as any
        const matching = (results as any[]).filter((a: any) => isAllowedRedirectUri(dest, a))
        const allowed = hintAud
            ? matching.some((a: any) => a.id === hintAud)
            : matching.length > 0
        if (allowed) {
            const target = state ? dest + (dest.includes('?') ? '&' : '?') + 'state=' + encodeURIComponent(state) : dest
            return c.redirect(target)
        }
    }
    return c.redirect('/login')
})

// トークン失効(RFC 7009)。RP が access_token または refresh_token を提示し、
// (機密クライアントなら)認証する。一致した app_session を削除する。
// §2.2 により、形式が正しいリクエストにはトークンが未知/既に無効でも 200 を返す。
// これによりクライアントはトークンの有効性を探れない。
oidcRouter.post('/oauth/revoke', async (c) => {
    c.header('Cache-Control', 'no-store')
    c.header('Pragma', 'no-cache')
    const body = await parseClientBody(c)

    // クライアント認証: client_secret_post(ボディ)または client_secret_basic(ヘッダ)。
    const basic = parseBasicAuth(c)
    const providedSecret = (body.client_secret as string) || basic.secret

    const token = body.token
    if (!token) return tokenError(c, 'invalid_request', 'missing token')
    const hint = body.token_type_hint

    // トークンを access token または refresh token として引き当てる。token_type_hint は
    // あくまで最適化であり、RFC 7009 §2.1 はもう一方の種別も試すことを要求する。
    const hashedToken = await hashToken(token)
    const byRefresh = c.env.DB.prepare('SELECT * FROM app_sessions WHERE refresh_token = ?').bind(hashedToken)
    const byAccess = c.env.DB.prepare('SELECT * FROM app_sessions WHERE token = ?').bind(hashedToken)
    let session = await (hint === 'access_token' ? byAccess : byRefresh).first() as any
    if (!session) session = await (hint === 'access_token' ? byRefresh : byAccess).first() as any

    if (session) {
        // トークンが発行されたクライアントだけがそれを失効できる。
        const auth = await authenticateClient(c, session.app_id, providedSecret, true)
        if (!auth.ok) return auth.res
        const clientId = (body.client_id as string) || basic.clientId
        if (!clientId || clientId === session.app_id) {
            await c.env.DB.prepare('DELETE FROM app_sessions WHERE id = ?').bind(session.id).run()
        }
    }
    // 未知のトークン → 何もせず成功扱い(§2.2)。
    return c.body(null, 200)
})

// トークンイントロスペクション(RFC 7662)。RP が access_token または refresh_token を
// 提示して認証する。IdP はそれが active かどうかとメタデータを返す。
// 呼び出し元クライアント以外に属するトークンは inactive として返す(§4 プライバシー)。
oidcRouter.post('/oauth/introspect', async (c) => {
    c.header('Cache-Control', 'no-store')
    c.header('Pragma', 'no-cache')
    const body = await parseClientBody(c)
    const basic = parseBasicAuth(c)
    const providedSecret = (body.client_secret as string) || basic.secret
    const callerId = (body.client_id as string) || basic.clientId

    const token = body.token
    if (!token) return tokenError(c, 'invalid_request', 'missing token')
    const hashedToken = await hashToken(token)

    // 呼び出し元は登録済みクライアントとして認証しなければならない(RFC 7662 §2.1)。
    // ここでは*呼び出し元自身*の身元を認証する — トークンの所有者ではない — ので、
    // 他クライアントに属するトークンは invalid_client エラーで存在を漏らす代わりに
    // inactive として返される。
    if (!callerId) return tokenError(c, 'invalid_client', 'client authentication required', 401)
    const auth = await authenticateClient(c, callerId, providedSecret, true)
    if (!auth.ok) return auth.res

    const hint = body.token_type_hint
    const inactive = () => c.json({ active: false })

    const byRefresh = c.env.DB.prepare('SELECT * FROM app_sessions WHERE refresh_token = ?').bind(hashedToken)
    const byAccess = c.env.DB.prepare('SELECT * FROM app_sessions WHERE token = ?').bind(hashedToken)
    // どちらの形式で一致したかを記録し、token_type のラベル付けと access token の失効判定に使う。
    let session = await (hint === 'refresh_token' ? byRefresh : byAccess).first() as any
    let matchedAccess = !!session && session.token === hashedToken
    if (!session) {
        session = await (hint === 'refresh_token' ? byAccess : byRefresh).first() as any
        matchedAccess = !!session && session.token === hashedToken
    }
    // 未知のトークン、または別クライアントに属するトークン → inactive(§4 プライバシー)。
    if (!session || session.app_id !== callerId) return inactive()

    const now = Math.floor(Date.now() / 1000)
    // access token は expires_at で失効。refresh token はローテーション/失効まで有効。
    if (matchedAccess && session.expires_at <= now) return inactive()

    return c.json({
        active: true,
        scope: session.scope || undefined,
        client_id: session.app_id,
        sub: session.user_id,
        token_type: matchedAccess ? 'Bearer' : 'refresh_token',
        ...(matchedAccess ? { exp: session.expires_at } : {}),
        ...(session.auth_time != null ? { auth_time: session.auth_time } : {}),
    })
})
