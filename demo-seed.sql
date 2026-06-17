-- =========================================================================
-- Tobira デモ環境用 シードデータ
-- =========================================================================
-- 実行前に既存のデータベースのデータはスキーマ再作成などでクリアされる前提。
-- パスワードはすべて "admin1234" に設定されています。
-- ハッシュ値: $2a$10$CdCjv9kCZIp8MwXbVSZ48uSCIxCpjd4MC8TLLSyRZy6CHya9B5vqW
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. グループ (3段のヒエラルキー)
-- -------------------------------------------------------------------------
-- G1: 本社 (Root)
INSERT INTO groups (id, name, created_at, parent_id)
VALUES ('g-root', '本社', 1700000000, NULL);

-- G2: 開発部門 (Middle)
INSERT INTO groups (id, name, created_at, parent_id)
VALUES ('g-middle', '開発部門', 1700000000, 'g-root');

-- G3: 第一開発チーム (Leaf)
INSERT INTO groups (id, name, created_at, parent_id)
VALUES ('g-leaf', '第一開発チーム', 1700000000, 'g-middle');

-- -------------------------------------------------------------------------
-- 2. ユーザー
-- -------------------------------------------------------------------------
INSERT INTO users (id, email, password_hash, created_at, updated_at, name)
VALUES
  ('u-admin', 'admin@example.com', '$2a$10$CdCjv9kCZIp8MwXbVSZ48uSCIxCpjd4MC8TLLSyRZy6CHya9B5vqW', 1700000000, 1700000000, 'グローバル管理者'),
  ('u-g-all', 'g_admin_all@example.com', '$2a$10$CdCjv9kCZIp8MwXbVSZ48uSCIxCpjd4MC8TLLSyRZy6CHya9B5vqW', 1700000000, 1700000000, 'G管理者(全権限)'),
  ('u-g-billing', 'g_admin_billing@example.com', '$2a$10$CdCjv9kCZIp8MwXbVSZ48uSCIxCpjd4MC8TLLSyRZy6CHya9B5vqW', 1700000000, 1700000000, 'G管理者(決済のみ)'),
  ('u-g-dev', 'g_admin_dev@example.com', '$2a$10$CdCjv9kCZIp8MwXbVSZ48uSCIxCpjd4MC8TLLSyRZy6CHya9B5vqW', 1700000000, 1700000000, 'G管理者(開発のみ)'),
  ('u-g-basic', 'g_admin_basic@example.com', '$2a$10$CdCjv9kCZIp8MwXbVSZ48uSCIxCpjd4MC8TLLSyRZy6CHya9B5vqW', 1700000000, 1700000000, 'G管理者(素)'),
  ('u-member', 'member_user@example.com', '$2a$10$CdCjv9kCZIp8MwXbVSZ48uSCIxCpjd4MC8TLLSyRZy6CHya9B5vqW', 1700000000, 1700000000, '一般メンバー');

-- -------------------------------------------------------------------------
-- 3. グローバル管理者権限
-- -------------------------------------------------------------------------
INSERT INTO admins (email, created_at)
VALUES ('admin@example.com', 1700000000);

-- -------------------------------------------------------------------------
-- 4. グループ所属とロール
-- -------------------------------------------------------------------------
-- g_admin_all: G2 (開発部門) の全権限持ち管理者
INSERT INTO group_memberships (user_id, group_id, role, valid_from, valid_to, is_group_admin, is_billing_admin, is_developer, developer_status)
VALUES ('u-g-all', 'g-middle', 'member', 0, 9999999999, 1, 1, 1, 'approved');

-- g_admin_billing: G2 (開発部門) の決済権限のみ持つ管理者
INSERT INTO group_memberships (user_id, group_id, role, valid_from, valid_to, is_group_admin, is_billing_admin, is_developer, developer_status)
VALUES ('u-g-billing', 'g-middle', 'member', 0, 9999999999, 1, 1, 0, 'none');

-- g_admin_dev: G2 (開発部門) の開発権限のみ持つ管理者
INSERT INTO group_memberships (user_id, group_id, role, valid_from, valid_to, is_group_admin, is_billing_admin, is_developer, developer_status)
VALUES ('u-g-dev', 'g-middle', 'member', 0, 9999999999, 1, 0, 1, 'approved');

