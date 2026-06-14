-- Migration: add OIDC Dynamic Client Registration (RFC 7591) support.
--
-- Adds the registration_tokens table holding admin-issued Initial Access Tokens.
-- A caller must present one as `Authorization: Bearer <token>` to POST /register;
-- without it (or with an expired/unknown one) registration is refused. This keeps
-- registration "protected" (RFC 7591 §1.2) rather than open/anonymous.
--
-- New databases get this table from schema.sql; this file only patches an
-- already-deployed DB. Running it twice errors with "table already exists" —
-- that is expected and harmless.
--
-- Apply (local):  npx wrangler d1 execute tobira-mock-db --local  --file ./migrations/0003_registration_tokens.sql
-- Apply (remote): npx wrangler d1 execute tobira-mock-db --remote --file ./migrations/0003_registration_tokens.sql

CREATE TABLE IF NOT EXISTS registration_tokens (
    token TEXT PRIMARY KEY,
    created_by TEXT,
    created_at INTEGER NOT NULL,
    expires_at INTEGER
);
