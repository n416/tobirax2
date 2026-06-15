import { sign, verify } from 'hono/jwt'
import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { csrf } from 'hono/csrf'
import { html } from 'hono/html'
import { Env, User, App, Session, Permission, Group, AuthCode, SystemConfig, LocalizedText } from './types'
import { verifyPassword, hashPassword, generateToken, getCookieOptions } from './utils/auth'
import { generateSecret, generateQRCode, verifyToken } from './utils/totp'
import { sendEmail } from './utils/mail'
import { fetchAppIcon } from './utils/icon'
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
import { AccountGrantsPage } from './views/admin/AccountGrantsPage'
import { AccountFacilitiesPage } from './views/admin/AccountFacilitiesPage'
import { AccountAssignmentsPage } from './views/admin/AccountAssignmentsPage'
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
    path === '/register' ||
    path === '/userinfo' || path === '/oidc/logout' || path.startsWith('/api/')
app.use('*', async (c, next) => {
    if (oidcCsrfExempt(c.req.path)) return next()
    return csrf()(c, next)
})

const getLang = (c: any) => {
    const accept = c.req.header('Accept-Language') || ''
    return accept.includes('ja') ? dict.ja : dict.en
}

async function getSystemConfig(db: D1Database): Promise<SystemConfig> {
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

function getLocalizedValue(c: any, text: LocalizedText): string {
    const accept = c.req.header('Accept-Language') || ''
    return accept.includes('ja') ? text.ja : text.en
}

// アイコンアップロード用ヘルパー
async function handleIconUpload(body: any): Promise<string | null> {
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
async function checkPermission(c: any, userId: string, appId: string): Promise<{ allowed: boolean, reason?: string }> {
    const now = Math.floor(Date.now() / 1000)

    const app = await c.env.DB.prepare('SELECT status FROM apps WHERE id = ?').bind(appId).first() as App | null
    if (app && app.status === 'inactive') {
        return { allowed: false, reason: 'App is paused' }
    }

    const userPerm = await c.env.DB.prepare('SELECT * FROM permissions WHERE user_id = ? AND app_id = ?')
        .bind(userId, appId).first() as Permission | null

    if (userPerm) {
        if (userPerm.valid_from <= now && userPerm.valid_to >= now) return { allowed: true }
        else return { allowed: false, reason: 'User permission expired/invalid' }
    }

    const user = await c.env.DB.prepare('SELECT group_id FROM users WHERE id = ?').bind(userId).first() as User | null
    if (user && user.group_id) {
        const groupPerm = await c.env.DB.prepare('SELECT * FROM group_permissions WHERE group_id = ? AND app_id = ?')
            .bind(user.group_id, appId).first() as Permission | null
        if (groupPerm && groupPerm.valid_from <= now && groupPerm.valid_to >= now) return { allowed: true }
    }

    return { allowed: false, reason: 'No permission found' }
}

// D1 を使ったキー別の固定ウィンドウ・レートリミッター。許可なら true を返す。
// (Cloudflare ネイティブの rate-limit バインディングはベストエフォート/結果整合で、
// ここでは確実に効いていなかったため、権威ある(authoritative)カウンタを自前で持つ。)
async function rateLimit(db: D1Database, key: string, limit: number, windowSec: number): Promise<boolean> {
    const now = Math.floor(Date.now() / 1000)
    const row = await db.prepare('SELECT count, reset_at FROM rate_limits WHERE k = ?')
        .bind(key).first<{ count: number; reset_at: number }>()
    if (!row || row.reset_at <= now) {
        await db.prepare('INSERT INTO rate_limits (k, count, reset_at) VALUES (?, 1, ?) ON CONFLICT(k) DO UPDATE SET count = 1, reset_at = excluded.reset_at')
            .bind(key, now + windowSec).run()
        return true
    }
    if (row.count >= limit) return false
    await db.prepare('UPDATE rate_limits SET count = count + 1 WHERE k = ?').bind(key).run()
    return true
}

async function getAdmin(c: any) {
    const sessionId = getCookie(c, '__Host-idp_session')
    if (!sessionId) return null
    const session = await c.env.DB.prepare('SELECT user_id FROM sessions WHERE id = ?').bind(sessionId).first() as Session | null
    if (!session) return null
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(session.user_id).first() as User | null
    const admin = await c.env.DB.prepare('SELECT * FROM admins WHERE email = ?').bind(user?.email).first()
    return admin ? user : null
}

async function getUser(c: any) {
    const sessionId = getCookie(c, '__Host-idp_session')
    if (!sessionId) return null
    const session = await c.env.DB.prepare('SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?').bind(sessionId, Math.floor(Date.now() / 1000)).first() as Session | null
    if (!session) return null
    return await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(session.user_id).first() as User | null
}

// ユーザー取得 + group_admin 判定をまとめて返す。ユーザー向け画面で共通利用。
async function getUserCtx(c: any): Promise<{ user: User; isGroupAdmin: boolean } | null> {
    const user = await getUser(c)
    if (!user) return null
    const now = Math.floor(Date.now() / 1000)
    const ga = await c.env.DB.prepare(
        `SELECT 1 FROM group_memberships WHERE user_id = ? AND role = 'group_admin' AND valid_from <= ? AND valid_to >= ? LIMIT 1`
    ).bind(user.id, now, now).first()
    return { user, isGroupAdmin: !!ga }
}

// 【委任管理の認可プリミティブ】ユーザーが管理できるグループID集合を返す。
//   = 自分が有効な group_admin として所属するグループ + その子孫(サブツリー)すべて。
//   「グループのツリーは管理の委任構造」という思想に従い、親グループの管理者は配下支店も管理できる。
//   (サービス利用権の自動継承なし=ゲート②③とは別レイヤ。これは"管理権限"の話で、委任構造はツリーで降りる。)
//   委任系の全エンドポイントはこの集合で「操作対象グループが配下か」を必ず検証する。
async function getManagedGroupIds(c: any, userId: string): Promise<Set<string>> {
    const now = Math.floor(Date.now() / 1000)
    const { results: adminRows } = await c.env.DB.prepare(
        `SELECT group_id FROM group_memberships WHERE user_id = ? AND role = 'group_admin' AND valid_from <= ? AND valid_to >= ?`
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

// 利用者割当(ゲート③)の中核ロジック: ゲート②(利用枠)確認 + 席数上限チェック + upsert。
//   戻り値 'no_grant'(利用枠なし) / 'seat'(席数超過) / 'ok'。呼び出し側(運営者/委任)で
//   結果を表示に変換する。運営者ルートと委任ルートで共通利用し、判定の二重管理を防ぐ。
async function createAssignment(c: any, p: { userId: string; groupId: string; serviceId: string; facilityId: string; roleId: number; validFrom: number; validTo: number }): Promise<'no_grant' | 'seat' | 'ok'> {
    // ゲート②: このグループ×サービスの利用枠が無ければ割当不可。
    const grant = await c.env.DB.prepare('SELECT * FROM group_service_grants WHERE group_id = ? AND service_id = ?')
        .bind(p.groupId, p.serviceId).first() as any
    if (!grant) return 'no_grant'
    // 席数チェック(ライセンス=利用者数)。既にこのグループ×サービスに居る人は新規席を消費しない。
    const existing = await c.env.DB.prepare('SELECT COUNT(*) AS c FROM service_user_assignments WHERE user_id = ? AND group_id = ? AND service_id = ?')
        .bind(p.userId, p.groupId, p.serviceId).first() as { c: number } | null
    const isNewSeat = (existing?.c || 0) === 0
    if (isNewSeat) {
        // 支店別サブ枠(grant.seat_limit)。
        if (grant.seat_limit != null) {
            const usedG = await c.env.DB.prepare('SELECT COUNT(DISTINCT user_id) AS c FROM service_user_assignments WHERE group_id = ? AND service_id = ?')
                .bind(p.groupId, p.serviceId).first() as { c: number } | null
            if ((usedG?.c || 0) >= grant.seat_limit) return 'seat'
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
    // UNIQUE(user_id, group_id, service_id, facility_id) で upsert(役割・期間を更新)。
    await c.env.DB.prepare(`
        INSERT INTO service_user_assignments (user_id, group_id, service_id, facility_id, service_role_id, valid_from, valid_to)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, group_id, service_id, facility_id) DO UPDATE SET service_role_id=excluded.service_role_id, valid_from=excluded.valid_from, valid_to=excluded.valid_to
    `).bind(p.userId, p.groupId, p.serviceId, p.facilityId, p.roleId, p.validFrom, p.validTo).run()
    return 'ok'
}

// 監査ログを1行記録する。details は i18n キー方式({ key, params }) で保存する。
async function logAudit(c: any, eventType: string, details: object) {
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)')
        .bind(eventType, JSON.stringify(details)).run()
}

// サービス削除の連鎖。サービスに紐づく契約・利用枠・役割マスタ・割当をまとめて掃除する。
// (提供企業削除→各サービス削除でも使う)
async function deleteServiceCascade(c: any, serviceId: string) {
    await c.env.DB.batch([
        c.env.DB.prepare('DELETE FROM service_user_assignments WHERE service_id = ?').bind(serviceId),
        c.env.DB.prepare('DELETE FROM service_role_master WHERE service_id = ?').bind(serviceId),
        c.env.DB.prepare('DELETE FROM group_service_grants WHERE service_id = ?').bind(serviceId),
        c.env.DB.prepare('DELETE FROM service_contracts WHERE service_id = ?').bind(serviceId),
        c.env.DB.prepare('DELETE FROM services WHERE id = ?').bind(serviceId),
    ])
}

// 現在の(未失効の)セッション行を auth_time 込みで取得する。ユーザーだけでなく
// 認証時刻が必要な箇所(OIDC /authorize)で使う。
async function getSessionRow(c: any): Promise<Session | null> {
    const sessionId = getCookie(c, '__Host-idp_session')
    if (!sessionId) return null
    return await c.env.DB.prepare('SELECT * FROM sessions WHERE id = ? AND expires_at > ?')
        .bind(sessionId, Math.floor(Date.now() / 1000)).first() as Session | null
}

// 新しいログインセッションを作成し Cookie を設定する。auth_time(実際の認証時刻)を
// 記録するので OIDC の auth_time / max_age / prompt=login が機能する。
async function createSession(c: any, userId: string): Promise<void> {
    const sessionId = generateToken()
    const now = Math.floor(Date.now() / 1000)
    const expires = now + 86400
    await c.env.DB.prepare('INSERT INTO sessions (id, user_id, expires_at, auth_time) VALUES (?, ?, ?, ?)')
        .bind(sessionId, userId, expires, now).run()
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
function isAllowedRedirectUri(redirectUri: string, app: { base_url: string; redirect_uris?: string | null }): boolean {
    const registered = parseRedirectUris(app.redirect_uris)
    if (registered.length > 0) return registered.includes(redirectUri)

    let redir: URL, base: URL
    try {
        redir = new URL(redirectUri)
        base = new URL(app.base_url)
    } catch {
        return false
    }
    // リダイレクト先は http(s) のみ許可。
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
        const { results: apps } = await c.env.DB.prepare(`
        SELECT DISTINCT a.* FROM apps a
        LEFT JOIN permissions up ON a.id = up.app_id AND up.user_id = ?
        LEFT JOIN group_permissions gp ON a.id = gp.app_id AND gp.group_id = ?
        WHERE
          (a.status IS NULL OR a.status = 'active') AND
          ((up.valid_from <= ? AND up.valid_to >= ?) OR (up.id IS NULL AND gp.valid_from <= ? AND gp.valid_to >= ?))
      `).bind(user.id, user.group_id || null, now, now, now, now).all()

        return c.html(<UserDashboard t={t} userEmail={user.email} apps={apps as any} siteName={siteName} profileName={user.name} profilePicture={user.picture} isGroupAdmin={isGroupAdmin} />)
    } catch (e: any) {
        return c.json({ error: e.message, stack: e.stack }, 500)
    }
})

// グループ管理者ポータル: group_memberships で role='group_admin' のユーザー専用。
// システム管理者(admins テーブル)は /admin を使うためここには来ない想定だが、
// group_admin ロールも持っていれば閲覧できて問題ない。
app.get('/group-admin', async (c) => {
  try {
    const user = await getUser(c)
    if (!user) return c.redirect('/login')
    const t = getLang(c)
    const config = await getSystemConfig(c.env.DB)
    const siteName = getLocalizedValue(c, config.appName)
    const now = Math.floor(Date.now() / 1000)

    // 管理できるグループ = 自分が group_admin のグループ + その子孫(サブツリー)。
    // 親グループの管理者は配下支店も管理対象に含む(委任構造はツリーで降りる)。
    const managedIds = await getManagedGroupIds(c, user.id)

    const { results: allGroups } = await c.env.DB.prepare('SELECT id, name, parent_id FROM groups').all()
    const groupMap = new Map((allGroups as any[]).map(g => [g.id, g]))

    // 配下グループそれぞれの(有効)メンバー数を引いて一覧を組み立てる。
    const managedGroupsRaw: any[] = []
    for (const g of allGroups as any[]) {
        if (!managedIds.has(g.id)) continue
        const cnt = await c.env.DB.prepare(
            `SELECT COUNT(*) AS c FROM group_memberships WHERE group_id = ? AND valid_from <= ? AND valid_to >= ?`
        ).bind(g.id, now, now).first<{ c: number }>()
        managedGroupsRaw.push({ ...g, member_count: cnt?.c || 0 })
    }

    const managedGroups = (managedGroupsRaw as any[]).map((g: any) => {
        const parts = [g.name]
        let current = g
        const visited = new Set([current.id])
        let depth = 0
        while (current.parent_id && groupMap.has(current.parent_id)) {
            current = groupMap.get(current.parent_id)
            if (visited.has(current.id)) break
            visited.add(current.id)
            parts.unshift(current.name)
            depth++
        }
        return {
            ...g,
            original_name: g.name,
            full_name: parts.join(' > '),
            depth: depth,
            name: parts.join(' > ')
        }
    }).sort((a, b) => a.full_name.localeCompare(b.full_name, 'ja'))

    if (!managedGroups || managedGroups.length === 0) {
        const allUsers: any[] = []
        return c.html(<GroupAdminPage t={t} userEmail={user.email} siteName={siteName}
            profileName={user.name} profilePicture={user.picture}
            managedGroups={[]} allUsers={allUsers} membersByGroup={{}} assignmentsByGroup={{}} permissionsByGroup={{}}
            grantsByGroup={{}} grantsDetailByGroup={{}} availableContracts={[]} facilities={[]} rolesByService={{}} apps={[]} />)
    }

    const groupIds = managedGroups.map((g: any) => g.id as string)

    // 全ユーザー（メンバー追加候補）
    const { results: allUsers } = await c.env.DB.prepare('SELECT id, email, name FROM users ORDER BY email').all()

    // グループ別メンバー一覧
    const membersByGroup: Record<string, any[]> = {}
    for (const gid of groupIds) {
        const { results } = await c.env.DB.prepare(`
            SELECT m.id, m.user_id, u.email, u.name, m.role, m.valid_from, m.valid_to
            FROM group_memberships m JOIN users u ON m.user_id = u.id
            WHERE m.group_id = ? ORDER BY (m.role = 'group_admin') DESC, u.email
        `).bind(gid).all()
        membersByGroup[gid] = results || []
    }

    // グループ別サービス割当
    const assignmentsByGroup: Record<string, any[]> = {}
    for (const gid of groupIds) {
        const { results } = await c.env.DB.prepare(`
            SELECT a.id, u.email AS user_email, u.name AS user_name,
                   s.name AS service_name, a.facility_id,
                   f.structure_no, f.building_use,
                   r.role_name, a.valid_from, a.valid_to
            FROM service_user_assignments a
            LEFT JOIN users u ON a.user_id = u.id
            LEFT JOIN services s ON a.service_id = s.id
            LEFT JOIN facilities f ON a.facility_id = f.id
            LEFT JOIN service_role_master r ON a.service_role_id = r.id
            WHERE a.group_id = ?
            ORDER BY u.email, s.name
        `).bind(gid).all()
        assignmentsByGroup[gid] = results || []
    }

    // グループ別アプリアクセス権（グループメンバー全員の有効権限を集約）
    const permissionsByGroup: Record<string, any[]> = {}
    for (const gid of groupIds) {
        const perms: any[] = []
        const members = membersByGroup[gid] || []
        // ユーザー個別権限
        for (const m of members) {
            const { results: userPerms } = await c.env.DB.prepare(`
                SELECT p.app_id, a.name AS app_name, p.valid_from, p.valid_to
                FROM permissions p JOIN apps a ON p.app_id = a.id
                WHERE p.user_id = ? AND p.valid_from <= ? AND p.valid_to >= ?
            `).bind((m as any).user_id, now, now).all()
            for (const p of (userPerms || [])) {
                perms.push({ ...(p as any), source: 'user', user_email: (m as any).email })
            }
        }
        // グループ共通権限（メンバー全員に適用）
        const { results: grpPerms } = await c.env.DB.prepare(`
            SELECT p.app_id, a.name AS app_name, p.valid_from, p.valid_to
            FROM group_permissions p JOIN apps a ON p.app_id = a.id
            WHERE p.group_id = ? AND p.valid_from <= ? AND p.valid_to >= ?
        `).bind(gid, now, now).all()
        for (const p of (grpPerms || [])) {
            perms.push({ ...(p as any), source: 'group', user_email: '(グループ共通)' })
        }
        permissionsByGroup[gid] = perms
    }

    // 割当作成(ゲート③)用データ:
    //   - grantsByGroup: 各グループに開放済(有効)のサービス = サービス選択肢(ゲート②)
    //   - facilities: 管理サブツリー配下の施設(建物用途で役割を絞る)
    //   - rolesByService: サービス→役割マスタ(クライアントで建物用途フィルタ)
    const grantsByGroup: Record<string, any[]> = {}
    for (const gid of groupIds) {
        const { results } = await c.env.DB.prepare(`
            SELECT gs.service_id, s.name AS service_name
            FROM group_service_grants gs JOIN services s ON gs.service_id = s.id
            WHERE gs.group_id = ? AND gs.valid_from <= ? AND gs.valid_to >= ?
            ORDER BY s.name
        `).bind(gid, now, now).all()
        grantsByGroup[gid] = results || []
    }
    const { results: allFacilities } = await c.env.DB.prepare('SELECT id, structure_no, building_use, managing_group_id FROM facilities').all()
    const facilities = (allFacilities as any[]).filter(f => managedIds.has(f.managing_group_id))
    const { results: allRoles } = await c.env.DB.prepare('SELECT id, service_id, facility_type, role_name FROM service_role_master ORDER BY role_name').all()
    const rolesByService: Record<string, any[]> = {}
    for (const r of allRoles as any[]) {
        if (!rolesByService[r.service_id]) rolesByService[r.service_id] = []
        rolesByService[r.service_id].push(r)
    }

    // 利用枠(ゲート②)タブ用データ:
    //   - grantsDetailByGroup: 各グループの利用枠一覧(取消ボタン・契約・席数・期間つき)
    //   - availableContracts: 配布可能な契約 = 顧客組織が自分の管理サブツリーにある契約
    const grantsDetailByGroup: Record<string, any[]> = {}
    for (const gid of groupIds) {
        const { results } = await c.env.DB.prepare(`
            SELECT gr.id, gr.service_id, s.name AS service_name, gr.contract_id, gr.seat_limit, gr.valid_from, gr.valid_to
            FROM group_service_grants gr LEFT JOIN services s ON gr.service_id = s.id
            WHERE gr.group_id = ? ORDER BY s.name
        `).bind(gid).all()
        grantsDetailByGroup[gid] = results || []
    }
    const { results: allContracts } = await c.env.DB.prepare(`
        SELECT ct.id, ct.service_id, ct.customer_group_id, ct.seat_limit, s.name AS service_name, g.name AS group_name
        FROM service_contracts ct
        LEFT JOIN services s ON ct.service_id = s.id
        LEFT JOIN groups g ON ct.customer_group_id = g.id
    `).all()
    const availableContracts = (allContracts as any[]).filter(ct => managedIds.has(ct.customer_group_id))

    return c.html(<GroupAdminPage
        t={t} userEmail={user.email} siteName={siteName}
        profileName={user.name} profilePicture={user.picture}
        managedGroups={managedGroups as any}
        allUsers={allUsers as any}
        membersByGroup={membersByGroup}
        assignmentsByGroup={assignmentsByGroup}
        permissionsByGroup={permissionsByGroup}
        grantsByGroup={grantsByGroup}
        grantsDetailByGroup={grantsDetailByGroup}
        availableContracts={availableContracts as any}
        facilities={facilities as any}
        rolesByService={rolesByService}
        apps={[]}
    />)
  } catch (e: any) {
    return c.json({ error: e.message, stack: e.stack }, 500)
  }
})

// ============================================================
// 委任管理: グループ管理者向けの書込みAPI(/group-admin/api/*)。
//   運営者専用の /admin/api/am/* とは別物。呼び出し元が「対象グループの管理権限を
//   持つか」を getManagedGroupIds(自分が group_admin のグループ+子孫) で必ず検証する。
//   これにより group_admin は自分の配下サブツリーのメンバーだけを操作できる。
// ============================================================
app.post('/group-admin/api/membership/add', async (c) => {
    const user = await getUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const groupId = body['group_id'] as string
    const userIds = (body['user_ids'] as string[]) || []
    const role = body['role'] === 'group_admin' ? 'group_admin' : 'member'
    const validFrom = Number(body['valid_from'])
    const validTo = Number(body['valid_to'])
    if (!groupId || userIds.length === 0) return c.json({ error: 'group_id and user_ids required' }, 400)
    // 委任ゲート: 対象グループが自分の管理サブツリー内か。
    const managed = await getManagedGroupIds(c, user.id)
    if (!managed.has(groupId)) return c.json({ error: 'Forbidden' }, 403)
    // UNIQUE(user_id, group_id) を活かして upsert(役割・期間を更新)。
    for (const uid of userIds) {
        await c.env.DB.prepare(`
            INSERT INTO group_memberships (user_id, group_id, role, valid_from, valid_to) VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(user_id, group_id) DO UPDATE SET role=excluded.role, valid_from=excluded.valid_from, valid_to=excluded.valid_to
        `).bind(uid, groupId, role, validFrom, validTo).run()
    }
    await logAudit(c, 'DELEGATED_MEMBERSHIP_ADD', { key: 'log_membership_add', params: { count: userIds.length, group: groupId, role: role, admin: user.email } })
    return c.json({ success: true })
})
app.post('/group-admin/api/membership/remove', async (c) => {
    const user = await getUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const id = body['id']
    // 削除対象の所属が属するグループを引き、自分の管理サブツリー内か検証する。
    const row = await c.env.DB.prepare('SELECT group_id FROM group_memberships WHERE id = ?').bind(id).first() as { group_id: string } | null
    if (!row) return c.json({ error: 'Not found' }, 404)
    const managed = await getManagedGroupIds(c, user.id)
    if (!managed.has(row.group_id)) return c.json({ error: 'Forbidden' }, 403)
    await c.env.DB.prepare('DELETE FROM group_memberships WHERE id = ?').bind(id).run()
    await logAudit(c, 'DELEGATED_MEMBERSHIP_REMOVE', { key: 'log_membership_remove', params: { id: id, admin: user.email } })
    return c.json({ success: true })
})

// 委任: ゲート③ 利用者割当の作成。対象グループが自分の管理サブツリー内かを検証し、
//   ゲート②(利用枠)・席数上限は共通の createAssignment で判定する。
app.post('/group-admin/api/assignment/add', async (c) => {
    const user = await getUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const groupId = body['group_id'] as string
    const userId = body['user_id'] as string
    const serviceId = body['service_id'] as string
    const facilityId = body['facility_id'] as string
    const roleId = Number(body['service_role_id'])
    const validFrom = Number(body['valid_from'])
    const validTo = Number(body['valid_to'])
    if (!userId || !groupId || !serviceId || !facilityId || !roleId) return c.json({ error: 'missing fields' }, 400)
    const managed = await getManagedGroupIds(c, user.id)
    if (!managed.has(groupId)) return c.json({ error: 'Forbidden' }, 403)
    const res = await createAssignment(c, { userId, groupId, serviceId, facilityId, roleId, validFrom, validTo })
    if (res !== 'ok') return c.json({ error: res }, 400)
    await logAudit(c, 'DELEGATED_ASSIGNMENT_ADD', { key: 'log_assignment_add', params: { user: userId, service: serviceId, admin: user.email } })
    return c.json({ success: true })
})
app.post('/group-admin/api/assignment/remove', async (c) => {
    const user = await getUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const id = (await c.req.json())['id']
    // 割当が属するグループを引き、自分の管理サブツリー内か検証する。
    const row = await c.env.DB.prepare('SELECT group_id FROM service_user_assignments WHERE id = ?').bind(id).first() as { group_id: string } | null
    if (!row) return c.json({ error: 'Not found' }, 404)
    const managed = await getManagedGroupIds(c, user.id)
    if (!managed.has(row.group_id)) return c.json({ error: 'Forbidden' }, 403)
    await c.env.DB.prepare('DELETE FROM service_user_assignments WHERE id = ?').bind(id).run()
    await logAudit(c, 'DELEGATED_ASSIGNMENT_REMOVE', { key: 'log_assignment_delete', params: { id, admin: user.email } })
    return c.json({ success: true })
})

// 委任: ゲート② 利用枠の開放/取消。組織管理者が自組織の契約を配下グループへ配る。
//   開放先グループ・契約の顧客組織のいずれも自分の管理サブツリー内であることを要求する
//   (= 自分が管理する組織の契約のみ、自分の配下ノードへ配布できる)。
app.post('/group-admin/api/grant/add', async (c) => {
    const user = await getUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const groupId = body['group_id'] as string
    const contractId = body['contract_id'] as string
    const seatRaw = ((body['seat_limit'] ?? '') + '').trim()
    const seatLimit = seatRaw === '' ? null : Number(seatRaw)
    const validFrom = Number(body['valid_from'])
    const validTo = Number(body['valid_to'])
    if (!groupId || !contractId) return c.json({ error: 'missing fields' }, 400)
    const managed = await getManagedGroupIds(c, user.id)
    if (!managed.has(groupId)) return c.json({ error: 'Forbidden' }, 403)
    // 契約から service_id を引きつつ、契約の顧客組織も自分の管理下か検証する。
    const ct = await c.env.DB.prepare('SELECT service_id, customer_group_id FROM service_contracts WHERE id = ?').bind(contractId).first() as { service_id: string; customer_group_id: string } | null
    if (!ct) return c.json({ error: 'contract not found' }, 404)
    if (!managed.has(ct.customer_group_id)) return c.json({ error: 'Forbidden' }, 403)
    // UNIQUE(group_id, service_id) で upsert(契約・席数・期間を更新)。
    await c.env.DB.prepare(`
        INSERT INTO group_service_grants (group_id, service_id, contract_id, seat_limit, valid_from, valid_to) VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(group_id, service_id) DO UPDATE SET contract_id=excluded.contract_id, seat_limit=excluded.seat_limit, valid_from=excluded.valid_from, valid_to=excluded.valid_to
    `).bind(groupId, ct.service_id, contractId, seatLimit, validFrom, validTo).run()
    await logAudit(c, 'DELEGATED_GRANT_ADD', { key: 'log_grant_add', params: { group: groupId, service: ct.service_id, admin: user.email } })
    return c.json({ success: true })
})
app.post('/group-admin/api/grant/remove', async (c) => {
    const user = await getUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const id = (await c.req.json())['id']
    const row = await c.env.DB.prepare('SELECT group_id FROM group_service_grants WHERE id = ?').bind(id).first() as { group_id: string } | null
    if (!row) return c.json({ error: 'Not found' }, 404)
    const managed = await getManagedGroupIds(c, user.id)
    if (!managed.has(row.group_id)) return c.json({ error: 'Forbidden' }, 403)
    await c.env.DB.prepare('DELETE FROM group_service_grants WHERE id = ?').bind(id).run()
    await logAudit(c, 'DELEGATED_GRANT_REMOVE', { key: 'log_grant_delete', params: { id, admin: user.email } })
    return c.json({ success: true })
})

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
    return c.html(<AccountPage t={t} userEmail={user.email} siteName={siteName} has2FA={!!user.two_factor_secret} profileName={user.name} profileUsername={user.preferred_username} profilePicture={user.picture} message={message} isGroupAdmin={isGroupAdmin} />)
})

app.get('/login', async (c) => {
    const t = getLang(c)
    const config = await getSystemConfig(c.env.DB)
    const siteName = getLocalizedValue(c, config.appName)
    const siteSubtitle = getLocalizedValue(c, config.appSubtitle)
    const redirectTo = c.req.query('redirect_to')
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
        if (redirectTo) return issueCodeAndRedirect(c, user.id, redirectTo)
        const admin = await c.env.DB.prepare('SELECT * FROM admins WHERE email = ?').bind(user.email).first()
        return c.redirect(admin ? '/admin' : '/')
    }

    return c.html(<Login t={t} redirectTo={redirectTo} returnTo={returnTo} message={message} siteName={siteName} siteSubtitle={siteSubtitle} email={loginHint} />)
})

app.post('/login', async (c) => {
    const t = getLang(c)
    const config = await getSystemConfig(c.env.DB)
    const siteName = getLocalizedValue(c, config.appName)
    const siteSubtitle = getLocalizedValue(c, config.appSubtitle)

    // パスワード総当たりを遅らせるための IP 別レート制限。
    const loginIp = c.req.header('CF-Connecting-IP') || 'unknown'
    if (!(await rateLimit(c.env.DB, `login:${loginIp}`, 10, 60))) {
        return c.html(<Login t={t} error={t.error_rate_limited} siteName={siteName} siteSubtitle={siteSubtitle} />, 429)
    }

    const body = await c.req.parseBody()
    const email = body['email'] as string
    const password = body['password'] as string
    const redirectTo = body['redirect_to'] as string
    const returnTo = body['return_to'] as string // OIDC: /authorize URL to resume

    const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first() as User | null
    if (!user || !(await verifyPassword(password, user.password_hash))) {
        return c.html(<Login t={t} redirectTo={redirectTo} returnTo={returnTo} error={t.error_credentials} siteName={siteName} siteSubtitle={siteSubtitle} />)
    }

    // 2要素認証(2FA)チェック
    if (user.two_factor_secret) {
        const secret = c.env.JWT_SECRET || 'dev_secret'
        const token = await sign({ sub: user.id, role: 'pre_2fa', exp: Math.floor(Date.now() / 1000) + 300 }, secret)
        setCookie(c, 'pre_2fa_token', token, { path: '/', secure: true, httpOnly: true, maxAge: 300, sameSite: 'Lax' })

        const params = new URLSearchParams()
        if (redirectTo) params.set('redirect_to', redirectTo)
        if (returnTo) params.set('return_to', returnTo)
        const qs = params.toString()
        return c.redirect('/login/2fa' + (qs ? '?' + qs : ''))
    }

    await createSession(c, user.id)

    let targetAppName = 'Tobira Dashboard';
    const admin = await c.env.DB.prepare('SELECT * FROM admins WHERE email = ?').bind(email).first()
    if (redirectTo) {
        const { results } = await c.env.DB.prepare('SELECT * FROM apps WHERE status = ?').bind('active').all() as any;
        const app = (results as any[]).find((a: any) => isAllowedRedirectUri(redirectTo, a));
        if (app) targetAppName = app.name;
    } else if (admin) {
        targetAppName = 'Tobira Admin';
    }

    const details = JSON.stringify({ key: 'log_login_app', params: { email, appName: targetAppName } });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('LOGIN', details).run()

    if (returnTo && isSafeReturnTo(returnTo)) return c.redirect(returnTo)
    if (redirectTo) return issueCodeAndRedirect(c, user.id, redirectTo)

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
    const redirectTo = c.req.query('redirect_to')
    const returnTo = c.req.query('return_to')

    const user = await getUser(c)
    if (user) {
        if (returnTo && isSafeReturnTo(returnTo)) return c.redirect(returnTo)
        if (redirectTo) return issueCodeAndRedirect(c, user.id, redirectTo)
        return c.redirect('/')
    }
    return c.html(<Signup t={t} redirectTo={redirectTo} returnTo={returnTo} siteName={siteName} siteSubtitle={siteSubtitle} />)
})

app.post('/signup', async (c) => {
    const t = getLang(c)
    const config = await getSystemConfig(c.env.DB)
    const siteName = getLocalizedValue(c, config.appName)
    const siteSubtitle = getLocalizedValue(c, config.appSubtitle)
    const body = await c.req.parseBody()
    const email = ((body['email'] as string) || '').trim()
    const password = body['password'] as string
    const redirectTo = body['redirect_to'] as string
    const returnTo = body['return_to'] as string

    const view = (error: string) => c.html(<Signup t={t} redirectTo={redirectTo} returnTo={returnTo} error={error} siteName={siteName} siteSubtitle={siteSubtitle} />)

    // 自動化された大量登録を抑えるための IP 別レート制限。
    const signupIp = c.req.header('CF-Connecting-IP') || 'unknown'
    if (!(await rateLimit(c.env.DB, `signup:${signupIp}`, 5, 60))) {
        return c.html(<Signup t={t} redirectTo={redirectTo} returnTo={returnTo} error={t.error_rate_limited} siteName={siteName} siteSubtitle={siteSubtitle} />, 429)
    }

    if (!email || !password) return view(t.error_required)

    const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()
    if (existing) return view(t.error_user_exists)

    // 任意の既定グループ → そのグループのアプリ権限を継承する。
    const grpRow = await c.env.DB.prepare("SELECT value FROM system_config WHERE key = 'signup_group_id'").first<{ value: string }>()
    const groupId = grpRow?.value || null

    const userId = crypto.randomUUID()
    const pwHash = await hashPassword(password)
    const now = Math.floor(Date.now() / 1000)
    try {
        await c.env.DB.prepare('INSERT INTO users (id, email, password_hash, group_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
            .bind(userId, email, pwHash, groupId, now, now).run()
    } catch (e) {
        return view(t.error_user_exists)
    }

    const details = JSON.stringify({ key: 'log_login', params: { email } })
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('SIGNUP', details).run()

    // 作成したばかりのアカウントを自動ログインする。
    await createSession(c, userId)

    if (returnTo && isSafeReturnTo(returnTo)) return c.redirect(returnTo)
    if (redirectTo) return issueCodeAndRedirect(c, userId, redirectTo)
    return c.redirect('/')
})

async function issueCodeAndRedirect(c: any, userId: string, redirectTo: string) {
    const { results } = await c.env.DB.prepare('SELECT * FROM apps WHERE status = ?').bind('active').all() as any
    const app = (results as App[]).find(a => isAllowedRedirectUri(redirectTo, a))

    if (!app) {
        console.error(`[Auth] No app matches redirect_to: ${redirectTo}`);
        return c.text('Invalid App: Redirect URL not registered', 400)
    }

    const check = await checkPermission(c, userId, app.id)
    if (!check.allowed) return c.text('Access Denied: ' + (check.reason || ''), 403)

    const code = generateToken()
    const expires = Math.floor(Date.now() / 1000) + 300
    const session = await getSessionRow(c)
    await c.env.DB.prepare('INSERT INTO auth_codes (code, user_id, app_id, expires_at, auth_time) VALUES (?, ?, ?, ?, ?)').bind(code, userId, app.id, expires, session?.auth_time ?? null).run()

    const separator = redirectTo.includes('?') ? '&' : '?'
    return c.redirect(`${redirectTo}${separator}code=${code}`)
}

app.get('/logout', async (c) => {
    const sessionId = getCookie(c, '__Host-idp_session')
    if (sessionId) {
        const session = await c.env.DB.prepare('SELECT user_id FROM sessions WHERE id = ?').bind(sessionId).first() as Session | null
        if (session) {
            await c.env.DB.prepare('DELETE FROM app_sessions WHERE user_id = ?').bind(session.user_id).run()
        }
        try { await c.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run() } catch (e) { }
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
        await c.env.DB.prepare('UPDATE users SET two_factor_secret = ? WHERE id = ?').bind(secret, user.id).run()
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
    const body = await c.req.parseBody()
    const password = body['password'] as string
    const pwHash = await hashPassword(password)
    await c.env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(pwHash, user.id).run()
    const details = JSON.stringify({ key: 'log_password_change', params: { email: user.email } });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('PASSWORD_CHANGE', details).run()
    const config = await getSystemConfig(c.env.DB)
    const siteName = getLocalizedValue(c, config.appName)
    return c.html(<ChangePassword t={getLang(c)} siteName={siteName} userEmail={user.email} profileName={user.name} profilePicture={user.picture} message={getLang(c).msg_password_changed} />)
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

// --- API トークン ---
app.get('/api/me', async (c) => {
    const authHeader = c.req.header('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) return bearerUnauthorized(c)
    const token = authHeader.split(' ')[1]
    const session = await c.env.DB.prepare('SELECT * FROM app_sessions WHERE token = ? AND expires_at > ?').bind(token, Math.floor(Date.now() / 1000)).first()
    if (!session) return bearerUnauthorized(c, 'invalid_token', 'the access token is invalid or expired')
    const user = await c.env.DB.prepare('SELECT id, email, group_id, created_at FROM users WHERE id = ?').bind(session.user_id).first()
    if (!user) return c.json({ error: 'User not found' }, 404)
    return c.json(user)
})
app.post('/api/token', async (c) => {
    const body = await c.req.json().catch(() => { })
    const code = body['code']
    if (!code) return c.json({ error: 'Missing code' }, 400)
    const authCode = await c.env.DB.prepare('SELECT * FROM auth_codes WHERE code = ?').bind(code).first() as AuthCode | null
    if (!authCode || authCode.expires_at < Date.now() / 1000 || authCode.used_at) return c.json({ error: 'Invalid code' }, 400)
    await c.env.DB.prepare('UPDATE auth_codes SET used_at = ? WHERE code = ?').bind(Date.now() / 1000, code).run()
    const token = generateToken()
    const refreshToken = generateToken()
    const expiresAt = Math.floor(Date.now() / 1000) + 3600
    await c.env.DB.prepare('INSERT INTO app_sessions (token, refresh_token, user_id, app_id, expires_at) VALUES (?, ?, ?, ?, ?)')
        .bind(token, refreshToken, authCode.user_id, authCode.app_id, expiresAt).run()
    return c.json({ access_token: token, refresh_token: refreshToken, expires_in: 3600 })
})
app.post('/api/refresh', async (c) => {
    const body = await c.req.json().catch(() => { })
    const refreshToken = body['refresh_token']
    if (!refreshToken) return c.json({ error: 'Missing refresh_token' }, 400)
    const session = await c.env.DB.prepare('SELECT * FROM app_sessions WHERE refresh_token = ?').bind(refreshToken).first<Session & { app_id: string }>()
    if (!session) return c.json({ error: 'Invalid refresh token' }, 400)
    const check = await checkPermission(c, session.user_id, session.app_id)
    if (!check.allowed) {
        await c.env.DB.prepare('DELETE FROM app_sessions WHERE refresh_token = ?').bind(refreshToken).run()
        return c.json({ error: 'Access Denied', details: check.reason }, 403)
    }
    const newToken = generateToken()
    const newRefreshToken = generateToken()
    const newExpiresAt = Math.floor(Date.now() / 1000) + 3600
    await c.env.DB.prepare('UPDATE app_sessions SET token=?, refresh_token=?, expires_at=? WHERE refresh_token=?')
        .bind(newToken, newRefreshToken, newExpiresAt, refreshToken).run()
    return c.json({ access_token: newToken, refresh_token: newRefreshToken, expires_in: 3600 })
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
function isSafeReturnTo(v: string | undefined | null): boolean {
    return typeof v === 'string' && v.startsWith('/authorize')
}

function buildRedirect(redirectUri: string, mode: string | undefined, params: Record<string, string | undefined>): string {
    const usp = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) if (v != null && v !== '') usp.set(k, v)
    const sep = mode === 'fragment' ? '#' : (redirectUri.includes('?') ? '&' : '?')
    return redirectUri + sep + usp.toString()
}

function tokenError(c: any, error: string, description: string, status: 400 | 401 = 400) {
    return c.json({ error, error_description: description }, status)
}

// RFC 6750 §3: Bearer で保護されたリソースは、失敗したリクエストに WWW-Authenticate
// チャレンジを返さなければならない。認証情報が一切無い場合はチャレンジから error コードを
// 省略し、無効/失効トークンには error="invalid_token" を付ける。
function bearerUnauthorized(c: any, error?: string, description?: string) {
    let challenge = 'Bearer realm="tobira"'
    if (error) {
        challenge += `, error="${error}"`
        if (description) challenge += `, error_description="${description}"`
    }
    c.header('WWW-Authenticate', challenge)
    return c.json({ error: error || 'invalid_request', error_description: description }, 401)
}

// 定数時間の文字列比較(タイミングによるシークレット漏洩を防ぐ)。
function safeEqual(a: string, b: string): boolean {
    if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false
    let r = 0
    for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i)
    return r === 0
}

// トークンエンドポイント向けの OIDC クライアント認証。
// 機密クライアント(シークレット登録済み) -> シークレット必須かつ一致が必要。
// パブリッククライアント(シークレット未登録) -> PKCE が使われていなければならない。
async function authenticateClient(
    c: any, appId: string, providedSecret: string | undefined, usedPkce: boolean
): Promise<{ ok: true } | { ok: false; res: Response }> {
    const app = await c.env.DB.prepare('SELECT client_secret FROM apps WHERE id = ?').bind(appId).first() as { client_secret?: string | null } | null
    const registered = app?.client_secret
    if (registered) {
        if (!providedSecret || !safeEqual(providedSecret, registered)) {
            return { ok: false, res: tokenError(c, 'invalid_client', 'client authentication failed', 401) }
        }
    } else if (!usedPkce) {
        return { ok: false, res: tokenError(c, 'invalid_client', 'client authentication required: use PKCE or a registered client_secret') }
    }
    return { ok: true }
}

// Authorization ヘッダから client_secret_basic の資格情報を(あれば)取り出す。
function parseBasicAuth(c: any): { clientId?: string; secret?: string } {
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

async function parseClientBody(c: any): Promise<Record<string, string>> {
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
function buildOidcClaims(user: User, scope: string | null): Record<string, unknown> {
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
        claims.email_verified = true
    }
    return claims
}

// OIDC at_hash: base64url(SHA-256(access_token) の左側 128 ビット)。
async function computeAtHash(accessToken: string): Promise<string> {
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(accessToken)))
    const half = digest.slice(0, 16)
    let bin = ''
    for (let i = 0; i < half.length; i++) bin += String.fromCharCode(half[i])
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function issueOidcTokens(c: any, user: User, clientId: string, nonce: string | null, scope: string | null, authTime: number | null) {
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
    await c.env.DB.prepare('INSERT INTO app_sessions (token, refresh_token, user_id, app_id, expires_at, scope, auth_time) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(accessToken, refreshToken, user.id, clientId, now + expiresIn, grantedScope, effectiveAuthTime).run()

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
    }, c.env.DB, c.env.OIDC_KEK)

    return c.json({
        access_token: accessToken,
        id_token: idToken,
        token_type: 'Bearer',
        expires_in: expiresIn,
        ...(offlineAccess ? { refresh_token: refreshToken } : {}),
        scope: grantedScope,
    })
}

app.get('/.well-known/openid-configuration', (c) => {
    const issuer = new URL(c.req.url).origin
    return c.json({
        issuer,
        authorization_endpoint: `${issuer}/authorize`,
        token_endpoint: `${issuer}/oauth/token`,
        userinfo_endpoint: `${issuer}/userinfo`,
        jwks_uri: `${issuer}/.well-known/jwks.json`,
        end_session_endpoint: `${issuer}/oidc/logout`,
        // OIDC Back-Channel Logout 1.0: 各 RP の登録エンドポイントへ logout_token を
        // POST する。subject ベース(sid なし)なので session_supported=false。
        backchannel_logout_supported: true,
        backchannel_logout_session_supported: false,
        revocation_endpoint: `${issuer}/oauth/revoke`,
        revocation_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic', 'none'],
        introspection_endpoint: `${issuer}/oauth/introspect`,
        introspection_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic', 'none'],
        // RFC 7591 動的クライアント登録(保護付き: Initial Access Token が必要)。
        registration_endpoint: `${issuer}/register`,
        response_types_supported: ['code'],
        grant_types_supported: ['authorization_code', 'refresh_token'],
        subject_types_supported: ['public'],
        id_token_signing_alg_values_supported: ['RS256'],
        scopes_supported: ['openid', 'profile', 'email', 'offline_access'],
        token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic', 'none'],
        code_challenge_methods_supported: ['S256'],
        claims_supported: ['sub', 'email', 'email_verified', 'name', 'preferred_username', 'iss', 'aud', 'exp', 'iat', 'nonce', 'auth_time', 'at_hash'],
    })
})

app.get('/.well-known/jwks.json', async (c) => {
    const keys = await getJwksKeys(c.env.DB, c.env.OIDC_KEK)
    return c.json({ keys: keys.map(k => ({ ...k, alg: 'RS256', use: 'sig' })) })
})

app.get('/authorize', async (c) => {
    const q = c.req.query()
    const { client_id: clientId, redirect_uri: redirectUri, state, nonce, response_mode: responseMode } = q
    const responseType = q.response_type
    const scope = q.scope || 'openid'

    if (!clientId || !redirectUri) return c.text('invalid_request: client_id and redirect_uri are required', 400)

    const app = await c.env.DB.prepare('SELECT * FROM apps WHERE id = ?').bind(clientId).first() as App | null
    if (!app) return c.text('invalid_client: unknown client_id', 400)
    if (!isAllowedRedirectUri(redirectUri, app)) return c.text('invalid_request: redirect_uri is not registered for this client', 400)

    if (responseType && responseType !== 'code') {
        return c.redirect(buildRedirect(redirectUri, responseMode, { error: 'unsupported_response_type', error_description: 'only response_type=code is supported', state }))
    }

    // PKCE: S256 のみ受理。`plain` は廃止済み(OAuth 2.1 / RFC 7636 のセキュリティBCP)。
    // code_challenge を渡す場合は明示的に S256 メソッドを伴う必要がある — メソッド省略は
    // 従来 `plain` の既定だった(RFC 7636 §4.3)が、それも許可しない。
    if (q.code_challenge && q.code_challenge_method !== 'S256') {
        return c.redirect(buildRedirect(redirectUri, responseMode, {
            error: 'invalid_request',
            error_description: 'code_challenge_method must be S256 (plain is not supported)',
            state,
        }))
    }

    // OIDC Core 3.1.2.1: prompt + max_age が(再)認証の要否を決める。
    const now = Math.floor(Date.now() / 1000)
    const promptValues = (q.prompt || '').split(/\s+/).filter(Boolean)
    const promptNone = promptValues.includes('none')
    // 同意(consent)UI が無いので prompt=consent は何もしない。login/select_account は
    // どちらも「ユーザーを再度認証させる」を意味する。
    const forceLogin = promptValues.includes('login') || promptValues.includes('select_account')
    const maxAge = /^\d+$/.test(q.max_age || '') ? parseInt(q.max_age, 10) : null

    // 認証済みセッションを要求。無ければログインへ飛ばし、ここに戻って再開する。
    const session = await getSessionRow(c)
    const user = session
        ? await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(session.user_id).first() as User | null
        : null

    const maxAgeExceeded = !!(user && maxAge !== null && now - (session?.auth_time ?? 0) > maxAge)
    const needReauth = !user || forceLogin || maxAgeExceeded

    if (needReauth) {
        // prompt=none は一切の UI を禁止する: ログインフォームを出さずエラーを返す。
        if (promptNone) {
            return c.redirect(buildRedirect(redirectUri, responseMode, {
                error: 'login_required',
                error_description: user ? 're-authentication required but prompt=none' : 'no active session and prompt=none',
                state,
            }))
        }
        // ログイン後にこのリクエストをそのまま再開する。ただし `prompt` は除去する。
        // 再開後の authorize が再びログインを強制してループしないようにするため。max_age は
        // 残す: 新しいセッションなら自然に満たされる。`reauth=1` は /login に対し、まだ有効な
        // セッションを黙って再利用しないよう伝える(prompt=login / max_age 超過時)。
        const resume = new URL(c.req.url)
        resume.searchParams.delete('prompt')
        const returnTo = '/authorize' + resume.search
        // login_hint を /login へ渡し、メール欄を初期表示する(OIDC 3.1.2.1)。
        const hint = q.login_hint ? '&login_hint=' + encodeURIComponent(q.login_hint) : ''
        return c.redirect('/login?reauth=1' + hint + '&return_to=' + encodeURIComponent(returnTo))
    }

    // tobira のアプリ別権限ゲートを適用する。
    const check = await checkPermission(c, user.id, app.id)
    if (!check.allowed) {
        return c.redirect(buildRedirect(redirectUri, responseMode, { error: 'access_denied', error_description: check.reason || 'access denied', state }))
    }

    const code = generateToken()
    const expires = Math.floor(Date.now() / 1000) + 300
    // セッションの実際の auth_time を code に持ち込み、id_token がユーザーの実認証時刻を
    // 反映するようにする(OIDC auth_time)。
    await c.env.DB.prepare(
        'INSERT INTO auth_codes (code, user_id, app_id, expires_at, nonce, code_challenge, code_challenge_method, redirect_uri, scope, auth_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(code, user.id, app.id, expires, nonce || null, q.code_challenge || null, q.code_challenge_method || null, redirectUri, scope, session?.auth_time ?? null).run()

    return c.redirect(buildRedirect(redirectUri, responseMode, { code, state }))
})

app.post('/oauth/token', async (c) => {
    // RFC 6749 §5.1: トークンエンドポイントの応答はキャッシュしてはならない。
    c.header('Cache-Control', 'no-store')
    c.header('Pragma', 'no-cache')
    const body = await parseClientBody(c)

    // クライアント認証: client_secret_post(ボディ)または client_secret_basic(ヘッダ)。
    let basicClientId: string | undefined
    let basicClientSecret: string | undefined
    const authz = c.req.header('Authorization')
    if (authz && authz.startsWith('Basic ')) {
        try {
            const dec = atob(authz.slice(6))
            const i = dec.indexOf(':')
            basicClientId = decodeURIComponent(dec.slice(0, i))
            basicClientSecret = decodeURIComponent(dec.slice(i + 1))
        } catch { /* ignore */ }
    }
    const providedSecret = (body.client_secret as string) || basicClientSecret

    const grantType = body.grant_type

    if (grantType === 'authorization_code') {
        const code = body.code
        if (!code) return tokenError(c, 'invalid_request', 'missing code')
        const ac = await c.env.DB.prepare('SELECT * FROM auth_codes WHERE code = ?').bind(code).first() as AuthCode | null
        const nowSec = Math.floor(Date.now() / 1000)
        if (!ac || ac.used_at || ac.expires_at < nowSec) return tokenError(c, 'invalid_grant', 'authorization code is invalid or expired')
        await c.env.DB.prepare('UPDATE auth_codes SET used_at = ? WHERE code = ?').bind(nowSec, code).run()

        const clientId = body.client_id || basicClientId
        if (clientId && clientId !== ac.app_id) return tokenError(c, 'invalid_grant', 'client_id does not match the authorization code')
        // RFC 6749 §4.1.3 / OIDC: 認可リクエストで redirect_uri が使われた場合
        // (/authorize では常に該当)、トークンリクエストにも同一のものを含めなければ
        // ならない。以前はクライアントが送る選択をしたときだけ検証していたため、
        // redirect_uri を省略すると検証を素通りしていた。
        if (ac.redirect_uri) {
            if (!body.redirect_uri) return tokenError(c, 'invalid_grant', 'redirect_uri is required')
            if (body.redirect_uri !== ac.redirect_uri) return tokenError(c, 'invalid_grant', 'redirect_uri does not match')
        }

        const pkceOk = await verifyPkce(body.code_verifier, ac.code_challenge as any, ac.code_challenge_method as any)
        if (!pkceOk) return tokenError(c, 'invalid_grant', 'PKCE verification failed')

        const auth = await authenticateClient(c, ac.app_id, providedSecret, !!ac.code_challenge)
        if (!auth.ok) return auth.res

        const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(ac.user_id).first() as User | null
        if (!user) return tokenError(c, 'invalid_grant', 'user not found')

        return issueOidcTokens(c, user, ac.app_id, (ac.nonce as any) || null, (ac.scope as any) || null, (ac.auth_time as any) ?? null)
    }

    if (grantType === 'refresh_token') {
        const refreshToken = body.refresh_token
        if (!refreshToken) return tokenError(c, 'invalid_request', 'missing refresh_token')
        const session = await c.env.DB.prepare('SELECT * FROM app_sessions WHERE refresh_token = ?').bind(refreshToken).first() as any
        if (!session) return tokenError(c, 'invalid_grant', 'invalid refresh_token')
        // パブリッククライアントはシークレット無しで更新可。機密クライアントは認証必須。
        const auth = await authenticateClient(c, session.app_id, providedSecret, true)
        if (!auth.ok) return auth.res
        const check = await checkPermission(c, session.user_id, session.app_id)
        if (!check.allowed) {
            await c.env.DB.prepare('DELETE FROM app_sessions WHERE refresh_token = ?').bind(refreshToken).run()
            return tokenError(c, 'invalid_grant', check.reason || 'access denied')
        }
        const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(session.user_id).first() as User | null
        if (!user) return tokenError(c, 'invalid_grant', 'user not found')
        await c.env.DB.prepare('DELETE FROM app_sessions WHERE refresh_token = ?').bind(refreshToken).run()
        // 更新をまたいで当初付与の scope と auth_time を保持し、更新後の id_token が
        // 元の認証時刻を保つようにする。
        return issueOidcTokens(c, user, session.app_id, null, (session.scope as string) || null, (session.auth_time as number) ?? null)
    }

    return tokenError(c, 'unsupported_grant_type', grantType ? `grant_type '${grantType}' is not supported` : 'missing grant_type')
})

app.on(['GET', 'POST'], '/userinfo', async (c) => {
    const auth = c.req.header('Authorization') || ''
    if (!auth.startsWith('Bearer ')) return bearerUnauthorized(c)
    const token = auth.slice(7)
    const session = await c.env.DB.prepare('SELECT * FROM app_sessions WHERE token = ? AND expires_at > ?')
        .bind(token, Math.floor(Date.now() / 1000)).first() as any
    if (!session) return bearerUnauthorized(c, 'invalid_token', 'the access token is invalid or expired')
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(session.user_id).first() as User | null
    if (!user) return bearerUnauthorized(c, 'invalid_token', 'the access token is invalid or expired')
    // sub は常に返す。その他のクレームはトークンに付与された scope に依存する。
    return c.json({
        sub: user.id,
        ...buildOidcClaims(user, (session.scope as string) || null),
    })
})

// OIDC Back-Channel Logout 1.0 §2.4: logout_token は `events` メンバーを持ち subject を
// 特定する署名付き JWT。ここでは subject 単位でログアウトする(そのユーザーの app_sessions
// を全て失効)ので `sid` は省略し、backchannel_logout_session_supported:false を広告する
// — RP はこの sub の自分の全セッションをログアウトする。
async function backchannelLogoutToken(c: any, issuer: string, clientId: string, userId: string): Promise<string> {
    return signRS256({
        iss: issuer,
        aud: clientId,
        sub: userId,
        iat: Math.floor(Date.now() / 1000),
        jti: generateToken(),
        events: { 'http://schemas.openid.net/event/backchannel-logout': {} },
    }, c.env.DB, c.env.OIDC_KEK, 'logout+jwt')
}

// ユーザーがログイン中の RP のうち、backchannel_logout_uri を登録しているもの全てに
// 通知する。同一アカウントの Worker はその *.workers.dev ホストへ直接 fetch しても届かない
// (Cloudflare エラー 1042)ため、RP_<APP_ID> という名前のサービスバインディングがあれば
// それ経由で送り、外部 RP は通常の fetch を使う。短いタイムアウトでベストエフォート —
// 到達不能な RP でログアウトが固まってはならない。
async function sendBackchannelLogouts(c: any, issuer: string, userId: string): Promise<void> {
    const { results } = await c.env.DB.prepare(
        `SELECT DISTINCT a.id AS app_id, a.backchannel_logout_uri AS uri
           FROM app_sessions s JOIN apps a ON a.id = s.app_id
          WHERE s.user_id = ? AND a.backchannel_logout_uri IS NOT NULL AND a.backchannel_logout_uri != ''`
    ).bind(userId).all() as any
    const targets = (results as any[]) || []
    if (targets.length === 0) return
    await Promise.allSettled(targets.map(async (t: any) => {
        const logoutToken = await backchannelLogoutToken(c, issuer, t.app_id, userId)
        const bindingName = 'RP_' + String(t.app_id).toUpperCase().replace(/[^A-Z0-9]/g, '_')
        const fetcher = (c.env as any)[bindingName]?.fetch ? (c.env as any)[bindingName] : { fetch }
        const ctrl = new AbortController()
        const timer = setTimeout(() => ctrl.abort(), 4000)
        try {
            await fetcher.fetch(t.uri, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ logout_token: logoutToken }).toString(),
                signal: ctrl.signal,
            })
        } catch { /* RP unreachable — best effort */ } finally { clearTimeout(timer) }
    }))
}

// RP起点ログアウト(OIDC RP-Initiated Logout 1.0)。GET と POST に対応。
// パラメータ: post_logout_redirect_uri(+ Auth0風の returnTo エイリアス)、id_token_hint、
// state。ブラウザの SSO セッションを終了し、かつ発行済み OIDC トークン(app_sessions)を
// 失効させるので、ログアウトで実際に access/refresh が無効になる。さらにユーザーがログイン
// 中の全 RP へ OIDC Back-Channel Logout を送出する。
app.on(['GET', 'POST'], '/oidc/logout', async (c) => {
    // パラメータはクエリ文字列から読み、POST フォーム送信ならボディからも読む。
    const q = c.req.query()
    let p: Record<string, string> = { ...q }
    if (c.req.method === 'POST') {
        try {
            const body = await c.req.parseBody()
            for (const [k, v] of Object.entries(body)) if (typeof v === 'string') p[k] = v
        } catch { /* ignore */ }
    }
    const idTokenHint = p.id_token_hint
    const state = p.state
    const dest = p.post_logout_redirect_uri || p.returnTo

    // エンドユーザーを特定する。有効な SSO セッションを優先し、無ければ id_token_hint
    // (自身が発行した検証済みトークン)内の sub にフォールバックする。これにより、
    // ブラウザのセッションCookieが既に消えていてもトークン失効は機能する。
    const sessionId = getCookie(c, '__Host-idp_session')
    let userId: string | null = null
    if (sessionId) {
        const session = await c.env.DB.prepare('SELECT user_id FROM sessions WHERE id = ?').bind(sessionId).first() as Session | null
        if (session) userId = session.user_id
    }

    // id_token_hint を検証する(署名のみ — ログアウト時には通常すでに失効している)。
    let hintAud: string | null = null
    if (idTokenHint) {
        const payload = await verifyRS256(idTokenHint, c.env.DB, c.env.OIDC_KEK)
        if (payload) {
            hintAud = typeof payload.aud === 'string' ? payload.aud
                : Array.isArray(payload.aud) ? String(payload.aud[0]) : null
            if (!userId && typeof payload.sub === 'string') userId = payload.sub
        }
    }

    // バックチャネルログアウト: app_sessions を削除する前に、ユーザーがログイン中の各 RP へ
    // 通知する(どの RP に届けるかを知るために app_sessions を読むため)。
    if (userId) {
        try { await sendBackchannelLogouts(c, new URL(c.req.url).origin, userId) } catch (e) { }
    }
    // #9: このユーザーの OIDC トークンを失効させ、access/refresh を無効化する。
    if (userId) {
        try { await c.env.DB.prepare('DELETE FROM app_sessions WHERE user_id = ?').bind(userId).run() } catch (e) { }
    }
    // ブラウザの SSO セッションを終了し Cookie をクリアする。
    if (sessionId) {
        try { await c.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run() } catch (e) { }
    }
    setCookie(c, '__Host-idp_session', '', { path: '/', secure: true, httpOnly: true, expires: new Date(0) })

    // 遷移先が登録済みの場合のみ RP へリダイレクトする(オープンリダイレクト防止)。
    // id_token_hint がある場合は、遷移先がそのトークンのクライアント(aud)に属することも
    // 要求する。#11: state はそのままエコーする。
    if (dest) {
        const { results } = await c.env.DB.prepare('SELECT id, base_url, redirect_uris FROM apps WHERE status = ?').bind('active').all() as any
        const matching = (results as any[]).filter((a: any) => isAllowedRedirectUri(dest, a))
        const allowed = hintAud
            ? matching.some((a: any) => a.id === hintAud)
            : matching.length > 0
        if (allowed) {
            const target = state ? dest + (dest.includes('?') ? '&' : '?') + 'state=' + encodeURIComponent(state) : dest
            return c.redirect(target)
        }
    }
    return c.redirect('/login')
})

// トークン失効(RFC 7009)。RP が access_token または refresh_token を提示し、
// (機密クライアントなら)認証する。一致した app_session を削除する。
// §2.2 により、形式が正しいリクエストにはトークンが未知/既に無効でも 200 を返す。
// これによりクライアントはトークンの有効性を探れない。
app.post('/oauth/revoke', async (c) => {
    c.header('Cache-Control', 'no-store')
    c.header('Pragma', 'no-cache')
    const body = await parseClientBody(c)

    // クライアント認証: client_secret_post(ボディ)または client_secret_basic(ヘッダ)。
    const basic = parseBasicAuth(c)
    const providedSecret = (body.client_secret as string) || basic.secret

    const token = body.token
    if (!token) return tokenError(c, 'invalid_request', 'missing token')
    const hint = body.token_type_hint

    // トークンを access token または refresh token として引き当てる。token_type_hint は
    // あくまで最適化であり、RFC 7009 §2.1 はもう一方の種別も試すことを要求する。
    const byRefresh = c.env.DB.prepare('SELECT * FROM app_sessions WHERE refresh_token = ?').bind(token)
    const byAccess = c.env.DB.prepare('SELECT * FROM app_sessions WHERE token = ?').bind(token)
    let session = await (hint === 'access_token' ? byAccess : byRefresh).first() as any
    if (!session) session = await (hint === 'access_token' ? byRefresh : byAccess).first() as any

    if (session) {
        // トークンが発行されたクライアントだけがそれを失効できる。
        const auth = await authenticateClient(c, session.app_id, providedSecret, true)
        if (!auth.ok) return auth.res
        const clientId = (body.client_id as string) || basic.clientId
        if (!clientId || clientId === session.app_id) {
            await c.env.DB.prepare('DELETE FROM app_sessions WHERE id = ?').bind(session.id).run()
        }
    }
    // 未知のトークン → 何もせず成功扱い(§2.2)。
    return c.body(null, 200)
})

// トークンイントロスペクション(RFC 7662)。RP が access_token または refresh_token を
// 提示して認証する。IdP はそれが active かどうかとメタデータを返す。
// 呼び出し元クライアント以外に属するトークンは inactive として返す(§4 プライバシー)。
app.post('/oauth/introspect', async (c) => {
    c.header('Cache-Control', 'no-store')
    c.header('Pragma', 'no-cache')
    const body = await parseClientBody(c)
    const basic = parseBasicAuth(c)
    const providedSecret = (body.client_secret as string) || basic.secret
    const callerId = (body.client_id as string) || basic.clientId

    const token = body.token
    if (!token) return tokenError(c, 'invalid_request', 'missing token')

    // 呼び出し元は登録済みクライアントとして認証しなければならない(RFC 7662 §2.1)。
    // ここでは*呼び出し元自身*の身元を認証する — トークンの所有者ではない — ので、
    // 他クライアントに属するトークンは invalid_client エラーで存在を漏らす代わりに
    // inactive として返される。
    if (!callerId) return tokenError(c, 'invalid_client', 'client authentication required', 401)
    const auth = await authenticateClient(c, callerId, providedSecret, true)
    if (!auth.ok) return auth.res

    const hint = body.token_type_hint
    const inactive = () => c.json({ active: false })

    const byRefresh = c.env.DB.prepare('SELECT * FROM app_sessions WHERE refresh_token = ?').bind(token)
    const byAccess = c.env.DB.prepare('SELECT * FROM app_sessions WHERE token = ?').bind(token)
    // どちらの形式で一致したかを記録し、token_type のラベル付けと access token の失効判定に使う。
    let session = await (hint === 'refresh_token' ? byRefresh : byAccess).first() as any
    let matchedAccess = !!session && session.token === token
    if (!session) {
        session = await (hint === 'refresh_token' ? byAccess : byRefresh).first() as any
        matchedAccess = !!session && session.token === token
    }
    // 未知のトークン、または別クライアントに属するトークン → inactive(§4 プライバシー)。
    if (!session || session.app_id !== callerId) return inactive()

    const now = Math.floor(Date.now() / 1000)
    // access token は expires_at で失効。refresh token はローテーション/失効まで有効。
    if (matchedAccess && session.expires_at <= now) return inactive()

    return c.json({
        active: true,
        scope: session.scope || undefined,
        client_id: session.app_id,
        sub: session.user_id,
        token_type: matchedAccess ? 'Bearer' : 'refresh_token',
        ...(matchedAccess ? { exp: session.expires_at } : {}),
        ...(session.auth_time != null ? { auth_time: session.auth_time } : {}),
    })
})

// OIDC 動的クライアント登録(RFC 7591)。保護付き登録: 呼び出し元は管理者が発行した
// Initial Access Token を Bearer トークンとして提示しなければならない。成功すると、
// 管理画面の「アプリ作成」フォームと全く同様に新しい機密(またはパブリック)クライアントが
// `apps` に作成され、その資格情報が返される。
app.post('/register', async (c) => {
    c.header('Cache-Control', 'no-store')
    c.header('Pragma', 'no-cache')
    const regError = (code: string, desc: string) => c.json({ error: code, error_description: desc }, 400)
    const unauthorized = (desc: string) =>
        c.json({ error: 'invalid_token', error_description: desc }, 401, { 'WWW-Authenticate': 'Bearer error="invalid_token"' })

    // RFC 7591 §1.2: Initial Access Token を必須化(管理者発行・失効可能)。
    const authz = c.req.header('Authorization') || ''
    const iat = authz.startsWith('Bearer ') ? authz.slice(7).trim() : ''
    if (!iat) return unauthorized('an Initial Access Token is required (Authorization: Bearer ...)')
    const nowSec = Math.floor(Date.now() / 1000)
    const tokenRow = await c.env.DB.prepare('SELECT * FROM registration_tokens WHERE token = ?').bind(iat).first() as any
    if (!tokenRow || (tokenRow.expires_at && tokenRow.expires_at < nowSec)) {
        return unauthorized('the Initial Access Token is invalid or expired')
    }

    // クライアントメタデータは JSON オブジェクト(RFC 7591 §2 / §3.1)。
    let meta: any
    try { meta = await c.req.json() } catch { return regError('invalid_client_metadata', 'request body must be a JSON object') }
    if (!meta || typeof meta !== 'object') return regError('invalid_client_metadata', 'request body must be a JSON object')

    // grant_types: authorization_code(+ refresh_token)に対応。既定値は仕様準拠。
    const requestedGrants: string[] = Array.isArray(meta.grant_types) && meta.grant_types.length ? meta.grant_types : ['authorization_code']
    const supportedGrants = ['authorization_code', 'refresh_token']
    for (const g of requestedGrants) if (!supportedGrants.includes(g)) return regError('invalid_client_metadata', 'unsupported grant_type: ' + g)
    const needsRedirect = requestedGrants.includes('authorization_code')

    // redirect_uris: authorization_code グラントでは必須。各々が絶対 https URI で
    // (http は localhost のみ)、フラグメントを含まないこと(RFC 7591 §2 / §5)。
    const redirectUris: string[] = Array.isArray(meta.redirect_uris) ? meta.redirect_uris.filter((u: any) => typeof u === 'string') : []
    if (needsRedirect && redirectUris.length === 0) return regError('invalid_redirect_uri', 'redirect_uris is required for the authorization_code grant')
    for (const u of redirectUris) {
        let parsed: URL
        try { parsed = new URL(u) } catch { return regError('invalid_redirect_uri', 'not a valid absolute URI: ' + u) }
        const isLocal = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1'
        if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && isLocal)) return regError('invalid_redirect_uri', 'must be https (http allowed only for localhost): ' + u)
        if (parsed.hash) return regError('invalid_redirect_uri', 'must not contain a fragment: ' + u)
    }

    // token_endpoint_auth_method: 'none' => パブリッククライアント(PKCE、シークレットなし)。
    const authMethod = typeof meta.token_endpoint_auth_method === 'string' ? meta.token_endpoint_auth_method : 'client_secret_basic'
    if (!['none', 'client_secret_basic', 'client_secret_post'].includes(authMethod)) return regError('invalid_client_metadata', 'unsupported token_endpoint_auth_method: ' + authMethod)
    const isPublic = authMethod === 'none'

    const clientId = 'dcr-' + generateToken()
    const clientSecret = isPublic ? null : (generateToken() + generateToken().replace(/-/g, ''))
    const clientName = (typeof meta.client_name === 'string' && meta.client_name.trim()) ? meta.client_name.trim() : clientId
    // base_url は管理画面表示と旧方式リダイレクトのフォールバックに使う。client_uri か
    // 最初の redirect_uri のオリジンから導出する。
    let baseUrl = ''
    if (typeof meta.client_uri === 'string') { try { baseUrl = new URL(meta.client_uri).origin } catch { /* ignore */ } }
    if (!baseUrl && redirectUris.length) { try { baseUrl = new URL(redirectUris[0]).origin } catch { /* ignore */ } }
    if (!baseUrl) baseUrl = 'https://example.invalid'
    const backchannel = (typeof meta.backchannel_logout_uri === 'string' && meta.backchannel_logout_uri.trim()) ? meta.backchannel_logout_uri.trim() : null
    const iconUrl = typeof meta.logo_uri === 'string' ? meta.logo_uri : null

    await c.env.DB.prepare('INSERT INTO apps (id, name, base_url, status, created_at, icon_url, client_secret, redirect_uris, backchannel_logout_uri) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(clientId, clientName, baseUrl, 'active', nowSec, iconUrl, clientSecret, redirectUris.join('\n'), backchannel).run()
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)')
        .bind('APP_REGISTERED', JSON.stringify({ key: 'log_app_created', params: { appName: clientName, id: clientId, admin: 'dynamic-registration (' + (tokenRow.created_by || 'iat') + ')' } })).run()

    // RFC 7591 §3.2.1 成功: 登録メタデータ + 資格情報を 201 で返す。
    const resp: Record<string, unknown> = {
        client_id: clientId,
        client_id_issued_at: nowSec,
        redirect_uris: redirectUris,
        grant_types: requestedGrants,
        response_types: needsRedirect ? ['code'] : [],
        token_endpoint_auth_method: authMethod,
        client_name: clientName,
    }
    if (clientSecret) { resp.client_secret = clientSecret; resp.client_secret_expires_at = 0 }
    if (backchannel) resp.backchannel_logout_uri = backchannel
    if (typeof meta.scope === 'string') resp.scope = meta.scope
    return c.json(resp, 201)
})

// --- 管理(Admin) ---
app.get('/admin', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const t = getLang(c)
    const config = await getSystemConfig(c.env.DB)
    const siteName = getLocalizedValue(c, config.appName)
    const stats = {
        apps: await c.env.DB.prepare('SELECT COUNT(*) as c FROM apps').first('c'),
        users: await c.env.DB.prepare('SELECT COUNT(*) as c FROM users').first('c'),
        logs: await c.env.DB.prepare('SELECT COUNT(*) as c FROM audit_logs').first('c'),
    }
    return c.html(<AdminHome t={t} userEmail={user.email} stats={stats as any} siteName={siteName} appConfig={config} />)
})
app.get('/admin/apps', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const config = await getSystemConfig(c.env.DB)
    const siteName = getLocalizedValue(c, config.appName)
    const { results } = await c.env.DB.prepare('SELECT * FROM apps ORDER BY created_at DESC').all()
    const regTokens = await c.env.DB.prepare('SELECT token, created_at, expires_at FROM registration_tokens ORDER BY created_at DESC').all()
    return c.html(<AppsPage t={getLang(c)} userEmail={user.email} apps={results as any} regTokens={regTokens.results as any} siteName={siteName} appConfig={config} />)
})

