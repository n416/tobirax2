CREATE TABLE IF NOT EXISTS recent_audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    details TEXT,
    user_id TEXT,
    app_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
);
