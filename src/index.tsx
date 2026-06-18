import { sign, verify } from 'hono/jwt'
import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { csrf } from 'hono/csrf'
import { html } from 'hono/html'
import { Env, User, App, Session, Permission, Group, AuthCode, SystemConfig, LocalizedText } from './types'
import { verifyPassword, hashPassword, generateToken, getCookieOptions, validatePassword, BCRYPT_COST, getBcryptCost, hashToken } from './utils/auth'
import { generateSecret, generateQRCode, verifyToken } from './utils/totp'
import { encryptSecret, decryptSecret } from './utils/secretbox'
import { sendEmail } from './utils/mail'
import { fetchAppIcon } from './utils/icon'
import { requireSecret } from './utils/env'
import { signRS256, verifyPkce, verifyRS256 } from './oidc/jwt'
import { getJwksKeys } from './oidc/keys'
import { Login } from './views/Login'
import { Signup } from './views/Signup'
import { UserDashboard } from './views/UserDashboard'
import { AccountPage } from './views/AccountPage'
import { Invite } from './views/Invite'
import { ForgotPassword } from './views/ForgotPassword'
import { ResetPassword } from './views/ResetPassword'
import { ChangePassword } from './views/ChangePassword'
import { Setup2FA } from './views/Setup2FA'
import { Login2FA } from './views/Login2FA'

import { GroupAdminPage } from './views/GroupAdminPage'
import { AdminHome } from './views/admin/AdminHome'
import { AppsPage } from './views/admin/AppsPage'
import { GroupsPage } from './views/admin/GroupsPage'
import { AccountGroupsPage } from './views/admin/AccountGroupsPage'
import { AccountServicesPage } from './views/admin/AccountServicesPage'

import { UsersPage } from './views/admin/UsersPage'
import { LogsPage } from './views/admin/LogsPage'

import { dict } from './i18n'

const app = new Hono<{ Bindings: Env }>()

// CSRF は HTML フォーム系ルートを保護する。OIDC のマシン向けエンドポイント
// (/oauth/token, /userinfo) や旧来の JSON API は SDK/バックエンドからクロスオリジンで
// 呼ばれるため除外する。/authorize は GET なのでそもそも csrf() の対象外。
// /oidc/logout は RP起点(本質的にクロスサイトで、OIDC RP-Initiated Logout に従い POST
// されることもある)。/oauth/revoke (RFC 7009) は RP バックエンドが呼ぶマシン向け
// エンドポイント。いずれも他の OIDC エンドポイント同様に除外する。
const oidcCsrfExempt = (path: string) =>
    path === '/oauth/token' || path === '/oauth/revoke' || path === '/oauth/introspect' ||
    path === '/userinfo' || path === '/oidc/logout' ||
    path.startsWith('/entitlements/')
app.use('*', async (c, next) => {
    if (oidcCsrfExempt(c.req.path)) return next()
    return csrf()(c, next)
})

export const getLang = (c: any) => {
    const accept = c.req.header('Accept-Language') || ''
    return accept.includes('ja') ? dict.ja : dict.en
}

export async function getSystemConfig(db: D1Database): Promise<SystemConfig> {
    const config: SystemConfig = {
        appName: { ja: 'Tobira', en: 'Tobira' },
        appSubtitle: { ja: 'Secure Identity Provider', en: 'Secure Identity Provider' }
    };
    try {
        const { results } = await db.prepare('SELECT * FROM system_config').all<{ key: string, value: string }>();
        if (results) {
            results.forEach(r => {
                if (r.key === 'app_name_ja') config.appName.ja = r.value;
                if (r.key === 'app_name_en') config.appName.en = r.value;
                if (r.key === 'app_subtitle_ja') config.appSubtitle.ja = r.value;
                if (r.key === 'app_subtitle_en') config.appSubtitle.en = r.value;
            });
        }
    } catch (e) {
        console.error('Config fetch failed:', e);
    }
    return config;
}

export function getLocalizedValue(c: any, text: LocalizedText): string {
    const accept = c.req.header('Accept-Language') || ''
    return accept.includes('ja') ? text.ja : text.en
}

// アイコンアップロード用ヘルパー
export async function handleIconUpload(body: any): Promise<string | null> {
    const file = body['icon_file'];
    if (file && file instanceof File && file.size > 0) {
        // D1 のサイズ上限チェック(安全マージン)
        if (file.size > 1024 * 150) {
            console.warn('Icon file too large:', file.size);
            return null; 
        }
        const buf = await file.arrayBuffer();
        let binary = '';
        const bytes = new Uint8Array(buf);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return `data:${file.type};base64,${btoa(binary)}`;
    }
    return null;
}

// ------------------------------------------------------------------
// 権限ロジック
// ------------------------------------------------------------------
export async function checkPermission(c: any, userId: string, appId: string): Promise<{ allowed: boolean, reason?: string }> {
    const now = Math.floor(Date.now() / 1000)

    const app = await c.env.DB.prepare('SELECT status FROM apps WHERE id = ?').bind(appId).first() as App | null
    // status が設定されていて 'active' 以外(inactive/pending/rejected)のアプリは利用不可。
    // pending(申請待ち)/rejected(却下)のアプリで OIDC フローやダッシュボードが進まないようにする。
    // status が NULL の旧アプリは active 扱いにフォールバック。
    if (app && app.status && app.status !== 'active') {
        return { allowed: false, reason: `App is ${app.status}` }
    }

    const userPerm = await c.env.DB.prepare('SELECT * FROM permissions WHERE user_id = ? AND app_id = ?')
        .bind(userId, appId).first() as Permission | null

    if (userPerm && userPerm.valid_from <= now && userPerm.valid_to >= now) return { allowed: true }

    const user = await c.env.DB.prepare('SELECT group_id FROM users WHERE id = ?').bind(userId).first() as User | null
    if (user && user.group_id) {
        const groupPerm = await c.env.DB.prepare('SELECT * FROM group_permissions WHERE group_id = ? AND app_id = ?')
            .bind(user.group_id, appId).first() as Permission | null
        if (groupPerm && groupPerm.valid_from <= now && groupPerm.valid_to >= now) return { allowed: true }
    }

    // サービス経由のエンタイトルメント(Account Manager 連携)
    const { results: serviceRows } = await c.env.DB.prepare(`
        SELECT a.service_id
        FROM service_user_assignments a
        JOIN group_memberships m ON m.user_id = a.user_id AND m.group_id = a.group_id AND m.valid_from <= ? AND m.valid_to >= ?
        JOIN services s ON s.id = a.service_id
        JOIN service_apps sa ON sa.service_id = s.id AND sa.app_id = ?
        LEFT JOIN group_service_grants gr ON gr.group_id = a.group_id AND gr.service_id = a.service_id AND gr.valid_from <= ? AND gr.valid_to >= ?
        WHERE a.user_id = ?
          AND a.valid_from <= ? AND a.valid_to >= ?
          AND (gr.id IS NOT NULL OR (s.owner_group_id = a.group_id AND s.status = 'active'))
        LIMIT 1
    `).bind(now, now, appId, now, now, userId, now, now).all()

    if (serviceRows && serviceRows.length > 0) {
        return { allowed: true }
    }

    return { allowed: false, reason: 'No permission found' }
}

