-- ユーザーと認証
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    group_id TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    two_factor_secret TEXT,
    recovery_codes TEXT,
    -- OIDC profile スコープのクレーム(NULL の場合はトークン発行時に email にフォールバック)
    name TEXT,
    preferred_username TEXT,
    picture TEXT,
    email_verified INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    -- OIDC: エンドユーザーが実際に認証した時刻(unix秒)。id_token の auth_time と
    -- max_age / prompt=login の再認証判定を駆動する。
    auth_time INTEGER
);

CREATE TABLE IF NOT EXISTS admins (
    email TEXT PRIMARY KEY,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- アプリと権限
CREATE TABLE IF NOT EXISTS apps (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    base_url TEXT NOT NULL,
    -- 'active'(稼働) / 'inactive'(停止) / 'pending'(グループ管理者の登録申請待ち) /
    -- 'rejected'(却下)。'active' 以外は checkPermission で利用不可・ダッシュボード非表示。
    status TEXT DEFAULT 'active',
    reason TEXT,
    icon_url TEXT,
    description TEXT,
    created_at INTEGER NOT NULL,
    -- OIDC: NULL = パブリッククライアント(PKCE必須)、値あり = 機密クライアント
    client_secret TEXT,
    -- OIDC: 完全一致 redirect_uris の改行区切りリスト。値があれば redirect_uri は
    -- いずれかと完全一致しなければならない(仕様準拠)。NULL/空なら base_url の
    -- オリジン照合にフォールバック(旧方式)。
    redirect_uris TEXT,
    -- OIDC Back-Channel Logout 1.0: RP のログアウトエンドポイント。値があれば /oidc/logout が
    -- 署名付き logout_token をここへ POST し、RP 側も自身のセッションを破棄できる。
    backchannel_logout_uri TEXT,
    -- ダッシュボードのアプリ起動時にブラウザを送るRP側のログイン開始URL。未設定なら base_url にフォールバック
    initiate_login_uri TEXT,
    -- セルフサービス: このアプリ(クライアント)を申請/所有するグループ。NULL = 運営者が
    -- 直接作った従来のグローバルアプリ。group_admin は自分の管理サブツリーが owner の
    -- アプリだけを操作でき、status='pending' のアプリは運営者の承諾(=status='active')を待つ。
    owner_group_id TEXT REFERENCES groups(id)
);

-- タグ管理
CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    -- 'active': 利用可能, 'pending': 申請待ち(システム管理者の承認待ち), 'rejected': 却下
    status TEXT DEFAULT 'active',
    -- 申請したグループ（NULLの場合はシステム管理者が作成）
    owner_group_id TEXT REFERENCES groups(id),
    created_at INTEGER NOT NULL
);

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

CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    -- アカウントマネージャ: 親子階層(最上位は NULL)。groups(id) を参照。
    parent_id TEXT,
    -- 決裁権者(billing_admin)の sudo パスワード(bcrypt)。NULL=未設定。利用枠操作の昇格に使う。
    billing_password_hash TEXT
);

-- 【決裁権者の昇格(sudo)状態】利用枠の開放・分配・取消の直前にグループの決裁権者パスワードで
-- 昇格し、expires_at までは再入力なしで予算操作できる。(user, group) 単位。
CREATE TABLE IF NOT EXISTS billing_elevations (
    user_id    TEXT NOT NULL,
    group_id   TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, group_id)
);

CREATE TABLE IF NOT EXISTS permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    app_id TEXT NOT NULL,
    valid_from INTEGER NOT NULL,
    valid_to INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    UNIQUE(user_id, app_id)
);

CREATE TABLE IF NOT EXISTS group_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id TEXT NOT NULL,
    app_id TEXT NOT NULL,
    valid_from INTEGER NOT NULL,
    valid_to INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    UNIQUE(group_id, app_id)
);

-- OIDC / API フロー
CREATE TABLE IF NOT EXISTS auth_codes (
    code TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    app_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    used_at INTEGER,
    -- OIDC 認可リクエストのコンテキスト(code -> token へ引き継ぐ)
    nonce TEXT,
    code_challenge TEXT,
    code_challenge_method TEXT,
    redirect_uri TEXT,
    scope TEXT,
    -- OIDC: セッションから引き継いだエンドユーザーの auth_time。発行される id_token が
    -- (トークン発行時ではなく)ユーザーが実際に認証した時刻を反映するようにする。
    auth_time INTEGER
);

CREATE TABLE IF NOT EXISTS app_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT NOT NULL,
    refresh_token TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL,
    app_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    -- このトークンに付与された OIDC scope(userinfo が返すクレームを決める)
    scope TEXT,
    -- OIDC: エンドユーザーの auth_time。更新をまたいで保持し、再発行される id_token が
    -- 元の認証時刻を保つようにする。
    auth_time INTEGER
);

