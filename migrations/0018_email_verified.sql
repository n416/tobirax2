-- 既存ユーザーの email_verified は 1 (確認済み) とみなし、後方互換性を保つ。
ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 1;
