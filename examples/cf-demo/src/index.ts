// Cloudflare Workers 上で動く最小限の OIDC「リライングパーティ(RP / ログインを使う側)」。
//
// tobirax2 IdP に対して Authorization Code フローを実装する。サードパーティ製ライブラリは
// 使わず、Workers ランタイム + WebCrypto のみ。コールバックでは本物の OIDC SDK と同様に、
// id_token の RS256 署名を IdP の JWKS で検証し、iss / aud / nonce / exp を確認する。
//
//   /          -> ログイン中ユーザーのクレーム、または「ログイン」ボタンを表示
//   /login     -> IdP の /authorize へリダイレクト
//   /callback  -> code を交換し id_token を検証、セッションCookieを設定
//   /logout    -> セッション破棄 + IdP への RP起点ログアウト

interface Env {
  IDP_ISSUER: string
  CLIENT_ID: string
  CLIENT_SECRET: string
  APP_BASE_URL: string
  COOKIE_SECRET: string
  // 2つのデモRPを画面上で区別するための表示ラベル。
  APP_NAME?: string
  // tobirax2 IdP Worker へのサービスバインディング(サーバー間通信用)。
  IDP: { fetch: typeof fetch }
  // OIDC Back-Channel Logout の失効リスト。IdP が /backchannel-logout に logout_token を
  // POST してきたら、ここに bcl:<CLIENT_ID>:<sub> = ログアウト時刻 を記録する。ホーム画面は
  // id_token.iat がその時刻以前のセッションをログアウト済みとして扱う。
  BCL: KVNamespace
}

// ---- 小さなヘルパー群 -------------------------------------------------------

const enc = new TextEncoder()
const b64url = (buf: ArrayBuffer | Uint8Array) => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
const b64urlToBytes = (s: string) => {
  s = s.replace(/-/g, '+').replace(/_/g, '/')
  while (s.length % 4) s += '='
  const bin = atob(s)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}
const randomString = () => b64url(crypto.getRandomValues(new Uint8Array(24)))

function parseCookies(req: Request): Record<string, string> {
  const out: Record<string, string> = {}
  const raw = req.headers.get('Cookie') || ''
  for (const part of raw.split(';')) {
    const i = part.indexOf('=')
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim())
  }
  return out
}

async function hmacKey(secret: string) {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}
// value.signature の形式 — 改ざん検知できるCookieペイロード
async function signValue(secret: string, value: string) {
  const key = await hmacKey(secret)
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(value))
  return value + '.' + b64url(sig)
}
async function verifyValue(secret: string, signed: string): Promise<string | null> {
  const i = signed.lastIndexOf('.')
  if (i < 0) return null
  const value = signed.slice(0, i)
  const sig = signed.slice(i + 1)
  const key = await hmacKey(secret)
  const ok = await crypto.subtle.verify('HMAC', key, b64urlToBytes(sig), enc.encode(value))
  return ok ? value : null
}

// ---- JWKS による id_token 検証 ----------------------------------------------

let jwksCache: { keys: any[] } | null = null
async function getJwks(env: Env, forceRefresh = false) {
  if (jwksCache && !forceRefresh) return jwksCache
  jwksCache = await (await env.IDP.fetch(`${env.IDP_ISSUER}/.well-known/jwks.json`)).json()
  return jwksCache!
}

async function verifyIdToken(idToken: string, env: Env): Promise<any | null> {
  const [h, p, s] = idToken.split('.')
  if (!h || !p || !s) return null
  let header: any, payload: any
  try {
    header = JSON.parse(new TextDecoder().decode(b64urlToBytes(h)))
    payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(p)))
  } catch {
    return null
  }
  // 署名鍵を kid で照合する。未知の場合(例: IdP が鍵をローテーションした)は、
  // 諦める前に一度だけ JWKS を再取得する — 本物の OIDC SDK と同じ挙動。
  let jwks = await getJwks(env)
  let jwk = jwks.keys.find((k: any) => k.kid === header.kid)
  if (!jwk) {
    jwks = await getJwks(env, true)
    jwk = jwks.keys.find((k: any) => k.kid === header.kid)
  }
  if (!jwk) return null
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify'])
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlToBytes(s), enc.encode(`${h}.${p}`))
  if (!ok) return null
  const now = Math.floor(Date.now() / 1000)
  if (payload.iss !== env.IDP_ISSUER) return null
  if (payload.aud !== env.CLIENT_ID) return null
  if (typeof payload.exp === 'number' && payload.exp < now) return null
  return payload
}

// ---- バックチャネルログアウト (OIDC Back-Channel Logout 1.0) -----------------

