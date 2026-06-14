-- マイグレーション: OIDC Back-Channel Logout 1.0 対応を追加する。
--
-- RP ごとのログアウトエンドポイント列を追加する。値があれば /oidc/logout が署名付き
-- logout_token をこの URL へ POST し、RP も自身のセッションを無効化する(ユーザーが
-- ログイン中の全 RP にまたがる単一ログアウト)。
--
-- 新規 DB は schema.sql からこの列を既に取得する。本ファイルは既にデプロイ済みの DB を
-- パッチするだけ。SQLite には "ADD COLUMN IF NOT EXISTS" が無いため、二重実行すると
-- "duplicate column name" エラーになる — これは想定内で無害。
--
-- 適用(ローカル):  npx wrangler d1 execute tobira-mock-db --local  --file ./migrations/0002_backchannel_logout.sql
-- 適用(リモート):  npx wrangler d1 execute tobira-mock-db --remote --file ./migrations/0002_backchannel_logout.sql

ALTER TABLE apps ADD COLUMN backchannel_logout_uri TEXT;
