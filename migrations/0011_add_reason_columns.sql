-- Migration: Add reason columns to services and apps
-- 適用(ローカル): npx wrangler d1 execute tobira-mock-db --local --file ./migrations/0011_add_reason_columns.sql
-- 適用(本番): npx wrangler d1 execute tobira-mock-db --remote --file ./migrations/0011_add_reason_columns.sql

ALTER TABLE services ADD COLUMN reason TEXT;
ALTER TABLE apps ADD COLUMN reason TEXT;
