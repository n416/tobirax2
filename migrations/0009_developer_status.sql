ALTER TABLE group_memberships ADD COLUMN developer_status TEXT NOT NULL DEFAULT 'none';
ALTER TABLE group_memberships ADD COLUMN developer_reason TEXT;