// IdP が /backchannel-logout に POST してきた logout_token を検証する。妥当なら
// subject(sub)を、そうでなければ null を返す。検証項目: JWKS による RS256 署名、
// iss == 自分の IdP、aud == 自分の client_id、backchannel-logout の `events` メンバー、
// そして `nonce` が無いこと(仕様 §2.4 で logout token への nonce は禁止)。
async function verifyLogoutToken(logoutToken: string, env: Env): Promise<string | null> {
  const [h, p, s] = logoutToken.split('.')
  if (!h || !p || !s) return null
  let header: any, payload: any
  try {
    header = JSON.parse(new TextDecoder().decode(b64urlToBytes(h)))
    payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(p)))
  } catch { return null }
  let jwks = await getJwks(env)
  let jwk = jwks.keys.find((k: any) => k.kid === header.kid)
  if (!jwk) { jwks = await getJwks(env, true); jwk = jwks.keys.find((k: any) => k.kid === header.kid) }
  if (!jwk) return null
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify'])
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlToBytes(s), enc.encode(`${h}.${p}`))
  if (!ok) return null
  if (payload.iss !== env.IDP_ISSUER) return null
  if (payload.aud !== env.CLIENT_ID) return null
  if ('nonce' in payload) return null // logout token には nonce 禁止
  const events = payload.events
  if (!events || typeof events !== 'object' || !('http://schemas.openid.net/event/backchannel-logout' in events)) return null
  return typeof payload.sub === 'string' ? payload.sub : null
}

// この subject は id_token 発行後にバックチャネルでログアウトされたか？
async function isBackchannelLoggedOut(env: Env, claims: any): Promise<boolean> {
  const t = await env.BCL.get(`bcl:${env.CLIENT_ID}:${claims.sub}`)
  if (!t) return false
  return Number(claims.iat || 0) <= Number(t)
}

// ---- HTML --------------------------------------------------------------------

const page = (body: string, appName = 'tobirax2 公開デモ', setCookie?: string) => new Response(
  `<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8">
   <meta name="viewport" content="width=device-width,initial-scale=1">
   <title>${appName} (OIDCクライアント)</title>
   <style>
     body{font-family:system-ui,'Noto Sans JP',sans-serif;max-width:680px;margin:48px auto;padding:0 20px;line-height:1.7;color:#0f172a;background:linear-gradient(135deg,#f0f4ff,#e0e7ff);min-height:100vh}
     .card{background:#fff;border-radius:20px;padding:32px;box-shadow:0 8px 32px rgba(31,38,135,.12)}
     h1{font-size:1.4rem;margin:0 0 4px} .sub{color:#64748b;font-size:.9rem;margin-bottom:24px}
     a.btn,button.btn{display:inline-block;background:linear-gradient(135deg,#4f46e5,#4338ca);color:#fff;
       text-decoration:none;padding:12px 22px;border:none;border-radius:12px;font-size:1rem;font-weight:600;cursor:pointer}
     a.logout{color:#64748b;font-size:.9rem}
     pre{background:#f5f7ff;padding:16px;border-radius:12px;overflow:auto;font-size:.85rem;border:1px solid #e2e8f0}
     .ok{color:#15803d;font-weight:700}
   </style></head><body><div class="card">${body}</div></body></html>`,
  { headers: { 'Content-Type': 'text/html; charset=utf-8', ...(setCookie ? { 'Set-Cookie': setCookie } : {}) } },
)
const clearSession = 'rp_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'

