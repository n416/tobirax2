-- マイグレーション: アカウントマネージャ(権限/グループ/サービス管理)の先行実装。
--
-- 位置づけ:
--   Taisei-DaaS 将来像の「権限データ層」を、現行 OIDC IdP を壊さず **追加(additive)** で導入する。
--   既存テーブル(users / permissions / group_permissions / apps 等)には触れない。
--   既存 users / groups を流用し、groups に親子階層(parent_id)を足し、新しい権限テーブルを追加する。
--   認証は当面現行のまま。auth0_user_id / system_role は将来(Auth0移行時)に追加する。
--   設計詳細は memory: taisei-daas-domain-model.md / リポジトリ直下 schema-v2-daas.sql を参照。
--
-- 注意: SQLite には "ADD COLUMN IF NOT EXISTS" が無いため、ALTER の二重実行は
--   "duplicate column name" で落ちる(想定内・無害)。CREATE 側は IF NOT EXISTS で冪等。
--
-- 適用(ローカル):  npx wrangler d1 execute tobira-mock-db --local  --file ./migrations/0004_account_manager.sql
-- 適用(リモート):  npx wrangler d1 execute tobira-mock-db --remote --file ./migrations/0004_account_manager.sql

-- 既存 groups に親子階層を追加(最上位は NULL、groups(id) を参照する想定)。
ALTER TABLE groups ADD COLUMN parent_id TEXT;

-- 【グループ所属】誰が・どのグループに・どの役割で・いつからいつまで(多対多)。
CREATE TABLE IF NOT EXISTS group_memberships (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    TEXT NOT NULL REFERENCES users(id),
    group_id   TEXT NOT NULL REFERENCES groups(id),
    role       TEXT NOT NULL DEFAULT 'member',   -- 'group_admin' / 'member'(グループ内権限)
    valid_from INTEGER NOT NULL,
    valid_to   INTEGER NOT NULL,
    UNIQUE(user_id, group_id)
);

-- 【サービス提供企業】点検会社・清掃会社など。
CREATE TABLE IF NOT EXISTS service_providers (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

-- 【サービス】提供されるサービスそのもの(点検・清掃 …)。
CREATE TABLE IF NOT EXISTS services (
    id          TEXT PRIMARY KEY,
    provider_id TEXT NOT NULL REFERENCES service_providers(id),
    name        TEXT NOT NULL,
    created_at  INTEGER NOT NULL
);

-- 【サービス契約】利用枠(ゲート②)の出所。席数上限(ライセンス枚数)を持つ。
CREATE TABLE IF NOT EXISTS service_contracts (
    id                TEXT PRIMARY KEY,
    service_id        TEXT NOT NULL REFERENCES services(id),
    customer_group_id TEXT NOT NULL REFERENCES groups(id),  -- 契約した組織(通常は最上位グループ)
    seat_limit        INTEGER,                              -- 席数上限。NULL=無制限
    valid_from        INTEGER NOT NULL,
    valid_to          INTEGER NOT NULL
);

-- 【グループ利用枠 / ゲート②】契約を各グループノードへ明示開放(親→子の自動継承なし)。
CREATE TABLE IF NOT EXISTS group_service_grants (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id    TEXT NOT NULL REFERENCES groups(id),
    service_id  TEXT NOT NULL REFERENCES services(id),
    contract_id TEXT NOT NULL REFERENCES service_contracts(id),  -- どの契約から開放したか
    seat_limit  INTEGER,    -- 支店別サブ枠(任意・将来)。NULL=契約の総枠に従う
    valid_from  INTEGER NOT NULL,
    valid_to    INTEGER NOT NULL,
    UNIQUE(group_id, service_id)
);

-- 【施設(建物)】施設ID=1:1で施設構造物番号に対応。管理する支店を持つ。
CREATE TABLE IF NOT EXISTS facilities (
    id                TEXT PRIMARY KEY,            -- ポータル採番の安定した施設ID
    structure_no      TEXT,                       -- 施設構造物番号(1:N)
    building_use      TEXT,                       -- 建物用途/種別(オフィス/病院/工場 …)役割メニュー絞り込みに使う
    managing_group_id TEXT NOT NULL REFERENCES groups(id),  -- 管理する支店
    created_at        INTEGER NOT NULL
);

-- 【サービス役割マスタ】サービス×施設種別で「選べる役割」を定義するメニュー。
CREATE TABLE IF NOT EXISTS service_role_master (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id    TEXT NOT NULL REFERENCES services(id),
    facility_type TEXT,                  -- NULL=全種別 / '病院' 等で限定
    role_name     TEXT NOT NULL,         -- 例: 点検管理者 / 点検作業者 / 院内立会者
    UNIQUE(service_id, facility_type, role_name)
);

-- 【サービス利用者割当 / ゲート③】個人を建物ごとにサービスへ割当+役割(マスタ参照)。
CREATE TABLE IF NOT EXISTS service_user_assignments (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         TEXT NOT NULL REFERENCES users(id),
    group_id        TEXT NOT NULL REFERENCES groups(id),       -- どのグループの立場として
    service_id      TEXT NOT NULL REFERENCES services(id),
    facility_id     TEXT NOT NULL REFERENCES facilities(id),   -- 対象の建物
    service_role_id INTEGER NOT NULL REFERENCES service_role_master(id),  -- 役割(マスタ参照)
    valid_from      INTEGER NOT NULL,
    valid_to        INTEGER NOT NULL,
    UNIQUE(user_id, group_id, service_id, facility_id)
);

-- 【施設外部コード対応】★将来・Tasei-DaaS等の外部連携時に使用★
-- 外部サービスごとに異なる設備識別コードを安定した施設IDへ翻訳する。
CREATE TABLE IF NOT EXISTS facility_external_codes (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    facility_id   TEXT NOT NULL REFERENCES facilities(id),
    service_id    TEXT NOT NULL REFERENCES services(id),
    external_code TEXT NOT NULL,
    UNIQUE(service_id, external_code)
);

-- 検索用インデックス(アクセス判定チェーンの引き当てを速くする)
CREATE INDEX IF NOT EXISTS idx_membership_user    ON group_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_membership_group   ON group_memberships(group_id);
CREATE INDEX IF NOT EXISTS idx_grant_group        ON group_service_grants(group_id);
CREATE INDEX IF NOT EXISTS idx_assign_user        ON service_user_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_assign_facility    ON service_user_assignments(facility_id);
CREATE INDEX IF NOT EXISTS idx_facility_group     ON facilities(managing_group_id);
CREATE INDEX IF NOT EXISTS idx_rolemaster_service ON service_role_master(service_id);
CREATE INDEX IF NOT EXISTS idx_groups_parent      ON groups(parent_id);
