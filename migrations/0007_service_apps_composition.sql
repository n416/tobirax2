-- マイグレーション: 「サービス＝複数アプリの束ね」への再設計。
--
-- 設計(2026-06-16 ユーザーと合意):
--   ・アプリ(OIDCクライアント)は 申請→運営者承認 を経て「承認済み部品」になる。
--     アプリ申請時にサービスへ紐づけることはしない(順序が逆だった)。
--   ・サービスは グループ管理者が作成(status='pending') → 承認済みアプリを1つ以上
--     「組み込む」(service_apps, 多対多) → 運営者が承認(status='active')。
--   ・アプリ↔サービスの紐づけの真実は service_apps に一本化する。
--     旧来の単一束縛列 apps.service_id のデータは service_apps へ移行する(列自体は残す)。
--
-- 注意: SQLite には "ADD COLUMN IF NOT EXISTS" が無いため、status 列の二重追加は
--   "duplicate column name" で落ちる(想定内・無害)。service_apps は IF NOT EXISTS。
--
-- 適用(ローカル):  npx wrangler d1 execute tobira-mock-db --local  --file ./migrations/0007_service_apps_composition.sql
-- 適用(リモート):  npx wrangler d1 execute tobira-mock-db --remote --file ./migrations/0007_service_apps_composition.sql

-- サービスにも承認状態を持たせる('active' / 'pending'(承認待ち) / 'rejected')。
-- 既存サービス(運営者が作ったもの)は active 扱い。
ALTER TABLE services ADD COLUMN status TEXT DEFAULT 'active';

-- 【サービス構成】サービス ―*:*― アプリ。承認済みアプリをサービスへ組み込む。
CREATE TABLE IF NOT EXISTS service_apps (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id TEXT NOT NULL REFERENCES services(id),
    app_id     TEXT NOT NULL REFERENCES apps(id),
    created_at INTEGER NOT NULL,
    UNIQUE(service_id, app_id)
);
CREATE INDEX IF NOT EXISTS idx_service_apps_service ON service_apps(service_id);
CREATE INDEX IF NOT EXISTS idx_service_apps_app     ON service_apps(app_id);

-- 旧来の単一束縛(apps.service_id)を service_apps へ移行する。
INSERT OR IGNORE INTO service_apps (service_id, app_id, created_at)
    SELECT service_id, id, strftime('%s','now') FROM apps WHERE service_id IS NOT NULL;