// RFC 7591 動的登録用の Initial Access Token を発行する。任意の `days` で有効期限を
// 設定する(空欄/0 = 無期限)。管理者専用。
app.post('/admin/registration-tokens', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const days = parseInt((body['days'] as string) || '0', 10)
    const now = Math.floor(Date.now() / 1000)
    const expiresAt = Number.isFinite(days) && days > 0 ? now + days * 86400 : null
    const token = 'iat-' + generateToken() + generateToken().replace(/-/g, '')
    await c.env.DB.prepare('INSERT INTO registration_tokens (token, created_by, created_at, expires_at) VALUES (?, ?, ?, ?)')
        .bind(token, user.email, now, expiresAt).run()
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)')
        .bind('REG_TOKEN_CREATED', JSON.stringify({ key: 'log_app_updated', params: { appName: 'registration token', status: 'created', admin: user.email } })).run()
    return c.redirect('/admin/apps')
})

// Initial Access Token を失効(削除)する。管理者専用。
app.post('/admin/registration-tokens/delete', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    await c.env.DB.prepare('DELETE FROM registration_tokens WHERE token = ?').bind(body['token']).run()
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)')
        .bind('REG_TOKEN_REVOKED', JSON.stringify({ key: 'log_app_updated', params: { appName: 'registration token', status: 'revoked', admin: user.email } })).run()
    return c.redirect('/admin/apps')
})

