-- Migration: 決裁権者(billing_admin)の sudo パスワードと昇格状態。
-- 適用(ローカル): npx wrangler d1 execute tobira-mock-db --local --file ./migrations/0012_billing_password.sql
-- 適用(本番): npx wrangler d1 execute tobira-mock-db --remote --file ./migrations/0012_billing_password.sql

-- グループに紐づく「決裁権者パスワード」(bcrypt ハッシュ)。NULL=未設定。
-- 初期設定/リセットは運営(/admin/am/groups)が行い、ローテーションは決裁権者本人が現パスワードで行う。
ALTER TABLE groups ADD COLUMN billing_password_hash TEXT;

-- 決裁権者の短命な昇格(sudo)状態。利用枠の開放・分配・取消の直前にパスワードで昇格し、
-- expires_at までの間は再入力なしで予算操作できる。(user, group) 単位。
CREATE TABLE IF NOT EXISTS billing_elevations (
    user_id    TEXT NOT NULL,
    group_id   TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, group_id)
);
