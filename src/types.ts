export interface Env {
  DB: D1Database
  RESEND_API_KEY?: string
  JWT_SECRET: string
  // Key-encryption-key for the OIDC signing private key at rest (see oidc/keys.ts).
  // Set as a Worker secret in production; falls back to a dev value locally.
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
  client_secret?: string | null // null/undefined = public client (PKCE)
  redirect_uris?: string | null // newline-separated exact redirect_uris (OIDC); empty = base_url origin fallback
  backchannel_logout_uri?: string | null // OIDC Back-Channel Logout 1.0: RP logout endpoint
}

export interface Session {
  id: string
  user_id: string
  expires_at: number
  // OIDC: actual end-user authentication time (unix seconds).
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
  // OIDC authorization request context
  nonce?: string | null
  code_challenge?: string | null
  code_challenge_method?: string | null
  redirect_uri?: string | null
  scope?: string | null
  // OIDC: end-user auth_time carried from the session at /authorize time.
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