// === アプリ作成(改修版) ===
app.post('/admin/apps', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const now = Math.floor(Date.now() / 1000)
    
    // アイコンアップロード
    const iconData = await handleIconUpload(body)
    const iconUrl = iconData || (body['icon_url'] as string) || await fetchAppIcon(body['base_url'] as string)

    // 新規アプリは既定で機密(シークレットを生成)。パブリック/SPA クライアントにするのは
    // 後から編集モーダルの「パブリックにする」操作で行う。
    const clientSecret = generateToken() + generateToken().replace(/-/g, '')

    const redirectUris = ((body['redirect_uris'] as string) || '').trim() || null
    const backchannelLogoutUri = ((body['backchannel_logout_uri'] as string) || '').trim() || null
    await c.env.DB.prepare('INSERT INTO apps (id, name, base_url, status, created_at, description, icon_url, client_secret, redirect_uris, backchannel_logout_uri) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(body['id'], body['name'], body['base_url'], 'active', now, body['description'], iconUrl, clientSecret, redirectUris, backchannelLogoutUri).run()

    const details = JSON.stringify({ key: 'log_app_created', params: { appName: body['name'], id: body['id'], admin: user.email } });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('APP_CREATED', details).run()
    return c.redirect('/admin/apps')
})

// アプリの client_secret を再生成、またはクリア(=パブリック化)する。
app.post('/admin/apps/secret', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const id = body['id']
    const action = body['action']
    const secret = action === 'clear' ? null : (generateToken() + generateToken().replace(/-/g, ''))
    await c.env.DB.prepare('UPDATE apps SET client_secret = ? WHERE id = ?').bind(secret, id).run()
    const details = JSON.stringify({ key: 'log_app_updated', params: { appName: id, status: action === 'clear' ? 'secret cleared' : 'secret regenerated', admin: user.email } });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('APP_UPDATED', details).run()
    return c.redirect('/admin/apps')
})