// D1 を使ったキー別の固定ウィンドウ・レートリミッター。許可なら true を返す。
// (Cloudflare ネイティブの rate-limit バインディングはベストエフォート/結果整合で、
// ここでは確実に効いていなかったため、権威ある(authoritative)カウンタを自前で持つ。)
export async function rateLimit(db: D1Database, key: string, limit: number, windowSec: number): Promise<boolean> {
    const now = Math.floor(Date.now() / 1000)
    const resetAt = now + windowSec
    const row = await db.prepare(`
        INSERT INTO rate_limits (k, count, reset_at) VALUES (?, 1, ?)
        ON CONFLICT(k) DO UPDATE SET
            count = CASE WHEN ? >= rate_limits.reset_at THEN 1 ELSE rate_limits.count + 1 END,
            reset_at = CASE WHEN ? >= rate_limits.reset_at THEN ? ELSE rate_limits.reset_at END
        RETURNING count
    `).bind(key, resetAt, now, now, resetAt).first<{ count: number }>()

    if (row && row.count > limit) {
        return false
    }
    return true
}

export async function getAdmin(c: any) {
    const sessionId = getCookie(c, '__Host-idp_session')
    if (!sessionId) return null
    const hashedSessionId = await hashToken(sessionId)
    const session = await c.env.DB.prepare('SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?').bind(hashedSessionId, Math.floor(Date.now() / 1000)).first() as Session | null
    if (!session) return null
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(session.user_id).first() as User | null
    if (user?.email) {
        const admin = await c.env.DB.prepare('SELECT * FROM admins WHERE LOWER(email) = LOWER(?)').bind(user.email).first()
        return admin ? user : null
    }
    return null
}

export async function getUser(c: any) {
    const sessionId = getCookie(c, '__Host-idp_session')
    if (!sessionId) return null
    const hashedSessionId = await hashToken(sessionId)
    const session = await c.env.DB.prepare('SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?').bind(hashedSessionId, Math.floor(Date.now() / 1000)).first() as Session | null
    if (!session) return null
    return await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(session.user_id).first() as User | null
}

// ユーザー取得 + 委任管理ポータルへの導線判定をまとめて返す。ユーザー向け画面で共通利用。
//   group_admin(運用担当)だけでなく billing_admin(決済権者)もポータルを使うため、
//   どちらかのロールを持てばナビにポータルリンクを出す。
async function getUserCtx(c: any): Promise<{ user: User; isGroupAdmin: boolean } | null> {
    const user = await getUser(c)
    if (!user) return null
    const now = Math.floor(Date.now() / 1000)
    const ga = await c.env.DB.prepare(
        `SELECT 1 FROM group_memberships WHERE user_id = ? AND (is_group_admin = 1 OR is_billing_admin = 1) AND valid_from <= ? AND valid_to >= ? LIMIT 1`
    ).bind(user.id, now, now).first()
    return { user, isGroupAdmin: !!ga }
}

// 【委任管理の認可プリミティブ】ユーザーが管理できるグループID集合を返す。
//   = 自分が有効な group_admin として所属するグループ + その子孫(サブツリー)すべて。
//   「グループのツリーは管理の委任構造」という思想に従い、親グループの管理者は配下支店も管理できる。
//   (サービス利用権の自動継承なし=ゲート②③とは別レイヤ。これは"管理権限"の話で、委任構造はツリーで降りる。)
//   委任系の全エンドポイントはこの集合で「操作対象グループが配下か」を必ず検証する。
export async function getManagedGroupIds(c: any, userId: string): Promise<Set<string>> {
    const now = Math.floor(Date.now() / 1000)
    // 運用担当(group_admin)に加え、決済権者(billing_admin)も割当画面を操作できる。
    // どちらのロールも自分のグループ + その子孫(サブツリー)を管理対象に持つ。
    const { results: adminRows } = await c.env.DB.prepare(
        `SELECT group_id FROM group_memberships WHERE user_id = ? AND (is_group_admin = 1 OR is_billing_admin = 1) AND valid_from <= ? AND valid_to >= ?`
    ).bind(userId, now, now).all()
    const roots = (adminRows as any[]).map(r => r.group_id as string)
    const managed = new Set<string>()
    if (roots.length === 0) return managed
    // 親→子の隣接リストを作り、各 root から子孫を BFS/DFS で収集する。
    const { results: allGroups } = await c.env.DB.prepare('SELECT id, parent_id FROM groups').all()
    const childrenMap = new Map<string, string[]>()
    for (const g of allGroups as any[]) {
        if (!g.parent_id) continue
        if (!childrenMap.has(g.parent_id)) childrenMap.set(g.parent_id, [])
        childrenMap.get(g.parent_id)!.push(g.id)
    }
    const stack = [...roots]
    while (stack.length) {
        const id = stack.pop()!
        if (managed.has(id)) continue   // 循環/重複ガード
        managed.add(id)
        for (const child of childrenMap.get(id) || []) stack.push(child)
    }
    return managed
}

// 【決済権限の認可プリミティブ】ユーザーが「決済権者(billing_admin)」として利用枠を
//   操作できるグループID集合を返す。= 自分が有効な billing_admin として所属するグループ
//   + その子孫(サブツリー)すべて。利用枠(Grant)の分配・移動は予算と直結するため、
//   運用担当(group_admin)とは別ロールで守る。getManagedGroupIds と同じツリー走査だが
//   ロール条件のみ 'billing_admin' に絞る。
export async function getBillingGroupIds(c: any, userId: string): Promise<Set<string>> {
    const now = Math.floor(Date.now() / 1000)
    const { results: adminRows } = await c.env.DB.prepare(
        `SELECT group_id FROM group_memberships WHERE user_id = ? AND is_billing_admin = 1 AND valid_from <= ? AND valid_to >= ?`
    ).bind(userId, now, now).all()
    const roots = (adminRows as any[]).map(r => r.group_id as string)
    const managed = new Set<string>()
    if (roots.length === 0) return managed
    const { results: allGroups } = await c.env.DB.prepare('SELECT id, parent_id FROM groups').all()
    const childrenMap = new Map<string, string[]>()
    for (const g of allGroups as any[]) {
        if (!g.parent_id) continue
        if (!childrenMap.has(g.parent_id)) childrenMap.set(g.parent_id, [])
        childrenMap.get(g.parent_id)!.push(g.id)
    }
    const stack = [...roots]
    while (stack.length) {
        const id = stack.pop()!
        if (managed.has(id)) continue   // 循環/重複ガード
        managed.add(id)
        for (const child of childrenMap.get(id) || []) stack.push(child)
    }
    return managed
}

