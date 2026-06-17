-- =========================================================================
-- Tobira データベース初期化 (イニシャライズクリア) スクリプト
-- =========================================================================
-- 既存のすべてのテーブルを削除します。
-- リモート環境などでクリーンな状態から再構築する際に利用します。

PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS apps;
DROP TABLE IF EXISTS groups;
DROP TABLE IF EXISTS billing_elevations;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS group_permissions;
DROP TABLE IF EXISTS auth_codes;
DROP TABLE IF EXISTS app_sessions;
DROP TABLE IF EXISTS registration_tokens;
DROP TABLE IF EXISTS invitations;
DROP TABLE IF EXISTS password_resets;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS system_config;
DROP TABLE IF EXISTS rate_limits;
DROP TABLE IF EXISTS group_memberships;
DROP TABLE IF EXISTS role_applications;
DROP TABLE IF EXISTS group_developer_applications;
DROP TABLE IF EXISTS service_providers;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS service_apps;
DROP TABLE IF EXISTS service_contracts;
DROP TABLE IF EXISTS group_service_grants;
DROP TABLE IF EXISTS facilities;
DROP TABLE IF EXISTS service_role_master;
DROP TABLE IF EXISTS service_user_assignments;
DROP TABLE IF EXISTS facility_external_codes;

-- SQLiteの自動インクリメントのリセット
DELETE FROM sqlite_sequence;

PRAGMA foreign_keys = ON;
