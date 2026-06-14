import { sign, verify } from 'hono/jwt'
import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { csrf } from 'hono/csrf'
import { html } from 'hono/html'
import { Env, User, App, Session, Permission, Group, AuthCode, SystemConfig, LocalizedText } from './types'
import { verifyPassword, hashPassword, generateToken, getCookieOptions } from './utils/auth'
import { generateSecret, generateQRCode, verifyToken } from './utils/totp'
import { sendEmail } from './utils/mail'
import { fetchAppIcon } from './utils/icon'
import { signRS256, verifyPkce, verifyRS256 } from './oidc/jwt'
import { getJwksKeys } from './oidc/keys'
import { Login } from './views/Login'
import { Signup } from './views/Signup'
import { UserDashboard } from './views/UserDashboard'
import { Invite } from './views/Invite'
import { ForgotPassword } from './views/ForgotPassword'
import { ResetPassword } from './views/ResetPassword'
import { ChangePassword } from './views/ChangePassword'
import { Setup2FA } from './views/Setup2FA'
import { Login2FA } from './views/Login2FA'

import { AdminHome } from './views/admin/AdminHome'
import { AppsPage } from './views/admin/AppsPage'
import { GroupsPage } from './views/admin/GroupsPage'
import { UsersPage } from './views/admin/UsersPage'
import { LogsPage } from './views/admin/LogsPage'

import { dict } from './i18n'

const app = new Hono<{ Bindings: Env }>()

// CSRF protects the HTML form routes. The OIDC machine endpoints
// (/oauth/token, /userinfo) and the legacy JSON API are called
// cross-origin by SDKs/backends, so they are exempt. /authorize is a
// GET and not guarded by csrf() anyway.
// /oidc/logout is RP-initiated (inherently cross-site, and may be POSTed per
// OIDC RP-Initiated Logout). /oauth/revoke (RFC 7009) is a machine endpoint
// called by RP backends. Both are exempt like the other OIDC endpoints.
const oidcCsrfExempt = (path: string) =>
    path === '/oauth/token' || path === '/oauth/revoke' || path === '/userinfo' ||
    path === '/oidc/logout' || path.startsWith('/api/')
app.use('*', async (c, next) => {
    if (oidcCsrfExempt(c.req.path)) return next()
    return csrf()(c, next)
})

const getLang = (c: any) => {
    const accept = c.req.header('Accept-Language') || ''
    return accept.includes('ja') ? dict.ja : dict.en
}

async function getSystemConfig(db: D1Database): Promise<SystemConfig> {
    const config: SystemConfig = {
        appName: { ja: 'Tobira', en: 'Tobira' },
        appSubtitle: { ja: 'Secure Identity Provider', en: 'Secure Identity Provider' }
    };
    try {
        const { results } = await db.prepare('SELECT * FROM system_config').all<{ key: string, value: string }>();
        if (results) {
            results.forEach(r => {
                if (r.key === 'app_name_ja') config.appName.ja = r.value;
                if (r.key === 'app_name_en') config.appName.en = r.value;
                if (r.key === 'app_subtitle_ja') config.appSubtitle.ja = r.value;
                if (r.key === 'app_subtitle_en') config.appSubtitle.en = r.value;
            });
        }
    } catch (e) {
        console.error('Config fetch failed:', e);
    }
    return config;
}

function getLocalizedValue(c: any, text: LocalizedText): string {
    const accept = c.req.header('Accept-Language') || ''
    return accept.includes('ja') ? text.ja : text.en
}

// Helper for Icon Upload
async function handleIconUpload(body: any): Promise<string | null> {
    const file = body['icon_file'];
    if (file && file instanceof File && file.size > 0) {
        // D1 limit check (safe margin)
        if (file.size > 1024 * 150) {
            console.warn('Icon file too large:', file.size);
            return null; 
        }
        const buf = await file.arrayBuffer();
        let binary = '';
        const bytes = new Uint8Array(buf);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return `data:${file.type};base64,${btoa(binary)}`;
    }
    return null;
}

// ------------------------------------------------------------------
// Permissions Logic
// ------------------------------------------------------------------
async function checkPermission(c: any, userId: string, appId: string): Promise<{ allowed: boolean, reason?: string }> {
    const now = Math.floor(Date.now() / 1000)

    const app = await c.env.DB.prepare('SELECT status FROM apps WHERE id = ?').bind(appId).first() as App | null
    if (app && app.status === 'inactive') {
        return { allowed: false, reason: 'App is paused' }
    }

    const userPerm = await c.env.DB.prepare('SELECT * FROM permissions WHERE user_id = ? AND app_id = ?')
        .bind(userId, appId).first() as Permission | null

    if (userPerm) {
        if (userPerm.valid_from <= now && userPerm.valid_to >= now) return { allowed: true }
        else return { allowed: false, reason: 'User permission expired/invalid' }
    }

    const user = await c.env.DB.prepare('SELECT group_id FROM users WHERE id = ?').bind(userId).first() as User | null
    if (user && user.group_id) {
        const groupPerm = await c.env.DB.prepare('SELECT * FROM group_permissions WHERE group_id = ? AND app_id = ?')
            .bind(user.group_id, appId).first() as Permission | null
        if (groupPerm && groupPerm.valid_from <= now && groupPerm.valid_to >= now) return { allowed: true }
    }

    return { allowed: false, reason: 'No permission found' }
}

// Fixed-window per-key rate limiter backed by D1. Returns true if allowed.
// (Cloudflare's native rate-limit binding is best-effort/eventually-consistent
// and was not enforcing reliably here, so we keep an authoritative counter.)
async function rateLimit(db: D1Database, key: string, limit: number, windowSec: number): Promise<boolean> {
    const now = Math.floor(Date.now() / 1000)
    const row = await db.prepare('SELECT count, reset_at FROM rate_limits WHERE k = ?')
        .bind(key).first<{ count: number; reset_at: number }>()
    if (!row || row.reset_at <= now) {
        await db.prepare('INSERT INTO rate_limits (k, count, reset_at) VALUES (?, 1, ?) ON CONFLICT(k) DO UPDATE SET count = 1, reset_at = excluded.reset_at')
            .bind(key, now + windowSec).run()
        return true
    }
    if (row.count >= limit) return false
    await db.prepare('UPDATE rate_limits SET count = count + 1 WHERE k = ?').bind(key).run()
    return true
}

async function getAdmin(c: any) {
    const sessionId = getCookie(c, '__Host-idp_session')
    if (!sessionId) return null
    const session = await c.env.DB.prepare('SELECT user_id FROM sessions WHERE id = ?').bind(sessionId).first() as Session | null
    if (!session) return null
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(session.user_id).first() as User | null
    const admin = await c.env.DB.prepare('SELECT * FROM admins WHERE email = ?').bind(user?.email).first()
    return admin ? user : null
}

async function getUser(c: any) {
    const sessionId = getCookie(c, '__Host-idp_session')
    if (!sessionId) return null
    const session = await c.env.DB.prepare('SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?').bind(sessionId, Math.floor(Date.now() / 1000)).first() as Session | null
    if (!session) return null
    return await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(session.user_id).first() as User | null
}

// Fetch the current (unexpired) session row, including auth_time. Used where we
// need the authentication time, not just the user (OIDC /authorize).
async function getSessionRow(c: any): Promise<Session | null> {
    const sessionId = getCookie(c, '__Host-idp_session')
    if (!sessionId) return null
    return await c.env.DB.prepare('SELECT * FROM sessions WHERE id = ? AND expires_at > ?')
        .bind(sessionId, Math.floor(Date.now() / 1000)).first() as Session | null
}

// Create a fresh login session and set its cookie. Records auth_time (the real
// authentication moment) so OIDC auth_time / max_age / prompt=login work.
async function createSession(c: any, userId: string): Promise<void> {
    const sessionId = generateToken()
    const now = Math.floor(Date.now() / 1000)
    const expires = now + 86400
    await c.env.DB.prepare('INSERT INTO sessions (id, user_id, expires_at, auth_time) VALUES (?, ?, ?, ?)')
        .bind(sessionId, userId, expires, now).run()
    setCookie(c, '__Host-idp_session', sessionId, getCookieOptions(expires))
}

// Parse a client's registered redirect_uris (newline-separated) into a list.
function parseRedirectUris(raw: string | null | undefined): string[] {
    return (raw || '').split(/[\r\n]+/).map(s => s.trim()).filter(Boolean)
}

