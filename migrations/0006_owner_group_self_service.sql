-- マイグレーション: グループ管理者によるセルフサービス
--   (アプリ登録「申請」→運営者「承諾」フロー / 自グループのサービス作成)。
--
-- 位置づけ:
--   ・apps.owner_group_id   = そのアプリ(OIDCクライアント)を申請/所有するグループ。
--                            NULL = 運営者が直接作った従来のグローバルアプリ。
--   ・services.owner_group_id = その「サービス」を所有するグループ。
--                            NULL = 運営者が提供企業つきで作ったグローバルサービス。
--   ・apps.status は従来の 'active'/'inactive' に加えて、申請待ちの 'pending'、
--     却下済みの 'rejected' を取りうる(列追加は不要・値の追加のみ)。
--     'active' 以外は checkPermission で利用不可・ダッシュボード非表示。
--
-- 「サービス」概念は本システム固有(Auth0には無い)であり、申請/承諾・サービス作成は
--   v1で本システムに実装する。memory: service-layer-is-ours-not-auth0.md 参照。
--
-- 注意: SQLite には "ADD COLUMN IF NOT EXISTS" が無いため、二重実行は
--   "duplicate column name" で落ちる(想定内・無害)。
--
-- 適用(ローカル):  npx wrangler d1 execute tobira-mock-db --local  --file ./migrations/0006_owner_group_self_service.sql
-- 適用(リモート):  npx wrangler d1 execute tobira-mock-db --remote --file ./migrations/0006_owner_group_self_service.sql

ALTER TABLE apps ADD COLUMN owner_group_id TEXT;
ALTER TABLE services ADD COLUMN owner_group_id TEXT;