// === アプリ更新(改修版) ===
app.post('/admin/apps/update', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const id = body['id']
    
    // アイコンアップロードのロジック:
    // 1. アップロードされたファイルがある? -> それを使う。
    // 2. 隠しフィールド(既存URL)またはテキスト入力がある? -> それを使う。
    // 3. フォールバック -> 自動取得 or 旧値維持?(ここでは主にフォーム入力を使う)
    const iconData = await handleIconUpload(body)
    const iconUrl = iconData || (body['icon_url'] as string) || await fetchAppIcon(body['base_url'] as string)

    const redirectUris = ((body['redirect_uris'] as string) || '').trim() || null
    const backchannelLogoutUri = ((body['backchannel_logout_uri'] as string) || '').trim() || null
    await c.env.DB.prepare('UPDATE apps SET name = ?, base_url = ?, description = ?, icon_url = ?, redirect_uris = ?, backchannel_logout_uri = ? WHERE id = ?')
        .bind(body['name'], body['base_url'], body['description'], iconUrl, redirectUris, backchannelLogoutUri, id).run()
        
    const details = JSON.stringify({ key: 'log_app_updated', params: { appName: body['name'], status: 'Updated', admin: user.email } });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('APP_UPDATED', details).run()
    return c.redirect('/admin/apps')
})