// Validate a requested redirect_uri against a registered client.
//
// Preferred path (OIDC Core 3.1.2.1): if the client has an explicit list of
// redirect_uris registered, the request must match one of them by exact string
// comparison. This is the spec-correct behaviour.
//
// Legacy fallback: clients registered before redirect_uris existed only have a
// base_url. For those we require the origin to match exactly and allow any path
// at or below base_url's path. The exact-origin check still closes the
// prefix-match hole (e.g. "https://app.example.evil.com" / "...@evil.com").
function isAllowedRedirectUri(redirectUri: string, app: { base_url: string; redirect_uris?: string | null }): boolean {
    const registered = parseRedirectUris(app.redirect_uris)
    if (registered.length > 0) return registered.includes(redirectUri)

    let redir: URL, base: URL
    try {
        redir = new URL(redirectUri)
        base = new URL(app.base_url)
    } catch {
        return false
    }
    // Only http(s) redirect targets are permitted.
    if (redir.protocol !== 'https:' && redir.protocol !== 'http:') return false
    if (redir.origin !== base.origin) return false
    const basePath = base.pathname.replace(/\/+$/, '')
    if (basePath === '') return true // base registered at origin root: any path allowed
    return redir.pathname === basePath || redir.pathname.startsWith(basePath + '/')
}

// ------------------------------------------------------------------
// Routes
// ------------------------------------------------------------------

app.get('/', async (c) => {
    try {
        const t = getLang(c)
        const user = await getUser(c)
        const config = await getSystemConfig(c.env.DB)
        const siteName = getLocalizedValue(c, config.appName)

        if (!user) return c.redirect('/login')

        const now = Math.floor(Date.now() / 1000)
        const { results: apps } = await c.env.DB.prepare(`
        SELECT DISTINCT a.* FROM apps a
        LEFT JOIN permissions up ON a.id = up.app_id AND up.user_id = ?
        LEFT JOIN group_permissions gp ON a.id = gp.app_id AND gp.group_id = ?
        WHERE 
          (a.status IS NULL OR a.status = 'active') AND
          ((up.valid_from <= ? AND up.valid_to >= ?) OR (up.id IS NULL AND gp.valid_from <= ? AND gp.valid_to >= ?))
      `).bind(user.id, user.group_id || null, now, now, now, now).all()

        return c.html(<UserDashboard t={t} userEmail={user.email} apps={apps as any} siteName={siteName} has2FA={!!user.two_factor_secret} profileName={user.name} profileUsername={user.preferred_username} profilePicture={user.picture} />)
    } catch (e: any) {
        return c.json({ error: e.message, stack: e.stack }, 500)
    }
})

app.get('/login', async (c) => {
    const t = getLang(c)
    const config = await getSystemConfig(c.env.DB)
    const siteName = getLocalizedValue(c, config.appName)
    const siteSubtitle = getLocalizedValue(c, config.appSubtitle)
    const redirectTo = c.req.query('redirect_to')
    const returnTo = c.req.query('return_to') // OIDC: come back to /authorize after login
    const msgKey = c.req.query('msg')
    // @ts-ignore
    const message = msgKey && t[msgKey] ? t[msgKey] : undefined
    // OIDC prompt=login / max_age forces re-authentication: /authorize sends us
    // here with reauth=1 so we show the form instead of silently reusing the
    // still-valid SSO session.
    const reauth = c.req.query('reauth') === '1'

    const user = await getUser(c)
    if (user && !reauth) {
        if (returnTo && isSafeReturnTo(returnTo)) return c.redirect(returnTo)
        if (redirectTo) return issueCodeAndRedirect(c, user.id, redirectTo)
        const admin = await c.env.DB.prepare('SELECT * FROM admins WHERE email = ?').bind(user.email).first()
        return c.redirect(admin ? '/admin' : '/')
    }

    return c.html(<Login t={t} redirectTo={redirectTo} returnTo={returnTo} message={message} siteName={siteName} siteSubtitle={siteSubtitle} />)
})

app.post('/login', async (c) => {
    const t = getLang(c)
    const config = await getSystemConfig(c.env.DB)
    const siteName = getLocalizedValue(c, config.appName)
    const siteSubtitle = getLocalizedValue(c, config.appSubtitle)

    // Per-IP rate limit to slow down password brute-forcing.
    const loginIp = c.req.header('CF-Connecting-IP') || 'unknown'
    if (!(await rateLimit(c.env.DB, `login:${loginIp}`, 10, 60))) {
        return c.html(<Login t={t} error={t.error_rate_limited} siteName={siteName} siteSubtitle={siteSubtitle} />, 429)
    }

    const body = await c.req.parseBody()
    const email = body['email'] as string
    const password = body['password'] as string
    const redirectTo = body['redirect_to'] as string
    const returnTo = body['return_to'] as string // OIDC: /authorize URL to resume

    const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first() as User | null
    if (!user || !(await verifyPassword(password, user.password_hash))) {
        return c.html(<Login t={t} redirectTo={redirectTo} returnTo={returnTo} error={t.error_credentials} siteName={siteName} siteSubtitle={siteSubtitle} />)
    }

    // 2FA Check
    if (user.two_factor_secret) {
        const secret = c.env.JWT_SECRET || 'dev_secret'
        const token = await sign({ sub: user.id, role: 'pre_2fa', exp: Math.floor(Date.now() / 1000) + 300 }, secret)
        setCookie(c, 'pre_2fa_token', token, { path: '/', secure: true, httpOnly: true, maxAge: 300, sameSite: 'Lax' })

        const params = new URLSearchParams()
        if (redirectTo) params.set('redirect_to', redirectTo)
        if (returnTo) params.set('return_to', returnTo)
        const qs = params.toString()
        return c.redirect('/login/2fa' + (qs ? '?' + qs : ''))
    }

    await createSession(c, user.id)

    let targetAppName = 'Tobira Dashboard';
    const admin = await c.env.DB.prepare('SELECT * FROM admins WHERE email = ?').bind(email).first()
    if (redirectTo) {
        const { results } = await c.env.DB.prepare('SELECT * FROM apps WHERE status = ?').bind('active').all() as any;
        const app = (results as any[]).find((a: any) => isAllowedRedirectUri(redirectTo, a));
        if (app) targetAppName = app.name;
    } else if (admin) {
        targetAppName = 'Tobira Admin';
    }

    const details = JSON.stringify({ key: 'log_login_app', params: { email, appName: targetAppName } });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('LOGIN', details).run()

    if (returnTo && isSafeReturnTo(returnTo)) return c.redirect(returnTo)
    if (redirectTo) return issueCodeAndRedirect(c, user.id, redirectTo)

    return c.redirect(admin ? '/admin' : '/')
})

// --- Self-service signup ---
// Open registration. New users are optionally placed into a default group
// (system_config key 'signup_group_id') so they immediately inherit that
// group's app permissions — used to grant public-demo access automatically.
app.get('/signup', async (c) => {
    const t = getLang(c)
    const config = await getSystemConfig(c.env.DB)
    const siteName = getLocalizedValue(c, config.appName)
    const siteSubtitle = getLocalizedValue(c, config.appSubtitle)
    const redirectTo = c.req.query('redirect_to')
    const returnTo = c.req.query('return_to')

    const user = await getUser(c)
    if (user) {
        if (returnTo && isSafeReturnTo(returnTo)) return c.redirect(returnTo)
        if (redirectTo) return issueCodeAndRedirect(c, user.id, redirectTo)
        return c.redirect('/')
    }
    return c.html(<Signup t={t} redirectTo={redirectTo} returnTo={returnTo} siteName={siteName} siteSubtitle={siteSubtitle} />)
})

