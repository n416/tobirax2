-- Migration: add OIDC profile-claim columns + per-token scope to EXISTING tables.
-- Fresh databases created from schema.sql already include these.
-- D1 has no "ADD COLUMN IF NOT EXISTS", so run each line once.

-- profile scope claims (NULL falls back to email at token time)
ALTER TABLE users ADD COLUMN name TEXT;
ALTER TABLE users ADD COLUMN preferred_username TEXT;
ALTER TABLE users ADD COLUMN picture TEXT;

-- scope granted for an access/refresh token; gates userinfo claims
ALTER TABLE app_sessions ADD COLUMN scope TEXT;
