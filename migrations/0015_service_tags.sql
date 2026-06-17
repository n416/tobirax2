DROP TABLE IF EXISTS app_tags;

CREATE TABLE IF NOT EXISTS service_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id TEXT NOT NULL REFERENCES services(id),
    tag_id TEXT NOT NULL REFERENCES tags(id),
    -- 'active': 紐付け済み, 'pending': 申請待ち, 'rejected': 却下
    status TEXT DEFAULT 'active',
    -- 申請したグループ（NULLの場合はシステム管理者が紐付け）
    requesting_group_id TEXT REFERENCES groups(id),
    created_at INTEGER NOT NULL,
    UNIQUE(service_id, tag_id)
);
