-- 開発者申請に対する管理者の却下・はく奪事由を記録するカラムを追加
ALTER TABLE group_developer_applications ADD COLUMN admin_reason TEXT;