// ---- ルート ------------------------------------------------------------------

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url)
    const cookies = parseCookies(req)

    // ホーム: ログイン中ならクレームを、未ログインならログインボタンを表示。
    if (url.pathname === '/') {
      const appName = env.APP_NAME || 'tobirax2 公開デモ'
      const session = cookies['rp_session']
      let claims = session ? await verifyIdToken(session, env) : null
      // バックチャネルログアウト: id_token Cookie がまだ有効でも、この subject が
      // ログアウト済みと IdP から通知されていればセッション終了として扱う。
      const loggedOutByBcl = !!(claims && await isBackchannelLoggedOut(env, claims))
      if (claims && !loggedOutByBcl) {
        return page(`
          <h1>✅ <span class="ok">ログイン成功</span> — ${appName}</h1>
          <p class="sub">Cloudflare Workers 製のOIDCクライアントが、tobirax2 を認証プロバイダとして利用しています。</p>
          <p><b>${claims.email}</b> としてログイン中。</p>
          <p>下のクレームは、このアプリが <code>${env.IDP_ISSUER}</code> の JWKS で
             <b>id_token の RS256 署名を検証し</b>、iss / aud / nonce / exp を確認したものです。</p>
          <h3>id_token クレーム（検証済み）</h3>
          <pre>${JSON.stringify(claims, null, 2).replace(/</g, '&lt;')}</pre>
          <p><a class="logout" href="/logout">ログアウト</a></p>`, appName)
      }
      // 未ログイン状態(一度もログインしていない、またはバックチャネルログアウトが効いた)。
      // 死んだセッションをブラウザが提示し続けないよう、古いCookieをクリアする。
      const banner = loggedOutByBcl
        ? `<p class="sub" style="color:#b45309">🔒 別のアプリでログアウトされたため、このアプリのセッションも終了しました（Back-Channel Logout）。</p>`
        : `<p class="sub">「ログインを使う側のアプリ」のサンプルです（Cloudflare Workers / OIDC Authorization Code フロー）。</p>`
      return page(`
        <h1>${appName}</h1>
        ${banner}
        <p>アカウントが無い場合は、ログイン画面の「新規登録」から作成できます（登録後すぐ使えます）。</p>
        <p><a class="btn" href="/login">ログイン / 新規登録</a></p>`, appName, session ? clearSession : undefined)
    }

    // バックチャネルログアウト受信口(OIDC Back-Channel Logout 1.0 §2.5)。IdP が
    // 署名付き logout_token をここへ POST する(サーバー間通信、ブラウザを介さない)。
    // 検証してログアウトを記録し、ホーム画面側でユーザーのセッションを無効化させる。
    if (url.pathname === '/backchannel-logout' && req.method === 'POST') {
      const noStore = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
      let logoutToken = ''
      try {
        const form = await req.formData()
        logoutToken = String(form.get('logout_token') || '')
      } catch { /* form-encoded ではない */ }
      const sub = logoutToken ? await verifyLogoutToken(logoutToken, env) : null
      if (!sub) return new Response(JSON.stringify({ error: 'invalid_request' }), { status: 400, headers: noStore })
      // iat比較用のキー: id_token が現在時刻以前に発行されたセッションは無効とみなす。
      await env.BCL.put(`bcl:${env.CLIENT_ID}:${sub}`, String(Math.floor(Date.now() / 1000)), { expirationTtl: 3600 })
      return new Response(null, { status: 200, headers: { 'Cache-Control': 'no-store' } })
    }

    // ログイン開始: state+nonce を生成し、署名付きトランザクションCookieを保存してリダイレクト。
    if (url.pathname === '/login') {
      const state = randomString()
      const nonce = randomString()
      const tx = await signValue(env.COOKIE_SECRET, JSON.stringify({ state, nonce }))
      const authorize = new URL(`${env.IDP_ISSUER}/authorize`)
      authorize.searchParams.set('response_type', 'code')
      authorize.searchParams.set('client_id', env.CLIENT_ID)
      authorize.searchParams.set('redirect_uri', `${env.APP_BASE_URL}/callback`)
      authorize.searchParams.set('scope', 'openid profile email')
      authorize.searchParams.set('state', state)
      authorize.searchParams.set('nonce', nonce)
      return new Response(null, {
        status: 302,
        headers: {
          Location: authorize.toString(),
          'Set-Cookie': `rp_tx=${tx}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
        },
      })
    }

    // コールバック: state を検証し、code を交換、id_token を検証してセッションを設定。
    if (url.pathname === '/callback') {
      const err = url.searchParams.get('error')
      if (err) return page(`<h1>ログインできませんでした</h1><p class="sub">IdP からのエラー: <code>${err}</code> — ${url.searchParams.get('error_description') || ''}</p><p><a class="btn" href="/">戻る</a></p>`)

      const code = url.searchParams.get('code') || ''
      const state = url.searchParams.get('state') || ''
      const txRaw = cookies['rp_tx']
      const txVerified = txRaw ? await verifyValue(env.COOKIE_SECRET, txRaw) : null
      if (!txVerified) return page('<h1>セッションエラー</h1><p>もう一度お試しください。</p><p><a class="btn" href="/login">再ログイン</a></p>')
      const tx = JSON.parse(txVerified)
      if (!code || state !== tx.state) return page('<h1>state 検証エラー</h1><p><a class="btn" href="/login">再ログイン</a></p>')

      const tokenRes = await env.IDP.fetch(`${env.IDP_ISSUER}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: `${env.APP_BASE_URL}/callback`,
          client_id: env.CLIENT_ID,
          client_secret: env.CLIENT_SECRET,
        }),
      })
      if (!tokenRes.ok) {
        const t = await tokenRes.text()
        return page(`<h1>トークン交換に失敗</h1><pre>${t.replace(/</g, '&lt;')}</pre><p><a class="btn" href="/login">再ログイン</a></p>`)
      }
      const tokens = await tokenRes.json<{ id_token: string }>()
      const claims = await verifyIdToken(tokens.id_token, env)
      if (!claims || claims.nonce !== tx.nonce) {
        return page('<h1>id_token 検証エラー</h1><p>署名または nonce が一致しません。</p><p><a class="btn" href="/login">再ログイン</a></p>')
      }
      const maxAge = (typeof claims.exp === 'number' ? claims.exp - Math.floor(Date.now() / 1000) : 3600)
      return new Response(null, {
        status: 302,
        headers: {
          Location: '/',
          'Set-Cookie': `rp_session=${tokens.id_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge > 0 ? maxAge : 3600}`,
        },
      })
    }

    // ログアウト: 自分のセッションを破棄し、続けて IdP への RP起点ログアウトへ。
    if (url.pathname === '/logout') {
      const end = `${env.IDP_ISSUER}/oidc/logout?post_logout_redirect_uri=${encodeURIComponent(env.APP_BASE_URL)}`
      return new Response(null, {
        status: 302,
        headers: {
          Location: end,
          'Set-Cookie': 'rp_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
        },
      })
    }

    return new Response('Not found', { status: 404 })
  },
}
