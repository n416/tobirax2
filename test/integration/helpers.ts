// ------------------------------------------------------------------
// 統合テスト共通ヘルパ。
//   - applySchema: schema.sql(本番投入の正本)を実 D1 へ流す。
//   - makePkce: PKCE の code_verifier と S256 code_challenge を生成。
//   - seed*: ユーザー / アプリ / 認可コードを D1 に直接投入。
// 振る舞いは本番コードと同じ関数（hashToken / bytesToBase64Url）を使い、
// テスト側で写し間違えないようにする。
// ------------------------------------------------------------------
import type { D1Database } from '@cloudflare/workers-types'
// Vite の ?raw で schema.sql を生テキスト(string)として取り込む（本番投入の正本そのもの）。
// 相対指定子 + ?raw はアンビエントの wildcard 宣言に当たらない(TS は相対パスをディスク
// 解決するため)。ランタイムは Vite が string に解決する(統合テストで検証済み)ので、
// 型だけここで string として扱う。
// @ts-ignore -- Vite ?raw インポート（型解決外・実体は string）
import schemaSqlRaw from '../../schema.sql?raw'
const schemaSql: string = schemaSqlRaw
import { hashToken } from '../../src/utils/auth'
import { bytesToBase64Url } from '../../src/oidc/jwt'

const te = new TextEncoder()

/**
 * schema.sql を文単位で実 D1 に適用する。`--` 行コメントを除去し `;` で分割して
 * 1 文ずつ実行する。schema.sql は DDL のみ（文字列リテラル中に `;` を含まない）。
 * エラーは握り潰さない＝将来 schema が壊れたらテストで露見させる。
 */
export async function applySchema(db: D1Database): Promise<void> {
  const stripped = schemaSql.replace(/--[^\n]*/g, '')
  const statements = stripped
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
  for (const stmt of statements) {
    await db.prepare(stmt).run()
  }
}

/** PKCE: ランダム verifier と S256 challenge(=base64url(SHA-256(verifier)))。 */
export async function makePkce(): Promise<{ verifier: string; challenge: string }> {
  const verifier = crypto.randomUUID() + crypto.randomUUID()
  const digest = await crypto.subtle.digest('SHA-256', te.encode(verifier))
  return { verifier, challenge: bytesToBase64Url(new Uint8Array(digest)) }
}

const nowSec = () => Math.floor(Date.now() / 1000)

export interface SeedUserOpts {
  id?: string
  email?: string
  name?: string | null
  preferred_username?: string | null
  email_verified?: number
  group_id?: string | null
}

/** users に 1 行投入し、id を返す。NOT NULL 列(password_hash 等)は埋める。 */
export async function seedUser(db: D1Database, opts: SeedUserOpts = {}): Promise<string> {
  const id = opts.id ?? `usr-${crypto.randomUUID()}`
  const now = nowSec()
  await db
    .prepare(
      `INSERT INTO users (id, email, password_hash, group_id, created_at, updated_at, name, preferred_username, email_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      opts.email ?? `${id}@example.com`,
      'x-not-used-in-token-flow',
      opts.group_id ?? null,
      now,
      now,
      opts.name ?? null,
      opts.preferred_username ?? null,
      opts.email_verified ?? 0,
    )
    .run()
  return id
}

export interface SeedAppOpts {
  id?: string
  name?: string
  base_url?: string
  status?: string
  client_secret?: string | null
  redirect_uris?: string | null
}

/** apps に 1 行投入し、id(=client_id)を返す。client_secret 省略でパブリッククライアント。 */
export async function seedApp(db: D1Database, opts: SeedAppOpts = {}): Promise<string> {
  const id = opts.id ?? `app-${crypto.randomUUID()}`
  await db
    .prepare(
      `INSERT INTO apps (id, name, base_url, status, client_secret, redirect_uris, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      opts.name ?? 'Test RP',
      opts.base_url ?? 'https://rp.example',
      opts.status ?? 'active',
      opts.client_secret ?? null,
      opts.redirect_uris ?? null,
      nowSec(),
    )
    .run()
  return id
}

export interface SeedAuthCodeOpts {
  plainCode: string
  user_id: string
  app_id: string
  redirect_uri: string
  scope?: string
  code_challenge?: string | null
  code_challenge_method?: string | null
  nonce?: string | null
  auth_time?: number | null
  expires_at?: number
}

/**
 * auth_codes に 1 行投入。code 列にはハッシュ(hashToken)を保存する＝本番と同じ形。
 * plainCode はトークン要求時にそのまま送る。
 */
export async function seedAuthCode(db: D1Database, opts: SeedAuthCodeOpts): Promise<void> {
  const hashed = await hashToken(opts.plainCode)
  await db
    .prepare(
      `INSERT INTO auth_codes (code, user_id, app_id, expires_at, used_at, nonce, code_challenge, code_challenge_method, redirect_uri, scope, auth_time)
       VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      hashed,
      opts.user_id,
      opts.app_id,
      opts.expires_at ?? nowSec() + 600,
      opts.nonce ?? null,
      opts.code_challenge ?? null,
      opts.code_challenge_method ?? null,
      opts.redirect_uri,
      opts.scope ?? 'openid',
      opts.auth_time ?? null,
    )
    .run()
}

/** application/x-www-form-urlencoded のトークン要求を組み立てる。 */
export function formBody(params: Record<string, string>): RequestInit {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString(),
  }
}