app.post('/signup', async (c) => {
    const t = getLang(c)
    const config = await getSystemConfig(c.env.DB)
    const siteName = getLocalizedValue(c, config.appName)
    const siteSubtitle = getLocalizedValue(c, config.appSubtitle)
    const body = await c.req.parseBody()
    const email = ((body['email'] as string) || '').trim()
    const password = body['password'] as string
    const redirectTo = body['redirect_to'] as string
    const returnTo = body['return_to'] as string

    const view = (error: string) => c.html(<Signup t={t} redirectTo={redirectTo} returnTo={returnTo} error={error} siteName={siteName} siteSubtitle={siteSubtitle} />)

    // Per-IP rate limit to curb automated mass signups.
    const signupIp = c.req.header('CF-Connecting-IP') || 'unknown'
    if (!(await rateLimit(c.env.DB, `signup:${signupIp}`, 5, 60))) {
        return c.html(<Signup t={t} redirectTo={redirectTo} returnTo={returnTo} error={t.error_rate_limited} siteName={siteName} siteSubtitle={siteSubtitle} />, 429)
    }

    if (!email || !password) return view(t.error_required)

    const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()
    if (existing) return view(t.error_user_exists)

    // Optional default group → inherits that group's app permissions.
    const grpRow = await c.env.DB.prepare("SELECT value FROM system_config WHERE key = 'signup_group_id'").first<{ value: string }>()
    const groupId = grpRow?.value || null

    const userId = crypto.randomUUID()
    const pwHash = await hashPassword(password)
    const now = Math.floor(Date.now() / 1000)
    try {
        await c.env.DB.prepare('INSERT INTO users (id, email, password_hash, group_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
            .bind(userId, email, pwHash, groupId, now, now).run()
    } catch (e) {
        return view(t.error_user_exists)
    }

    const details = JSON.stringify({ key: 'log_login', params: { email } })
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('SIGNUP', details).run()

    // Auto-login the freshly created account.
    await createSession(c, userId)

    if (returnTo && isSafeReturnTo(returnTo)) return c.redirect(returnTo)
    if (redirectTo) return issueCodeAndRedirect(c, userId, redirectTo)
    return c.redirect('/')
})

async function issueCodeAndRedirect(c: any, userId: string, redirectTo: string) {
    const { results } = await c.env.DB.prepare('SELECT * FROM apps WHERE status = ?').bind('active').all() as any
    const app = (results as App[]).find(a => isAllowedRedirectUri(redirectTo, a))

    if (!app) {
        console.error(`[Auth] No app matches redirect_to: ${redirectTo}`);
        return c.text('Invalid App: Redirect URL not registered', 400)
    }

    const check = await checkPermission(c, userId, app.id)
    if (!check.allowed) return c.text('Access Denied: ' + (check.reason || ''), 403)

    const code = generateToken()
    const expires = Math.floor(Date.now() / 1000) + 300
    const session = await getSessionRow(c)
    await c.env.DB.prepare('INSERT INTO auth_codes (code, user_id, app_id, expires_at, auth_time) VALUES (?, ?, ?, ?, ?)').bind(code, userId, app.id, expires, session?.auth_time ?? null).run()

    const separator = redirectTo.includes('?') ? '&' : '?'
    return c.redirect(`${redirectTo}${separator}code=${code}`)
}

app.get('/logout', async (c) => {
    const sessionId = getCookie(c, '__Host-idp_session')
    if (sessionId) {
        const session = await c.env.DB.prepare('SELECT user_id FROM sessions WHERE id = ?').bind(sessionId).first() as Session | null
        if (session) {
            await c.env.DB.prepare('DELETE FROM app_sessions WHERE user_id = ?').bind(session.user_id).run()
        }
        try { await c.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run() } catch (e) { }
    }
    setCookie(c, '__Host-idp_session', '', { path: '/', secure: true, httpOnly: true, expires: new Date(0) })
    return c.redirect('/login')
})

// ... (2FA, Password Reset routes omitted for brevity but should be here. Assuming they are standard) ...
// NOTE: For full restore, we include all standard routes.

app.get('/user/2fa/setup', async (c) => {
    const user = await getUser(c)
    if (!user) return c.redirect('/login')
    const t = getLang(c)
    const secret = generateSecret()
    const qrCode = await generateQRCode(secret, user.email, 'Tobira')
    return c.html(<Setup2FA t={t} qrCodeDataUrl={qrCode} secret={secret} />)
})
app.post('/user/2fa/setup', async (c) => {
    const user = await getUser(c)
    if (!user) return c.redirect('/login')
    const t = getLang(c)
    const body = await c.req.parseBody()
    const token = (body['token'] as string).replace(/\s+/g, '')
    const secret = body['secret'] as string 
    if (verifyToken(token, secret)) {
        await c.env.DB.prepare('UPDATE users SET two_factor_secret = ? WHERE id = ?').bind(secret, user.id).run()
        const details = JSON.stringify({ key: 'log_2fa_enable', params: { email: user.email } });
        await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('2FA_ENABLE', details).run()
        return c.redirect('/?msg=msg_2fa_enabled')
    } else {
        const qrCode = await generateQRCode(secret, user.email, 'Tobira')
        return c.html(<Setup2FA t={t} qrCodeDataUrl={qrCode} secret={secret} error={t.err_invalid_code} />)
    }
})
app.post('/user/2fa/disable', async (c) => {
    const user = await getUser(c)
    if (!user) return c.redirect('/login')
    await c.env.DB.prepare('UPDATE users SET two_factor_secret = NULL WHERE id = ?').bind(user.id).run()
    const details = JSON.stringify({ key: 'log_2fa_disable', params: { email: user.email } });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('2FA_DISABLE', details).run()
    return c.redirect('/?msg=msg_2fa_disabled')
})
app.get('/change-password', async (c) => {
    const user = await getUser(c)
    if (!user) return c.redirect('/login')
    return c.html(<ChangePassword t={getLang(c)} />)
})
app.post('/change-password', async (c) => {
    const user = await getUser(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const password = body['password'] as string
    const pwHash = await hashPassword(password)
    await c.env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(pwHash, user.id).run()
    const details = JSON.stringify({ key: 'log_password_change', params: { email: user.email } });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('PASSWORD_CHANGE', details).run()
    return c.html(<ChangePassword t={getLang(c)} message={getLang(c).msg_password_changed} />)
})
// Self-service OIDC profile (name / preferred_username / picture). Blank = unset
// (falls back to email in claims).
app.post('/user/profile', async (c) => {
    const user = await getUser(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const name = ((body['name'] as string) || '').trim() || null
    const preferredUsername = ((body['preferred_username'] as string) || '').trim() || null
    const picture = ((body['picture'] as string) || '').trim() || null
    const now = Math.floor(Date.now() / 1000)
    await c.env.DB.prepare('UPDATE users SET name = ?, preferred_username = ?, picture = ?, updated_at = ? WHERE id = ?')
        .bind(name, preferredUsername, picture, now, user.id).run()
    return c.redirect('/')
})

// --- API Token ---
app.get('/api/me', async (c) => {
    const authHeader = c.req.header('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) return bearerUnauthorized(c)
    const token = authHeader.split(' ')[1]
    const session = await c.env.DB.prepare('SELECT * FROM app_sessions WHERE token = ? AND expires_at > ?').bind(token, Math.floor(Date.now() / 1000)).first()
    if (!session) return bearerUnauthorized(c, 'invalid_token', 'the access token is invalid or expired')
    const user = await c.env.DB.prepare('SELECT id, email, group_id, created_at FROM users WHERE id = ?').bind(session.user_id).first()
    if (!user) return c.json({ error: 'User not found' }, 404)
    return c.json(user)
})
app.post('/api/token', async (c) => {
    const body = await c.req.json().catch(() => { })
    const code = body['code']
    if (!code) return c.json({ error: 'Missing code' }, 400)
    const authCode = await c.env.DB.prepare('SELECT * FROM auth_codes WHERE code = ?').bind(code).first() as AuthCode | null
    if (!authCode || authCode.expires_at < Date.now() / 1000 || authCode.used_at) return c.json({ error: 'Invalid code' }, 400)
    await c.env.DB.prepare('UPDATE auth_codes SET used_at = ? WHERE code = ?').bind(Date.now() / 1000, code).run()
    const token = generateToken()
    const refreshToken = generateToken()
    const expiresAt = Math.floor(Date.now() / 1000) + 3600
    await c.env.DB.prepare('INSERT INTO app_sessions (token, refresh_token, user_id, app_id, expires_at) VALUES (?, ?, ?, ?, ?)')
        .bind(token, refreshToken, authCode.user_id, authCode.app_id, expiresAt).run()
    return c.json({ access_token: token, refresh_token: refreshToken, expires_in: 3600 })
})
app.post('/api/refresh', async (c) => {
    const body = await c.req.json().catch(() => { })
    const refreshToken = body['refresh_token']
    if (!refreshToken) return c.json({ error: 'Missing refresh_token' }, 400)
    const session = await c.env.DB.prepare('SELECT * FROM app_sessions WHERE refresh_token = ?').bind(refreshToken).first<Session & { app_id: string }>()
    if (!session) return c.json({ error: 'Invalid refresh token' }, 400)
    const check = await checkPermission(c, session.user_id, session.app_id)
    if (!check.allowed) {
        await c.env.DB.prepare('DELETE FROM app_sessions WHERE refresh_token = ?').bind(refreshToken).run()
        return c.json({ error: 'Access Denied', details: check.reason }, 403)
    }
    const newToken = generateToken()
    const newRefreshToken = generateToken()
    const newExpiresAt = Math.floor(Date.now() / 1000) + 3600
    await c.env.DB.prepare('UPDATE app_sessions SET token=?, refresh_token=?, expires_at=? WHERE refresh_token=?')
        .bind(newToken, newRefreshToken, newExpiresAt, refreshToken).run()
    return c.json({ access_token: newToken, refresh_token: newRefreshToken, expires_in: 3600 })
})

// ------------------------------------------------------------------
// OIDC (Auth0-compatible mock surface)
//
// Relying parties register as "apps" in the admin UI:
//   - app.id       == client_id
//   - app.base_url == registered origin (+ optional path) the redirect_uri
//                     must match; see isAllowedRedirectUri
// tobira's per-app permission gate is enforced at /authorize.
// access_token is opaque (looked up at /userinfo); id_token is a
// real RS256 JWT verifiable via /.well-known/jwks.json.
// ------------------------------------------------------------------

// return_to is used to resume /authorize after an interactive login.
// Only same-origin /authorize paths are allowed (no open redirect).
function isSafeReturnTo(v: string | undefined | null): boolean {
    return typeof v === 'string' && v.startsWith('/authorize')
}

function buildRedirect(redirectUri: string, mode: string | undefined, params: Record<string, string | undefined>): string {
    const usp = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) if (v != null && v !== '') usp.set(k, v)
    const sep = mode === 'fragment' ? '#' : (redirectUri.includes('?') ? '&' : '?')
    return redirectUri + sep + usp.toString()
}

function tokenError(c: any, error: string, description: string, status: 400 | 401 = 400) {
    return c.json({ error, error_description: description }, status)
}

// RFC 6750 §3: Bearer-protected resources must answer a failed request with a
// WWW-Authenticate challenge. When no credentials were supplied at all, the
// challenge omits the error code; an invalid/expired token gets error="invalid_token".
function bearerUnauthorized(c: any, error?: string, description?: string) {
    let challenge = 'Bearer realm="tobira"'
    if (error) {
        challenge += `, error="${error}"`
        if (description) challenge += `, error_description="${description}"`
    }
    c.header('WWW-Authenticate', challenge)
    return c.json({ error: error || 'invalid_request', error_description: description }, 401)
}

// Constant-time string comparison (avoids leaking the secret via timing).
function safeEqual(a: string, b: string): boolean {
    if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false
    let r = 0
    for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i)
    return r === 0
}

// OIDC client authentication for the token endpoint.
// Confidential client (a secret is registered) -> secret required & must match.
// Public client (no secret registered) -> PKCE must have been used.
async function authenticateClient(
    c: any, appId: string, providedSecret: string | undefined, usedPkce: boolean
): Promise<{ ok: true } | { ok: false; res: Response }> {
    const app = await c.env.DB.prepare('SELECT client_secret FROM apps WHERE id = ?').bind(appId).first() as { client_secret?: string | null } | null
    const registered = app?.client_secret
    if (registered) {
        if (!providedSecret || !safeEqual(providedSecret, registered)) {
            return { ok: false, res: tokenError(c, 'invalid_client', 'client authentication failed', 401) }
        }
    } else if (!usedPkce) {
        return { ok: false, res: tokenError(c, 'invalid_client', 'client authentication required: use PKCE or a registered client_secret') }
    }
    return { ok: true }
}

async function parseClientBody(c: any): Promise<Record<string, string>> {
    const ct = c.req.header('Content-Type') || ''
    if (ct.includes('application/json')) return (await c.req.json().catch(() => ({}))) as any
    const body = await c.req.parseBody()
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(body)) if (typeof v === 'string') out[k] = v
    return out
}

// Map a granted scope string to OIDC claims (OIDC Core 5.4). Only the standard
// claims for the granted scopes are returned, so an `openid`-only request does
// not leak email/profile data. Profile fields fall back to email when unset.
function buildOidcClaims(user: User, scope: string | null): Record<string, unknown> {
    const scopes = (scope || '').split(/\s+/).filter(Boolean)
    const claims: Record<string, unknown> = {}
    if (scopes.includes('profile')) {
        claims.name = user.name || user.email
        claims.preferred_username = user.preferred_username || user.email
        if (user.picture) claims.picture = user.picture
        claims.updated_at = user.updated_at
    }
    if (scopes.includes('email')) {
        claims.email = user.email
        claims.email_verified = true
    }
    return claims
}

async function issueOidcTokens(c: any, user: User, clientId: string, nonce: string | null, scope: string | null, authTime: number | null) {
    const now = Math.floor(Date.now() / 1000)
    const expiresIn = 3600
    const grantedScope = scope || 'openid'
    // Real end-user authentication time. Falls back to now only for legacy codes
    // / sessions issued before auth_time was tracked.
    const effectiveAuthTime = authTime ?? now
    const accessToken = generateToken()
    const refreshToken = generateToken()
    await c.env.DB.prepare('INSERT INTO app_sessions (token, refresh_token, user_id, app_id, expires_at, scope, auth_time) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(accessToken, refreshToken, user.id, clientId, now + expiresIn, grantedScope, effectiveAuthTime).run()

    const issuer = new URL(c.req.url).origin
    const idToken = await signRS256({
        iss: issuer,
        sub: user.id,
        aud: clientId,
        iat: now,
        exp: now + expiresIn,
        auth_time: effectiveAuthTime,
        ...(nonce ? { nonce } : {}),
        ...buildOidcClaims(user, grantedScope),
    }, c.env.DB, c.env.OIDC_KEK)

    return c.json({
        access_token: accessToken,
        id_token: idToken,
        token_type: 'Bearer',
        expires_in: expiresIn,
        refresh_token: refreshToken,
        scope: grantedScope,
    })
}

app.get('/.well-known/openid-configuration', (c) => {
    const issuer = new URL(c.req.url).origin
    return c.json({
        issuer,
        authorization_endpoint: `${issuer}/authorize`,
        token_endpoint: `${issuer}/oauth/token`,
        userinfo_endpoint: `${issuer}/userinfo`,
        jwks_uri: `${issuer}/.well-known/jwks.json`,
        end_session_endpoint: `${issuer}/oidc/logout`,
        revocation_endpoint: `${issuer}/oauth/revoke`,
        revocation_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic', 'none'],
        response_types_supported: ['code'],
        grant_types_supported: ['authorization_code', 'refresh_token'],
        subject_types_supported: ['public'],
        id_token_signing_alg_values_supported: ['RS256'],
        scopes_supported: ['openid', 'profile', 'email', 'offline_access'],
        token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic', 'none'],
        code_challenge_methods_supported: ['S256', 'plain'],
        claims_supported: ['sub', 'email', 'email_verified', 'name', 'preferred_username', 'iss', 'aud', 'exp', 'iat', 'nonce', 'auth_time'],
    })
})

app.get('/.well-known/jwks.json', async (c) => {
    const keys = await getJwksKeys(c.env.DB, c.env.OIDC_KEK)
    return c.json({ keys: keys.map(k => ({ ...k, alg: 'RS256', use: 'sig' })) })
})

app.get('/authorize', async (c) => {
    const q = c.req.query()
    const { client_id: clientId, redirect_uri: redirectUri, state, nonce, response_mode: responseMode } = q
    const responseType = q.response_type
    const scope = q.scope || 'openid'

    if (!clientId || !redirectUri) return c.text('invalid_request: client_id and redirect_uri are required', 400)

    const app = await c.env.DB.prepare('SELECT * FROM apps WHERE id = ?').bind(clientId).first() as App | null
    if (!app) return c.text('invalid_client: unknown client_id', 400)
    if (!isAllowedRedirectUri(redirectUri, app)) return c.text('invalid_request: redirect_uri is not registered for this client', 400)

    if (responseType && responseType !== 'code') {
        return c.redirect(buildRedirect(redirectUri, responseMode, { error: 'unsupported_response_type', error_description: 'only response_type=code is supported', state }))
    }

    // OIDC Core 3.1.2.1: prompt + max_age drive whether we (re-)authenticate.
    const now = Math.floor(Date.now() / 1000)
    const promptValues = (q.prompt || '').split(/\s+/).filter(Boolean)
    const promptNone = promptValues.includes('none')
    // We have no consent UI, so prompt=consent is a no-op; login/select_account
    // both mean "make the user authenticate again".
    const forceLogin = promptValues.includes('login') || promptValues.includes('select_account')
    const maxAge = /^\d+$/.test(q.max_age || '') ? parseInt(q.max_age, 10) : null

    // Require an authenticated session; bounce to login and resume here.
    const session = await getSessionRow(c)
    const user = session
        ? await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(session.user_id).first() as User | null
        : null

    const maxAgeExceeded = !!(user && maxAge !== null && now - (session?.auth_time ?? 0) > maxAge)
    const needReauth = !user || forceLogin || maxAgeExceeded

    if (needReauth) {
        // prompt=none forbids any UI: report back instead of showing a login form.
        if (promptNone) {
            return c.redirect(buildRedirect(redirectUri, responseMode, {
                error: 'login_required',
                error_description: user ? 're-authentication required but prompt=none' : 'no active session and prompt=none',
                state,
            }))
        }
        // Resume this exact request after login, but strip `prompt` so the
        // resumed authorize doesn't force login again and loop. max_age is kept:
        // a fresh session naturally satisfies it. `reauth=1` tells /login not to
        // silently reuse the still-valid session (prompt=login / stale max_age).
        const resume = new URL(c.req.url)
        resume.searchParams.delete('prompt')
        const returnTo = '/authorize' + resume.search
        return c.redirect('/login?reauth=1&return_to=' + encodeURIComponent(returnTo))
    }

    // Enforce tobira's per-app permission gate.
    const check = await checkPermission(c, user.id, app.id)
    if (!check.allowed) {
        return c.redirect(buildRedirect(redirectUri, responseMode, { error: 'access_denied', error_description: check.reason || 'access denied', state }))
    }

    const code = generateToken()
    const expires = Math.floor(Date.now() / 1000) + 300
    // Carry the session's real auth_time into the code so the id_token reflects
    // when the user actually authenticated (OIDC auth_time).
    await c.env.DB.prepare(
        'INSERT INTO auth_codes (code, user_id, app_id, expires_at, nonce, code_challenge, code_challenge_method, redirect_uri, scope, auth_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(code, user.id, app.id, expires, nonce || null, q.code_challenge || null, q.code_challenge_method || null, redirectUri, scope, session?.auth_time ?? null).run()

    return c.redirect(buildRedirect(redirectUri, responseMode, { code, state }))
})

app.post('/oauth/token', async (c) => {
    // RFC 6749 §5.1: token endpoint responses must not be cached.
    c.header('Cache-Control', 'no-store')
    c.header('Pragma', 'no-cache')
    const body = await parseClientBody(c)

    // Client auth: client_secret_post (body) or client_secret_basic (header).
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
        const ac = await c.env.DB.prepare('SELECT * FROM auth_codes WHERE code = ?').bind(code).first() as AuthCode | null
        const nowSec = Math.floor(Date.now() / 1000)
        if (!ac || ac.used_at || ac.expires_at < nowSec) return tokenError(c, 'invalid_grant', 'authorization code is invalid or expired')
        await c.env.DB.prepare('UPDATE auth_codes SET used_at = ? WHERE code = ?').bind(nowSec, code).run()

        const clientId = body.client_id || basicClientId
        if (clientId && clientId !== ac.app_id) return tokenError(c, 'invalid_grant', 'client_id does not match the authorization code')
        if (ac.redirect_uri && body.redirect_uri && body.redirect_uri !== ac.redirect_uri) return tokenError(c, 'invalid_grant', 'redirect_uri does not match')

        const pkceOk = await verifyPkce(body.code_verifier, ac.code_challenge as any, ac.code_challenge_method as any)
        if (!pkceOk) return tokenError(c, 'invalid_grant', 'PKCE verification failed')

        const auth = await authenticateClient(c, ac.app_id, providedSecret, !!ac.code_challenge)
        if (!auth.ok) return auth.res

        const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(ac.user_id).first() as User | null
        if (!user) return tokenError(c, 'invalid_grant', 'user not found')

        return issueOidcTokens(c, user, ac.app_id, (ac.nonce as any) || null, (ac.scope as any) || null, (ac.auth_time as any) ?? null)
    }

    if (grantType === 'refresh_token') {
        const refreshToken = body.refresh_token
        if (!refreshToken) return tokenError(c, 'invalid_request', 'missing refresh_token')
        const session = await c.env.DB.prepare('SELECT * FROM app_sessions WHERE refresh_token = ?').bind(refreshToken).first() as any
        if (!session) return tokenError(c, 'invalid_grant', 'invalid refresh_token')
        // Public clients refresh without a secret; confidential clients must authenticate.
        const auth = await authenticateClient(c, session.app_id, providedSecret, true)
        if (!auth.ok) return auth.res
        const check = await checkPermission(c, session.user_id, session.app_id)
        if (!check.allowed) {
            await c.env.DB.prepare('DELETE FROM app_sessions WHERE refresh_token = ?').bind(refreshToken).run()
            return tokenError(c, 'invalid_grant', check.reason || 'access denied')
        }
        const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(session.user_id).first() as User | null
        if (!user) return tokenError(c, 'invalid_grant', 'user not found')
        await c.env.DB.prepare('DELETE FROM app_sessions WHERE refresh_token = ?').bind(refreshToken).run()
        // Preserve the originally-granted scope and auth_time across the refresh,
        // so a refreshed id_token keeps the original authentication time.
        return issueOidcTokens(c, user, session.app_id, null, (session.scope as string) || null, (session.auth_time as number) ?? null)
    }

    return tokenError(c, 'unsupported_grant_type', grantType ? `grant_type '${grantType}' is not supported` : 'missing grant_type')
})

app.on(['GET', 'POST'], '/userinfo', async (c) => {
    const auth = c.req.header('Authorization') || ''
    if (!auth.startsWith('Bearer ')) return bearerUnauthorized(c)
    const token = auth.slice(7)
    const session = await c.env.DB.prepare('SELECT * FROM app_sessions WHERE token = ? AND expires_at > ?')
        .bind(token, Math.floor(Date.now() / 1000)).first() as any
    if (!session) return bearerUnauthorized(c, 'invalid_token', 'the access token is invalid or expired')
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(session.user_id).first() as User | null
    if (!user) return bearerUnauthorized(c, 'invalid_token', 'the access token is invalid or expired')
    // sub is always returned; other claims depend on the token's granted scope.
    return c.json({
        sub: user.id,
        ...buildOidcClaims(user, (session.scope as string) || null),
    })
})

// RP-initiated logout (OIDC RP-Initiated Logout 1.0). Supports GET and POST.
// Params: post_logout_redirect_uri (+ Auth0-style returnTo alias), id_token_hint,
// state. Ends the browser SSO session AND revokes the user's issued OIDC tokens
// (app_sessions), so logout actually invalidates access/refresh tokens.
app.on(['GET', 'POST'], '/oidc/logout', async (c) => {
    // Read params from the query string and, for POST form posts, the body.
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

    // Identify the end user. Prefer the active SSO session; fall back to the sub
    // in id_token_hint (a verified token we issued), so token revocation still
    // works even if the browser session cookie is already gone.
    const sessionId = getCookie(c, '__Host-idp_session')
    let userId: string | null = null
    if (sessionId) {
        const session = await c.env.DB.prepare('SELECT user_id FROM sessions WHERE id = ?').bind(sessionId).first() as Session | null
        if (session) userId = session.user_id
    }

    // Validate id_token_hint (signature only — it is routinely expired at logout).
    let hintAud: string | null = null
    if (idTokenHint) {
        const payload = await verifyRS256(idTokenHint, c.env.DB, c.env.OIDC_KEK)
        if (payload) {
            hintAud = typeof payload.aud === 'string' ? payload.aud
                : Array.isArray(payload.aud) ? String(payload.aud[0]) : null
            if (!userId && typeof payload.sub === 'string') userId = payload.sub
        }
    }

    // #9: revoke this user's OIDC tokens so access/refresh stop working.
    if (userId) {
        try { await c.env.DB.prepare('DELETE FROM app_sessions WHERE user_id = ?').bind(userId).run() } catch (e) { }
    }
    // End the browser SSO session and clear the cookie.
    if (sessionId) {
        try { await c.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run() } catch (e) { }
    }
    setCookie(c, '__Host-idp_session', '', { path: '/', secure: true, httpOnly: true, expires: new Date(0) })

    // Redirect back to the RP only if the destination is registered (no open
    // redirect). When id_token_hint is present, also require the destination to
    // belong to that token's client (aud). #11: echo state back unchanged.
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

// Token revocation (RFC 7009). The RP presents an access_token or refresh_token
// and (if confidential) authenticates; the matching app_session is deleted.
// Per §2.2 the endpoint returns 200 for any well-formed request, even when the
// token is unknown/already-invalid, so clients can't probe token validity.
app.post('/oauth/revoke', async (c) => {
    c.header('Cache-Control', 'no-store')
    c.header('Pragma', 'no-cache')
    const body = await parseClientBody(c)

    // Client auth: client_secret_post (body) or client_secret_basic (header).
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

    const token = body.token
    if (!token) return tokenError(c, 'invalid_request', 'missing token')
    const hint = body.token_type_hint

    // Look the token up as either an access token or a refresh token. token_type_hint
    // is just an optimisation; RFC 7009 §2.1 requires trying the other type too.
    const byRefresh = c.env.DB.prepare('SELECT * FROM app_sessions WHERE refresh_token = ?').bind(token)
    const byAccess = c.env.DB.prepare('SELECT * FROM app_sessions WHERE token = ?').bind(token)
    let session = await (hint === 'access_token' ? byAccess : byRefresh).first() as any
    if (!session) session = await (hint === 'access_token' ? byRefresh : byAccess).first() as any

    if (session) {
        // Only the client the token was issued to may revoke it.
        const auth = await authenticateClient(c, session.app_id, providedSecret, true)
        if (!auth.ok) return auth.res
        const clientId = (body.client_id as string) || basicClientId
        if (!clientId || clientId === session.app_id) {
            await c.env.DB.prepare('DELETE FROM app_sessions WHERE id = ?').bind(session.id).run()
        }
    }
    // Unknown token → succeed silently (§2.2).
    return c.body(null, 200)
})

// --- Admin ---
app.get('/admin', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const t = getLang(c)
    const config = await getSystemConfig(c.env.DB)
    const siteName = getLocalizedValue(c, config.appName)
    const stats = {
        apps: await c.env.DB.prepare('SELECT COUNT(*) as c FROM apps').first('c'),
        users: await c.env.DB.prepare('SELECT COUNT(*) as c FROM users').first('c'),
        logs: await c.env.DB.prepare('SELECT COUNT(*) as c FROM audit_logs').first('c'),
    }
    return c.html(<AdminHome t={t} userEmail={user.email} stats={stats as any} siteName={siteName} appConfig={config} />)
})
app.get('/admin/apps', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const config = await getSystemConfig(c.env.DB)
    const siteName = getLocalizedValue(c, config.appName)
    const { results } = await c.env.DB.prepare('SELECT * FROM apps ORDER BY created_at DESC').all()
    return c.html(<AppsPage t={getLang(c)} userEmail={user.email} apps={results as any} siteName={siteName} appConfig={config} />)
})

// === MODIFIED CREATE APP ===
app.post('/admin/apps', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const now = Math.floor(Date.now() / 1000)
    
    // Icon Upload
    const iconData = await handleIconUpload(body)
    const iconUrl = iconData || (body['icon_url'] as string) || await fetchAppIcon(body['base_url'] as string)
    
    // New apps are confidential by default (a secret is generated). Make it a
    // public/SPA client later via the "make public" action in the edit modal.
    const clientSecret = generateToken() + generateToken().replace(/-/g, '')

    const redirectUris = ((body['redirect_uris'] as string) || '').trim() || null
    await c.env.DB.prepare('INSERT INTO apps (id, name, base_url, status, created_at, description, icon_url, client_secret, redirect_uris) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(body['id'], body['name'], body['base_url'], 'active', now, body['description'], iconUrl, clientSecret, redirectUris).run()

    const details = JSON.stringify({ key: 'log_app_created', params: { appName: body['name'], id: body['id'], admin: user.email } });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('APP_CREATED', details).run()
    return c.redirect('/admin/apps')
})

// Regenerate or clear (=make public) an app's client_secret.
app.post('/admin/apps/secret', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const id = body['id']
    const action = body['action']
    const secret = action === 'clear' ? null : (generateToken() + generateToken().replace(/-/g, ''))
    await c.env.DB.prepare('UPDATE apps SET client_secret = ? WHERE id = ?').bind(secret, id).run()
    const details = JSON.stringify({ key: 'log_app_updated', params: { appName: id, status: action === 'clear' ? 'secret cleared' : 'secret regenerated', admin: user.email } });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('APP_UPDATED', details).run()
    return c.redirect('/admin/apps')
})

// === MODIFIED UPDATE APP ===
app.post('/admin/apps/update', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const id = body['id']
    
    // Icon Upload Logic:
    // 1. Uploaded file? -> Use it.
    // 2. Hidden field (existing url) or Text input? -> Use it.
    // 3. Fallback -> Auto fetch or keep old? (Here we use form inputs primarily)
    const iconData = await handleIconUpload(body)
    const iconUrl = iconData || (body['icon_url'] as string) || await fetchAppIcon(body['base_url'] as string)

    const redirectUris = ((body['redirect_uris'] as string) || '').trim() || null
    await c.env.DB.prepare('UPDATE apps SET name = ?, base_url = ?, description = ?, icon_url = ?, redirect_uris = ? WHERE id = ?')
        .bind(body['name'], body['base_url'], body['description'], iconUrl, redirectUris, id).run()
        
    const details = JSON.stringify({ key: 'log_app_updated', params: { appName: body['name'], status: 'Updated', admin: user.email } });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('APP_UPDATED', details).run()
    return c.redirect('/admin/apps')
})

