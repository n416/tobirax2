-- マイグレーション: OIDC 動的クライアント登録(RFC 7591)対応を追加する。
--
-- 管理者が発行する Initial Access Token を保持する registration_tokens テーブルを追加する。
-- 呼び出し元は POST /register 時に `Authorization: Bearer <token>` として提示する必要があり、
-- 提示が無い(または失効/未知の)場合は登録を拒否する。これにより登録をオープン/匿名ではなく
-- 「保護付き」(RFC 7591 §1.2)に保つ。
--
-- 新規 DB は schema.sql からこのテーブルを取得する。本ファイルは既にデプロイ済みの DB を
-- パッチするだけ。二重実行すると "table already exists" エラーになる — 想定内で無害。
--
-- 適用(ローカル):  npx wrangler d1 execute tobira-mock-db --local  --file ./migrations/0003_registration_tokens.sql
-- 適用(リモート):  npx wrangler d1 execute tobira-mock-db --remote --file ./migrations/0003_registration_tokens.sql

CREATE TABLE IF NOT EXISTS registration_tokens (
    token TEXT PRIMARY KEY,
    created_by TEXT,
    created_at INTEGER NOT NULL,
    expires_at INTEGER
);
