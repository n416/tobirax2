// OIDC / OAuth2 の純粋ヘルパ群。DB アクセス・ルートハンドラ・JSX ビューに依存しない、
// 仕様準拠の判定・整形ロジックだけをここに集める。元は src/index.tsx に同居していたが、
// ユニットテスト時にアプリ全体を import せずに済むよう切り出した(振る舞いは不変)。
import { User, type AppContext } from '../types'

// クライアントに登録された redirect_uris(改行区切り)を配列にパースする。
function parseRedirectUris(raw: string | null | undefined): string[] {
    return (raw || '').split(/[\r\n]+/).map(s => s.trim()).filter(Boolean)
}

// 要求された redirect_uri を登録済みクライアントに対して検証する。
//
// 推奨経路(OIDC Core 3.1.2.1): クライアントに明示的な redirect_uris のリストが
// 登録されていれば、要求はそのいずれかと完全一致(文字列比較)しなければならない。
// これが仕様に忠実な挙動。
//
// 旧方式のフォールバック: redirect_uris 導入前に登録されたクライアントは base_url
// しか持たない。その場合はオリジンの完全一致を要求し、base_url のパス以下の任意パスを
// 許可する。オリジン完全一致のチェックにより、前方一致の穴
// (例: "https://app.example.evil.com" / "...@evil.com")は塞がれる。
export function isAllowedRedirectUri(redirectUri: string, app: { base_url: string; redirect_uris?: string | null }): boolean {
    const registered = parseRedirectUris(app.redirect_uris)
    if (registered.length > 0) return registered.includes(redirectUri)

    let redir: URL, base: URL
    try {
        redir = new URL(redirectUri)
        base = new URL(app.base_url)
    } catch {
        return false
    }
    // リダイレクト先は http(s) のみ許可。ただし http はローカル開発環境のみ許容。
    if (redir.protocol === 'http:' && redir.hostname !== 'localhost' && redir.hostname !== '127.0.0.1') return false
    if (redir.protocol !== 'https:' && redir.protocol !== 'http:') return false
    if (redir.origin !== base.origin) return false
    const basePath = base.pathname.replace(/\/+$/, '')
    if (basePath === '') return true // base registered at origin root: any path allowed
    return redir.pathname === basePath || redir.pathname.startsWith(basePath + '/')
}

// return_to は対話的ログイン後に /authorize を再開するために使う。
// 同一オリジンの /authorize パスのみ許可(オープンリダイレクト防止)。
export function isSafeReturnTo(v: string | undefined | null): boolean {
    return typeof v === 'string' && v.startsWith('/authorize')
}

export function buildRedirect(redirectUri: string, mode: string | undefined, params: Record<string, string | undefined>): string {
    const usp = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) if (v != null && v !== '') usp.set(k, v)
    const sep = mode === 'fragment' ? '#' : (redirectUri.includes('?') ? '&' : '?')
    return redirectUri + sep + usp.toString()
}

export function tokenError(c: AppContext, error: string, description: string, status: 400 | 401 = 400) {
    return c.json({ error, error_description: description }, status)
}

// RFC 6750 §3: Bearer で保護されたリソースは、失敗したリクエストに WWW-Authenticate
// チャレンジを返さなければならない。認証情報が一切無い場合はチャレンジから error コードを
// 省略し、無効/失効トークンには error="invalid_token" を付ける。
export function bearerUnauthorized(c: AppContext, error?: string, description?: string) {
    let challenge = 'Bearer realm="tobira"'
    if (error) {
        challenge += `, error="${error}"`
        if (description) challenge += `, error_description="${description}"`
    }
    c.header('WWW-Authenticate', challenge)
    return c.json({ error: error || 'invalid_request', error_description: description }, 401)
}

// 定数時間の文字列比較(タイミングによるシークレット漏洩を防ぐ)。
export function safeEqual(a: string, b: string): boolean {
    if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false
    let r = 0
    for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i)
    return r === 0
}

// Authorization ヘッダから client_secret_basic の資格情報を(あれば)取り出す。
export function parseBasicAuth(c: AppContext): { clientId?: string; secret?: string } {
    const authz = c.req.header('Authorization')
    if (!authz || !authz.startsWith('Basic ')) return {}
    try {
        const dec = atob(authz.slice(6))
        const i = dec.indexOf(':')
        return { clientId: decodeURIComponent(dec.slice(0, i)), secret: decodeURIComponent(dec.slice(i + 1)) }
    } catch {
        return {}
    }
}

export async function parseClientBody(c: AppContext): Promise<Record<string, string>> {
    const ct = c.req.header('Content-Type') || ''
    if (ct.includes('application/json')) return (await c.req.json().catch(() => ({}))) as Record<string, string>
    const body = await c.req.parseBody()
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(body)) if (typeof v === 'string') out[k] = v
    return out
}

// 付与された scope 文字列を OIDC クレームへマッピングする(OIDC Core 5.4)。付与された
// scope に対応する標準クレームのみ返すので、`openid` のみの要求では email/profile が
// 漏れない。プロフィール項目は未設定なら email にフォールバックする。
export function buildOidcClaims(user: User, scope: string | null): Record<string, unknown> {
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
        claims.email_verified = !!user.email_verified
    }
    return claims
}

// OIDC at_hash: base64url(SHA-256(access_token) の左側 128 ビット)。
export async function computeAtHash(accessToken: string): Promise<string> {
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(accessToken)))
    const half = digest.slice(0, 16)
    let bin = ''
    for (let i = 0; i < half.length; i++) bin += String.fromCharCode(half[i])
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
