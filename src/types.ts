export interface Env {
  DB: D1Database
  RESEND_API_KEY?: string
  JWT_SECRET: string
  // OIDC 署名用秘密鍵を保存時に暗号化するための鍵暗号化鍵(KEK)(oidc/keys.ts 参照)。
  // 本番では Worker のシークレットとして設定し、ローカルでは開発用の値にフォールバックする。
  OIDC_KEK?: string
}

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
  preferred_username?: string | null
  picture?: string | null
}

export interface App {
  id: string
  name: string
  base_url: string
  status: string // 'active' | 'inactive'
  icon_url?: string
  description?: string
  created_at: number
  client_secret?: string | null // null/undefined = パブリッククライアント(PKCE)
  redirect_uris?: string | null // 改行区切りの完全一致 redirect_uris(OIDC)。空なら base_url のオリジン照合にフォールバック
  backchannel_logout_uri?: string | null // OIDC Back-Channel Logout 1.0: RP のログアウトエンドポイント
}

export interface Session {
  id: string
  user_id: string
  expires_at: number
  // OIDC: エンドユーザーが実際に認証した時刻(unix秒)。
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
  created_at: number
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
