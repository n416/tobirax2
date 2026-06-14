-- Migration: add OIDC auth_time columns to existing databases.
--
-- Adds the end-user authentication time so the IdP can:
--   * emit a real id_token `auth_time` claim (OIDC Core 2, #3)
--   * enforce the `max_age` / `prompt=login` re-authentication requests (#5/#6)
--
-- New databases already get these columns from schema.sql; this file only
-- patches an already-deployed DB. SQLite has no "ADD COLUMN IF NOT EXISTS",
-- so running it twice errors with "duplicate column name" — that is expected
-- and harmless (the column already exists).
--
-- Apply (local):  npx wrangler d1 execute tobira-mock-db --local  --file ./migrations/0001_auth_time.sql
-- Apply (remote): npx wrangler d1 execute tobira-mock-db --remote --file ./migrations/0001_auth_time.sql

ALTER TABLE sessions ADD COLUMN auth_time INTEGER;
ALTER TABLE auth_codes ADD COLUMN auth_time INTEGER;
ALTER TABLE app_sessions ADD COLUMN auth_time INTEGER;