// 利用者割当(ゲート③)の中核ロジック: ゲート②(利用枠)確認 + 席数上限チェック + upsert。
//   戻り値 'no_grant'(利用枠なし) / 'seat'(席数超過) / 'ok'。呼び出し側(運営者/委任)で
//   結果を表示に変換する。運営者ルートと委任ルートで共通利用し、判定の二重管理を防ぐ。
export async function createAssignment(c: any, p: { userId: string; groupId: string; serviceId: string; facilityId: string | null; roleId: number | null; validFrom: number; validTo: number }): Promise<'no_grant' | 'seat' | 'ok'> {
    // ゲート②: このグループ×サービスの利用枠が無ければ割当不可。
    // ただし、自グループが所有する「active」なサービスは無条件で利用可能(自作ツールのため)。
    const grant = await c.env.DB.prepare('SELECT * FROM group_service_grants WHERE group_id = ? AND service_id = ?')
        .bind(p.groupId, p.serviceId).first() as any
    let isSelfOwned = false;
    if (!grant) {
        const svc = await c.env.DB.prepare('SELECT owner_group_id, status FROM services WHERE id = ?').bind(p.serviceId).first() as { owner_group_id: string | null, status: string } | null;
        if (svc && svc.owner_group_id === p.groupId && svc.status === 'active') {
            isSelfOwned = true;
        } else {
            return 'no_grant'
        }
    }
    
    // 席数チェック(ライセンス=利用者数)。既にこのグループ×サービスに居る人は新規席を消費しない。
    const existing = await c.env.DB.prepare('SELECT COUNT(*) AS c FROM service_user_assignments WHERE user_id = ? AND group_id = ? AND service_id = ?')
        .bind(p.userId, p.groupId, p.serviceId).first() as { c: number } | null
    const isNewSeat = (existing?.c || 0) === 0
    if (isNewSeat && grant && !isSelfOwned) {
        // 支店別サブ枠(grant.seat_limit)。
        //   実効上限 = 自グループの枠 - 直接の子グループへ配った同一サービスの枠の合計。
        //   子へ配った分は子が消費する前提なので、親が自グループで使える枠から差し引く
        //   (「親の grant - 子の grant」)。子枠は配布時に seat_limit 必須なので SUM で集計できる。
        if (grant.seat_limit != null) {
            const usedG = await c.env.DB.prepare('SELECT COUNT(DISTINCT user_id) AS c FROM service_user_assignments WHERE group_id = ? AND service_id = ?')
                .bind(p.groupId, p.serviceId).first() as { c: number } | null
            const childSum = await c.env.DB.prepare(`
                SELECT COALESCE(SUM(gsg.seat_limit), 0) AS s
                FROM groups ch
                JOIN group_service_grants gsg ON gsg.group_id = ch.id AND gsg.service_id = ?
                WHERE ch.parent_id = ?`).bind(p.serviceId, p.groupId).first() as { s: number } | null
            const effectiveLimit = grant.seat_limit - (childSum?.s || 0)
            if ((usedG?.c || 0) >= effectiveLimit) return 'seat'
        }
        // 契約の総枠(contract.seat_limit)。同一契約に紐づく全利用枠の利用者数で判定。
        const contract = await c.env.DB.prepare('SELECT seat_limit FROM service_contracts WHERE id = ?').bind(grant.contract_id).first() as { seat_limit: number | null } | null
        if (contract && contract.seat_limit != null) {
            const usedC = await c.env.DB.prepare(`
                SELECT COUNT(DISTINCT a.user_id) AS c FROM service_user_assignments a
                JOIN group_service_grants g ON a.group_id = g.group_id AND a.service_id = g.service_id
                WHERE g.contract_id = ?`).bind(grant.contract_id).first() as { c: number } | null
            if ((usedC?.c || 0) >= contract.seat_limit) return 'seat'
        }
    }
    // UNIQUE(user_id, group_id, service_id, facility_id) 制約がありますが、facility_id が NULL の場合複数登録できてしまう問題を防ぐため
    // アプリケーション側で既存行をチェックして UPDATE/INSERT を出し分けます。
    let assignId: number | undefined;
    if (p.facilityId) {
        const row = await c.env.DB.prepare('SELECT id FROM service_user_assignments WHERE user_id = ? AND group_id = ? AND service_id = ? AND facility_id = ?')
            .bind(p.userId, p.groupId, p.serviceId, p.facilityId).first() as { id: number } | null;
        assignId = row?.id;
    } else {
        const row = await c.env.DB.prepare('SELECT id FROM service_user_assignments WHERE user_id = ? AND group_id = ? AND service_id = ? AND facility_id IS NULL')
            .bind(p.userId, p.groupId, p.serviceId).first() as { id: number } | null;
        assignId = row?.id;
    }

    if (assignId) {
        await c.env.DB.prepare('UPDATE service_user_assignments SET service_role_id = ?, valid_from = ?, valid_to = ? WHERE id = ?')
            .bind(p.roleId, p.validFrom, p.validTo, assignId).run()
    } else {
        await c.env.DB.prepare(`
            INSERT INTO service_user_assignments (user_id, group_id, service_id, facility_id, service_role_id, valid_from, valid_to)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(p.userId, p.groupId, p.serviceId, p.facilityId || null, p.roleId, p.validFrom, p.validTo).run()
    }
    return 'ok'
}

// ランタイム・エンタイトルメント判定(読み取り): 指定ユーザー×サービスについて、
//   3ゲート(①グループ所属 → ②利用枠 → ③利用者割当)を now 時点で全通過した
//   エンタイトルメント行を列挙する。書き込み側 createAssignment と判定の真実を一致させる。
//   ①②③のどれか欠ければその行は出ない(自動継承なし)。将来の check も本ヘルパを使う。
//   1本の JOIN で評価する:
//     ③ service_user_assignments を起点に、対象 user×service の有効な割当を取り、
//     ① group_memberships(同 user×group が now 有効) を INNER JOIN、
//     ② group_service_grants(同 group×service が now 有効) を INNER JOIN、
//     表示用に groups / facilities / service_role_master を JOIN する。
export async function getEntitlements(c: any, userId: string, serviceId: string): Promise<any[]> {
    const now = Math.floor(Date.now() / 1000)
    const { results } = await c.env.DB.prepare(`
        SELECT
            a.group_id        AS group_id,
            g.name            AS group_name,
            m.is_group_admin   AS is_group_admin,
            m.is_billing_admin AS is_billing_admin,
            m.is_developer     AS is_developer,
            a.facility_id     AS facility_id,
            f.structure_no    AS structure_no,
            f.building_use    AS building_use,
            rm.role_code      AS role_code,
            rm.role_name      AS role_name,
            a.valid_from      AS valid_from,
            a.valid_to        AS valid_to
        FROM service_user_assignments a
        JOIN group_memberships m
            ON m.user_id = a.user_id AND m.group_id = a.group_id
           AND m.valid_from <= ? AND m.valid_to >= ?
        JOIN services s ON s.id = a.service_id
        LEFT JOIN group_service_grants gr
            ON gr.group_id = a.group_id AND gr.service_id = a.service_id
           AND gr.valid_from <= ? AND gr.valid_to >= ?
        JOIN groups g              ON g.id = a.group_id
        JOIN facilities f          ON f.id = a.facility_id
        JOIN service_role_master rm ON rm.id = a.service_role_id
        WHERE a.user_id = ? AND a.service_id = ?
          AND a.valid_from <= ? AND a.valid_to >= ?
          AND (gr.id IS NOT NULL OR (s.owner_group_id = a.group_id AND s.status = 'active'))
        ORDER BY g.name, f.structure_no
    `).bind(now, now, now, now, userId, serviceId, now, now).all()
    return (results as any[]).map(r => ({
        group:    { id: r.group_id, name: r.group_name, is_group_admin: !!r.is_group_admin, is_billing_admin: !!r.is_billing_admin, is_developer: !!r.is_developer },
        facility: { id: r.facility_id, structure_no: r.structure_no, building_use: r.building_use },
        role:     r.role_name,
        valid_from: r.valid_from,
        valid_to:   r.valid_to,
    }))
}

// 監査ログを1行記録する。details は i18n キー方式({ key, params }) で保存する。
export async function logAudit(c: any, eventType: string, details: object) {
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)')
        .bind(eventType, JSON.stringify(details)).run()
}

// サービス削除の連鎖。サービスに紐づく契約・利用枠・役割マスタ・割当をまとめて掃除する。
// (提供企業削除→各サービス削除でも使う)
export async function deleteServiceCascade(c: any, serviceId: string) {
    await c.env.DB.batch([
        c.env.DB.prepare('DELETE FROM service_user_assignments WHERE service_id = ?').bind(serviceId),
        c.env.DB.prepare('DELETE FROM service_role_master WHERE service_id = ?').bind(serviceId),
        c.env.DB.prepare('DELETE FROM group_service_grants WHERE service_id = ?').bind(serviceId),
        c.env.DB.prepare('DELETE FROM service_contracts WHERE service_id = ?').bind(serviceId),
        c.env.DB.prepare('DELETE FROM service_apps WHERE service_id = ?').bind(serviceId),
        c.env.DB.prepare('DELETE FROM services WHERE id = ?').bind(serviceId),
    ])
}

// グループ管理者が自グループのサービスを作るとき、services.provider_id(NOT NULL)を満たす
// ための「提供企業」をグループごとに用意する。提供企業=そのグループ自身という意味づけで、
// id は決め打ち(grp-prov:<group_id>)・名称はグループ名にする。既にあれば再利用する。
export async function ensureGroupProvider(c: any, groupId: string): Promise<string> {
    const providerId = `grp-prov:${groupId}`
    const existing = await c.env.DB.prepare('SELECT id FROM service_providers WHERE id = ?').bind(providerId).first()
    if (!existing) {
        const grp = await c.env.DB.prepare('SELECT name FROM groups WHERE id = ?').bind(groupId).first() as { name: string } | null
        await c.env.DB.prepare('INSERT INTO service_providers (id, name, created_at) VALUES (?, ?, ?)')
            .bind(providerId, grp?.name || groupId, Math.floor(Date.now() / 1000)).run()
    }
    return providerId
}

// 現在の(未失効の)セッション行を auth_time 込みで取得する。ユーザーだけでなく
// 認証時刻が必要な箇所(OIDC /authorize)で使う。
export async function getSessionRow(c: any): Promise<Session | null> {
    const sessionId = getCookie(c, '__Host-idp_session')
    if (!sessionId) return null
    const hashedSessionId = await hashToken(sessionId)
    return await c.env.DB.prepare('SELECT * FROM sessions WHERE id = ? AND expires_at > ?')
        .bind(hashedSessionId, Math.floor(Date.now() / 1000)).first() as Session | null
}

// 新しいログインセッションを作成し Cookie を設定する。auth_time(実際の認証時刻)を
// 記録するので OIDC の auth_time / max_age / prompt=login が機能する。
async function createSession(c: any, userId: string): Promise<void> {
    const sessionId = generateToken()
    const now = Math.floor(Date.now() / 1000)
    const expires = now + 86400
    const hashedSessionId = await hashToken(sessionId)
    await c.env.DB.prepare('INSERT INTO sessions (id, user_id, expires_at, auth_time) VALUES (?, ?, ?, ?)')
        .bind(hashedSessionId, userId, expires, now).run()
    setCookie(c, '__Host-idp_session', sessionId, getCookieOptions(expires))
}

// クライアントに登録された redirect_uris(改行区切り)を配列にパースする。
function parseRedirectUris(raw: string | null | undefined): string[] {
    return (raw || '').split(/[\r\n]+/).map(s => s.trim()).filter(Boolean)
}

// 要求された redirect_uri を登録済みクライアントに対して検証する。
//
// 推奨経路(OIDC Core 3.1.2.1): クライアントに明示的な redirect_uris のリストが
// 登録されていれば、要求はそのいずれかと完全一致(文字列比較)しなければならない。
// これが仕様に忠実な挙動。
//
// 旧方式のフォールバック: redirect_uris 導入前に登録されたクライアントは base_url
// しか持たない。その場合はオリジンの完全一致を要求し、base_url のパス以下の任意パスを
// 許可する。オリジン完全一致のチェックにより、前方一致の穴
// (例: "https://app.example.evil.com" / "...@evil.com")は塞がれる。
export function isAllowedRedirectUri(redirectUri: string, app: { base_url: string; redirect_uris?: string | null }): boolean {
    const registered = parseRedirectUris(app.redirect_uris)
    if (registered.length > 0) return registered.includes(redirectUri)

    let redir: URL, base: URL
    try {
        redir = new URL(redirectUri)
        base = new URL(app.base_url)
    } catch {
        return false
    }
    // リダイレクト先は http(s) のみ許可。ただし http はローカル開発環境のみ許容。
    if (redir.protocol === 'http:' && redir.hostname !== 'localhost' && redir.hostname !== '127.0.0.1') return false
    if (redir.protocol !== 'https:' && redir.protocol !== 'http:') return false
    if (redir.origin !== base.origin) return false
    const basePath = base.pathname.replace(/\/+$/, '')
    if (basePath === '') return true // base registered at origin root: any path allowed
    return redir.pathname === basePath || redir.pathname.startsWith(basePath + '/')
}

// ------------------------------------------------------------------
// ルート
// ------------------------------------------------------------------

app.get('/', async (c) => {
    try {
        const t = getLang(c)
        const ctx = await getUserCtx(c)
        if (!ctx) return c.redirect('/login')
        const { user, isGroupAdmin } = ctx
        const config = await getSystemConfig(c.env.DB)
        const siteName = getLocalizedValue(c, config.appName)

        const now = Math.floor(Date.now() / 1000)
        
        // 1. 直接割り当てられた単体アプリ (従来の権限)
        const { results: standaloneApps } = await c.env.DB.prepare(`
        SELECT DISTINCT a.* FROM apps a
        LEFT JOIN permissions up ON a.id = up.app_id AND up.user_id = ?
        LEFT JOIN group_permissions gp ON a.id = gp.app_id AND gp.group_id = ?
        WHERE
          (a.status IS NULL OR a.status = 'active') AND
          ((up.valid_from <= ? AND up.valid_to >= ?) OR (up.id IS NULL AND gp.valid_from <= ? AND gp.valid_to >= ?))
        `).bind(user.id, user.group_id || null, now, now, now, now).all()

        // 2. サービスに割り当てられたアプリ (ドリルダウン用)
        // ユーザーが有効な割当を持つサービスとそのサービス内のアプリを取得
        const { results: serviceAppsRows } = await c.env.DB.prepare(`
            SELECT DISTINCT s.id AS service_id, s.name AS service_name, 
                   a.id AS app_id, a.name AS app_name, a.icon_url, a.description, a.base_url, a.initiate_login_uri
            FROM service_user_assignments sua
            JOIN group_memberships m ON m.user_id = sua.user_id AND m.group_id = sua.group_id AND m.valid_from <= ? AND m.valid_to >= ?
            JOIN services s ON s.id = sua.service_id
            JOIN service_apps sa ON sa.service_id = s.id
            JOIN apps a ON a.id = sa.app_id
            LEFT JOIN group_service_grants gr ON gr.group_id = sua.group_id AND gr.service_id = sua.service_id AND gr.valid_from <= ? AND gr.valid_to >= ?
            WHERE sua.user_id = ?
              AND sua.valid_from <= ? AND sua.valid_to >= ?
              AND (gr.id IS NOT NULL OR (s.owner_group_id = sua.group_id AND s.status = 'active'))
              AND (a.status IS NULL OR a.status = 'active')
            ORDER BY s.name, a.name
        `).bind(now, now, now, now, user.id, now, now).all()

        const servicesMap = new Map<string, any>()
        for (const row of serviceAppsRows as any[]) {
            if (!servicesMap.has(row.service_id)) {
                servicesMap.set(row.service_id, { id: row.service_id, name: row.service_name, apps: [], tags: [] })
            }
            servicesMap.get(row.service_id).apps.push({
                id: row.app_id,
                name: row.app_name,
                icon_url: row.icon_url,
                description: row.description,
                base_url: row.base_url,
                initiate_login_uri: row.initiate_login_uri
            })
        }
        const entitledServices = Array.from(servicesMap.values())

        const serviceIds = Array.from(servicesMap.keys())
        const allTagsMap = new Map<string, {id: string, name: string}>()
        if (serviceIds.length > 0) {
            const placeholders = serviceIds.map(() => '?').join(',')
            const { results: tagRows } = await c.env.DB.prepare(`
                SELECT st.service_id, t.id, t.name
                FROM service_tags st
                JOIN tags t ON st.tag_id = t.id
                WHERE st.service_id IN (${placeholders}) AND t.status = 'active'
            `).bind(...serviceIds).all()

            for (const row of tagRows as any[]) {
                const s = servicesMap.get(row.service_id)
                if (s) {
                    // Prevent duplicate tags if any
                    if (!s.tags.find((t: any) => t.id === row.id)) {
                        s.tags.push({ id: row.id, name: row.name })
                    }
                }
                allTagsMap.set(row.id, { id: row.id, name: row.name })
            }
        }
        const availableServiceTags = Array.from(allTagsMap.values()).sort((a, b) => a.name.localeCompare(b.name))

        return c.html(<UserDashboard t={t} userEmail={user.email} apps={standaloneApps as any} services={entitledServices} availableServiceTags={availableServiceTags} siteName={siteName} profileName={user.name} profilePicture={user.picture} isGroupAdmin={isGroupAdmin} />)
    } catch (e: any) {
        console.error(e)
        const isDev = c.env.ENVIRONMENT === 'dev' || c.env.ENVIRONMENT === 'development'
        return c.json(isDev ? { error: e.message, stack: e.stack } : { error: 'Internal Server Error' }, 500)
    }
})

// グループ管理者ポータル: group_memberships で role='group_admin' のユーザー専用。
// システム管理者(admins テーブル)は /admin を使うためここには来ない想定だが、
// group_admin ロールも持っていれば閲覧できて問題ない。
import { groupAdminRouter } from './routes/group-admin';
app.route('/', groupAdminRouter);


// アカウント設定(プロフィール編集 + セキュリティ)の専用画面。
app.get('/account', async (c) => {
    const ctx = await getUserCtx(c)
    if (!ctx) return c.redirect('/login')
    const { user, isGroupAdmin } = ctx
    const t = getLang(c)
    const config = await getSystemConfig(c.env.DB)
    const siteName = getLocalizedValue(c, config.appName)
    const msgKey = c.req.query('msg')
    const message = msgKey && (t as any)[msgKey] ? (t as any)[msgKey] : undefined

    const now = Math.floor(Date.now() / 1000)
    const { results: memberships } = await c.env.DB.prepare(`
        SELECT m.group_id, g.name AS group_name, m.is_group_admin, m.is_billing_admin, m.is_developer
        FROM group_memberships m JOIN groups g ON g.id = m.group_id
        WHERE m.user_id = ? AND m.valid_from <= ? AND m.valid_to >= ?
        ORDER BY g.name
    `).bind(user.id, now, now).all()
    const { results: myApps } = await c.env.DB.prepare(
        "SELECT group_id, role_type, status, admin_reason FROM role_applications WHERE user_id = ? AND status IN ('pending','rejected')"
    ).bind(user.id).all()
    const appMap: Record<string, { status: string; admin_reason: string | null }> = {}
    for (const a of (myApps as any[])) appMap[a.group_id + '|' + a.role_type] = { status: a.status, admin_reason: a.admin_reason }
    const myMemberships = (memberships as any[]).map(m => ({
        group_id: m.group_id,
        group_name: m.group_name,
        is_group_admin: !!m.is_group_admin,
        is_billing_admin: !!m.is_billing_admin,
        is_developer: !!m.is_developer,
        app_group_admin: appMap[m.group_id + '|group_admin'] || null,
        app_billing_admin: appMap[m.group_id + '|billing_admin'] || null,
        app_developer: appMap[m.group_id + '|developer'] || null,
    }))

    return c.html(<AccountPage t={t} userEmail={user.email} siteName={siteName} has2FA={!!user.two_factor_secret} profileName={user.name} profileUsername={user.preferred_username} profilePicture={user.picture} message={message} isGroupAdmin={isGroupAdmin} myMemberships={myMemberships} />)
})

app.get('/login', async (c) => {
    const t = getLang(c)
    const config = await getSystemConfig(c.env.DB)
    const siteName = getLocalizedValue(c, config.appName)
    const siteSubtitle = getLocalizedValue(c, config.appSubtitle)
    const returnTo = c.req.query('return_to') // OIDC: come back to /authorize after login
    const msgKey = c.req.query('msg')
    // @ts-ignore
    const message = msgKey && t[msgKey] ? t[msgKey] : undefined
    // OIDC の prompt=login / max_age は再認証を強制する: /authorize は reauth=1 付きで
    // ここへ送ってくるので、まだ有効な SSO セッションを黙って再利用せずフォームを表示する。
    const reauth = c.req.query('reauth') === '1'
    // OIDC login_hint: メール欄を初期表示するために RP が提供する識別子。
    const loginHint = c.req.query('login_hint')

    const user = await getUser(c)
    if (user && !reauth) {
        if (returnTo && isSafeReturnTo(returnTo)) return c.redirect(returnTo)
        if (user?.email) {
            const admin = await c.env.DB.prepare('SELECT * FROM admins WHERE LOWER(email) = LOWER(?)').bind(user.email).first()
            return c.redirect(admin ? '/admin' : '/')
        }
    }

    return c.html(<Login t={t} returnTo={returnTo} message={message} siteName={siteName} siteSubtitle={siteSubtitle} email={loginHint} />)
})

const ACCT_RL_LIMIT = 10;
const ACCT_RL_WINDOW = 900; // 15 mins

app.post('/login', async (c) => {
    const t = getLang(c)
    const config = await getSystemConfig(c.env.DB)
    const siteName = getLocalizedValue(c, config.appName)
    const siteSubtitle = getLocalizedValue(c, config.appSubtitle)

    const body = await c.req.parseBody()
    const rawEmail = typeof body['email'] === 'string' ? body['email'] : ''
    const email = rawEmail.trim().toLowerCase()
    const password = body['password'] as string
    const returnTo = body['return_to'] as string // OIDC: /authorize URL to resume

    // パスワード総当たりを遅らせるための IP別 および アカウント別 レート制限
    const loginIp = c.req.header('CF-Connecting-IP') || 'unknown'
    const ipOk = await rateLimit(c.env.DB, `login:ip:${loginIp}`, 10, 60)
    const acctOk = await rateLimit(c.env.DB, `login:acct:${email}`, ACCT_RL_LIMIT, ACCT_RL_WINDOW)

    if (!ipOk || !acctOk) {
        return c.html(<Login t={t} error={t.error_rate_limited} siteName={siteName} siteSubtitle={siteSubtitle} />, 429)
    }

    const user = await c.env.DB.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').bind(email).first() as User | null
    if (!user || !(await verifyPassword(password, user.password_hash))) {
        return c.html(<Login t={t} returnTo={returnTo} error={t.error_credentials} siteName={siteName} siteSubtitle={siteSubtitle} />)
    }

    // Opaque upgrade: if the stored hash cost is less than the current standard, re-hash and update
    if (getBcryptCost(user.password_hash) < BCRYPT_COST) {
        const upgradedHash = await hashPassword(password)
        await c.env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(upgradedHash, user.id).run()
    }

    // パスワード検証成功時にアカウントのレート制限カウンタをリセット
    await c.env.DB.prepare('DELETE FROM rate_limits WHERE k = ?').bind(`login:acct:${email}`).run()

    // 2要素認証(2FA)チェック
    if (user.two_factor_secret) {
        const secret = requireSecret(c.env, 'JWT_SECRET', 'dev_secret')
        const token = await sign({ sub: user.id, role: 'pre_2fa', exp: Math.floor(Date.now() / 1000) + 300 }, secret)
        setCookie(c, 'pre_2fa_token', token, { path: '/', secure: true, httpOnly: true, maxAge: 300, sameSite: 'Lax' })

        const params = new URLSearchParams()
        if (returnTo) params.set('return_to', returnTo)
        const qs = params.toString()
        return c.redirect('/login/2fa' + (qs ? '?' + qs : ''))
    }

    await createSession(c, user.id)

    let targetAppName = 'Tobira Dashboard';
    const admin = await c.env.DB.prepare('SELECT * FROM admins WHERE LOWER(email) = LOWER(?)').bind(email).first()
    if (admin) {
        targetAppName = 'Tobira Admin';
    }

    const details = JSON.stringify({ key: 'log_login_app', params: { email, appName: targetAppName } });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('LOGIN', details).run()

    if (returnTo && isSafeReturnTo(returnTo)) return c.redirect(returnTo)

    return c.redirect(admin ? '/admin' : '/')
})

// --- セルフサービス新規登録 ---
// オープン登録。新規ユーザーは任意で既定グループ(system_config キー 'signup_group_id')に
// 配置され、そのグループのアプリ権限を即座に継承する — 公開デモへのアクセスを自動付与する
// ために使う。
app.get('/signup', async (c) => {
    const t = getLang(c)
    const config = await getSystemConfig(c.env.DB)
    const siteName = getLocalizedValue(c, config.appName)
    const siteSubtitle = getLocalizedValue(c, config.appSubtitle)
    const returnTo = c.req.query('return_to')

    const user = await getUser(c)
    if (user) {
        if (returnTo && isSafeReturnTo(returnTo)) return c.redirect(returnTo)
        return c.redirect('/')
    }
    return c.html(<Signup t={t} returnTo={returnTo} siteName={siteName} siteSubtitle={siteSubtitle} />)
})

app.post('/signup', async (c) => {
    const t = getLang(c)
    const config = await getSystemConfig(c.env.DB)
    const siteName = getLocalizedValue(c, config.appName)
    const siteSubtitle = getLocalizedValue(c, config.appSubtitle)
    const body = await c.req.parseBody()
    const email = ((body['email'] as string) || '').trim().toLowerCase()
    const password = body['password'] as string
    const returnTo = body['return_to'] as string

    const view = (error: string) => c.html(<Signup t={t} returnTo={returnTo} error={error} siteName={siteName} siteSubtitle={siteSubtitle} />)

    // 自動化された大量登録を抑えるための IP 別レート制限。
    const signupIp = c.req.header('CF-Connecting-IP') || 'unknown'
    if (!(await rateLimit(c.env.DB, `signup:${signupIp}`, 5, 60))) {
        return c.html(<Signup t={t} returnTo={returnTo} error={t.error_rate_limited} siteName={siteName} siteSubtitle={siteSubtitle} />, 429)
    }

    if (!email || !password) return view(t.error_required)
    if (!validatePassword(password)) return view(t.error_password_too_short || 'Password must be at least 8 characters long.')

    // 任意の既定グループ → そのグループのアプリ権限を継承する。
    const grpRow = await c.env.DB.prepare("SELECT value FROM system_config WHERE key = 'signup_group_id'").first<{ value: string }>()
    const groupId = grpRow?.value || null

    const userId = crypto.randomUUID()
    const pwHash = await hashPassword(password)
    const now = Math.floor(Date.now() / 1000)

    // サインアップ列挙対策: 成功時・既存時問わず同一のリダイレクトを行う
    const params = new URLSearchParams()
    params.set('msg', 'msg_account_created')
    if (returnTo) params.set('return_to', returnTo)
    const successRedirect = '/login?' + params.toString()

    try {
        await c.env.DB.prepare(
            'INSERT INTO users (id, email, password_hash, group_id, created_at, updated_at, email_verified) VALUES (?, ?, ?, ?, ?, ?, 0)'
        ).bind(userId, email, pwHash, groupId, now, now).run()

        const details = JSON.stringify({ key: 'log_signup', params: { email } })
        await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('SIGNUP', details).run()
    } catch (e) {
        // UNIQUE制約違反等の場合もタイミング差を出さずに同じ応答を返す
        return c.redirect(successRedirect)
    }

    return c.redirect(successRedirect)
})



app.get('/logout', async (c) => {
    const sessionId = getCookie(c, '__Host-idp_session')
    if (sessionId) {
        const hashedSessionId = await hashToken(sessionId)
        const session = await c.env.DB.prepare('SELECT user_id FROM sessions WHERE id = ?').bind(hashedSessionId).first() as Session | null
        if (session) {
            await c.env.DB.prepare('DELETE FROM app_sessions WHERE user_id = ?').bind(session.user_id).run()
        }
        try { await c.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(hashedSessionId).run() } catch (e) { }
    }
    setCookie(c, '__Host-idp_session', '', { path: '/', secure: true, httpOnly: true, expires: new Date(0) })
    return c.redirect('/login')
})

// ... (2FA・パスワードリセットのルートは簡潔さのため省略表記だが、ここに存在する想定。標準的な実装) ...
// 注: 完全復元のため、標準的なルートはすべて含める。

app.get('/user/2fa/setup', async (c) => {
    const user = await getUser(c)
    if (!user) return c.redirect('/login')
    const t = getLang(c)
    const config = await getSystemConfig(c.env.DB)
    const siteName = getLocalizedValue(c, config.appName)
    const secret = generateSecret()
    const qrCode = await generateQRCode(secret, user.email, 'Tobira')
    return c.html(<Setup2FA t={t} qrCodeDataUrl={qrCode} secret={secret} siteName={siteName} userEmail={user.email} profileName={user.name} profilePicture={user.picture} />)
})
app.post('/user/2fa/setup', async (c) => {
    const user = await getUser(c)
    if (!user) return c.redirect('/login')
    const t = getLang(c)
    const body = await c.req.parseBody()
    const token = (body['token'] as string).replace(/\s+/g, '')
    const secret = body['secret'] as string 
    if (verifyToken(token, secret)) {
        const kek = await requireSecret(c.env, 'OIDC_KEK', 'fallback-local-dev-kek-do-not-use-in-prod');
        const encryptedSecret = await encryptSecret(secret, kek);
        await c.env.DB.prepare('UPDATE users SET two_factor_secret = ? WHERE id = ?').bind(encryptedSecret, user.id).run()
        const details = JSON.stringify({ key: 'log_2fa_enable', params: { email: user.email } });
        await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('2FA_ENABLE', details).run()
        return c.redirect('/account?msg=msg_2fa_enabled')
    } else {
        const config = await getSystemConfig(c.env.DB)
        const siteName = getLocalizedValue(c, config.appName)
        const qrCode = await generateQRCode(secret, user.email, 'Tobira')
        return c.html(<Setup2FA t={t} qrCodeDataUrl={qrCode} secret={secret} siteName={siteName} userEmail={user.email} profileName={user.name} profilePicture={user.picture} error={t.err_invalid_code} />)
    }
})
app.post('/user/2fa/disable', async (c) => {
    const user = await getUser(c)
    if (!user) return c.redirect('/login')
    
    const body = await c.req.parseBody()
    const currentPassword = body['current_password'] as string
    
    if (!currentPassword || !(await verifyPassword(currentPassword, user.password_hash))) {
        return c.redirect('/account?error=' + encodeURIComponent(getLang(c).error_credentials || 'Invalid password'))
    }

    await c.env.DB.prepare('UPDATE users SET two_factor_secret = NULL WHERE id = ?').bind(user.id).run()
    const details = JSON.stringify({ key: 'log_2fa_disable', params: { email: user.email } });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('2FA_DISABLE', details).run()
    return c.redirect('/account?msg=msg_2fa_disabled')
})
app.get('/change-password', async (c) => {
    const user = await getUser(c)
    if (!user) return c.redirect('/login')
    const config = await getSystemConfig(c.env.DB)
    const siteName = getLocalizedValue(c, config.appName)
    return c.html(<ChangePassword t={getLang(c)} siteName={siteName} userEmail={user.email} profileName={user.name} profilePicture={user.picture} />)
})
app.post('/change-password', async (c) => {
    const user = await getUser(c)
    if (!user) return c.redirect('/login')
    const config = await getSystemConfig(c.env.DB)
    const siteName = getLocalizedValue(c, config.appName)
    const view = (error: string, message?: string) => c.html(<ChangePassword t={getLang(c)} siteName={siteName} userEmail={user.email} profileName={user.name} profilePicture={user.picture} error={error} message={message} />)

    const body = await c.req.parseBody()
    const currentPassword = body['current_password'] as string
    const newPassword = body['password'] as string

    if (!currentPassword || !newPassword) return view(getLang(c).error_required || 'All fields are required.')
    
    // Verify current password
    if (!(await verifyPassword(currentPassword, user.password_hash))) {
        return view(getLang(c).error_credentials || 'Invalid current password.')
    }

    // Validate new password
    if (!validatePassword(newPassword)) {
        return view(getLang(c).error_password_too_short || 'Password must be at least 8 characters long.')
    }

    const pwHash = await hashPassword(newPassword)
    await c.env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(pwHash, user.id).run()
    const details = JSON.stringify({ key: 'log_password_change', params: { email: user.email } });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('PASSWORD_CHANGE', details).run()

    // Clear other sessions and app_sessions
    const sessionId = getCookie(c, '__Host-idp_session')
    if (sessionId) {
        const hashedSessionId = await hashToken(sessionId)
        await c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ? AND id != ?').bind(user.id, hashedSessionId).run()
    } else {
        await c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(user.id).run()
    }
    await c.env.DB.prepare('DELETE FROM app_sessions WHERE user_id = ?').bind(user.id).run()

    return view('', getLang(c).msg_password_changed)
})
// セルフサービスの OIDC プロフィール(name / preferred_username / picture)。
// 空欄 = 未設定(クレームでは email にフォールバック)。
app.post('/user/profile', async (c) => {
    const user = await getUser(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const name = ((body['name'] as string) || '').trim() || null
    const preferredUsername = ((body['preferred_username'] as string) || '').trim() || null
    const picture = ((body['picture'] as string) || '').trim() || null
    const now = Math.floor(Date.now() / 1000)
    await c.env.DB.prepare('UPDATE users SET name = ?, preferred_username = ?, picture = ?, updated_at = ? WHERE id = ?')
        .bind(name, preferredUsername, picture, now, user.id).run()
    return c.redirect('/account?msg=msg_profile_saved')
})


// ------------------------------------------------------------------
// OIDC (Auth0 互換のモック面)
//
// リライングパーティ(RP)は管理画面で「アプリ」として登録される:
//   - app.id       == client_id
//   - app.base_url == redirect_uri が一致すべき登録オリジン(+任意パス)。
//                     isAllowedRedirectUri を参照
// tobira のアプリ別権限ゲートは /authorize で適用される。
// access_token は不透明(/userinfo で引き当てる)。id_token は
// /.well-known/jwks.json で検証できる本物の RS256 JWT。
// ------------------------------------------------------------------

// return_to は対話的ログイン後に /authorize を再開するために使う。
// 同一オリジンの /authorize パスのみ許可(オープンリダイレクト防止)。
export function isSafeReturnTo(v: string | undefined | null): boolean {
    return typeof v === 'string' && v.startsWith('/authorize')
}

export function buildRedirect(redirectUri: string, mode: string | undefined, params: Record<string, string | undefined>): string {
    const usp = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) if (v != null && v !== '') usp.set(k, v)
    const sep = mode === 'fragment' ? '#' : (redirectUri.includes('?') ? '&' : '?')
    return redirectUri + sep + usp.toString()
}

export function tokenError(c: any, error: string, description: string, status: 400 | 401 = 400) {
    return c.json({ error, error_description: description }, status)
}

// RFC 6750 §3: Bearer で保護されたリソースは、失敗したリクエストに WWW-Authenticate
// チャレンジを返さなければならない。認証情報が一切無い場合はチャレンジから error コードを
// 省略し、無効/失効トークンには error="invalid_token" を付ける。
export function bearerUnauthorized(c: any, error?: string, description?: string) {
    let challenge = 'Bearer realm="tobira"'
    if (error) {
        challenge += `, error="${error}"`
        if (description) challenge += `, error_description="${description}"`
    }
    c.header('WWW-Authenticate', challenge)
    return c.json({ error: error || 'invalid_request', error_description: description }, 401)
}

// 定数時間の文字列比較(タイミングによるシークレット漏洩を防ぐ)。
export function safeEqual(a: string, b: string): boolean {
    if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false
    let r = 0
    for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i)
    return r === 0
}

// トークンエンドポイント向けの OIDC クライアント認証。
// 機密クライアント(シークレット登録済み) -> シークレット必須かつ一致が必要。
// パブリッククライアント(シークレット未登録) -> PKCE が使われていなければならない。
export async function authenticateClient(
    c: any, appId: string, providedSecret: string | undefined, usedPkce: boolean
): Promise<{ ok: true } | { ok: false; res: Response }> {
    const app = await c.env.DB.prepare('SELECT client_secret FROM apps WHERE id = ?').bind(appId).first() as { client_secret?: string | null } | null
    const registered = app?.client_secret
    if (registered) {
        let isMatch = false
        if (registered.startsWith('$2a$') || registered.startsWith('$2b$')) {
            isMatch = !!providedSecret && await verifyPassword(providedSecret, registered)
        } else {
            isMatch = !!providedSecret && safeEqual(providedSecret, registered)
        }
        if (!isMatch) {
            return { ok: false, res: tokenError(c, 'invalid_client', 'client authentication failed', 401) }
        }
    } else if (!usedPkce) {
        return { ok: false, res: tokenError(c, 'invalid_client', 'client authentication required: use PKCE or a registered client_secret') }
    }
    return { ok: true }
}

// Authorization ヘッダから client_secret_basic の資格情報を(あれば)取り出す。
export function parseBasicAuth(c: any): { clientId?: string; secret?: string } {
    const authz = c.req.header('Authorization')
    if (!authz || !authz.startsWith('Basic ')) return {}
    try {
        const dec = atob(authz.slice(6))
        const i = dec.indexOf(':')
        return { clientId: decodeURIComponent(dec.slice(0, i)), secret: decodeURIComponent(dec.slice(i + 1)) }
    } catch {
        return {}
    }
}

export async function parseClientBody(c: any): Promise<Record<string, string>> {
    const ct = c.req.header('Content-Type') || ''
    if (ct.includes('application/json')) return (await c.req.json().catch(() => ({}))) as any
    const body = await c.req.parseBody()
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(body)) if (typeof v === 'string') out[k] = v
    return out
}

// 付与された scope 文字列を OIDC クレームへマッピングする(OIDC Core 5.4)。付与された
// scope に対応する標準クレームのみ返すので、`openid` のみの要求では email/profile が
// 漏れない。プロフィール項目は未設定なら email にフォールバックする。
export function buildOidcClaims(user: User, scope: string | null): Record<string, unknown> {
    const scopes = (scope || '').split(/\s+/).filter(Boolean)
    const claims: Record<string, unknown> = {}
    if (scopes.includes('profile')) {
        claims.name = user.name || user.email
        claims.preferred_username = user.preferred_username || user.email
        if (user.picture) claims.picture = user.picture
        claims.updated_at = user.updated_at
    }
    if (scopes.includes('email')) {
        claims.email = user.email
        claims.email_verified = !!user.email_verified
    }
    return claims
}

// OIDC at_hash: base64url(SHA-256(access_token) の左側 128 ビット)。
export async function computeAtHash(accessToken: string): Promise<string> {
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(accessToken)))
    const half = digest.slice(0, 16)
    let bin = ''
    for (let i = 0; i < half.length; i++) bin += String.fromCharCode(half[i])
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function issueOidcTokens(c: any, user: User, clientId: string, nonce: string | null, scope: string | null, authTime: number | null) {
    const now = Math.floor(Date.now() / 1000)
    const expiresIn = 3600
    const grantedScope = scope || 'openid'
    // OIDC Core 11: refresh token は `offline_access` scope が付与された場合のみ発行する。
    // 行には常に refresh_token を保存する(列が NOT NULL のため)が、offline_access が
    // 付与されたときだけ返す — 返さないトークンは提示しようがないので、実質未発行となる。
    const offlineAccess = grantedScope.split(/\s+/).includes('offline_access')
    // 実際のエンドユーザー認証時刻。auth_time 追跡前の旧 code / セッションに限り now に
    // フォールバックする。
    const effectiveAuthTime = authTime ?? now
    const accessToken = generateToken()
    const refreshToken = generateToken()
    const hashedAccessToken = await hashToken(accessToken)
    const hashedRefreshToken = await hashToken(refreshToken)
    await c.env.DB.prepare('INSERT INTO app_sessions (token, refresh_token, user_id, app_id, expires_at, scope, auth_time) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(hashedAccessToken, hashedRefreshToken, user.id, clientId, now + expiresIn, grantedScope, effectiveAuthTime).run()

    const issuer = new URL(c.req.url).origin
    // OIDC Core 3.1.3.6: at_hash = base64url(SHA-256(access_token) の左半分)。
    // RS256 → SHA-256 なので左半分は先頭 16 バイト。RP がこの access_token と id_token を
    // 結びつけられるようにする。
    const atHash = await computeAtHash(accessToken)
    const idToken = await signRS256({
        iss: issuer,
        sub: user.id,
        aud: clientId,
        iat: now,
        exp: now + expiresIn,
        auth_time: effectiveAuthTime,
        at_hash: atHash,
        ...(nonce ? { nonce } : {}),
        ...buildOidcClaims(user, grantedScope),
    }, c.env.DB, requireSecret(c.env, 'OIDC_KEK', 'dev-only-insecure-oidc-kek-change-me'))

    return c.json({
        access_token: accessToken,
        id_token: idToken,
        token_type: 'Bearer',
        expires_in: expiresIn,
        ...(offlineAccess ? { refresh_token: refreshToken } : {}),
        scope: grantedScope,
    })
}

import { oidcRouter } from './routes/oidc';
app.route('/', oidcRouter);


// --- 管理(Admin) ---
import { adminRouter } from './routes/admin';
app.route('/', adminRouter);

// 2要素認証(2FA)の検証ルート
app.get('/login/2fa', async (c) => {
    const t = getLang(c)
    const token = getCookie(c, 'pre_2fa_token')
    if (!token) return c.redirect('/login')
    try { await verify(token, requireSecret(c.env, 'JWT_SECRET', 'dev_secret'), "HS256") } catch (e) { return c.redirect('/login') }
    const returnTo = c.req.query('return_to')
    return c.html(<Login2FA t={t} returnTo={returnTo} />)
})
app.post('/login/2fa', async (c) => {
    const t = getLang(c)
    const body = await c.req.parseBody()
    const otp = (body['token'] as string).replace(/\s+/g, '')
    const returnTo = body['return_to'] as string
    const preToken = getCookie(c, 'pre_2fa_token')
    if (!preToken) return c.redirect('/login')
    let payload;
    try { payload = await verify(preToken, requireSecret(c.env, 'JWT_SECRET', 'dev_secret'), "HS256") } catch (e) { return c.redirect('/login') }
    const userId = payload.sub as string

    const loginIp = c.req.header('CF-Connecting-IP') || 'unknown'
    const ipOk = await rateLimit(c.env.DB, `2fa:ip:${loginIp}`, 10, 60)
    const userOk = await rateLimit(c.env.DB, `2fa:user:${userId}`, ACCT_RL_LIMIT, ACCT_RL_WINDOW)

    if (!ipOk || !userOk) {
        return c.html(<Login2FA t={t} returnTo={returnTo} error={t.error_rate_limited} />, 429)
    }

    const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first() as User | null
    if (!user || !user.two_factor_secret) return c.redirect('/login')
    let decryptedSecret: string | null = null;
    try {
        const kek = await requireSecret(c.env, 'OIDC_KEK', 'fallback-local-dev-kek-do-not-use-in-prod');
        decryptedSecret = await decryptSecret(user.two_factor_secret, kek);
    } catch (e) {
        return c.html(<Login2FA t={t} returnTo={returnTo} error={t.error_credentials || 'Invalid credentials'} />, 403);
    }

    if (!decryptedSecret || !verifyToken(otp, decryptedSecret)) {
        return c.html(<Login2FA t={t} returnTo={returnTo} error={t.err_invalid_code} />)
    }

    // 2FA成功時にユーザーのレート制限カウンタをリセット
    await c.env.DB.prepare('DELETE FROM rate_limits WHERE k = ?').bind(`2fa:user:${userId}`).run()

    // Lazy migration: if the stored secret was legacy plaintext, encrypt and save it now
    if (!user.two_factor_secret.startsWith('v1:')) {
        const kek = await requireSecret(c.env, 'OIDC_KEK', 'fallback-local-dev-kek-do-not-use-in-prod');
        const encryptedSecret = await encryptSecret(decryptedSecret, kek);
        await c.env.DB.prepare('UPDATE users SET two_factor_secret = ? WHERE id = ?').bind(encryptedSecret, user.id).run();
    }

    await createSession(c, user.id)
        deleteCookie(c, 'pre_2fa_token')

        let targetAppName = 'Tobira Dashboard';
        const admin = await c.env.DB.prepare('SELECT * FROM admins WHERE LOWER(email) = LOWER(?)').bind(user.email).first()
        if (admin) {
            targetAppName = 'Tobira Admin';
        }

        const details = JSON.stringify({ key: 'log_login_app', params: { email: user.email, method: '2FA', appName: targetAppName } });
        await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('LOGIN', details).run()

        if (returnTo && isSafeReturnTo(returnTo)) return c.redirect(returnTo)
        return c.redirect(admin ? '/admin' : '/')
})

export default app
