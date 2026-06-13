-- Local-only test fixtures for the OIDC live test / examples.
-- Login: tester@example.com / admin1234  (password_hash is bcrypt of admin1234)
INSERT OR REPLACE INTO users (id, email, password_hash, created_at, updated_at)
  VALUES ('u-test-1', 'tester@example.com',
          '$2a$10$CdCjv9kCZIp8MwXbVSZ48uSCIxCpjd4MC8TLLSyRZy6CHya9B5vqW',
          1700000000, 1700000000);

-- Make the test user an admin too (so /admin is reachable).
INSERT OR IGNORE INTO admins (email) VALUES ('tester@example.com');

-- Relying party registered as an app: id == client_id, base_url == redirect_uri prefix.
-- client_secret set => confidential client (the example sends this secret).
INSERT OR REPLACE INTO apps (id, name, base_url, status, created_at, client_secret)
  VALUES ('app-test-1', 'Test Client', 'http://localhost:3000', 'active', 1700000000,
          'test-secret-abc123');

INSERT OR REPLACE INTO permissions (user_id, app_id, valid_from, valid_to, created_at)
  VALUES ('u-test-1', 'app-test-1', 0, 9999999999, 1700000000);

-- Pre-seeded IdP session (handy for headless/curl testing without a browser).
INSERT OR REPLACE INTO sessions (id, user_id, expires_at)
  VALUES ('sess-test-1', 'u-test-1', 9999999999);
