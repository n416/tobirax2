-- OIDC ユーザー同意(consent)の記録。既存DBへの追加用。
-- fresh DB は schema.sql に含まれるため不要。
CREATE TABLE IF NOT EXISTS consents (
    user_id TEXT NOT NULL,
    app_id TEXT NOT NULL,
    scope TEXT NOT NULL,
    granted_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, app_id)
);
