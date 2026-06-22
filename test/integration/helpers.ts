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
import { bytesToBase64Url, resetSigningKeyCachesForTests } from '../../src/oidc/jwt'
import { resetKeysetCacheForTests } from '../../src/oidc/keys'

/**
 * プロセス内(isolate)の鍵キャッシュを全て破棄する。`reset()`(D1 消去)では消えないため、
 * 鍵の隔離・rotation を検証するテストでは applySchema の後にこれを呼んで cold-start させる。
 */
export function resetKeyCaches(): void {
  resetKeysetCacheForTests()
  resetSigningKeyCachesForTests()
}

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

export interface SeedAppSessionOpts {
  plainRefreshToken: string
  plainAccessToken?: string
  user_id: string
  app_id: string
  scope?: string
  auth_time?: number | null
  expires_at?: number
}

/**
 * app_sessions に 1 行投入。token / refresh_token 列にはハッシュ(hashToken)を保存する＝
 * 本番と同じ形。plainRefreshToken はトークン更新要求でそのまま送る。
 */
export async function seedAppSession(db: D1Database, opts: SeedAppSessionOpts): Promise<void> {
  const hashedRefresh = await hashToken(opts.plainRefreshToken)
  const hashedAccess = await hashToken(opts.plainAccessToken ?? `at-${crypto.randomUUID()}`)
  await db
    .prepare(
      `INSERT INTO app_sessions (token, refresh_token, user_id, app_id, expires_at, scope, auth_time)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      hashedAccess,
      hashedRefresh,
      opts.user_id,
      opts.app_id,
      opts.expires_at ?? nowSec() + 3600,
      opts.scope ?? 'openid',
      opts.auth_time ?? null,
    )
    .run()
}

export interface SeedPermissionOpts {
  user_id: string
  app_id: string
  valid_from?: number
  valid_to?: number
}

/** permissions に 1 行投入（checkPermission のユーザー直付与を満たす）。既定で現在有効。 */
export async function seedPermission(db: D1Database, opts: SeedPermissionOpts): Promise<void> {
  const now = nowSec()
  await db
    .prepare(
      `INSERT INTO permissions (user_id, app_id, valid_from, valid_to, created_at) VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(opts.user_id, opts.app_id, opts.valid_from ?? now - 60, opts.valid_to ?? now + 3600, now)
    .run()
}

export interface SeedSessionOpts {
  plainSessionId: string
  user_id: string
  auth_time?: number | null
  expires_at?: number
}

/**
 * sessions(ブラウザ SSO セッション)に 1 行投入。id 列にはハッシュ(hashToken)を保存する＝
 * 本番と同じ形。plainSessionId は Cookie `__Host-idp_session` にそのまま入れて送る。
 */
export async function seedSession(db: D1Database, opts: SeedSessionOpts): Promise<void> {
  const hashed = await hashToken(opts.plainSessionId)
  await db
    .prepare('INSERT INTO sessions (id, user_id, expires_at, auth_time) VALUES (?, ?, ?, ?)')
    .bind(hashed, opts.user_id, opts.expires_at ?? nowSec() + 3600, opts.auth_time ?? null)
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

export interface SeedGroupOpts {
  id?: string
  name?: string
  parent_id?: string | null
  billing_password_hash?: string | null
}
export async function seedGroup(db: D1Database, opts: SeedGroupOpts = {}): Promise<string> {
  const id = opts.id ?? `grp-${crypto.randomUUID()}`
  await db
    .prepare('INSERT INTO groups (id, name, created_at, parent_id, billing_password_hash) VALUES (?, ?, ?, ?, ?)')
    .bind(id, opts.name ?? `Group ${id}`, nowSec(), opts.parent_id ?? null, opts.billing_password_hash ?? null)
    .run()
  return id
}

export interface SeedMembershipOpts {
  user_id: string
  group_id: string
  role?: string
  valid_from?: number
  valid_to?: number
  is_group_admin?: number
  is_billing_admin?: number
  is_developer?: number
}
export async function seedMembership(db: D1Database, opts: SeedMembershipOpts): Promise<void> {
  const now = nowSec()
  await db
    .prepare(`INSERT INTO group_memberships (user_id, group_id, role, valid_from, valid_to, is_group_admin, is_billing_admin, is_developer)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(
      opts.user_id,
      opts.group_id,
      opts.role ?? 'member',
      opts.valid_from ?? now - 60,
      opts.valid_to ?? now + 3600,
      opts.is_group_admin ?? 0,
      opts.is_billing_admin ?? 0,
      opts.is_developer ?? 0
    )
    .run()
}

export interface SeedProviderOpts {
  id?: string
  name?: string
}
export async function seedProvider(db: D1Database, opts: SeedProviderOpts = {}): Promise<string> {
  const id = opts.id ?? `prov-${crypto.randomUUID()}`
  await db
    .prepare('INSERT INTO service_providers (id, name, created_at) VALUES (?, ?, ?)')
    .bind(id, opts.name ?? `Provider ${id}`, nowSec())
    .run()
  return id
}

export interface SeedServiceOpts {
  id?: string
  provider_id: string
  name?: string
  owner_group_id?: string | null
  status?: string
}
export async function seedService(db: D1Database, opts: SeedServiceOpts): Promise<string> {
  const id = opts.id ?? `svc-${crypto.randomUUID()}`
  await db
    .prepare('INSERT INTO services (id, provider_id, name, created_at, owner_group_id, status) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(
      id,
      opts.provider_id,
      opts.name ?? `Service ${id}`,
      nowSec(),
      opts.owner_group_id ?? null,
      opts.status ?? 'active'
    )
    .run()
  return id
}

export interface SeedContractOpts {
  id?: string
  service_id: string
  customer_group_id: string
  seat_limit?: number | null
  valid_from?: number
  valid_to?: number
}
export async function seedContract(db: D1Database, opts: SeedContractOpts): Promise<string> {
  const id = opts.id ?? `ctr-${crypto.randomUUID()}`
  const now = nowSec()
  await db
    .prepare('INSERT INTO service_contracts (id, service_id, customer_group_id, seat_limit, valid_from, valid_to) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(
      id,
      opts.service_id,
      opts.customer_group_id,
      opts.seat_limit ?? null,
      opts.valid_from ?? now - 60,
      opts.valid_to ?? now + 3600
    )
    .run()
  return id
}

export interface SeedGrantOpts {
  group_id: string
  service_id: string
  contract_id: string
  seat_limit?: number | null
  valid_from?: number
  valid_to?: number
}
export async function seedGrant(db: D1Database, opts: SeedGrantOpts): Promise<void> {
  const now = nowSec()
  await db
    .prepare('INSERT INTO group_service_grants (group_id, service_id, contract_id, seat_limit, valid_from, valid_to) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(
      opts.group_id,
      opts.service_id,
      opts.contract_id,
      opts.seat_limit ?? null,
      opts.valid_from ?? now - 60,
      opts.valid_to ?? now + 3600
    )
    .run()
}

export interface SeedFacilityOpts {
  id?: string
  structure_no?: string | null
  building_use?: string | null
  managing_group_id: string
}
export async function seedFacility(db: D1Database, opts: SeedFacilityOpts): Promise<string> {
  const id = opts.id ?? `fac-${crypto.randomUUID()}`
  await db
    .prepare('INSERT INTO facilities (id, structure_no, building_use, managing_group_id, created_at) VALUES (?, ?, ?, ?, ?)')
    .bind(
      id,
      opts.structure_no ?? null,
      opts.building_use ?? null,
      opts.managing_group_id,
      nowSec()
    )
    .run()
  return id
}

export interface SeedRoleMasterOpts {
  service_id: string
  facility_type?: string | null
  role_code?: string
  role_name?: string
}
export async function seedRoleMaster(db: D1Database, opts: SeedRoleMasterOpts): Promise<number> {
  const result = await db
    .prepare('INSERT INTO service_role_master (service_id, facility_type, role_code, role_name) VALUES (?, ?, ?, ?) RETURNING id')
    .bind(
      opts.service_id,
      opts.facility_type ?? null,
      opts.role_code ?? 'general',
      opts.role_name ?? 'General Role'
    )
    .first<{id: number}>()
  return result!.id
}

export interface SeedAssignmentOpts {
  user_id: string
  group_id: string
  service_id: string
  facility_id?: string | null
  service_role_id?: number | null
  valid_from?: number
  valid_to?: number
}
export async function seedAssignment(db: D1Database, opts: SeedAssignmentOpts): Promise<void> {
  const now = nowSec()
  await db
    .prepare(`INSERT INTO service_user_assignments (user_id, group_id, service_id, facility_id, service_role_id, valid_from, valid_to)
              VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .bind(
      opts.user_id,
      opts.group_id,
      opts.service_id,
      opts.facility_id ?? null,
      opts.service_role_id ?? null,
      opts.valid_from ?? now - 60,
      opts.valid_to ?? now + 3600
    )
    .run()
}

