// ------------------------------------------------------------------
// CSP スモークテスト（素の Node / vitest-pool-workers、ブラウザ不要）
//
// 目的: 主要ページを実際にレンダリングし、Content-Security-Policy が「strict
// （script-src に 'unsafe-inline' 無し・nonce 方式）」のまま壊れていないことを、
// HTML とヘッダの静的照合で保証する。本セッションで踏んだ回帰
// （nonce 渡し忘れ→ nonce="" / 取りこぼした inline on*= / javascript: URI）を
// コミット前に機械検出するための番人。
//
// 検出できること:
//   - script-src から 'unsafe-inline' が混入していない
//   - 実行される inline <script> が全て CSP ヘッダの nonce と一致する nonce を持つ
//     （= nonce="" や nonce 渡し忘れを捕捉）
//   - inline イベントハンドラ(onclick= 等) と javascript: URI が存在しない
//   - 外部 <script src> が allowlist(自オリジン / cdn.jsdelivr.net) 内
//
// 限界: ランタイムで DOM 注入されるスクリプト等、初期 HTML に現れない違反は
// 見られない（実ブラウザでないため）。そこは別途。
// ------------------------------------------------------------------
import { env, SELF, reset } from 'cloudflare:test'
import { beforeEach, describe, it, expect } from 'vitest'
import { applySchema, seedUser, seedSession } from './helpers'

const HOST = 'https://idp.test'

// script-src に明示的に許可する外部オリジン（tom-select の CDN）。
const ALLOWED_SCRIPT_ORIGINS = ['https://cdn.jsdelivr.net']

// inline イベントハンドラとして弾きたい属性（CSP の script-src-attr に該当）。
const EVENT_ATTRS =
  'click|change|submit|input|load|keyup|keydown|keypress|mouseover|mouseout|mousedown|mouseup|focus|blur|dblclick|wheel|drag|drop|error|reset|select|toggle|contextmenu'

// --- CSP / HTML パースの小道具 --------------------------------------

function scriptSrcTokens(csp: string): string[] {
  const dir = csp
    .split(';')
    .map((s) => s.trim())
    .find((d) => d.startsWith('script-src'))
  return dir ? dir.split(/\s+/).slice(1) : []
}

function cspNonce(csp: string): string | null {
  const tok = scriptSrcTokens(csp).find((t) => t.startsWith("'nonce-"))
  // "'nonce-ABC=='" → "ABC=="
  return tok ? tok.slice("'nonce-".length, -1) : null
}