app.post('/admin/apps/toggle', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const id = body['id']
    const status = body['status']
    await c.env.DB.prepare('UPDATE apps SET status = ? WHERE id = ?').bind(status, id).run()
    const details = JSON.stringify({ key: 'log_app_updated', params: { appName: id, status: status, admin: user.email } });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('APP_UPDATED', details).run()
    return c.redirect('/admin/apps')
})
app.post('/admin/apps/delete', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const id = body['id']
    await c.env.DB.batch([
        c.env.DB.prepare('DELETE FROM permissions WHERE app_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM group_permissions WHERE app_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM auth_codes WHERE app_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM app_sessions WHERE app_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM apps WHERE id = ?').bind(id)
    ])
    const details = JSON.stringify({ key: 'log_app_deleted', params: { id: id, admin: user.email } });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('APP_DELETED', details).run()
    return c.redirect('/admin/apps')
})

// Groups, Users, etc... are same as original but included for integrity
app.get('/admin/groups', async (c) => {
    try {
        const user = await getAdmin(c)
        if (!user) return c.redirect('/login')
        const config = await getSystemConfig(c.env.DB)
        const siteName = getLocalizedValue(c, config.appName)
        const groups = await c.env.DB.prepare('SELECT * FROM groups ORDER BY created_at DESC').all()
        const apps = await c.env.DB.prepare('SELECT * FROM apps').all()
        if (!groups.success) throw new Error('Groups DB Error: ' + groups.error)
        if (!apps.success) throw new Error('Apps DB Error: ' + apps.error)
        return c.html(<GroupsPage t={getLang(c)} userEmail={user.email} groups={groups.results as any} apps={apps.results as any} siteName={siteName} appConfig={config} />)
    } catch (e: any) {
        return c.text('Error: ' + e.message + '\n' + e.stack, 500)
    }
})
app.post('/admin/groups', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const id = crypto.randomUUID()
    const now = Math.floor(Date.now() / 1000)
    await c.env.DB.prepare('INSERT INTO groups (id, name, created_at) VALUES (?, ?, ?)').bind(id, body['name'], now).run()
    return c.redirect('/admin/groups')
})
app.post('/admin/groups/delete', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const id = body['id'] as string
    await c.env.DB.batch([
        c.env.DB.prepare('DELETE FROM group_permissions WHERE group_id = ?').bind(id),
        c.env.DB.prepare('UPDATE users SET group_id = NULL WHERE group_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM groups WHERE id = ?').bind(id)
    ])
    const details = JSON.stringify({ key: 'log_group_deleted', params: { id: id, admin: user.email } });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('GROUP_DELETED', details).run()
    return c.redirect('/admin/groups')
})
app.get('/admin/users', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const config = await getSystemConfig(c.env.DB)
    const siteName = getLocalizedValue(c, config.appName)
    const users = await c.env.DB.prepare('SELECT * FROM users ORDER BY created_at DESC').all()
    const apps = await c.env.DB.prepare('SELECT * FROM apps').all()
    const groups = await c.env.DB.prepare('SELECT * FROM groups').all()
    return c.html(<UsersPage t={getLang(c)} userEmail={user.email} users={users.results as any} apps={apps.results as any} groups={groups.results as any} inviteUrl={c.req.query('invite_url')} error={c.req.query('error')} siteName={siteName} appConfig={config} />)
})
app.post('/admin/invite', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const email = body['email'] as string
    if (!email) return c.redirect('/admin/users?error=Email required')
    const token = generateToken()
    const expiresAt = Math.floor(Date.now() / 1000) + (86400 * 30)
    try { await c.env.DB.prepare('INSERT INTO invitations (id, email, invited_by, expires_at) VALUES (?, ?, ?, ?)').bind(token, email, user.id, expiresAt).run() }
    catch (e: any) { return c.redirect(`/admin/users?error=${encodeURIComponent('Error: ' + e.message)}`) }
    const url = new URL(c.req.url)
    return c.redirect(`/admin/users?invite_url=${encodeURIComponent(url.protocol + '//' + url.host + '/invite?token=' + token)}`)
})
app.post('/admin/users/delete', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const id = body['id'] as string
    await c.env.DB.batch([
        c.env.DB.prepare('DELETE FROM permissions WHERE user_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM app_sessions WHERE user_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM auth_codes WHERE user_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM password_resets WHERE user_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM invitations WHERE invited_by = ?').bind(id),
        c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id)
    ])
    const details = JSON.stringify({ key: 'log_user_deleted', params: { id: id, admin: user.email } });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('USER_DELETED', details).run()
    return c.redirect('/admin/users')
})
app.post('/admin/users/bulk', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const text = await c.req.text()
    const params = new URLSearchParams(text)
    const ids = params.getAll('user_ids')
    const groupId = params.get('group_id')
    const appId = params.get('app_id')
    if (!ids || ids.length === 0) return c.redirect('/admin/users')
    let gName = null;
    if (groupId) {
        const val = groupId === '__CLEAR__' || groupId === '' ? null : groupId
        for (const uid of ids) {
            await c.env.DB.prepare('UPDATE users SET group_id = ? WHERE id = ?').bind(val, uid).run()
        }
        if (val) {
            const g = await c.env.DB.prepare('SELECT name FROM groups WHERE id = ?').bind(val).first<{ name: string }>();
            gName = g ? g.name : val;
        } else {
            gName = 'None';
        }
    }
    let aName = null;
    if (appId) {
        const start = Math.floor(Date.now() / 1000)
        const end = start + 31536000
        const now = Math.floor(Date.now() / 1000)
        for (const uid of ids) {
            await c.env.DB.prepare(`
                INSERT INTO permissions (user_id, app_id, valid_from, valid_to, created_at) VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(user_id, app_id) DO UPDATE SET valid_from=?, valid_to=?
            `).bind(uid, appId, start, end, now, start, end).run()
        }
        const a = await c.env.DB.prepare('SELECT name FROM apps WHERE id = ?').bind(appId).first<{ name: string }>();
        aName = a ? a.name : appId;
    }
    const details = JSON.stringify({
        key: 'log_bulk_update',
        params: { count: ids.length, admin: user.email, group: gName || '-', app: aName || '-' }
    });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('USER_UPDATE', details).run()
    return c.redirect('/admin/users')
})
app.get('/admin/api/user-details/:id', async (c) => {
    if (!await getAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)
    const userId = c.req.param('id')
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first() as User | null
    if (!user) return c.json({ error: 'Not found' }, 404)
    const { results: direct } = await c.env.DB.prepare('SELECT p.*, a.name as app_name FROM permissions p JOIN apps a ON p.app_id = a.id WHERE p.user_id = ?').bind(userId).all()
    let groupPerms: any[] = []
    if (user.group_id) {
        const res = await c.env.DB.prepare('SELECT p.*, a.name as app_name FROM group_permissions p JOIN apps a ON p.app_id = a.id WHERE p.group_id = ?').bind(user.group_id).all()
        groupPerms = res.results
    }
    const allApps = await c.env.DB.prepare('SELECT id, name FROM apps').all<{ id: string, name: string }>()
    const combined = allApps.results.map(app => {
        const d = direct.find((x: any) => x.app_id === app.id)
        const g = groupPerms.find((x: any) => x.app_id === app.id)
        if (d) return { ...d, source: 'user', is_override: true }
        if (g) return { ...g, source: 'group', is_override: false }
        return null
    }).filter(x => x)
    return c.json({ email: user.email, permissions: combined, group_id: user.group_id })
})
app.post('/admin/api/user/group', async (c) => {
    try {
        const user = await getAdmin(c)
        if (!user) return c.json({ error: 'Unauthorized' }, 401)
        const body = await c.req.json()
        const userId = body['user_id']
        const groupId = body['group_id'] || null
        await c.env.DB.prepare('UPDATE users SET group_id = ? WHERE id = ?').bind(groupId || null, userId).run()
        let gName = 'None';
        if (groupId) {
            const g = await c.env.DB.prepare('SELECT name FROM groups WHERE id = ?').bind(groupId).first<{ name: string }>();
            if (g) gName = g.name;
        }
        const details = JSON.stringify({ key: 'log_user_group_update', params: { user: userId, group: gName, admin: user.email } });
        await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('USER_UPDATE', details).run()
        return c.json({ success: true })
    } catch (e: any) {
        return c.json({ error: e.message, stack: e.stack }, 500)
    }
})
app.post('/admin/api/user/permission/revoke', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const id = body['id']
    await c.env.DB.prepare('DELETE FROM permissions WHERE id = ?').bind(id).run()
    const details = JSON.stringify({ key: 'log_permission_revoke', params: { id: id, admin: user.email } });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('PERMISSION_REVOKE', details).run()
    return c.json({ success: true })
})
app.post('/admin/api/user/permission/grant', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const userId = body['user_id']
    const appIds = body['app_ids']
    const appId = body['app_id']
    const validTo = body['valid_to']
    const validFrom = body['valid_from'] || Math.floor(Date.now() / 1000)
    const targets = Array.isArray(appIds) ? appIds : [appId]
    const appNames = [];
    const now = Math.floor(Date.now() / 1000)
    for (const aid of targets) {
        if (!aid) continue
        await c.env.DB.prepare(`
            INSERT INTO permissions (user_id, app_id, valid_from, valid_to, created_at) VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(user_id, app_id) DO UPDATE SET valid_from=?, valid_to=?
        `).bind(userId, aid, validFrom, validTo, now, validFrom, validTo).run()
        const a = await c.env.DB.prepare('SELECT name FROM apps WHERE id = ?').bind(aid).first<{ name: string }>();
        if (a) appNames.push(a.name);
    }
    const details = JSON.stringify({ key: 'log_permission_grant', params: { apps: appNames.join(', '), user: userId, admin: user.email } });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('PERMISSION_GRANT', details).run()
    return c.json({ success: true })
})
app.get('/admin/api/group-details/:id', async (c) => {
    if (!await getAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)
    const groupId = c.req.param('id')
    const { results } = await c.env.DB.prepare(`
        SELECT p.*, a.name as app_name 
        FROM group_permissions p 
        JOIN apps a ON p.app_id = a.id 
        WHERE p.group_id = ?
    `).bind(groupId).all()
    return c.json({ permissions: results })
})
app.post('/admin/api/group/permission/grant', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const groupId = body['group_id']
    const appIds = body['app_ids']
    const validTo = body['valid_to']
    const validFrom = body['valid_from'] || Math.floor(Date.now() / 1000)
    const targets = Array.isArray(appIds) ? appIds : []
    const appNames = [];
    const now = Math.floor(Date.now() / 1000)
    for (const aid of targets) {
        if (!aid) continue
        await c.env.DB.prepare(`
            INSERT INTO group_permissions (group_id, app_id, valid_from, valid_to, created_at) VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(group_id, app_id) DO UPDATE SET valid_from=?, valid_to=?
        `).bind(groupId, aid, validFrom, validTo, now, validFrom, validTo).run()
        const a = await c.env.DB.prepare('SELECT name FROM apps WHERE id = ?').bind(aid).first<{ name: string }>();
        if (a) appNames.push(a.name);
    }
    const g = await c.env.DB.prepare('SELECT name FROM groups WHERE id = ?').bind(groupId).first<{ name: string }>();
    const gName = g ? g.name : groupId;
    const details = JSON.stringify({ key: 'log_group_permission_grant', params: { apps: appNames.join(', '), group: gName, admin: user.email } });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('GROUP_PERMISSION_GRANT', details).run()
    return c.json({ success: true })
})
app.post('/admin/api/group/permission/revoke', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const id = body['id']
    await c.env.DB.prepare('DELETE FROM group_permissions WHERE id = ?').bind(id).run()
    const details = JSON.stringify({ key: 'log_group_permission_revoke', params: { id: id, admin: user.email } });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('GROUP_PERMISSION_REVOKE', details).run()
    return c.json({ success: true })
})
app.get('/admin/logs', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const config = await getSystemConfig(c.env.DB)
    const siteName = getLocalizedValue(c, config.appName)
    const page = parseInt(c.req.query('page') || '1');
    const filterEvent = c.req.query('event') || '';
    const pageSize = 50;
    const offset = (page - 1) * pageSize;
    let query = 'SELECT * FROM audit_logs';
    let countQuery = 'SELECT COUNT(*) as c FROM audit_logs';
    const params = [];
    if (filterEvent) {
        const where = ' WHERE event_type = ?';
        query += where;
        countQuery += where;
        params.push(filterEvent);
    }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(pageSize, offset);
    const { results } = await c.env.DB.prepare(query).bind(...params).all();
    const countParams = filterEvent ? [filterEvent] : [];
    const totalRes = await c.env.DB.prepare(countQuery).bind(...countParams).first<{ c: number }>();
    const totalCount = totalRes?.c || 0;
    const totalPages = Math.ceil(totalCount / pageSize);
    return c.html(<LogsPage
        t={getLang(c)}
        userEmail={user.email}
        logs={results as any}
        currentPage={page}
        totalPages={totalPages}
        totalCount={totalCount}
        currentFilter={filterEvent}
        siteName={siteName}
        appConfig={config}
    />)
})

