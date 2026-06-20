import type { Context } from 'hono'

export interface Env {
  DB: D1Database
  ENVIRONMENT?: string
  RESEND_API_KEY?: string
  JWT_SECRET: string
  // OIDC 署名用秘密鍵を保存時に暗号化するための鍵暗号化鍵(KEK)(oidc/keys.ts 参照)。
  // 本番では Worker のシークレットとして設定し、ローカルでは開発用の値にフォールバックする。
  OIDC_KEK?: string
}

// アプリ共通の Hono コンテキスト型。DB ハンドラ群が受け取る c の型(従来は c: any)。
// 各ルーターは new Hono<{ Bindings: Env }>() で生成しているのでこれに揃える。
export type AppContext = Context<{ Bindings: Env }>


export interface User {
  id: string
  email: string
  password_hash: string
  group_id: string | null
  created_at: number
  two_factor_secret?: string | null
  recovery_codes?: string | null
  updated_at: number
  name?: string | null
  email_verified: number
  preferred_username?: string | null
  picture?: string | null
}

export interface App {
  id: string
  name: string
  base_url: string
  status: string // 'active' | 'inactive' | 'pending'(申請待ち) | 'rejected'(却下)
  icon_url?: string
  description?: string
  created_at: number
  client_secret?: string | null // null/undefined = パブリッククライアント(PKCE)
  redirect_uris?: string | null // 改行区切りの完全一致 redirect_uris(OIDC)。空なら base_url のオリジン照合にフォールバック
  backchannel_logout_uri?: string | null // OIDC Back-Channel Logout 1.0: RP のログアウトエンドポイント
  initiate_login_uri?: string | null // ダッシュボードからのログイン開始URL
  service_name?: string | null
  // セルフサービス: 申請/所有グループ。NULL = 運営者が直接作ったグローバルアプリ。
  owner_group_id?: string | null
  owner_group_name?: string | null
  // 表示用: このアプリが組み込まれているサービス数(service_apps 由来)。
  service_count?: number
}

export interface Session {
  id: string
  user_id: string
  expires_at: number
  // OIDC: エンドユーザーが実際に認証した時刻(unix秒)。
  auth_time?: number | null
}

// tags の行。サービスに付与するタグ(管理者承認制)。
export interface Tag {
  id: string
  name: string
  status: string
  owner_group_id?: string | null
  created_at: number
}

// recent_audit_logs の行。Monitor 画面用に直近 N 件だけ保持する監査ログ。
export interface RecentAuditLog {
  id: number
  event_type: string
  details: string | null
  user_id: string | null
  app_id: string | null
  ip_address: string | null
  user_agent: string | null
  // DEFAULT (strftime) で常に値が入る。
  created_at: number
}

// app_sessions の行。発行済み OIDC トークン(access/refresh)の不透明トークン引き当て元。
export interface AppSession {
  id: number
  token: string
  refresh_token: string
  user_id: string
  app_id: string
  expires_at: number
  scope?: string | null
  auth_time?: number | null
}

export interface Permission {
  id: number
  user_id?: string
  group_id?: string
  app_id: string
  valid_from: number
  valid_to: number
  created_at: number
}

export interface Group {
  id: string
  name: string
  // アカウントマネージャ: 親グループ(階層)。最上位は null。(migration 0004)
  parent_id?: string | null
  created_at: number
}

// アカウントマネージャ【グループ所属】誰が・どのグループに・どの役割で・いつからいつまで。
// role: 'group_admin'(グループ管理者) / 'member'(メンバー)。(migration 0004: group_memberships)
export interface GroupMembership {
  id: number
  user_id: string
  group_id: string
  role: 'group_admin' | 'member'
  valid_from: number
  valid_to: number
}

// アカウントマネージャ【サービス提供企業】点検会社・清掃会社など。(migration 0004)
export interface ServiceProvider {
  id: string
  name: string
  created_at: number
}

// アカウントマネージャ【サービス】提供企業配下のサービス。(migration 0004)
export interface Service {
  id: string
  provider_id: string
  name: string
  created_at: number
  // セルフサービス: 所有グループ。NULL = 運営者が提供企業つきで作ったグローバルサービス。
  owner_group_id?: string | null
  // 'active'(承認済み) / 'pending'(承認待ち) / 'rejected'(却下)。
  status?: string
}

// アカウントマネージャ【サービス構成】サービス ―*:*― アプリ。承認済みアプリを束ねる。
export interface ServiceApp {
  id: number
  service_id: string
  app_id: string
  created_at: number
}

// アカウントマネージャ【サービス契約】利用枠(ゲート②)の出所。席数上限を持つ。(migration 0004)
export interface ServiceContract {
  id: string
  service_id: string
  customer_group_id: string
  seat_limit?: number | null   // null=無制限
  valid_from: number
  valid_to: number
}

// アカウントマネージャ【グループ利用枠 / ゲート②】契約を各グループノードへ明示開放。(migration 0004)
export interface GroupServiceGrant {
  id: number
  group_id: string
  service_id: string
  contract_id: string
  seat_limit?: number | null   // 支店別サブ枠(任意)。null=契約の総枠に従う
  valid_from: number
  valid_to: number
}

// アカウントマネージャ【施設(建物)】施設ID=1:1で施設構造物番号に対応。(migration 0004)
export interface Facility {
  id: string
  structure_no?: string | null
  building_use?: string | null   // 建物用途/種別(役割メニュー絞り込みに使う)
  managing_group_id: string
  created_at: number
}

// アカウントマネージャ【サービス役割マスタ】サービス×施設種別で選べる役割のメニュー。(migration 0004)
export interface ServiceRole {
  id: number
  service_id: string
  facility_type?: string | null  // null=全種別 / '病院'等で限定
  role_code: string
  role_name: string
}

// アカウントマネージャ【サービス利用者割当 / ゲート③】個人を建物ごとにサービスへ割当+役割。(migration 0004)
export interface ServiceUserAssignment {
  id: number
  user_id: string
  group_id: string
  service_id: string
  facility_id: string
  service_role_id: number
  valid_from: number
  valid_to: number
}

export interface AuthCode {
  code: string
  user_id: string
  app_id: string
  expires_at: number
  used_at?: number
  // OIDC 認可リクエストのコンテキスト
  nonce?: string | null
  code_challenge?: string | null
  code_challenge_method?: string | null
  redirect_uri?: string | null
  scope?: string | null
  // OIDC: /authorize 時にセッションから引き継いだエンドユーザーの auth_time。
  auth_time?: number | null
}

export interface LocalizedText {
  ja: string
  en: string
}

export interface SystemConfig {
  appName: LocalizedText
  appSubtitle: LocalizedText
}

export interface RoleApplication {
  id: number
  user_id: string
  group_id: string
  role_type: 'group_admin' | 'billing_admin' | 'developer'
  status: 'pending' | 'approved' | 'rejected'
  reason: string | null
  admin_reason: string | null
  created_at: number
  updated_at: number
}