-- OIDC 動的クライアント登録(RFC 7591): 管理者が発行する Initial Access Token。
-- 呼び出し元は POST /register 時に Bearer トークンとしてこれを提示しなければならない。
CREATE TABLE IF NOT EXISTS registration_tokens (
    token TEXT PRIMARY KEY,
    created_by TEXT,                 -- 発行した管理者のメール
    created_at INTEGER NOT NULL,
    expires_at INTEGER               -- NULL = 無期限(削除して失効させる)
);

-- 管理機能
CREATE TABLE IF NOT EXISTS invitations (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    invited_by TEXT NOT NULL,
    expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS password_resets (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    details TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- システム設定(新規)
CREATE TABLE IF NOT EXISTS system_config (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- 固定ウィンドウのレート制限(IP別のログイン/新規登録スロットリング)
CREATE TABLE IF NOT EXISTS rate_limits (
    k TEXT PRIMARY KEY,
    count INTEGER NOT NULL,
    reset_at INTEGER NOT NULL
);

-- パフォーマンス用インデックス
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_permissions_user ON permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_group_perms_group ON group_permissions(group_id);
CREATE INDEX IF NOT EXISTS idx_logs_created ON audit_logs(created_at);

-- ============================================================
-- アカウントマネージャ（権限/グループ/サービス管理） ※先行実装・現行IdPとは別レイヤ
-- 認証は当面現行のまま。将来 Auth0 移行時に auth0_user_id / system_role 等を追加予定。
-- 設計詳細: schema-v2-daas.sql / memory:taisei-daas-domain-model.md。
-- 既存DBへの追加は migrations/0004_account_manager.sql。
-- ============================================================

-- 【グループ所属】誰が・どのグループに・どの役割で・いつからいつまで(多対多)。
CREATE TABLE IF NOT EXISTS group_memberships (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    TEXT NOT NULL REFERENCES users(id),
    group_id   TEXT NOT NULL REFERENCES groups(id),
    role       TEXT NOT NULL DEFAULT 'member',
    valid_from INTEGER NOT NULL,
    valid_to   INTEGER NOT NULL,
    developer_status TEXT NOT NULL DEFAULT 'none',
    developer_reason TEXT,
    is_group_admin INTEGER NOT NULL DEFAULT 0,
    is_billing_admin INTEGER NOT NULL DEFAULT 0,
    is_developer INTEGER NOT NULL DEFAULT 0,
    UNIQUE(user_id, group_id)
);

-- 【権限申請フロー】メンバーが不足している権限を申請する
CREATE TABLE IF NOT EXISTS role_applications (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     TEXT NOT NULL REFERENCES users(id),
    group_id    TEXT NOT NULL REFERENCES groups(id),
    role_type   TEXT NOT NULL,                       -- 'group_admin' / 'billing_admin' / 'developer'
    status      TEXT NOT NULL DEFAULT 'pending',     -- 'pending' / 'approved' / 'rejected'
    reason      TEXT,                                -- 申請理由
    admin_reason TEXT,                               -- 承認/却下理由
    approver_id TEXT,                                -- 処理したユーザー
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_role_applications_group_status ON role_applications(group_id, status);
CREATE INDEX IF NOT EXISTS idx_role_applications_user ON role_applications(user_id);

-- 【グループ開発者申請】グループ管琁E老EE開発者権限の申請状態
CREATE TABLE IF NOT EXISTS group_developer_applications (
    user_id    TEXT NOT NULL REFERENCES users(id),
    group_id   TEXT NOT NULL REFERENCES groups(id),
    status     TEXT NOT NULL DEFAULT 'pending',
    reason     TEXT,
    admin_reason TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY(user_id, group_id)
);

-- 【サービス提供企業】
CREATE TABLE IF NOT EXISTS service_providers (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

-- 【サービス】
CREATE TABLE IF NOT EXISTS services (
    id          TEXT PRIMARY KEY,
    provider_id TEXT NOT NULL REFERENCES service_providers(id),
    name        TEXT NOT NULL,
    created_at  INTEGER NOT NULL,
    -- セルフサービス: この「サービス」を所有するグループ。NULL = 運営者が提供企業つきで
    -- 作ったグローバルサービス。group_admin が自グループ用に作ったサービスはここに owner を
    -- 刻み、提供企業は ensureGroupProvider でグループ名のダミー企業を自動採番する。
    owner_group_id TEXT REFERENCES groups(id),
    -- 'active'(承認済み/稼働) / 'pending'(承認待ち) / 'rejected'(却下)。
    -- グループ管理者が作成したサービスは pending で始まり、運営者の承認で active になる。
    status TEXT DEFAULT 'active',
    reason TEXT
);

-- 【サービス構成】サービス ―*:*― アプリ。承認済みアプリをサービスへ組み込む(多対多)。
-- アプリ↔サービス紐づけの単一の真実。旧来の apps.service_id は移行で本表に取り込む。
CREATE TABLE IF NOT EXISTS service_apps (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id TEXT NOT NULL REFERENCES services(id),
    app_id     TEXT NOT NULL REFERENCES apps(id),
    created_at INTEGER NOT NULL,
    UNIQUE(service_id, app_id)
);

-- 【サービス契約】利用枠(ゲート②)の出所。席数上限を持つ。
CREATE TABLE IF NOT EXISTS service_contracts (
    id                TEXT PRIMARY KEY,
    service_id        TEXT NOT NULL REFERENCES services(id),
    customer_group_id TEXT NOT NULL REFERENCES groups(id),
    seat_limit        INTEGER,
    valid_from        INTEGER NOT NULL,
    valid_to          INTEGER NOT NULL
);

-- 【グループ利用枠 / ゲート②】契約を各グループノードへ明示開放(自動継承なし)。
CREATE TABLE IF NOT EXISTS group_service_grants (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id    TEXT NOT NULL REFERENCES groups(id),
    service_id  TEXT NOT NULL REFERENCES services(id),
    contract_id TEXT NOT NULL REFERENCES service_contracts(id),
    seat_limit  INTEGER,
    valid_from  INTEGER NOT NULL,
    valid_to    INTEGER NOT NULL,
    UNIQUE(group_id, service_id)
);

-- 【施設(建物)】
-- 当システム（認証ポータル）は「論理的な施設（例: A棟、B棟）」のアクセス権限を管理する責務を持つ。
-- 物理的な工事履歴などの管理はコアシステムのドメインであるため、ポータル側は 1施設＝1レコード（1構造物番号） として扱う。
-- ※カンマ区切り等で複数の構造物番号を保持することはしない。
CREATE TABLE IF NOT EXISTS facilities (
    id                TEXT PRIMARY KEY,
    structure_no      TEXT,
    building_use      TEXT,
    managing_group_id TEXT NOT NULL REFERENCES groups(id),
    created_at        INTEGER NOT NULL
);

-- 【サービス役割マスタ】サービス×施設種別で選べる役割メニュー。
CREATE TABLE IF NOT EXISTS service_role_master (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id    TEXT NOT NULL REFERENCES services(id),
    facility_type TEXT,                  -- NULL=全種別 / '病院' 等で限定
    role_code     TEXT NOT NULL DEFAULT 'general',
    role_name     TEXT NOT NULL,
    UNIQUE(service_id, facility_type, role_code)
);

-- 【サービス利用者割当 / ゲート③】個人を建物ごとにサービスへ割当+役割(マスタ参照)。
CREATE TABLE IF NOT EXISTS service_user_assignments (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         TEXT NOT NULL REFERENCES users(id),
    group_id        TEXT NOT NULL REFERENCES groups(id),
    service_id      TEXT NOT NULL REFERENCES services(id),
    facility_id     TEXT REFERENCES facilities(id),
    service_role_id INTEGER REFERENCES service_role_master(id),
    valid_from      INTEGER NOT NULL,
    valid_to        INTEGER NOT NULL,
    UNIQUE(user_id, group_id, service_id, facility_id)
);

-- 【施設外部コード対応】★将来・外部連携時★ 設備コード↔施設ID翻訳。
CREATE TABLE IF NOT EXISTS facility_external_codes (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    facility_id   TEXT NOT NULL REFERENCES facilities(id),
    service_id    TEXT NOT NULL REFERENCES services(id),
    external_code TEXT NOT NULL,
    UNIQUE(service_id, external_code)
);

CREATE INDEX IF NOT EXISTS idx_membership_user    ON group_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_membership_group   ON group_memberships(group_id);
CREATE INDEX IF NOT EXISTS idx_grant_group        ON group_service_grants(group_id);
CREATE INDEX IF NOT EXISTS idx_assign_user        ON service_user_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_assign_facility    ON service_user_assignments(facility_id);
CREATE INDEX IF NOT EXISTS idx_facility_group     ON facilities(managing_group_id);
CREATE INDEX IF NOT EXISTS idx_rolemaster_service ON service_role_master(service_id);
CREATE INDEX IF NOT EXISTS idx_groups_parent      ON groups(parent_id);
CREATE INDEX IF NOT EXISTS idx_service_apps_service ON service_apps(service_id);
CREATE INDEX IF NOT EXISTS idx_service_apps_app     ON service_apps(app_id);
