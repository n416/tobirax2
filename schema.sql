-- Users & Auth
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    group_id TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    two_factor_secret TEXT,
    recovery_codes TEXT,
    -- OIDC profile-scope claims (NULL falls back to email at token time)
    name TEXT,
    preferred_username TEXT,
    picture TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    -- OIDC: actual end-user authentication time (unix seconds). Drives id_token
    -- auth_time and the max_age / prompt=login re-authentication checks.
    auth_time INTEGER
);

CREATE TABLE IF NOT EXISTS admins (
    email TEXT PRIMARY KEY,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Apps & Permissions
CREATE TABLE IF NOT EXISTS apps (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    base_url TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    icon_url TEXT,
    description TEXT,
    created_at INTEGER NOT NULL,
    -- OIDC: NULL = public client (PKCE required); set = confidential client
    client_secret TEXT,
    -- OIDC: newline-separated list of exact redirect_uris. When set, redirect_uri
    -- must match one of these exactly (spec-correct). When NULL/empty, falls back
    -- to origin matching against base_url (legacy).
    redirect_uris TEXT,
    -- OIDC Back-Channel Logout 1.0: the RP's logout endpoint. When set, /oidc/logout
    -- POSTs a signed logout_token here so the RP can kill its own session too.
    backchannel_logout_uri TEXT
);

CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    app_id TEXT NOT NULL,
    valid_from INTEGER NOT NULL,
    valid_to INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    UNIQUE(user_id, app_id)
);

CREATE TABLE IF NOT EXISTS group_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id TEXT NOT NULL,
    app_id TEXT NOT NULL,
    valid_from INTEGER NOT NULL,
    valid_to INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    UNIQUE(group_id, app_id)
);

-- OIDC / API flow
CREATE TABLE IF NOT EXISTS auth_codes (
    code TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    app_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    used_at INTEGER,
    -- OIDC authorization request context (carried code -> token)
    nonce TEXT,
    code_challenge TEXT,
    code_challenge_method TEXT,
    redirect_uri TEXT,
    scope TEXT,
    -- OIDC: end-user auth_time carried from the session, so the issued id_token
    -- reflects when the user actually authenticated (not when the token issued).
    auth_time INTEGER
);

CREATE TABLE IF NOT EXISTS app_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT NOT NULL,
    refresh_token TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL,
    app_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    -- OIDC scope granted for this token (drives which claims userinfo returns)
    scope TEXT,
    -- OIDC: end-user auth_time, preserved across refresh so re-issued id_tokens
    -- keep the original authentication time.
    auth_time INTEGER
);

-- Management features
CREATE TABLE IF NOT EXISTS invitations (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    invited_by TEXT NOT NULL,
    expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS password_resets (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    details TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- System Configuration (New)
CREATE TABLE IF NOT EXISTS system_config (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- Fixed-window rate limiting (per-IP login/signup throttling)
CREATE TABLE IF NOT EXISTS rate_limits (
    k TEXT PRIMARY KEY,
    count INTEGER NOT NULL,
    reset_at INTEGER NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_permissions_user ON permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_group_perms_group ON group_permissions(group_id);
CREATE INDEX IF NOT EXISTS idx_logs_created ON audit_logs(created_at);