app.post('/admin/apps/toggle', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const id = body['id']
    const status = body['status']
    await c.env.DB.prepare('UPDATE apps SET status = ? WHERE id = ?').bind(status, id).run()
    const details = JSON.stringify({ key: 'log_app_updated', params: { appName: id, status: status, admin: user.email } });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('APP_UPDATED', details).run()
    return c.redirect('/admin/apps')
})
app.post('/admin/apps/delete', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const id = body['id']
    await c.env.DB.batch([
        c.env.DB.prepare('DELETE FROM permissions WHERE app_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM group_permissions WHERE app_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM auth_codes WHERE app_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM app_sessions WHERE app_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM apps WHERE id = ?').bind(id)
    ])
    const details = JSON.stringify({ key: 'log_app_deleted', params: { id: id, admin: user.email } });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('APP_DELETED', details).run()
    return c.redirect('/admin/apps')
})

// グループ・ユーザー等... は元のままだが、整合性のために含めている
app.get('/admin/groups', async (c) => {
    try {
        const user = await getAdmin(c)
        if (!user) return c.redirect('/login')
        const config = await getSystemConfig(c.env.DB)
        const siteName = getLocalizedValue(c, config.appName)
        const groups = await c.env.DB.prepare('SELECT * FROM groups ORDER BY created_at DESC').all()
        const apps = await c.env.DB.prepare('SELECT * FROM apps').all()
        if (!groups.success) throw new Error('Groups DB Error: ' + groups.error)
        if (!apps.success) throw new Error('Apps DB Error: ' + apps.error)
        return c.html(<GroupsPage t={getLang(c)} userEmail={user.email} groups={groups.results as any} apps={apps.results as any} siteName={siteName} appConfig={config} />)
    } catch (e: any) {
        return c.text('Error: ' + e.message + '\n' + e.stack, 500)
    }
})
app.post('/admin/groups', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const id = crypto.randomUUID()
    const now = Math.floor(Date.now() / 1000)
    await c.env.DB.prepare('INSERT INTO groups (id, name, created_at) VALUES (?, ?, ?)').bind(id, body['name'], now).run()
    return c.redirect('/admin/groups')
})
app.post('/admin/groups/delete', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const id = body['id'] as string
    await c.env.DB.batch([
        c.env.DB.prepare('DELETE FROM group_permissions WHERE group_id = ?').bind(id),
        c.env.DB.prepare('UPDATE users SET group_id = NULL WHERE group_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM groups WHERE id = ?').bind(id)
    ])
    const details = JSON.stringify({ key: 'log_group_deleted', params: { id: id, admin: user.email } });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('GROUP_DELETED', details).run()
    return c.redirect('/admin/groups')
})
app.get('/admin/users', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const config = await getSystemConfig(c.env.DB)
    const siteName = getLocalizedValue(c, config.appName)
    const users = await c.env.DB.prepare('SELECT * FROM users ORDER BY created_at DESC').all()
    const apps = await c.env.DB.prepare('SELECT * FROM apps').all()
    const groups = await c.env.DB.prepare('SELECT * FROM groups').all()
    return c.html(<UsersPage t={getLang(c)} userEmail={user.email} users={users.results as any} apps={apps.results as any} groups={groups.results as any} inviteUrl={c.req.query('invite_url')} error={c.req.query('error')} siteName={siteName} appConfig={config} />)
})
app.post('/admin/invite', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const email = body['email'] as string
    if (!email) return c.redirect('/admin/users?error=Email required')
    const token = generateToken()
    const expiresAt = Math.floor(Date.now() / 1000) + (86400 * 30)
    try { await c.env.DB.prepare('INSERT INTO invitations (id, email, invited_by, expires_at) VALUES (?, ?, ?, ?)').bind(token, email, user.id, expiresAt).run() }
    catch (e: any) { return c.redirect(`/admin/users?error=${encodeURIComponent('Error: ' + e.message)}`) }
    const url = new URL(c.req.url)
    return c.redirect(`/admin/users?invite_url=${encodeURIComponent(url.protocol + '//' + url.host + '/invite?token=' + token)}`)
})
app.post('/admin/users/delete', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const id = body['id'] as string
    await c.env.DB.batch([
        c.env.DB.prepare('DELETE FROM permissions WHERE user_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM app_sessions WHERE user_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM auth_codes WHERE user_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM password_resets WHERE user_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM invitations WHERE invited_by = ?').bind(id),
        c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id)
    ])
    const details = JSON.stringify({ key: 'log_user_deleted', params: { id: id, admin: user.email } });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('USER_DELETED', details).run()
    return c.redirect('/admin/users')
})
app.post('/admin/users/bulk', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const text = await c.req.text()
    const params = new URLSearchParams(text)
    const ids = params.getAll('user_ids')
    const groupId = params.get('group_id')
    const appId = params.get('app_id')
    if (!ids || ids.length === 0) return c.redirect('/admin/users')
    let gName = null;
    if (groupId) {
        const val = groupId === '__CLEAR__' || groupId === '' ? null : groupId
        for (const uid of ids) {
            await c.env.DB.prepare('UPDATE users SET group_id = ? WHERE id = ?').bind(val, uid).run()
        }
        if (val) {
            const g = await c.env.DB.prepare('SELECT name FROM groups WHERE id = ?').bind(val).first<{ name: string }>();
            gName = g ? g.name : val;
        } else {
            gName = 'None';
        }
    }
    let aName = null;
    if (appId) {
        const start = Math.floor(Date.now() / 1000)
        const end = start + 31536000
        const now = Math.floor(Date.now() / 1000)
        for (const uid of ids) {
            await c.env.DB.prepare(`
                INSERT INTO permissions (user_id, app_id, valid_from, valid_to, created_at) VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(user_id, app_id) DO UPDATE SET valid_from=?, valid_to=?
            `).bind(uid, appId, start, end, now, start, end).run()
        }
        const a = await c.env.DB.prepare('SELECT name FROM apps WHERE id = ?').bind(appId).first<{ name: string }>();
        aName = a ? a.name : appId;
    }
    const details = JSON.stringify({
        key: 'log_bulk_update',
        params: { count: ids.length, admin: user.email, group: gName || '-', app: aName || '-' }
    });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('USER_UPDATE', details).run()
    return c.redirect('/admin/users')
})
app.get('/admin/api/user-details/:id', async (c) => {
    if (!await getAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)
    const userId = c.req.param('id')
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first() as User | null
    if (!user) return c.json({ error: 'Not found' }, 404)
    const { results: direct } = await c.env.DB.prepare('SELECT p.*, a.name as app_name FROM permissions p JOIN apps a ON p.app_id = a.id WHERE p.user_id = ?').bind(userId).all()
    let groupPerms: any[] = []
    if (user.group_id) {
        const res = await c.env.DB.prepare('SELECT p.*, a.name as app_name FROM group_permissions p JOIN apps a ON p.app_id = a.id WHERE p.group_id = ?').bind(user.group_id).all()
        groupPerms = res.results
    }
    const allApps = await c.env.DB.prepare('SELECT id, name FROM apps').all<{ id: string, name: string }>()
    const combined = allApps.results.map(app => {
        const d = direct.find((x: any) => x.app_id === app.id)
        const g = groupPerms.find((x: any) => x.app_id === app.id)
        if (d) return { ...d, source: 'user', is_override: true }
        if (g) return { ...g, source: 'group', is_override: false }
        return null
    }).filter(x => x)
    return c.json({ email: user.email, permissions: combined, group_id: user.group_id })
})
app.post('/admin/api/user/group', async (c) => {
    try {
        const user = await getAdmin(c)
        if (!user) return c.json({ error: 'Unauthorized' }, 401)
        const body = await c.req.json()
        const userId = body['user_id']
        const groupId = body['group_id'] || null
        await c.env.DB.prepare('UPDATE users SET group_id = ? WHERE id = ?').bind(groupId || null, userId).run()
        let gName = 'None';
        if (groupId) {
            const g = await c.env.DB.prepare('SELECT name FROM groups WHERE id = ?').bind(groupId).first<{ name: string }>();
            if (g) gName = g.name;
        }
        const details = JSON.stringify({ key: 'log_user_group_update', params: { user: userId, group: gName, admin: user.email } });
        await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('USER_UPDATE', details).run()
        return c.json({ success: true })
    } catch (e: any) {
        return c.json({ error: e.message, stack: e.stack }, 500)
    }
})
app.post('/admin/api/user/permission/revoke', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const id = body['id']
    await c.env.DB.prepare('DELETE FROM permissions WHERE id = ?').bind(id).run()
    const details = JSON.stringify({ key: 'log_permission_revoke', params: { id: id, admin: user.email } });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('PERMISSION_REVOKE', details).run()
    return c.json({ success: true })
})
app.post('/admin/api/user/permission/grant', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const userId = body['user_id']
    const appIds = body['app_ids']
    const appId = body['app_id']
    const validTo = body['valid_to']
    const validFrom = body['valid_from'] || Math.floor(Date.now() / 1000)
    const targets = Array.isArray(appIds) ? appIds : [appId]
    const appNames = [];
    const now = Math.floor(Date.now() / 1000)
    for (const aid of targets) {
        if (!aid) continue
        await c.env.DB.prepare(`
            INSERT INTO permissions (user_id, app_id, valid_from, valid_to, created_at) VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(user_id, app_id) DO UPDATE SET valid_from=?, valid_to=?
        `).bind(userId, aid, validFrom, validTo, now, validFrom, validTo).run()
        const a = await c.env.DB.prepare('SELECT name FROM apps WHERE id = ?').bind(aid).first<{ name: string }>();
        if (a) appNames.push(a.name);
    }
    const details = JSON.stringify({ key: 'log_permission_grant', params: { apps: appNames.join(', '), user: userId, admin: user.email } });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('PERMISSION_GRANT', details).run()
    return c.json({ success: true })
})
app.get('/admin/api/group-details/:id', async (c) => {
    if (!await getAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)
    const groupId = c.req.param('id')
    const { results } = await c.env.DB.prepare(`
        SELECT p.*, a.name as app_name 
        FROM group_permissions p 
        JOIN apps a ON p.app_id = a.id 
        WHERE p.group_id = ?
    `).bind(groupId).all()
    return c.json({ permissions: results })
})
app.post('/admin/api/group/permission/grant', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const groupId = body['group_id']
    const appIds = body['app_ids']
    const validTo = body['valid_to']
    const validFrom = body['valid_from'] || Math.floor(Date.now() / 1000)
    const targets = Array.isArray(appIds) ? appIds : []
    const appNames = [];
    const now = Math.floor(Date.now() / 1000)
    for (const aid of targets) {
        if (!aid) continue
        await c.env.DB.prepare(`
            INSERT INTO group_permissions (group_id, app_id, valid_from, valid_to, created_at) VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(group_id, app_id) DO UPDATE SET valid_from=?, valid_to=?
        `).bind(groupId, aid, validFrom, validTo, now, validFrom, validTo).run()
        const a = await c.env.DB.prepare('SELECT name FROM apps WHERE id = ?').bind(aid).first<{ name: string }>();
        if (a) appNames.push(a.name);
    }
    const g = await c.env.DB.prepare('SELECT name FROM groups WHERE id = ?').bind(groupId).first<{ name: string }>();
    const gName = g ? g.name : groupId;
    const details = JSON.stringify({ key: 'log_group_permission_grant', params: { apps: appNames.join(', '), group: gName, admin: user.email } });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('GROUP_PERMISSION_GRANT', details).run()
    return c.json({ success: true })
})
app.post('/admin/api/group/permission/revoke', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const id = body['id']
    await c.env.DB.prepare('DELETE FROM group_permissions WHERE id = ?').bind(id).run()
    const details = JSON.stringify({ key: 'log_group_permission_revoke', params: { id: id, admin: user.email } });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('GROUP_PERMISSION_REVOKE', details).run()
    return c.json({ success: true })
})