// JSON データアイランド(<script type="application/json">)は実行されないので CSP の
// 対象外。中身に "onclick" 等の文字列が入りうるため、ハンドラ走査の前に除去する。
function stripDataIslands(html: string): string {
  return html.replace(
    /<script\b[^>]*type=["']application\/json["'][^>]*>[\s\S]*?<\/script>/gi,
    '',
  )
}

// 実行される inline <script> の開始タグ一覧（src 無し・非 JSON）。
function inlineScriptTags(html: string): string[] {
  const tags = html.match(/<script\b[^>]*>/gi) || []
  return tags.filter(
    (t) =>
      !/\bsrc=/i.test(t) &&
      !/type=["']application\/json["']/i.test(t) &&
      !/type=["']text\/template["']/i.test(t),
  )
}

function externalScriptSrcs(html: string): string[] {
  const tags = html.match(/<script\b[^>]*\bsrc=["'][^"']+["'][^>]*>/gi) || []
  return tags.map((t) => (t.match(/\bsrc=["']([^"']+)["']/i) || [])[1] || '')
}

function findInlineHandler(html: string): string | null {
  const re = new RegExp(`<[a-zA-Z][^>]*?\\son(?:${EVENT_ATTRS})\\s*=`, 'i')
  const m = stripDataIslands(html).match(re)
  return m ? m[0] : null
}

// 1 ページぶんの CSP 健全性をまとめて検証する。
function assertCspClean(label: string, res: Response, html: string) {
  const csp = res.headers.get('content-security-policy')
  expect(csp, `${label}: CSP ヘッダが付与されている`).toBeTruthy()

  const tokens = scriptSrcTokens(csp!)
  expect(tokens, `${label}: script-src に 'unsafe-inline' が無い`).not.toContain(
    "'unsafe-inline'",
  )

  const nonce = cspNonce(csp!)
  expect(nonce, `${label}: script-src に nonce がある`).toBeTruthy()

  // 実行される inline <script> は全て CSP の nonce を持つこと（nonce="" を捕捉）。
  for (const tag of inlineScriptTags(html)) {
    const m = tag.match(/\bnonce=["']([^"']*)["']/i)
    const head = tag.slice(0, 90)
    expect(m, `${label}: inline <script> に nonce 属性がある → ${head}`).toBeTruthy()
    expect(m![1], `${label}: inline <script> の nonce が CSP と一致 → ${head}`).toBe(nonce)
  }

  // 外部 script は自オリジン(相対) か allowlist 内のみ。
  for (const src of externalScriptSrcs(html)) {
    const ok = src.startsWith('/') || ALLOWED_SCRIPT_ORIGINS.some((o) => src.startsWith(o))
    expect(ok, `${label}: 外部 script src が許可されている → ${src}`).toBe(true)
  }

  // inline イベントハンドラ / javascript: URI が無いこと。
  const handler = findInlineHandler(html)
  expect(handler, `${label}: inline on*= ハンドラが無い → ${handler}`).toBeNull()
  expect(stripDataIslands(html).includes('javascript:'), `${label}: javascript: URI が無い`).toBe(
    false,
  )
}

// 認証付きで GET し、[Response, html] を返す。
async function getPage(path: string, cookie?: string): Promise<[Response, string]> {
  const res = await SELF.fetch(`${HOST}${path}`, {
    headers: cookie ? { Cookie: cookie } : {},
    redirect: 'manual',
  })
  const html = await res.text()
  return [res, html]
}

// 管理者セッションを 1 つ用意し、Cookie 文字列を返す。
async function seedAdminSession(email: string): Promise<string> {
  const userId = await seedUser(env.DB, { email })
  await env.DB.prepare('INSERT INTO admins (email) VALUES (?)').bind(email).run()
  const sid = `sess-${crypto.randomUUID()}`
  await seedSession(env.DB, { plainSessionId: sid, user_id: userId })
  return `__Host-idp_session=${sid}`
}

beforeEach(async () => {
  await reset()
  await applySchema(env.DB)
})

describe('CSP スモーク: 主要ページが strict CSP を保っている', () => {
  it('公開ページ(/login, /signup)が CSP クリーン', async () => {
    for (const path of ['/login', '/signup']) {
      const [res, html] = await getPage(path)
      expect(res.status, `${path} が 200`).toBe(200)
      assertCspClean(path, res, html)
    }
  })

  it('ユーザーページ(/account)が CSP クリーン', async () => {
    const userId = await seedUser(env.DB, { email: 'user@example.com' })
    const sid = `sess-${crypto.randomUUID()}`
    await seedSession(env.DB, { plainSessionId: sid, user_id: userId })
    const cookie = `__Host-idp_session=${sid}`

    const [res, html] = await getPage('/account', cookie)
    expect(res.status, '/account が 200').toBe(200)
    assertCspClean('/account', res, html)
  })

  it('管理ページ(/admin 系)が CSP クリーン', async () => {
    const cookie = await seedAdminSession('admin@example.com')

    for (const path of ['/admin', '/admin/apps', '/admin/users', '/admin/am/groups', '/admin/am/services']) {
      const [res, html] = await getPage(path, cookie)
      expect(res.status, `${path} が 200`).toBe(200)
      assertCspClean(path, res, html)
    }
  })

  it('委任ポータル(/group-admin)が CSP クリーン（本セッションの回帰箇所）', async () => {
    // 本体ポータル(タブ・モーダル群)を描画させるため、ユーザーを管理対象グループの
    // group_admin / billing_admin にする。空状態ブランチでは部品スクリプトが出ない。
    const email = 'ga@example.com'
    const userId = await seedUser(env.DB, { email })
    const sid = `sess-${crypto.randomUUID()}`
    await seedSession(env.DB, { plainSessionId: sid, user_id: userId })
    const cookie = `__Host-idp_session=${sid}`

    const now = Math.floor(Date.now() / 1000)
    await env.DB.prepare('INSERT INTO groups (id, name, created_at) VALUES (?, ?, ?)')
      .bind('g-csp', 'CSP検証グループ', now)
      .run()
    await env.DB.prepare(
      `INSERT INTO group_memberships (user_id, group_id, role, valid_from, valid_to, is_group_admin, is_billing_admin)
       VALUES (?, ?, 'group_admin', 1, 4102444800, 1, 1)`,
    )
      .bind(userId, 'g-csp')
      .run()

    const [res, html] = await getPage('/group-admin', cookie)
    expect(res.status, '/group-admin が 200').toBe(200)
    // 本体ブランチが描画されている（部品スクリプトが存在する）ことを担保し、
    // スクリプトゼロで素通り＝偽合格になるのを防ぐ。
    expect(
      inlineScriptTags(html).length,
      '/group-admin: inline スクリプトが描画されている',
    ).toBeGreaterThan(0)
    assertCspClean('/group-admin', res, html)
  })
})
