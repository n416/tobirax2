-- Migration: add OIDC columns to an EXISTING auth_codes table.
-- Fresh databases created from schema.sql already include these.
-- D1 has no "ADD COLUMN IF NOT EXISTS", so run each line once.
ALTER TABLE auth_codes ADD COLUMN nonce TEXT;
ALTER TABLE auth_codes ADD COLUMN code_challenge TEXT;
ALTER TABLE auth_codes ADD COLUMN code_challenge_method TEXT;
ALTER TABLE auth_codes ADD COLUMN redirect_uri TEXT;
ALTER TABLE auth_codes ADD COLUMN scope TEXT;
