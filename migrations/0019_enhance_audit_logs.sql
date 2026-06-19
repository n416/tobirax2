ALTER TABLE audit_logs ADD COLUMN user_id TEXT;
ALTER TABLE audit_logs ADD COLUMN app_id TEXT;
ALTER TABLE audit_logs ADD COLUMN ip_address TEXT;
ALTER TABLE audit_logs ADD COLUMN user_agent TEXT;
