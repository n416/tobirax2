-- マイグレーション: OIDCクライアント(apps) ↔ ドメインサービス(services) の束縛。
--
-- 位置づけ:
--   ランタイム・エンタイトルメントAPI(GET /entitlements/me)のテナント分離に使う。
--   外部サービスが提示したアクセストークンから app_id(=OIDCクライアント)を引き、
--   その apps.service_id に紐づくサービスのエンタイトルメントだけを返す。
--   NULL = エンタイトルメント問い合わせ用に紐付いていないクライアント(API は 403)。
--   これにより点検会社のトークンは点検サービスのエンタイトルメントしか読めない。
--
-- 注意: SQLite には "ADD COLUMN IF NOT EXISTS" が無いため、二重実行は
--   "duplicate column name" で落ちる(想定内・無害)。
--
-- 適用(ローカル):  npx wrangler d1 execute tobira-mock-db --local  --file ./migrations/0005_app_service_binding.sql
-- 適用(リモート):  npx wrangler d1 execute tobira-mock-db --remote --file ./migrations/0005_app_service_binding.sql

-- OIDCクライアントを単一のドメインサービスへ束縛する(services(id) を参照する想定)。
ALTER TABLE apps ADD COLUMN service_id TEXT;
