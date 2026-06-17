-- ============================================================
-- Taisei-DaaS 権限基盤 新スキーマ（ガラガラポン版 v2）【設計ドラフト・未適用】
--
-- 位置づけ:
--   現行 schema.sql（OIDC IdP）を「ガラガラポン」で作り直す対象の設計案。
--   本番はサンプルデータのみのため移行不要。まだ本番には適用しない。
--   ドメインモデルの詳細は memory の taisei-daas-domain-model.md を参照。
--
-- 方針:
--   - D1 / SQLite。識別子=英語、コメント=日本語。
--   - 認証は Auth0 が担当（確定）。本システムはパスワードを持たず、ユーザーは
--     Auth0 の認証主体（auth0_user_id）に紐づく。「ユーザー・組織・権限・割当」を担う。
--   - 権限は3スコープ: システム内 / グループ内 / サービス内。
--   - アクセスは3ゲート全通過で成立（すべて明示割当・自動継承なし）:
--       ① group_memberships → ② group_service_grants → ③ service_user_assignments
-- ============================================================

-- 【ユーザー】認証は Auth0。ここは主体（誰か）とシステム内権限を持つだけ。
CREATE TABLE users (
    id            TEXT PRIMARY KEY,
    auth0_user_id TEXT UNIQUE NOT NULL,   -- Auth0 の認証主体への参照（パスワードは持たない）
    email         TEXT,
    display_name  TEXT,
    -- システム内権限: 'system_admin'(運営者) / 'user'(一般)
    system_role   TEXT NOT NULL DEFAULT 'user',
    created_at    INTEGER NOT NULL,
    updated_at    INTEGER NOT NULL
);

-- 【グループ】組織と支店。親子で階層（ツリー）を作る。
CREATE TABLE groups (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    parent_id  TEXT REFERENCES groups(id),  -- 親グループ（最上位は NULL）
    created_at INTEGER NOT NULL
);

-- 【グループ所属】誰が・どのグループに・どの役割で・いつからいつまで（多対多）。
CREATE TABLE IF NOT EXISTS group_memberships (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    TEXT NOT NULL REFERENCES users(id),
    group_id   TEXT NOT NULL REFERENCES groups(id),
    role       TEXT NOT NULL DEFAULT 'member',   -- 'group_admin' / 'member'(グループの権限)
    valid_from INTEGER NOT NULL,
    valid_to   INTEGER NOT NULL,
    UNIQUE(user_id, group_id)
);

-- 【グループ開発者申請】グループ管琁E老EE開発者権限の申請状態(独立したライフサイクルを持つ)
CREATE TABLE IF NOT EXISTS group_developer_applications (
    user_id    TEXT NOT NULL REFERENCES users(id),
    group_id   TEXT NOT NULL REFERENCES groups(id),
    status     TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    reason     TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY(user_id, group_id)
);

-- 【サービス提供企業】点検会社・清掃会社など。
CREATE TABLE service_providers (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

-- 【サービス】提供されるサービスそのもの（点検・清掃 …）。
CREATE TABLE services (
    id          TEXT PRIMARY KEY,
    provider_id TEXT NOT NULL REFERENCES service_providers(id),
    name        TEXT NOT NULL,
    created_at  INTEGER NOT NULL
);

-- 【サービス契約】提供企業と顧客組織の契約。利用枠(ゲート②)の出所。席数上限を持つ。
CREATE TABLE service_contracts (
    id                TEXT PRIMARY KEY,
    service_id        TEXT NOT NULL REFERENCES services(id),
    customer_group_id TEXT NOT NULL REFERENCES groups(id),  -- 契約した組織（通常は最上位グループ）
    seat_limit        INTEGER,                              -- 席数上限（ライセンス枚数）。NULL=無制限
    valid_from        INTEGER NOT NULL,
    valid_to          INTEGER NOT NULL
);

-- 【グループ利用枠 / ゲート②】契約を、組織内の各グループノードへ「明示的に」開放する。
-- 親に開放しても子へは自動継承しない（ノード毎に行を作る）。
CREATE TABLE group_service_grants (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id    TEXT NOT NULL REFERENCES groups(id),
    service_id  TEXT NOT NULL REFERENCES services(id),
    contract_id TEXT NOT NULL REFERENCES service_contracts(id),  -- どの契約から開放したか
    seat_limit  INTEGER,    -- 支店別サブ枠（任意・将来）。NULL=契約の総枠に従う
    valid_from  INTEGER NOT NULL,
    valid_to    INTEGER NOT NULL,
    UNIQUE(group_id, service_id)
);

-- 【施設（建物）】施設ID=1:1で施設構造物番号に対応。管理する支店を持つ。
CREATE TABLE facilities (
    id                TEXT PRIMARY KEY,            -- ポータル採番の安定した施設ID
    structure_no      TEXT,                       -- 施設構造物番号（1:N）
    building_use      TEXT,                       -- 建物用途/種別（オフィス/病院/工場 …）役割メニューの絞り込みに使う
    managing_group_id TEXT NOT NULL REFERENCES groups(id),  -- 管理する支店
    created_at        INTEGER NOT NULL
);

-- 【サービス役割マスタ】サービス×施設種別で「選べる役割」を定義するメニュー。
-- facility_type が NULL = そのサービスで常に出る役割。種別指定 = その用途の建物でのみ追加。
CREATE TABLE service_role_master (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id    TEXT NOT NULL REFERENCES services(id),
    facility_type TEXT,                  -- NULL=全種別 / '病院' 等で限定
    role_code     TEXT NOT NULL DEFAULT 'general',
    role_name     TEXT NOT NULL,
    UNIQUE(service_id, facility_type, role_code)
);

-- 【サービス利用者割当 / ゲート③】個人を「建物ごと」にサービスへ割り当て、役割を付ける。
-- role はマスタを参照（自由入力にしない）。
CREATE TABLE service_user_assignments (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         TEXT NOT NULL REFERENCES users(id),
    group_id        TEXT NOT NULL REFERENCES groups(id),       -- どのグループの立場として
    service_id      TEXT NOT NULL REFERENCES services(id),
    facility_id     TEXT REFERENCES facilities(id),   -- 対象の建物
    service_role_id INTEGER REFERENCES service_role_master(id),  -- 役割（マスタ参照）
    valid_from      INTEGER NOT NULL,
    valid_to        INTEGER NOT NULL,
    UNIQUE(user_id, group_id, service_id, facility_id)
);

-- 【施設外部コード対応】★将来・Tasei-DaaS等の外部連携時に実装★
-- 外部サービスごとに異なる設備識別コード（例 点検=TKB-001, 清掃=MARU-7F）を施設IDへ翻訳する。
-- 権限ロジックには不要だが「この表が要る」という要件は確定。
CREATE TABLE facility_external_codes (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    facility_id   TEXT NOT NULL REFERENCES facilities(id),
    service_id    TEXT NOT NULL REFERENCES services(id),
    external_code TEXT NOT NULL,         -- 外部システム側の設備/建物コード
    UNIQUE(service_id, external_code)
);

-- 検索用インデックス（アクセス判定チェーンの引き当てを速くする）
CREATE INDEX idx_membership_user    ON group_memberships(user_id);
CREATE INDEX idx_membership_group   ON group_memberships(group_id);
CREATE INDEX idx_grant_group        ON group_service_grants(group_id);
CREATE INDEX idx_assign_user        ON service_user_assignments(user_id);
CREATE INDEX idx_assign_facility    ON service_user_assignments(facility_id);
CREATE INDEX idx_facility_group     ON facilities(managing_group_id);
CREATE INDEX idx_rolemaster_service ON service_role_master(service_id);
