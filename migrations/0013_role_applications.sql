-- Migration: グループ内ロールの兼任化(フラグ列)と汎用の権限申請フロー(role_applications)。
-- 適用(ローカル): npx wrangler d1 execute tobira-mock-db --local --file ./migrations/0013_role_applications.sql
-- 適用(本番): npx wrangler d1 execute tobira-mock-db --remote --file ./migrations/0013_role_applications.sql
--
-- 背景: これまで group_memberships.role は単一選択(member/group_admin/billing_admin)で、
--   開発者権限は別管理(developer_status / group_developer_applications)だったため兼任できなかった。
--   本マイグレーションでロールを「個別の論理フラグ(0/1)」へ移行し、複数権限の兼務を可能にする。
--   旧 role / developer_status 列、billing_password_hash、billing_elevations、
--   group_developer_applications はアプリからの参照をやめる(列・表自体は破壊的変更を避けて残置)。

-- 1) group_memberships を兼任可能なフラグへ拡張する。
ALTER TABLE group_memberships ADD COLUMN is_group_admin   INTEGER NOT NULL DEFAULT 0;  -- グループ管理者(運用担当)
ALTER TABLE group_memberships ADD COLUMN is_billing_admin INTEGER NOT NULL DEFAULT 0;  -- 決裁権者(利用枠の予算操作)
ALTER TABLE group_memberships ADD COLUMN is_developer     INTEGER NOT NULL DEFAULT 0;  -- 開発者(アプリ/サービスの作成)

-- 2) 既存データの移行。旧 role / developer_status から対応フラグを立てる。
UPDATE group_memberships SET is_group_admin   = 1 WHERE role = 'group_admin';
UPDATE group_memberships SET is_billing_admin = 1 WHERE role = 'billing_admin';
UPDATE group_memberships SET is_developer     = 1 WHERE developer_status = 'active';

-- 3) group_developer_applications の承認済みも開発者フラグへ移行する(統合のため)。
UPDATE group_memberships
   SET is_developer = 1
 WHERE EXISTS (
       SELECT 1 FROM group_developer_applications d
        WHERE d.user_id = group_memberships.user_id
          AND d.group_id = group_memberships.group_id
          AND d.status = 'approved'
   );

-- 4) 汎用の権限申請フロー。member が不足している権限(group_admin/billing_admin/developer)を
--    申請し、決裁権者またはシステム管理者が承認/却下する。
CREATE TABLE IF NOT EXISTS role_applications (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     TEXT NOT NULL,
    group_id    TEXT NOT NULL,
    role_type   TEXT NOT NULL,                       -- 'group_admin' / 'billing_admin' / 'developer'
    status      TEXT NOT NULL DEFAULT 'pending',     -- 'pending' / 'approved' / 'rejected'
    reason      TEXT,                                -- 申請理由(申請者コメント)
    admin_reason TEXT,                               -- 却下理由など(承認者コメント)
    approver_id TEXT,                                -- 承認/却下したユーザーID
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_role_applications_group_status ON role_applications(group_id, status);
CREATE INDEX IF NOT EXISTS idx_role_applications_user ON role_applications(user_id);