// ============================================================
// アカウントマネージャ: グループ管理(新データ層・additive)
//   既存の /admin/groups(OIDCの所属→アプリ権限)とは別物。
//   ここでは groups(階層対応) と group_memberships(所属＋役割＋期間) を扱う。
// ============================================================
app.get('/admin/am/groups', async (c) => {
    try {
        const user = await getAdmin(c)
        if (!user) return c.redirect('/login')
        const config = await getSystemConfig(c.env.DB)
        const siteName = getLocalizedValue(c, config.appName)
        // グループ一覧＋メンバー数(group_memberships の件数)。
        const groups = await c.env.DB.prepare(`
            SELECT g.*, (SELECT COUNT(*) FROM group_memberships m WHERE m.group_id = g.id) AS member_count
            FROM groups g ORDER BY g.created_at DESC
        `).all()
        const users = await c.env.DB.prepare('SELECT * FROM users ORDER BY email').all()
        if (!groups.success) throw new Error('Groups DB Error: ' + groups.error)
        if (!users.success) throw new Error('Users DB Error: ' + users.error)
        return c.html(<AccountGroupsPage t={getLang(c)} userEmail={user.email} groups={groups.results as any} users={users.results as any} siteName={siteName} appConfig={config} />)
    } catch (e: any) {
        return c.text('Error: ' + e.message + '\n' + e.stack, 500)
    }
})
app.post('/admin/am/groups', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const name = (body['name'] as string || '').trim()
    if (!name) return c.redirect('/admin/am/groups')
    const parentId = (body['parent_id'] as string) || null
    const id = crypto.randomUUID()
    const now = Math.floor(Date.now() / 1000)
    await c.env.DB.prepare('INSERT INTO groups (id, name, parent_id, created_at) VALUES (?, ?, ?, ?)').bind(id, name, parentId, now).run()
    return c.redirect('/admin/am/groups')
})
// グループの親(parent_id)を変更=ツリー上の移動。自己親・循環参照を弾く。
app.post('/admin/am/groups/parent', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const id = body['id'] as string
    let parentId = (body['parent_id'] as string) || null
    if (parentId === '') parentId = null
    if (parentId && parentId === id) return c.json({ error: 'self' }, 400)
    if (parentId) {
        // 親候補から祖先を辿り、自分(id)に到達したら循環なので拒否。
        const { results } = await c.env.DB.prepare('SELECT id, parent_id FROM groups').all() as any
        const parentOf = new Map<string, string | null>((results as any[]).map(r => [r.id, r.parent_id]))
        let cur: string | null = parentId
        let guard = 0
        while (cur && guard++ < 10000) {
            if (cur === id) return c.json({ error: 'cycle' }, 400)
            cur = parentOf.get(cur) ?? null
        }
    }
    await c.env.DB.prepare('UPDATE groups SET parent_id = ? WHERE id = ?').bind(parentId, id).run()
    return c.json({ success: true })
})
app.post('/admin/am/groups/delete', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const id = body['id'] as string
    // グループ削除に伴い、新旧両モデルの関連レコードを掃除する。
    await c.env.DB.batch([
        c.env.DB.prepare('DELETE FROM group_memberships WHERE group_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM group_permissions WHERE group_id = ?').bind(id),
        c.env.DB.prepare('UPDATE users SET group_id = NULL WHERE group_id = ?').bind(id),
        c.env.DB.prepare('UPDATE groups SET parent_id = NULL WHERE parent_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM groups WHERE id = ?').bind(id)
    ])
    const details = JSON.stringify({ key: 'log_group_deleted', params: { id: id, admin: user.email } });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('GROUP_DELETED', details).run()
    return c.redirect('/admin/am/groups')
})
app.get('/admin/api/am/group-members/:id', async (c) => {
    if (!await getAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)
    const groupId = c.req.param('id')
    const { results } = await c.env.DB.prepare(`
        SELECT m.id, m.user_id, m.role, m.valid_from, m.valid_to, u.email, u.name
        FROM group_memberships m JOIN users u ON m.user_id = u.id
        WHERE m.group_id = ? ORDER BY (m.role = 'group_admin') DESC, u.email
    `).bind(groupId).all()
    return c.json({ members: results })
})
app.post('/admin/api/am/membership/add', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const groupId = body['group_id'] as string
    const userIds = (body['user_ids'] as string[]) || []
    const role = body['role'] === 'group_admin' ? 'group_admin' : 'member'
    const validFrom = Number(body['valid_from'])
    const validTo = Number(body['valid_to'])
    if (!groupId || userIds.length === 0) return c.json({ error: 'group_id and user_ids required' }, 400)
    // UNIQUE(user_id, group_id) を活かして upsert(役割・期間を更新)。
    for (const uid of userIds) {
        await c.env.DB.prepare(`
            INSERT INTO group_memberships (user_id, group_id, role, valid_from, valid_to) VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(user_id, group_id) DO UPDATE SET role=excluded.role, valid_from=excluded.valid_from, valid_to=excluded.valid_to
        `).bind(uid, groupId, role, validFrom, validTo).run()
    }
    const details = JSON.stringify({ key: 'log_membership_add', params: { count: userIds.length, group: groupId, role: role, admin: user.email } });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('MEMBERSHIP_ADD', details).run()
    return c.json({ success: true })
})
app.post('/admin/api/am/membership/remove', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const id = body['id']
    await c.env.DB.prepare('DELETE FROM group_memberships WHERE id = ?').bind(id).run()
    const details = JSON.stringify({ key: 'log_membership_remove', params: { id: id, admin: user.email } });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('MEMBERSHIP_REMOVE', details).run()
    return c.json({ success: true })
})