// Invite, ForgotPW, etc. routes unchanged
app.get('/invite', async (c) => {
    const t = getLang(c)
    const token = c.req.query('token')
    if (!token) return c.html(<Invite t={t} error={t.error_invalid_invite} />)
    const invite = await c.env.DB.prepare('SELECT * FROM invitations WHERE id = ? AND expires_at > ?')
        .bind(token, Math.floor(Date.now() / 1000)).first<{ email: string }>()
    if (!invite) return c.html(<Invite t={t} error={t.error_invalid_invite} />)
    return c.html(<Invite t={t} token={token} email={invite.email} />)
})
app.post('/invite', async (c) => {
    const t = getLang(c)
    const body = await c.req.parseBody()
    const token = (body['token'] as string).replace(/\s+/g, '')
    const password = body['password'] as string
    const invite = await c.env.DB.prepare('SELECT * FROM invitations WHERE id = ? AND expires_at > ?')
        .bind(token, Math.floor(Date.now() / 1000)).first<{ email: string }>()
    if (!invite) return c.html(<Invite t={t} error={t.error_invalid_invite} />)
    const userId = crypto.randomUUID()
    const pwHash = await hashPassword(password)
    const now = Math.floor(Date.now() / 1000)
    try {
        await c.env.DB.prepare('INSERT INTO users (id, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
            .bind(userId, invite.email, pwHash, now, now).run()
        await c.env.DB.prepare('DELETE FROM invitations WHERE id = ?').bind(token).run()
        return c.redirect('/login?msg=msg_account_created')
    } catch (e) {
        return c.html(<Invite t={t} token={token} error={t.error_user_exists} />)
    }
})
app.get('/forgot-password', (c) => c.html(<ForgotPassword t={getLang(c)} />))
app.post('/forgot-password', async (c) => {
    const t = getLang(c)
    const body = await c.req.parseBody()
    const email = body['email'] as string
    const user = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first() as User | null
    if (user) {
        const token = generateToken()
        const expires = Math.floor(Date.now() / 1000) + 3600
        await c.env.DB.prepare('INSERT INTO password_resets (token, user_id, expires_at) VALUES (?, ?, ?)').bind(token, user.id, expires).run()
        const resetLink = `${new URL(c.req.url).origin}/reset-password?token=${token}`;
        const htmlBody = `
      <div style="font-family: sans-serif; color: #333; line-height: 1.6;">
        <p><strong>Password Reset</strong></p>
        <p>You requested a password reset. Please click the link below to set a new password:</p>
        <p><a href="${resetLink}" style="color: #0288d1; word-break: break-all;">${resetLink}</a></p>
        <p>This link will expire in 1 hour.</p>
        <p><strong>繝代せ繝ｯ繝ｼ繝峨Μ繧ｻ繝・ヨ</strong></p>
        <p>繝代せ繝ｯ繝ｼ繝峨Μ繧ｻ繝・ヨ縺ｮ繝ｪ繧ｯ繧ｨ繧ｹ繝医ｒ蜿励￠莉倥￠縺ｾ縺励◆縲ゆｻ･荳九・繝ｪ繝ｳ繧ｯ繧偵け繝ｪ繝・け縺励※縲∵眠縺励＞繝代せ繝ｯ繝ｼ繝峨ｒ險ｭ螳壹＠縺ｦ縺上□縺輔＞縲・/p>
        <p><a href="${resetLink}" style="color: #0288d1; word-break: break-all;">${resetLink}</a></p>
      </div>
    `;
        await sendEmail(c.env, email, 'Password Reset / 繝代せ繝ｯ繝ｼ繝峨Μ繧ｻ繝・ヨ', htmlBody);
    }
    return c.html(<ForgotPassword t={t} message={t.link_sent} />)
})
app.get('/reset-password', async (c) => {
    const t = getLang(c)
    const token = c.req.query('token')
    if (!token) return c.redirect('/forgot-password')
    const reset = await c.env.DB.prepare('SELECT * FROM password_resets WHERE token = ? AND expires_at > ?').bind(token, Math.floor(Date.now() / 1000)).first()
    if (!reset) return c.html(<ResetPassword t={t} token="" error={t.error_invalid_invite} />)
    return c.html(<ResetPassword t={t} token={token} />)
})
app.post('/reset-password', async (c) => {
    const t = getLang(c)
    const body = await c.req.parseBody()
    const token = (body['token'] as string).replace(/\s+/g, '')
    const password = body['password'] as string
    const reset = await c.env.DB.prepare('SELECT * FROM password_resets WHERE token = ? AND expires_at > ?').bind(token, Math.floor(Date.now() / 1000)).first<{ user_id: string }>()
    if (!reset) return c.html(<ResetPassword t={t} token="" error={t.error_invalid_invite} />)
    const pwHash = await hashPassword(password)
    await c.env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(pwHash, reset.user_id).run()
    await c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(reset.user_id).run()
    try { await c.env.DB.prepare('DELETE FROM app_sessions WHERE user_id = ?').bind(reset.user_id).run() } catch (e) { }
    await c.env.DB.prepare('DELETE FROM password_resets WHERE token = ?').bind(token).run()
    return c.redirect('/login')
})
app.post('/admin/config', async (c) => {
    try {
        const user = await getAdmin(c)
        if (!user) return c.redirect('/login')
        const body = await c.req.parseBody()
        const app_name_ja = body['app_name_ja'] as string
        const app_name_en = body['app_name_en'] as string
        const app_subtitle_ja = body['app_subtitle_ja'] as string
        const app_subtitle_en = body['app_subtitle_en'] as string
        if (app_name_ja) await c.env.DB.prepare('INSERT INTO system_config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=?').bind('app_name_ja', app_name_ja, app_name_ja).run()
        if (app_name_en) await c.env.DB.prepare('INSERT INTO system_config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=?').bind('app_name_en', app_name_en, app_name_en).run()
        if (app_subtitle_ja) await c.env.DB.prepare('INSERT INTO system_config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=?').bind('app_subtitle_ja', app_subtitle_ja, app_subtitle_ja).run()
        if (app_subtitle_en) await c.env.DB.prepare('INSERT INTO system_config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=?').bind('app_subtitle_en', app_subtitle_en, app_subtitle_en).run()
        const details = JSON.stringify({ key: 'log_config_update', params: { admin: user.email } });
        await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('CONFIG_UPDATE', details).run()
        return c.redirect('/admin')
    } catch (e: any) {
        return c.text('Error updating config: ' + e.message, 500)
    }
})

// 2FA Verification Routes
app.get('/login/2fa', async (c) => {
    const t = getLang(c)
    const token = getCookie(c, 'pre_2fa_token')
    if (!token) return c.redirect('/login')
    try { await verify(token, c.env.JWT_SECRET || 'dev_secret', "HS256") } catch (e) { return c.redirect('/login') }
    const redirectTo = c.req.query('redirect_to')
    const returnTo = c.req.query('return_to')
    return c.html(<Login2FA t={t} redirectTo={redirectTo} returnTo={returnTo} />)
})
app.post('/login/2fa', async (c) => {
    const t = getLang(c)
    const body = await c.req.parseBody()
    const otp = (body['token'] as string).replace(/\s+/g, '')
    const redirectTo = body['redirect_to'] as string
    const returnTo = body['return_to'] as string
    const preToken = getCookie(c, 'pre_2fa_token')
    if (!preToken) return c.redirect('/login')
    let payload;
    try { payload = await verify(preToken, c.env.JWT_SECRET || 'dev_secret', "HS256") } catch (e) { return c.redirect('/login') }
    const userId = payload.sub as string
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first() as User | null
    if (!user || !user.two_factor_secret) return c.redirect('/login')
    if (verifyToken(otp, user.two_factor_secret)) {
        await createSession(c, user.id)
        deleteCookie(c, 'pre_2fa_token')

        let targetAppName = 'Tobira Dashboard';
        const admin = await c.env.DB.prepare('SELECT * FROM admins WHERE email = ?').bind(user.email).first()
        if (redirectTo) {
            const { results } = await c.env.DB.prepare('SELECT * FROM apps WHERE status = ?').bind('active').all() as any;
            const app = (results as any[]).find((a: any) => isAllowedRedirectUri(redirectTo, a));
            if (app) targetAppName = app.name;
        } else if (admin) {
            targetAppName = 'Tobira Admin';
        }

        const details = JSON.stringify({ key: 'log_login_app', params: { email: user.email, method: '2FA', appName: targetAppName } });
        await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('LOGIN', details).run()

        if (returnTo && isSafeReturnTo(returnTo)) return c.redirect(returnTo)
        if (redirectTo) return issueCodeAndRedirect(c, user.id, redirectTo)
        return c.redirect(admin ? '/admin' : '/')
    } else {
        return c.html(<Login2FA t={t} redirectTo={redirectTo} returnTo={returnTo} error={t.err_invalid_code} />)
    }
})

export default app
