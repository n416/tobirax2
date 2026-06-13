-- Local-only test fixtures for the OIDC live test.
INSERT OR REPLACE INTO users (id, email, password_hash, created_at, updated_at)
  VALUES ('u-test-1', 'tester@example.com', 'x', 1700000000, 1700000000);

INSERT OR REPLACE INTO apps (id, name, base_url, status, created_at)
  VALUES ('app-test-1', 'Test Client', 'http://localhost:3000', 'active', 1700000000);

INSERT OR REPLACE INTO permissions (user_id, app_id, valid_from, valid_to, created_at)
  VALUES ('u-test-1', 'app-test-1', 0, 9999999999, 1700000000);

INSERT OR REPLACE INTO sessions (id, user_id, expires_at)
  VALUES ('sess-test-1', 'u-test-1', 9999999999);