-- g_admin_basic: G2 (開発部門) の素の管理者
INSERT INTO group_memberships (user_id, group_id, role, valid_from, valid_to, is_group_admin, is_billing_admin, is_developer, developer_status)
VALUES ('u-g-basic', 'g-middle', 'member', 0, 9999999999, 1, 0, 0, 'none');

-- member_user: G3 (第一開発チーム) の一般メンバー
INSERT INTO group_memberships (user_id, group_id, role, valid_from, valid_to, is_group_admin, is_billing_admin, is_developer, developer_status)
VALUES ('u-member', 'g-leaf', 'member', 0, 9999999999, 0, 0, 0, 'none');

-- -------------------------------------------------------------------------
-- 5. サービス提供企業・サービス
-- -------------------------------------------------------------------------
-- デモ用の提供企業
INSERT INTO service_providers (id, name, created_at)
VALUES ('prov-demo', '株式会社デモ (G2開発部門提供)', 1700000000);

-- サービス: 「社内ポータルサービス」(G2所有)
INSERT INTO services (id, provider_id, name, created_at, owner_group_id, status)
VALUES ('svc-portal', 'prov-demo', '社内ポータルサービス', 1700000000, 'g-middle', 'active');

-- -------------------------------------------------------------------------
-- 6. アプリ (G2の開発者が登録した想定)
-- -------------------------------------------------------------------------
-- アプリ1: ユーザー登録アプリ
INSERT INTO apps (id, name, base_url, status, created_at, client_secret, owner_group_id)
VALUES ('app-user-reg', 'ユーザー登録アプリ', 'http://localhost:3000', 'active', 1700000000, 'secret-user-reg-123', 'g-middle');

-- アプリ2: 社内Wikiアプリ
INSERT INTO apps (id, name, base_url, status, created_at, client_secret, owner_group_id)
VALUES ('app-wiki', '社内Wikiアプリ', 'http://localhost:3001', 'active', 1700000000, 'secret-wiki-123', 'g-middle');

-- -------------------------------------------------------------------------
-- 7. サービスとアプリの紐づけ
-- -------------------------------------------------------------------------
-- 「社内ポータルサービス」に2つのアプリを含める
INSERT INTO service_apps (service_id, app_id, created_at)
VALUES 
  ('svc-portal', 'app-user-reg', 1700000000),
  ('svc-portal', 'app-wiki', 1700000000);

-- -------------------------------------------------------------------------
-- 8. 権限 (一般メンバーがアプリを利用できるようにする例)
-- -------------------------------------------------------------------------
-- ユーザー単位での直接権限付与
INSERT INTO permissions (user_id, app_id, valid_from, valid_to, created_at)
VALUES 
  ('u-member', 'app-user-reg', 0, 9999999999, 1700000000),
  ('u-member', 'app-wiki', 0, 9999999999, 1700000000);

-- G2管理者(全権限) もアクセス可能に
INSERT INTO permissions (user_id, app_id, valid_from, valid_to, created_at)
VALUES 
  ('u-g-all', 'app-user-reg', 0, 9999999999, 1700000000),
  ('u-g-all', 'app-wiki', 0, 9999999999, 1700000000);

-- -------------------------------------------------------------------------
-- 9. 自社サービスのルート契約と直系経路上の利用枠
-- -------------------------------------------------------------------------
-- svc-portal の所有者は g-middle。そのルートは g-root。
INSERT INTO service_contracts (id, service_id, customer_group_id, seat_limit, valid_from, valid_to)
VALUES ('ct-implicit-portal', 'svc-portal', 'g-root', NULL, 0, 2147483647);

INSERT INTO group_service_grants (group_id, service_id, contract_id, seat_limit, valid_from, valid_to)
VALUES 
  ('g-root', 'svc-portal', 'ct-implicit-portal', NULL, 0, 2147483647),
  ('g-middle', 'svc-portal', 'ct-implicit-portal', NULL, 0, 2147483647);

-- -------------------------------------------------------------------------
-- 10. 施設 (Facilities)
-- -------------------------------------------------------------------------
INSERT INTO facilities (id, structure_no, building_use, managing_group_id, created_at)
VALUES 
  ('fac-demo-1', 'Bldg-A', 'オフィス', 'g-middle', 1700000000);