// ============================================================
// アカウントマネージャ: サービスマスタ(ゲート①)
//   提供企業 → サービス → 契約(席数上限つき)。全ゲートの前提データ。
// ============================================================
app.get('/admin/am/services', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const config = await getSystemConfig(c.env.DB)
    const siteName = getLocalizedValue(c, config.appName)
    const providers = await c.env.DB.prepare('SELECT * FROM service_providers ORDER BY created_at DESC').all()
    const services = await c.env.DB.prepare(`
        SELECT s.*, p.name AS provider_name FROM services s
        LEFT JOIN service_providers p ON s.provider_id = p.id ORDER BY s.created_at DESC`).all()
    const contracts = await c.env.DB.prepare(`
        SELECT ct.*, s.name AS service_name, p.name AS provider_name, g.name AS group_name
        FROM service_contracts ct
        LEFT JOIN services s ON ct.service_id = s.id
        LEFT JOIN service_providers p ON s.provider_id = p.id
        LEFT JOIN groups g ON ct.customer_group_id = g.id
        ORDER BY ct.valid_from DESC`).all()
    const groups = await c.env.DB.prepare('SELECT * FROM groups ORDER BY name').all()
    return c.html(<AccountServicesPage t={getLang(c)} userEmail={user.email} siteName={siteName} appConfig={config}
        providers={providers.results as any} services={services.results as any} contracts={contracts.results as any} groups={groups.results as any} />)
})
app.post('/admin/am/providers', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const name = ((body['name'] as string) || '').trim()
    if (name) {
        await c.env.DB.prepare('INSERT INTO service_providers (id, name, created_at) VALUES (?, ?, ?)')
            .bind(crypto.randomUUID(), name, Math.floor(Date.now() / 1000)).run()
        await logAudit(c, 'PROVIDER_ADD', { key: 'log_provider_add', params: { name, admin: user.email } })
    }
    return c.redirect('/admin/am/services')
})
app.post('/admin/am/providers/delete', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const id = (await c.req.parseBody())['id'] as string
    // 提供企業の配下サービス、さらにその下の契約/利用枠/役割/割当を連鎖削除する。
    const svc = await c.env.DB.prepare('SELECT id FROM services WHERE provider_id = ?').bind(id).all()
    for (const s of (svc.results as any[])) await deleteServiceCascade(c, s.id)
    await c.env.DB.prepare('DELETE FROM service_providers WHERE id = ?').bind(id).run()
    await logAudit(c, 'PROVIDER_DELETE', { key: 'log_provider_delete', params: { id, admin: user.email } })
    return c.redirect('/admin/am/services')
})
app.post('/admin/am/services', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const name = ((body['name'] as string) || '').trim()
    const providerId = (body['provider_id'] as string) || ''
    if (name && providerId) {
        await c.env.DB.prepare('INSERT INTO services (id, provider_id, name, created_at) VALUES (?, ?, ?, ?)')
            .bind(crypto.randomUUID(), providerId, name, Math.floor(Date.now() / 1000)).run()
        await logAudit(c, 'SERVICE_ADD', { key: 'log_service_add', params: { name, admin: user.email } })
    }
    return c.redirect('/admin/am/services')
})
app.post('/admin/am/services/delete', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const id = (await c.req.parseBody())['id'] as string
    await deleteServiceCascade(c, id)
    await logAudit(c, 'SERVICE_DELETE', { key: 'log_service_delete', params: { id, admin: user.email } })
    return c.redirect('/admin/am/services')
})
app.post('/admin/am/contracts', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const serviceId = (body['service_id'] as string) || ''
    const groupId = (body['customer_group_id'] as string) || ''
    const seatRaw = (body['seat_limit'] as string || '').trim()
    const seatLimit = seatRaw === '' ? null : Number(seatRaw)
    const validFrom = Math.floor(new Date(body['valid_from'] as string).getTime() / 1000)
    const validTo = Math.floor(new Date(body['valid_to'] as string).getTime() / 1000)
    if (serviceId && groupId) {
        await c.env.DB.prepare('INSERT INTO service_contracts (id, service_id, customer_group_id, seat_limit, valid_from, valid_to) VALUES (?, ?, ?, ?, ?, ?)')
            .bind(crypto.randomUUID(), serviceId, groupId, seatLimit, validFrom, validTo).run()
        await logAudit(c, 'CONTRACT_ADD', { key: 'log_contract_add', params: { service: serviceId, admin: user.email } })
    }
    return c.redirect('/admin/am/services')
})
app.post('/admin/am/contracts/delete', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const id = (await c.req.parseBody())['id'] as string
    await c.env.DB.batch([
        c.env.DB.prepare('DELETE FROM group_service_grants WHERE contract_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM service_contracts WHERE id = ?').bind(id),
    ])
    await logAudit(c, 'CONTRACT_DELETE', { key: 'log_contract_delete', params: { id, admin: user.email } })
    return c.redirect('/admin/am/services')
})

// ============================================================
// アカウントマネージャ: 利用枠(ゲート②)。契約をグループノードへ明示開放。
// ============================================================
app.get('/admin/am/grants', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const config = await getSystemConfig(c.env.DB)
    const siteName = getLocalizedValue(c, config.appName)
    const grants = await c.env.DB.prepare(`
        SELECT gr.*, g.name AS group_name, s.name AS service_name, p.name AS provider_name
        FROM group_service_grants gr
        LEFT JOIN groups g ON gr.group_id = g.id
        LEFT JOIN services s ON gr.service_id = s.id
        LEFT JOIN service_providers p ON s.provider_id = p.id
        ORDER BY gr.valid_from DESC`).all()
    const groups = await c.env.DB.prepare('SELECT * FROM groups ORDER BY name').all()
    const contracts = await c.env.DB.prepare(`
        SELECT ct.*, s.name AS service_name, p.name AS provider_name, g.name AS group_name
        FROM service_contracts ct
        LEFT JOIN services s ON ct.service_id = s.id
        LEFT JOIN service_providers p ON s.provider_id = p.id
        LEFT JOIN groups g ON ct.customer_group_id = g.id
        ORDER BY ct.valid_from DESC`).all()
    return c.html(<AccountGrantsPage t={getLang(c)} userEmail={user.email} siteName={siteName} appConfig={config}
        grants={grants.results as any} groups={groups.results as any} contracts={contracts.results as any} />)
})
app.post('/admin/am/grants', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const groupId = (body['group_id'] as string) || ''
    const contractId = (body['contract_id'] as string) || ''
    if (!groupId || !contractId) return c.redirect('/admin/am/grants')
    // 契約から service_id を引く(利用枠は契約に紐づく)。
    const ct = await c.env.DB.prepare('SELECT service_id FROM service_contracts WHERE id = ?').bind(contractId).first<{ service_id: string }>()
    if (!ct) return c.redirect('/admin/am/grants')
    const seatRaw = (body['seat_limit'] as string || '').trim()
    const seatLimit = seatRaw === '' ? null : Number(seatRaw)
    const validFrom = Math.floor(new Date(body['valid_from'] as string).getTime() / 1000)
    const validTo = Math.floor(new Date(body['valid_to'] as string).getTime() / 1000)
    // UNIQUE(group_id, service_id) で upsert(契約・席数・期間を更新)。
    await c.env.DB.prepare(`
        INSERT INTO group_service_grants (group_id, service_id, contract_id, seat_limit, valid_from, valid_to) VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(group_id, service_id) DO UPDATE SET contract_id=excluded.contract_id, seat_limit=excluded.seat_limit, valid_from=excluded.valid_from, valid_to=excluded.valid_to
    `).bind(groupId, ct.service_id, contractId, seatLimit, validFrom, validTo).run()
    await logAudit(c, 'GRANT_ADD', { key: 'log_grant_add', params: { group: groupId, service: ct.service_id, admin: user.email } })
    return c.redirect('/admin/am/grants')
})
app.post('/admin/am/grants/delete', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const id = (await c.req.parseBody())['id'] as string
    await c.env.DB.prepare('DELETE FROM group_service_grants WHERE id = ?').bind(id).run()
    await logAudit(c, 'GRANT_DELETE', { key: 'log_grant_delete', params: { id, admin: user.email } })
    return c.redirect('/admin/am/grants')
})

// ============================================================
// アカウントマネージャ: 施設(建物)。管理グループ(支店)に紐づく。
// ============================================================
app.get('/admin/am/facilities', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const config = await getSystemConfig(c.env.DB)
    const siteName = getLocalizedValue(c, config.appName)
    const facilities = await c.env.DB.prepare(`
        SELECT f.*, g.name AS group_name FROM facilities f
        LEFT JOIN groups g ON f.managing_group_id = g.id ORDER BY f.created_at DESC`).all()
    const groups = await c.env.DB.prepare('SELECT * FROM groups ORDER BY name').all()
    return c.html(<AccountFacilitiesPage t={getLang(c)} userEmail={user.email} siteName={siteName} appConfig={config}
        facilities={facilities.results as any} groups={groups.results as any} />)
})
app.post('/admin/am/facilities', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const groupId = (body['managing_group_id'] as string) || ''
    const structureNo = ((body['structure_no'] as string) || '').trim() || null
    const buildingUse = ((body['building_use'] as string) || '').trim() || null
    if (groupId) {
        await c.env.DB.prepare('INSERT INTO facilities (id, structure_no, building_use, managing_group_id, created_at) VALUES (?, ?, ?, ?, ?)')
            .bind(crypto.randomUUID(), structureNo, buildingUse, groupId, Math.floor(Date.now() / 1000)).run()
        await logAudit(c, 'FACILITY_ADD', { key: 'log_facility_add', params: { structure_no: structureNo, admin: user.email } })
    }
    return c.redirect('/admin/am/facilities')
})
app.post('/admin/am/facilities/delete', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const id = (await c.req.parseBody())['id'] as string
    await c.env.DB.batch([
        c.env.DB.prepare('DELETE FROM service_user_assignments WHERE facility_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM facilities WHERE id = ?').bind(id),
    ])
    await logAudit(c, 'FACILITY_DELETE', { key: 'log_facility_delete', params: { id, admin: user.email } })
    return c.redirect('/admin/am/facilities')
})

