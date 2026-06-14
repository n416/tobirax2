-- Migration: add OIDC Back-Channel Logout 1.0 support.
--
-- Adds the per-RP logout endpoint. When set, /oidc/logout POSTs a signed
-- logout_token to this URL so the RP invalidates its own session too (Single
-- Logout across all RPs the user is signed into).
--
-- New databases already get this column from schema.sql; this file only patches
-- an already-deployed DB. SQLite has no "ADD COLUMN IF NOT EXISTS", so running
-- it twice errors with "duplicate column name" — that is expected and harmless.
--
-- Apply (local):  npx wrangler d1 execute tobira-mock-db --local  --file ./migrations/0002_backchannel_logout.sql
-- Apply (remote): npx wrangler d1 execute tobira-mock-db --remote --file ./migrations/0002_backchannel_logout.sql

ALTER TABLE apps ADD COLUMN backchannel_logout_uri TEXT;
