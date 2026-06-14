-- Migration: add the OIDC redirect_uris column to an EXISTING apps table.
-- Fresh databases created from schema.sql already include this column.
-- D1 has no "ADD COLUMN IF NOT EXISTS", so run this once.
--
-- When set, redirect_uri must match one of these exactly (newline-separated).
-- When left NULL/empty, validation falls back to origin matching against base_url.
ALTER TABLE apps ADD COLUMN redirect_uris TEXT;