// ============================================================
// アカウントマネージャ: 役割マスタ + 利用者割当(ゲート③)。
//   割当はゲート②(利用枠)が前提。席数上限を超える場合は拒否する。
// ============================================================
app.get('/admin/am/assignments', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const config = await getSystemConfig(c.env.DB)
    const siteName = getLocalizedValue(c, config.appName)
    const roles = await c.env.DB.prepare(`
        SELECT r.*, s.name AS service_name, p.name AS provider_name FROM service_role_master r
        LEFT JOIN services s ON r.service_id = s.id
        LEFT JOIN service_providers p ON s.provider_id = p.id
        ORDER BY r.id DESC`).all()
    const assignments = await c.env.DB.prepare(`
        SELECT a.*, u.email AS user_email, u.name AS user_name, g.name AS group_name,
               s.name AS service_name, f.structure_no AS structure_no, rm.role_name AS role_name
        FROM service_user_assignments a
        LEFT JOIN users u ON a.user_id = u.id
        LEFT JOIN groups g ON a.group_id = g.id
        LEFT JOIN services s ON a.service_id = s.id
        LEFT JOIN facilities f ON a.facility_id = f.id
        LEFT JOIN service_role_master rm ON a.service_role_id = rm.id
        ORDER BY a.valid_from DESC`).all()
    const services = await c.env.DB.prepare(`
        SELECT s.*, p.name AS provider_name FROM services s
        LEFT JOIN service_providers p ON s.provider_id = p.id ORDER BY s.name`).all()
    const facilities = await c.env.DB.prepare(`
        SELECT f.*, g.name AS group_name FROM facilities f
        LEFT JOIN groups g ON f.managing_group_id = g.id ORDER BY f.structure_no`).all()
    const groups = await c.env.DB.prepare('SELECT * FROM groups ORDER BY name').all()
    const users = await c.env.DB.prepare('SELECT * FROM users ORDER BY email').all()
    return c.html(<AccountAssignmentsPage t={getLang(c)} userEmail={user.email} siteName={siteName} appConfig={config}
        roles={roles.results as any} assignments={assignments.results as any} services={services.results as any}
        facilities={facilities.results as any} groups={groups.results as any} users={users.results as any} error={c.req.query('error')} />)
})
app.post('/admin/am/roles', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const serviceId = (body['service_id'] as string) || ''
    const facilityType = ((body['facility_type'] as string) || '').trim() || null
    const roleName = ((body['role_name'] as string) || '').trim()
    if (serviceId && roleName) {
        await c.env.DB.prepare('INSERT INTO service_role_master (service_id, facility_type, role_name) VALUES (?, ?, ?) ON CONFLICT DO NOTHING')
            .bind(serviceId, facilityType, roleName).run()
        await logAudit(c, 'ROLE_ADD', { key: 'log_role_add', params: { role: roleName, admin: user.email } })
    }
    return c.redirect('/admin/am/assignments')
})
app.post('/admin/am/roles/delete', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const id = (await c.req.parseBody())['id'] as string
    await c.env.DB.batch([
        c.env.DB.prepare('DELETE FROM service_user_assignments WHERE service_role_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM service_role_master WHERE id = ?').bind(id),
    ])
    await logAudit(c, 'ROLE_DELETE', { key: 'log_role_delete', params: { id, admin: user.email } })
    return c.redirect('/admin/am/assignments')
})
app.post('/admin/am/assignments', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const userId = (body['user_id'] as string) || ''
    const groupId = (body['group_id'] as string) || ''
    const serviceId = (body['service_id'] as string) || ''
    const facilityId = (body['facility_id'] as string) || ''
    const roleId = Number(body['service_role_id'])
    const validFrom = Math.floor(new Date(body['valid_from'] as string).getTime() / 1000)
    const validTo = Math.floor(new Date(body['valid_to'] as string).getTime() / 1000)
    if (!userId || !groupId || !serviceId || !facilityId || !roleId) return c.redirect('/admin/am/assignments')

    const res = await createAssignment(c, { userId, groupId, serviceId, facilityId, roleId, validFrom, validTo })
    if (res !== 'ok') return c.redirect('/admin/am/assignments?error=' + res)
    await logAudit(c, 'ASSIGNMENT_ADD', { key: 'log_assignment_add', params: { user: userId, service: serviceId, admin: user.email } })
    return c.redirect('/admin/am/assignments')
})
app.post('/admin/am/assignments/delete', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const id = (await c.req.parseBody())['id'] as string
    await c.env.DB.prepare('DELETE FROM service_user_assignments WHERE id = ?').bind(id).run()
    await logAudit(c, 'ASSIGNMENT_DELETE', { key: 'log_assignment_delete', params: { id, admin: user.email } })
    return c.redirect('/admin/am/assignments')
})

app.get('/admin/logs', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const config = await getSystemConfig(c.env.DB)
    const siteName = getLocalizedValue(c, config.appName)
    const page = parseInt(c.req.query('page') || '1');
    const filterEvent = c.req.query('event') || '';
    const pageSize = 50;
    const offset = (page - 1) * pageSize;
    let query = 'SELECT * FROM audit_logs';
    let countQuery = 'SELECT COUNT(*) as c FROM audit_logs';
    const params = [];
    if (filterEvent) {
        const where = ' WHERE event_type = ?';
        query += where;
        countQuery += where;
        params.push(filterEvent);
    }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(pageSize, offset);
    const { results } = await c.env.DB.prepare(query).bind(...params).all();
    const countParams = filterEvent ? [filterEvent] : [];
    const totalRes = await c.env.DB.prepare(countQuery).bind(...countParams).first<{ c: number }>();
    const totalCount = totalRes?.c || 0;
    const totalPages = Math.ceil(totalCount / pageSize);
    return c.html(<LogsPage
        t={getLang(c)}
        userEmail={user.email}
        logs={results as any}
        currentPage={page}
        totalPages={totalPages}
        totalCount={totalCount}
        currentFilter={filterEvent}
        siteName={siteName}
        appConfig={config}
    />)
})

// 招待・パスワード忘れ等のルートは変更なし
app.get('/invite', async (c) => {
    const t = getLang(c)
    const token = c.req.query('token')
    if (!token) return c.html(<Invite t={t} error={t.error_invalid_invite} />)
    const invite = await c.env.DB.prepare('SELECT * FROM invitations WHERE id = ? AND expires_at > ?')
        .bind(token, Math.floor(Date.now() / 1000)).first<{ email: string }>()
    if (!invite) return c.html(<Invite t={t} error={t.error_invalid_invite} />)
    return c.html(<Invite t={t} token={token} email={invite.email} />)
})
app.post('/invite', async (c) => {
    const t = getLang(c)
    const body = await c.req.parseBody()
    const token = (body['token'] as string).replace(/\s+/g, '')
    const password = body['password'] as string
    const invite = await c.env.DB.prepare('SELECT * FROM invitations WHERE id = ? AND expires_at > ?')
        .bind(token, Math.floor(Date.now() / 1000)).first<{ email: string }>()
    if (!invite) return c.html(<Invite t={t} error={t.error_invalid_invite} />)
    const userId = crypto.randomUUID()
    const pwHash = await hashPassword(password)
    const now = Math.floor(Date.now() / 1000)
    try {
        await c.env.DB.prepare('INSERT INTO users (id, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
            .bind(userId, invite.email, pwHash, now, now).run()
        await c.env.DB.prepare('DELETE FROM invitations WHERE id = ?').bind(token).run()
        return c.redirect('/login?msg=msg_account_created')
    } catch (e) {
        return c.html(<Invite t={t} token={token} error={t.error_user_exists} />)
    }
})
app.get('/forgot-password', (c) => c.html(<ForgotPassword t={getLang(c)} />))
app.post('/forgot-password', async (c) => {
    const t = getLang(c)
    const body = await c.req.parseBody()
    const email = body['email'] as string
    const user = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first() as User | null
    if (user) {
        const token = generateToken()
        const expires = Math.floor(Date.now() / 1000) + 3600
        await c.env.DB.prepare('INSERT INTO password_resets (token, user_id, expires_at) VALUES (?, ?, ?)').bind(token, user.id, expires).run()
        const resetLink = `${new URL(c.req.url).origin}/reset-password?token=${token}`;
        const htmlBody = `
      <div style="font-family: sans-serif; color: #333; line-height: 1.6;">
        <p><strong>Password Reset</strong></p>
        <p>You requested a password reset. Please click the link below to set a new password:</p>
        <p><a href="${resetLink}" style="color: #0288d1; word-break: break-all;">${resetLink}</a></p>
        <p>This link will expire in 1 hour.</p>
        <p><strong>繝代せ繝ｯ繝ｼ繝峨Μ繧ｻ繝・ヨ</strong></p>
        <p>繝代せ繝ｯ繝ｼ繝峨Μ繧ｻ繝・ヨ縺ｮ繝ｪ繧ｯ繧ｨ繧ｹ繝医ｒ蜿励￠莉倥￠縺ｾ縺励◆縲ゆｻ･荳九・繝ｪ繝ｳ繧ｯ繧偵け繝ｪ繝・け縺励※縲∵眠縺励＞繝代せ繝ｯ繝ｼ繝峨ｒ險ｭ螳壹＠縺ｦ縺上□縺輔＞縲・/p>
        <p><a href="${resetLink}" style="color: #0288d1; word-break: break-all;">${resetLink}</a></p>
      </div>
    `;
        await sendEmail(c.env, email, 'Password Reset / 繝代せ繝ｯ繝ｼ繝峨Μ繧ｻ繝・ヨ', htmlBody);
    }
    return c.html(<ForgotPassword t={t} message={t.link_sent} />)
})
app.get('/reset-password', async (c) => {
    const t = getLang(c)
    const token = c.req.query('token')
    if (!token) return c.redirect('/forgot-password')
    const reset = await c.env.DB.prepare('SELECT * FROM password_resets WHERE token = ? AND expires_at > ?').bind(token, Math.floor(Date.now() / 1000)).first()
    if (!reset) return c.html(<ResetPassword t={t} token="" error={t.error_invalid_invite} />)
    return c.html(<ResetPassword t={t} token={token} />)
})
app.post('/reset-password', async (c) => {
    const t = getLang(c)
    const body = await c.req.parseBody()
    const token = (body['token'] as string).replace(/\s+/g, '')
    const password = body['password'] as string
    const reset = await c.env.DB.prepare('SELECT * FROM password_resets WHERE token = ? AND expires_at > ?').bind(token, Math.floor(Date.now() / 1000)).first<{ user_id: string }>()
    if (!reset) return c.html(<ResetPassword t={t} token="" error={t.error_invalid_invite} />)
    const pwHash = await hashPassword(password)
    await c.env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(pwHash, reset.user_id).run()
    await c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(reset.user_id).run()
    try { await c.env.DB.prepare('DELETE FROM app_sessions WHERE user_id = ?').bind(reset.user_id).run() } catch (e) { }
    await c.env.DB.prepare('DELETE FROM password_resets WHERE token = ?').bind(token).run()
    return c.redirect('/login')
})
app.post('/admin/config', async (c) => {
    try {
        const user = await getAdmin(c)
        if (!user) return c.redirect('/login')
        const body = await c.req.parseBody()
        const app_name_ja = body['app_name_ja'] as string
        const app_name_en = body['app_name_en'] as string
        const app_subtitle_ja = body['app_subtitle_ja'] as string
        const app_subtitle_en = body['app_subtitle_en'] as string
        if (app_name_ja) await c.env.DB.prepare('INSERT INTO system_config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=?').bind('app_name_ja', app_name_ja, app_name_ja).run()
        if (app_name_en) await c.env.DB.prepare('INSERT INTO system_config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=?').bind('app_name_en', app_name_en, app_name_en).run()
        if (app_subtitle_ja) await c.env.DB.prepare('INSERT INTO system_config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=?').bind('app_subtitle_ja', app_subtitle_ja, app_subtitle_ja).run()
        if (app_subtitle_en) await c.env.DB.prepare('INSERT INTO system_config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=?').bind('app_subtitle_en', app_subtitle_en, app_subtitle_en).run()
        const details = JSON.stringify({ key: 'log_config_update', params: { admin: user.email } });
        await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('CONFIG_UPDATE', details).run()
        return c.redirect('/admin')
    } catch (e: any) {
        return c.text('Error updating config: ' + e.message, 500)
    }
})

// 2要素認証(2FA)の検証ルート
app.get('/login/2fa', async (c) => {
    const t = getLang(c)
    const token = getCookie(c, 'pre_2fa_token')
    if (!token) return c.redirect('/login')
    try { await verify(token, c.env.JWT_SECRET || 'dev_secret', "HS256") } catch (e) { return c.redirect('/login') }
    const redirectTo = c.req.query('redirect_to')
    const returnTo = c.req.query('return_to')
    return c.html(<Login2FA t={t} redirectTo={redirectTo} returnTo={returnTo} />)
})
app.post('/login/2fa', async (c) => {
    const t = getLang(c)
    const body = await c.req.parseBody()
    const otp = (body['token'] as string).replace(/\s+/g, '')
    const redirectTo = body['redirect_to'] as string
    const returnTo = body['return_to'] as string
    const preToken = getCookie(c, 'pre_2fa_token')
    if (!preToken) return c.redirect('/login')
    let payload;
    try { payload = await verify(preToken, c.env.JWT_SECRET || 'dev_secret', "HS256") } catch (e) { return c.redirect('/login') }
    const userId = payload.sub as string
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first() as User | null
    if (!user || !user.two_factor_secret) return c.redirect('/login')
    if (verifyToken(otp, user.two_factor_secret)) {
        await createSession(c, user.id)
        deleteCookie(c, 'pre_2fa_token')

        let targetAppName = 'Tobira Dashboard';
        const admin = await c.env.DB.prepare('SELECT * FROM admins WHERE email = ?').bind(user.email).first()
        if (redirectTo) {
            const { results } = await c.env.DB.prepare('SELECT * FROM apps WHERE status = ?').bind('active').all() as any;
            const app = (results as any[]).find((a: any) => isAllowedRedirectUri(redirectTo, a));
            if (app) targetAppName = app.name;
        } else if (admin) {
            targetAppName = 'Tobira Admin';
        }

        const details = JSON.stringify({ key: 'log_login_app', params: { email: user.email, method: '2FA', appName: targetAppName } });
        await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('LOGIN', details).run()

        if (returnTo && isSafeReturnTo(returnTo)) return c.redirect(returnTo)
        if (redirectTo) return issueCodeAndRedirect(c, user.id, redirectTo)
        return c.redirect(admin ? '/admin' : '/')
    } else {
        return c.html(<Login2FA t={t} redirectTo={redirectTo} returnTo={returnTo} error={t.err_invalid_code} />)
    }
})

export default app
