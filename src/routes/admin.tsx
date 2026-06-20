import { Hono } from 'hono';
import type { Env, App, Session, User, RecentAuditLog } from '../types';
import { Layout } from '../views/admin/Layout';
import { AdminHome } from '../views/admin/AdminHome';
import { AppsPage } from '../views/admin/AppsPage';
import { GroupsPage } from '../views/admin/GroupsPage';
import { UsersPage } from '../views/admin/UsersPage';
import { TagsPage } from '../views/admin/TagsPage';
import { LogsPage } from '../views/admin/LogsPage';
import { AccountDevelopersPage } from '../views/admin/AccountDevelopersPage';
import { AccountGroupsPage } from '../views/admin/AccountGroupsPage';
import { AccountServicesPage } from '../views/admin/AccountServicesPage';
import { AccountServiceDetailPage } from '../views/admin/AccountServiceDetailPage';
import { AccountContractsPage } from '../views/admin/AccountContractsPage';
import { Invite } from '../views/Invite';
import { ForgotPassword } from '../views/ForgotPassword';
import { ResetPassword } from '../views/ResetPassword';
import { fetchAppIcon } from '../utils/icon';
import { dict, getLang, getLocalizedValue } from '../i18n';
import {
  getSystemConfig,
  getAdmin,
  handleIconUpload,
  logAudit,
  deleteServiceCascade,
  createAssignment,
  rateLimit
} from '../index';
import { sendEmail } from '../utils/mail';
import { generateToken, hashPassword, validatePassword, hashToken } from '../utils/auth';

function isValidAppUri(uri: string, baseUrl: string, redirectUris: string | null): boolean {
    if (!uri) return true;
    let parsedUri: URL, base: URL;
    try {
        parsedUri = new URL(uri);
        base = new URL(baseUrl);
    } catch {
        return false;
    }
    if (parsedUri.protocol !== 'https:' && parsedUri.protocol !== 'http:') return false;
    if (parsedUri.origin === base.origin) return true;

    if (redirectUris) {
        const uris = redirectUris.split('\n').map(s => s.trim()).filter(Boolean);
        for (const r of uris) {
            try {
                const rUrl = new URL(r);
                if (parsedUri.origin === rUrl.origin) return true;
            } catch {
                // ignore
            }
        }
    }
    return false;
}

export const adminRouter = new Hono<{ Bindings: Env }>();

adminRouter.get('/admin', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const t = getLang(c)
    const config = await getSystemConfig(c.env.DB)
    const siteName = getLocalizedValue(c, config.appName)
    const stats = {
        apps: await c.env.DB.prepare('SELECT COUNT(*) as c FROM apps').first('c'),
        users: await c.env.DB.prepare('SELECT COUNT(*) as c FROM users').first('c')
    }
    return c.html(<AdminHome t={t} userEmail={user.email} stats={stats as any} siteName={siteName} appConfig={config} />)
})
adminRouter.get('/admin/apps', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const config = await getSystemConfig(c.env.DB)
    const siteName = getLocalizedValue(c, config.appName)
    // アプリ↔サービスの紐づけは service_apps(多対多)に一本化したため、何個のサービスに
    // 組み込まれているかを件数で表示する(単一束縛 apps.service_id は廃止)。
    const { results } = await c.env.DB.prepare(`
        SELECT a.*, g.name as owner_group_name,
               (SELECT COUNT(*) FROM service_apps sa WHERE sa.app_id = a.id) AS service_count
        FROM apps a
        LEFT JOIN groups g ON a.owner_group_id = g.id
        ORDER BY (a.status = 'pending') DESC, a.created_at DESC
    `).all()
    const tagsResult = await c.env.DB.prepare("SELECT * FROM tags WHERE status = 'active' ORDER BY name").all()
    return c.html(<AppsPage t={getLang(c)} userEmail={user.email} apps={results as any} availableTags={tagsResult.results as any} siteName={siteName} appConfig={config} />)
})

adminRouter.get('/admin/tags', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const config = await getSystemConfig(c.env.DB)
    const siteName = getLocalizedValue(c, config.appName)

    const tags = await c.env.DB.prepare(`
        SELECT t.*, g.name as owner_group_name,
               (SELECT COUNT(*) FROM service_tags st WHERE st.tag_id = t.id AND st.status = 'active') as service_count
        FROM tags t
        LEFT JOIN groups g ON t.owner_group_id = g.id
        ORDER BY (t.status = 'pending') DESC, t.created_at DESC
    `).all()
    
    // Also fetch pending service_tag requests
    const pendingServiceTags = await c.env.DB.prepare(`
        SELECT st.id, st.service_id, s.name as service_name, t.name as tag_name, g.name as requesting_group_name, st.created_at
        FROM service_tags st
        JOIN services s ON st.service_id = s.id
        JOIN tags t ON st.tag_id = t.id
        LEFT JOIN groups g ON st.requesting_group_id = g.id
        WHERE st.status = 'pending'
        ORDER BY st.created_at DESC
    `).all()

    const allServices = await c.env.DB.prepare(`SELECT id, name FROM services WHERE status = 'active' ORDER BY name`).all()
    const serviceTagsMap = await c.env.DB.prepare(`
        SELECT st.id, st.tag_id, st.service_id, s.name as service_name, st.status
        FROM service_tags st
        JOIN services s ON st.service_id = s.id
        ORDER BY s.name
    `).all()

    return c.html(<TagsPage t={getLang(c)} userEmail={user.email} tags={tags.results as any} pendingServiceTags={pendingServiceTags.results as any} allServices={allServices.results as any} serviceTagsMap={serviceTagsMap.results as any} siteName={siteName} appConfig={config} />)
})

adminRouter.post('/admin/tags/create', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const id = crypto.randomUUID()
    const name = body['name'] as string
    const now = Math.floor(Date.now() / 1000)
    
    try {
        await c.env.DB.prepare("INSERT INTO tags (id, name, status, owner_group_id, created_at) VALUES (?, ?, 'active', NULL, ?)")
            .bind(id, name, now).run()
    } catch (e: any) {}
    return c.redirect('/admin/tags')
})

adminRouter.post('/admin/tags/approve', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const id = (await c.req.parseBody())['id'] as string
    await c.env.DB.prepare("UPDATE tags SET status = 'active' WHERE id = ?").bind(id).run()
    return c.redirect('/admin/tags')
})

adminRouter.post('/admin/tags/reject', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const id = (await c.req.parseBody())['id'] as string
    await c.env.DB.prepare("UPDATE tags SET status = 'rejected' WHERE id = ?").bind(id).run()
    return c.redirect('/admin/tags')
})

adminRouter.post('/admin/tags/delete', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const id = (await c.req.parseBody())['id'] as string
    await c.env.DB.batch([
        c.env.DB.prepare('DELETE FROM service_tags WHERE tag_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM tags WHERE id = ?').bind(id)
    ])
    return c.redirect('/admin/tags')
})

adminRouter.post('/admin/tags/service/approve', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const id = (await c.req.parseBody())['id'] as string
    await c.env.DB.prepare("UPDATE service_tags SET status = 'active' WHERE id = ?").bind(id).run()
    return c.redirect('/admin/tags')
})

adminRouter.post('/admin/tags/service/reject', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const id = (await c.req.parseBody())['id'] as string
    await c.env.DB.prepare("UPDATE service_tags SET status = 'rejected' WHERE id = ?").bind(id).run()
    return c.redirect('/admin/tags')
})

adminRouter.post('/admin/tags/service/add', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const serviceId = body['service_id'] as string
    const tagId = body['tag_id'] as string
    const now = Math.floor(Date.now() / 1000)
    try {
        await c.env.DB.prepare("INSERT INTO service_tags (service_id, tag_id, status, requesting_group_id, created_at) VALUES (?, ?, 'active', NULL, ?)")
            .bind(serviceId, tagId, now).run()
    } catch (e: any) {}
    const ref = c.req.header('referer') || '/admin/services'
    return c.redirect(ref)
})

adminRouter.post('/admin/tags/service/remove', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const serviceId = body['service_id'] as string
    const tagId = body['tag_id'] as string
    await c.env.DB.prepare("DELETE FROM service_tags WHERE service_id = ? AND tag_id = ?").bind(serviceId, tagId).run()
    const ref = c.req.header('referer') || '/admin/services'
    return c.redirect(ref)
})


// === アプリ作成(改修版) ===
adminRouter.post('/admin/apps', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const now = Math.floor(Date.now() / 1000)
    
    // アイコンアップロード
    const iconData = await handleIconUpload(body)
    const iconUrl = iconData || (body['icon_url'] as string) || await fetchAppIcon(body['base_url'] as string)

    // 新規アプリは既定で機密(シークレットを生成)。パブリック/SPA クライアントにするのは
    // 後から編集モーダルの「パブリックにする」操作で行う。
    const plainSecret = generateToken() + generateToken().replace(/-/g, '')
    const hashedSecret = await hashPassword(plainSecret)

    const redirectUris = ((body['redirect_uris'] as string) || '').trim() || null
    if (!redirectUris) {
        return c.redirect('/admin/apps?error=redirect_uris is required for new apps.')
    }

    const backchannelLogoutUri = ((body['backchannel_logout_uri'] as string) || '').trim() || null
    const initiateLoginUri = ((body['initiate_login_uri'] as string) || '').trim() || null

    if (initiateLoginUri && !isValidAppUri(initiateLoginUri, body['base_url'] as string, redirectUris)) {
        return c.redirect('/admin/apps?error=Invalid initiate_login_uri. Must match base_url or a redirect_uri origin.')
    }
    if (backchannelLogoutUri && !isValidAppUri(backchannelLogoutUri, body['base_url'] as string, redirectUris)) {
        return c.redirect('/admin/apps?error=Invalid backchannel_logout_uri. Must match base_url or a redirect_uri origin.')
    }

    // アプリ↔サービスの紐づけはここでは行わない(サービス構成側 service_apps で組み込む)。
    await c.env.DB.prepare('INSERT INTO apps (id, name, base_url, status, created_at, description, icon_url, client_secret, redirect_uris, backchannel_logout_uri, initiate_login_uri) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(body['id'], body['name'], body['base_url'], 'active', now, body['description'], iconUrl, hashedSecret, redirectUris, backchannelLogoutUri, initiateLoginUri).run()

    const details = JSON.stringify({ key: 'log_app_created', params: { appName: body['name'], id: body['id'], admin: user.email } });
    await logAudit(c, '', JSON.parse(details))
    return c.redirect('/admin/apps')
})

// アプリの client_secret を再生成、またはクリア(=パブリック化)する。
adminRouter.post('/admin/apps/secret', async (c) => {
    const user = await getAdmin(c)
    if (!user) {
        if (c.req.header('Accept')?.includes('application/json')) return c.json({ error: 'Unauthorized' }, 401)
        return c.redirect('/login')
    }
    
    // Parse body as JSON if Content-Type is application/json, otherwise parse as form
    let id, action;
    if (c.req.header('Content-Type')?.includes('application/json')) {
        const body = await c.req.json()
        id = body.id
        action = body.action
    } else {
        const body = await c.req.parseBody()
        id = body['id']
        action = body['action']
    }

    const plainSecret = action === 'clear' ? null : (generateToken() + generateToken().replace(/-/g, ''))
    const hashedSecret = plainSecret ? await hashPassword(plainSecret) : null
    await c.env.DB.prepare('UPDATE apps SET client_secret = ? WHERE id = ?').bind(hashedSecret, id).run()
    const details = JSON.stringify({ key: 'log_app_updated', params: { appName: id, status: action === 'clear' ? 'secret cleared' : 'secret regenerated', admin: user.email } });
    await logAudit(c, '', JSON.parse(details))
    
    if (c.req.header('Accept')?.includes('application/json')) {
        return c.json({ success: true, new_secret: plainSecret })
    }
    return c.redirect('/admin/apps')
})

// === アプリ更新(改修版) ===
adminRouter.post('/admin/apps/update', async (c) => {
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
    const initiateLoginUri = ((body['initiate_login_uri'] as string) || '').trim() || null

    if (initiateLoginUri && !isValidAppUri(initiateLoginUri, body['base_url'] as string, redirectUris)) {
        return c.redirect('/admin/apps?error=Invalid initiate_login_uri. Must match base_url or a redirect_uri origin.')
    }
    if (backchannelLogoutUri && !isValidAppUri(backchannelLogoutUri, body['base_url'] as string, redirectUris)) {
        return c.redirect('/admin/apps?error=Invalid backchannel_logout_uri. Must match base_url or a redirect_uri origin.')
    }

    // アプリ↔サービスの紐づけはここでは行わない(サービス構成側 service_apps で組み込む)。
    await c.env.DB.prepare('UPDATE apps SET name = ?, base_url = ?, description = ?, icon_url = ?, redirect_uris = ?, backchannel_logout_uri = ?, initiate_login_uri = ? WHERE id = ?')
        .bind(body['name'], body['base_url'], body['description'], iconUrl, redirectUris, backchannelLogoutUri, initiateLoginUri, id).run()
        
    const details = JSON.stringify({ key: 'log_app_updated', params: { appName: body['name'], status: 'Updated', admin: user.email } });
    await logAudit(c, '', JSON.parse(details))
    return c.redirect('/admin/apps')
})

adminRouter.post('/admin/apps/toggle', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const id = body['id']
    const status = body['status']
    await c.env.DB.prepare('UPDATE apps SET status = ? WHERE id = ?').bind(status, id).run()
    const details = JSON.stringify({ key: 'log_app_updated', params: { appName: id, status: status, admin: user.email } });
    await logAudit(c, '', JSON.parse(details))
    return c.redirect('/admin/apps')
})

// グループ管理者からのアプリ登録申請(status='pending')を承諾して有効化する。運営者専用。
adminRouter.post('/admin/apps/approve', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const id = (await c.req.parseBody())['id'] as string
    await c.env.DB.prepare("UPDATE apps SET status = 'active' WHERE id = ? AND status = 'pending'").bind(id).run()
    await logAudit(c, 'APP_APPROVED', { key: 'log_app_updated', params: { appName: id, status: 'approved', admin: user.email } })
    return c.redirect('/admin/apps')
})

// アプリ登録申請を却下する(status='rejected')。運営者専用。
adminRouter.post('/admin/apps/reject', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const id = body['id'] as string
    const reason = (body['reason'] as string) || ''
    await c.env.DB.prepare("UPDATE apps SET status = 'rejected', reason = ? WHERE id = ? AND status = 'pending'").bind(reason, id).run()
    await logAudit(c, 'APP_REJECTED', { key: 'log_app_updated', params: { appName: id, status: 'rejected', reason: reason, admin: user.email } })
    return c.redirect('/admin/apps')
})

adminRouter.post('/admin/apps/delete', async (c) => {
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
    await logAudit(c, '', JSON.parse(details))
    return c.redirect('/admin/apps')
})

// グループ・ユーザー等... は元のままだが、整合性のために含めている
adminRouter.get('/admin/groups', async (c) => {
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
        console.error(e)
        const isDev = c.env.ENVIRONMENT === 'dev' || c.env.ENVIRONMENT === 'development'
        return c.text(isDev ? ('Error: ' + e.message + '\n' + e.stack) : 'Internal Server Error', 500)
    }
})
adminRouter.post('/admin/groups', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const id = crypto.randomUUID()
    const now = Math.floor(Date.now() / 1000)
    await c.env.DB.prepare('INSERT INTO groups (id, name, created_at) VALUES (?, ?, ?)').bind(id, body['name'], now).run()
    return c.redirect('/admin/groups')
})
adminRouter.post('/admin/groups/delete', async (c) => {
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
    await logAudit(c, '', JSON.parse(details))
    return c.redirect('/admin/groups')
})
adminRouter.get('/admin/users', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const config = await getSystemConfig(c.env.DB)
    const siteName = getLocalizedValue(c, config.appName)
    const users = await c.env.DB.prepare('SELECT * FROM users ORDER BY created_at DESC').all()
    const apps = await c.env.DB.prepare('SELECT * FROM apps').all()
    const groups = await c.env.DB.prepare('SELECT * FROM groups').all()
    const services = await c.env.DB.prepare('SELECT * FROM services').all()
    const roles = await c.env.DB.prepare('SELECT * FROM service_role_master').all()
    const facilities = await c.env.DB.prepare('SELECT * FROM facilities').all()
    return c.html(<UsersPage t={getLang(c)} userEmail={user.email} users={users.results as any} apps={apps.results as any} groups={groups.results as any} services={services.results as any} roles={roles.results as any} facilities={facilities.results as any} inviteUrl={c.req.query('invite_url')} error={c.req.query('error')} siteName={siteName} appConfig={config} />)
})
adminRouter.post('/admin/invite', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const email = ((body['email'] as string) || '').trim().toLowerCase()
    if (!email) return c.redirect('/admin/users?error=Email required')
    const token = generateToken()
    const hashedToken = await hashToken(token)
    // 既存の平文トークンは無効化され、新規分からハッシュ保存になります（仕様変更）
    const expiresAt = Math.floor(Date.now() / 1000) + (86400 * 7) // 7 days
    try { await c.env.DB.prepare('INSERT INTO invitations (id, email, invited_by, expires_at) VALUES (?, ?, ?, ?)').bind(hashedToken, email, user.id, expiresAt).run() }
    catch (e: any) { return c.redirect(`/admin/users?error=${encodeURIComponent('Error: ' + e.message)}`) }
    const url = new URL(c.req.url)
    return c.redirect(`/admin/users?invite_url=${encodeURIComponent(url.protocol + '//' + url.host + '/invite?token=' + token)}`)
})
adminRouter.post('/admin/users/delete', async (c) => {
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
    await logAudit(c, '', JSON.parse(details))
    return c.redirect('/admin/users')
})
adminRouter.post('/admin/users/bulk', async (c) => {
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
    await logAudit(c, '', JSON.parse(details))
    return c.redirect('/admin/users')
})
adminRouter.get('/admin/api/user-details/:id', async (c) => {
    if (!await getAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)
    const userId = c.req.param('id')
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first() as User | null
    if (!user) return c.json({ error: 'Not found' }, 404)
    const { results: direct } = await c.env.DB.prepare('SELECT p.*, a.name as app_name FROM permissions p JOIN apps a ON p.app_id = a.id WHERE p.user_id = ?').bind(userId).all()
    let groupPerms: Record<string, unknown>[] = []
    if (user.group_id) {
        const res = await c.env.DB.prepare('SELECT p.*, a.name as app_name FROM group_permissions p JOIN apps a ON p.app_id = a.id WHERE p.group_id = ?').bind(user.group_id).all()
        groupPerms = res.results
    }
    const allApps = await c.env.DB.prepare('SELECT id, name FROM apps').all<{ id: string, name: string }>()
    const combined = allApps.results.map(app => {
        const d = direct.find((x) => x.app_id === app.id)
        const g = groupPerms.find((x) => x.app_id === app.id)
        if (d) return { ...d, source: 'user', is_override: true }
        if (g) return { ...g, source: 'group', is_override: false }
        return null
    }).filter(x => x)

    const assignments = await c.env.DB.prepare(`
        SELECT a.*, s.name AS service_name, g.name AS group_name,
               f.structure_no AS structure_no, f.building_use AS facility_name, rm.role_name AS role_name
        FROM service_user_assignments a
        LEFT JOIN services s ON a.service_id = s.id
        LEFT JOIN groups g ON a.group_id = g.id
        LEFT JOIN facilities f ON a.facility_id = f.id
        LEFT JOIN service_role_master rm ON a.service_role_id = rm.id
        WHERE a.user_id = ?
        ORDER BY a.valid_from DESC`).bind(userId).all()

    return c.json({ email: user.email, permissions: combined, group_id: user.group_id, assignments: assignments.results })
})
adminRouter.post('/admin/api/user/group', async (c) => {
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
        await logAudit(c, '', JSON.parse(details))
        return c.json({ success: true })
    } catch (e: any) {
        console.error(e)
        const isDev = c.env.ENVIRONMENT === 'dev' || c.env.ENVIRONMENT === 'development'
        return c.json(isDev ? { error: e.message, stack: e.stack } : { error: 'Internal Server Error' }, 500)
    }
})
adminRouter.post('/admin/api/user/permission/revoke', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const id = body['id']
    await c.env.DB.prepare('DELETE FROM permissions WHERE id = ?').bind(id).run()
    const details = JSON.stringify({ key: 'log_permission_revoke', params: { id: id, admin: user.email } });
    await logAudit(c, '', JSON.parse(details))
    return c.json({ success: true })
})
adminRouter.post('/admin/api/user/permission/grant', async (c) => {
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
    await logAudit(c, '', JSON.parse(details))
    return c.json({ success: true })
})
adminRouter.get('/admin/api/group-details/:id', async (c) => {
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
adminRouter.post('/admin/api/group/permission/grant', async (c) => {
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
    await logAudit(c, '', JSON.parse(details))
    return c.json({ success: true })
})
adminRouter.post('/admin/api/group/permission/revoke', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const id = body['id']
    await c.env.DB.prepare('DELETE FROM group_permissions WHERE id = ?').bind(id).run()
    const details = JSON.stringify({ key: 'log_group_permission_revoke', params: { id: id, admin: user.email } });
    await logAudit(c, '', JSON.parse(details))
    return c.json({ success: true })
})

// ============================================================
// アカウントマネージャ: グループ管理(新データ層・additive)
//   既存の /admin/groups(OIDCの所属→アプリ権限)とは別物。
//   ここでは groups(階層対応) と group_memberships(所属＋役割＋期間) を扱う。
// ============================================================
adminRouter.get('/admin/am/groups', async (c) => {
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
        const facilities = await c.env.DB.prepare('SELECT id, structure_no, building_use, managing_group_id FROM facilities ORDER BY structure_no').all()
        const contracts = await c.env.DB.prepare('SELECT ct.*, s.name AS service_name, g.name AS group_name FROM service_contracts ct LEFT JOIN services s ON ct.service_id = s.id LEFT JOIN groups g ON ct.customer_group_id = g.id ORDER BY ct.valid_from DESC').all()
        if (!groups.success) throw new Error('Groups DB Error: ' + groups.error)
        if (!users.success) throw new Error('Users DB Error: ' + users.error)
        return c.html(<AccountGroupsPage t={getLang(c)} userEmail={user.email} groups={groups.results as any} users={users.results as any} facilities={facilities.results as any} contracts={contracts.results as any} siteName={siteName} appConfig={config} />)
    } catch (e: any) {
        console.error(e)
        const isDev = c.env.ENVIRONMENT === 'dev' || c.env.ENVIRONMENT === 'development'
        return c.text(isDev ? ('Error: ' + e.message + '\n' + e.stack) : 'Internal Server Error', 500)
    }
})
adminRouter.post('/admin/am/groups', async (c) => {
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
//   親が実際に変わったら、移動サブツリーの利用枠(Sub-Grant)を強制没収する(下記参照)。
adminRouter.post('/admin/am/groups/parent', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const id = body['id'] as string
    let parentId = (body['parent_id'] as string) || null
    if (parentId === '') parentId = null
    if (parentId && parentId === id) return c.json({ error: 'self' }, 400)
    // 現在のツリーを一括取得(循環チェック + 移動サブツリーの算出に使う)。
    const { results: allGroups } = await c.env.DB.prepare('SELECT id, parent_id FROM groups').all<{ id: string; parent_id: string | null }>()
    const parentOf = new Map<string, string | null>(allGroups.map((r): [string, string | null] => [r.id, r.parent_id]))
    if (!parentOf.has(id)) return c.json({ error: 'Not found' }, 404)
    const oldParentId = parentOf.get(id) ?? null
    if (parentId) {
        // 親候補から祖先を辿り、自分(id)に到達したら循環なので拒否。
        let cur: string | null = parentId
        let guard = 0
        while (cur && guard++ < 10000) {
            if (cur === id) return c.json({ error: 'cycle' }, 400)
            cur = parentOf.get(cur) ?? null
        }
    }
    await c.env.DB.prepare('UPDATE groups SET parent_id = ? WHERE id = ?').bind(parentId, id).run()

    // 【組織移動時の予算整合】親が実際に変わったら、移動したサブツリー(自身+子孫)が保持する
    //   利用枠(Sub-Grant)を強制的に没収する。「親grant − 子grant」の実効上限計算は"今の"
    //   ツリー構造を前提とするため、付け替え時に枠を残すと矛盾が起きる:
    //     ・元の親で子へ配った枠が浮き、残高が錬金術的に復活する
    //     ・新しい親に枠を持つ子が降ってきて残高が減るとばっちり
    //     ・移動先で旧組織の契約(別世界)を消費し続ける
    //   割当(service_user_assignments)は保護して残す。利用枠がゼロになるので一時的に
    //   利用は停止するが、新しい親の決済権者が枠を配り直せば既存割当はそのまま再点灯する。
    let revoked = 0
    if (oldParentId !== parentId) {
        // 子→親の隣接から、移動した id を根とするサブツリー(id + 子孫)を集める。
        // (移動で変わるのは id の親リンクのみ。id 配下の親子関係は不変なので移動前の
        //  スナップショットでサブツリーを正しく算出できる。)
        const childrenMap = new Map<string, string[]>()
        for (const g of allGroups) {
            if (!g.parent_id) continue
            if (!childrenMap.has(g.parent_id)) childrenMap.set(g.parent_id, [])
            childrenMap.get(g.parent_id)!.push(g.id)
        }
        const subtree: string[] = []
        const seen = new Set<string>()
        const stack = [id]
        while (stack.length) {
            const cur = stack.pop()!
            if (seen.has(cur)) continue
            seen.add(cur)
            subtree.push(cur)
            for (const ch of childrenMap.get(cur) || []) stack.push(ch)
        }
        const placeholders = subtree.map(() => '?').join(',')
        const res = await c.env.DB.prepare(`DELETE FROM group_service_grants WHERE group_id IN (${placeholders})`).bind(...subtree).run()
        revoked = res.meta.changes
    }

    const details = JSON.stringify({ key: 'log_group_parent_changed', params: { id, parent: parentId || '(root)', revoked, admin: user.email } })
    await logAudit(c, '', JSON.parse(details))
    return c.json({ success: true, revoked })
})
adminRouter.post('/admin/am/groups/delete', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const id = body['id'] as string

    // 【組織削除時の予算整合】削除対象グループ自身と、親を失ってルートに昇格する(parent_id=NULL)
    //   全ての子孫グループの利用枠(Sub-Grant)を強制的に没収する。
    const { results: allGroups } = await c.env.DB.prepare('SELECT id, parent_id FROM groups').all<{ id: string; parent_id: string | null }>()
    const childrenMap = new Map<string, string[]>()
    for (const g of allGroups) {
        if (!g.parent_id) continue
        if (!childrenMap.has(g.parent_id)) childrenMap.set(g.parent_id, [])
        childrenMap.get(g.parent_id)!.push(g.id)
    }
    const subtree: string[] = []
    const seen = new Set<string>()
    const stack = [id]
    while (stack.length) {
        const cur = stack.pop()!
        if (seen.has(cur)) continue
        seen.add(cur)
        subtree.push(cur)
        for (const ch of childrenMap.get(cur) || []) stack.push(ch)
    }
    const placeholders = subtree.map(() => '?').join(',')

    // グループ削除に伴い、新旧両モデルの関連レコードを掃除する。
    await c.env.DB.batch([
        c.env.DB.prepare(`DELETE FROM group_service_grants WHERE group_id IN (${placeholders})`).bind(...subtree),
        c.env.DB.prepare('DELETE FROM group_memberships WHERE group_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM group_permissions WHERE group_id = ?').bind(id),
        c.env.DB.prepare('UPDATE users SET group_id = NULL WHERE group_id = ?').bind(id),
        c.env.DB.prepare('UPDATE groups SET parent_id = NULL WHERE parent_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM groups WHERE id = ?').bind(id)
    ])
    const details = JSON.stringify({ key: 'log_group_deleted', params: { id: id, admin: user.email, revoked_subtree_size: subtree.length } });
    await logAudit(c, '', JSON.parse(details))
    return c.redirect('/admin/am/groups')
})
adminRouter.get('/admin/api/am/group-members/:id', async (c) => {
    if (!await getAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)
    const groupId = c.req.param('id')
    const { results } = await c.env.DB.prepare(`
        SELECT m.id, m.user_id, m.is_group_admin, m.is_billing_admin, m.is_developer, m.valid_from, m.valid_to, u.email, u.name
        FROM group_memberships m JOIN users u ON m.user_id = u.id
        WHERE m.group_id = ? ORDER BY m.is_group_admin DESC, m.is_billing_admin DESC, u.email
    `).bind(groupId).all()
    return c.json({ members: results })
})
adminRouter.post('/admin/api/am/membership/add', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const groupId = body['group_id'] as string
    const userIds = (body['user_ids'] as string[]) || []
    // 役割は兼任可能なフラグ(グループ管理者/決裁権者/開発者)。未指定はすべて 0(=メンバー)。
    const isGroupAdmin = body['is_group_admin'] ? 1 : 0
    const isBillingAdmin = body['is_billing_admin'] ? 1 : 0
    const isDeveloper = body['is_developer'] ? 1 : 0
    const validFrom = Number(body['valid_from'])
    const validTo = Number(body['valid_to'])
    if (!groupId || userIds.length === 0) return c.json({ error: 'group_id and user_ids required' }, 400)
    // UNIQUE(user_id, group_id) を活かして upsert(フラグ・期間を更新)。role 列は既定値('member')に任せる。
    for (const uid of userIds) {
        await c.env.DB.prepare(`
            INSERT INTO group_memberships (user_id, group_id, is_group_admin, is_billing_admin, is_developer, valid_from, valid_to)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id, group_id) DO UPDATE SET
                is_group_admin=excluded.is_group_admin,
                is_billing_admin=excluded.is_billing_admin,
                is_developer=excluded.is_developer,
                valid_from=excluded.valid_from, valid_to=excluded.valid_to
        `).bind(uid, groupId, isGroupAdmin, isBillingAdmin, isDeveloper, validFrom, validTo).run()
    }
    const roleLabel = [isGroupAdmin && 'group_admin', isBillingAdmin && 'billing_admin', isDeveloper && 'developer'].filter(Boolean).join(',') || 'member'
    const details = JSON.stringify({ key: 'log_membership_add', params: { count: userIds.length, group: groupId, role: roleLabel, admin: user.email } });
    await logAudit(c, '', JSON.parse(details))
    return c.json({ success: true })
})
adminRouter.post('/admin/api/am/membership/remove', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const id = body['id']
    await c.env.DB.prepare('DELETE FROM group_memberships WHERE id = ?').bind(id).run()
    const details = JSON.stringify({ key: 'log_membership_remove', params: { id: id, admin: user.email } });
    await logAudit(c, '', JSON.parse(details))
    return c.json({ success: true })
})

// ============================================================
// アカウントマネージャ: サービスマスタ(ゲート①)
//   提供企業 → サービス → 契約(席数上限つき)。全ゲートの前提データ。
// ============================================================
adminRouter.get('/admin/am/services', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const config = await getSystemConfig(c.env.DB)
    const siteName = getLocalizedValue(c, config.appName)
    const providers = await c.env.DB.prepare('SELECT * FROM service_providers ORDER BY created_at DESC').all()
    // 承認待ち(pending)を先頭に。所有グループ名と、組み込み済みアプリ名(カンマ連結)も付ける。
    const services = await c.env.DB.prepare(`
        SELECT s.*, p.name AS provider_name, g.name AS owner_group_name,
               (SELECT GROUP_CONCAT(a.name, ', ') FROM service_apps sa JOIN apps a ON a.id = sa.app_id WHERE sa.service_id = s.id) AS app_names,
               (SELECT GROUP_CONCAT(sa.app_id, ',') FROM service_apps sa WHERE sa.service_id = s.id) AS app_ids
        FROM services s
        LEFT JOIN service_providers p ON s.provider_id = p.id
        LEFT JOIN groups g ON s.owner_group_id = g.id
        ORDER BY (s.status = 'pending') DESC, s.created_at DESC`).all()
    const groups = await c.env.DB.prepare('SELECT * FROM groups ORDER BY name').all()
    const allApps = await c.env.DB.prepare(`
        SELECT a.*, g.name AS group_name 
        FROM apps a 
        LEFT JOIN groups g ON a.owner_group_id = g.id 
        WHERE a.status = 'active' ORDER BY a.name
    `).all()
    return c.html(<AccountServicesPage t={getLang(c)} userEmail={user.email} siteName={siteName} appConfig={config}
        providers={providers.results as any} services={services.results as any} groups={groups.results as any} apps={allApps.results as any} />)
})

adminRouter.get('/admin/am/contracts', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const config = await getSystemConfig(c.env.DB)
    const siteName = getLocalizedValue(c, config.appName)

    const services = await c.env.DB.prepare('SELECT s.*, p.name AS provider_name FROM services s LEFT JOIN service_providers p ON s.provider_id = p.id ORDER BY s.name').all()
    const contracts = await c.env.DB.prepare(`
        SELECT ct.*, s.name AS service_name, p.name AS provider_name, g.name AS group_name
        FROM service_contracts ct
        LEFT JOIN services s ON ct.service_id = s.id
        LEFT JOIN service_providers p ON s.provider_id = p.id
        LEFT JOIN groups g ON ct.customer_group_id = g.id
        ORDER BY ct.valid_from DESC
    `).all()
    const groups = await c.env.DB.prepare('SELECT * FROM groups ORDER BY name').all()

    return c.html(<AccountContractsPage t={getLang(c)} userEmail={user.email} siteName={siteName} appConfig={config}
        services={services.results as any} contracts={contracts.results as any} groups={groups.results as any} />)
})

adminRouter.get('/admin/am/services/:id', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const serviceId = c.req.param('id')
    const config = await getSystemConfig(c.env.DB)
    const siteName = getLocalizedValue(c, config.appName)

    const service = await c.env.DB.prepare('SELECT s.*, p.name AS provider_name FROM services s LEFT JOIN service_providers p ON s.provider_id = p.id WHERE s.id = ?').bind(serviceId).first()
    if (!service) return c.redirect('/admin/am/services?error=notfound_' + serviceId)

    const roles = await c.env.DB.prepare(`
        SELECT * FROM service_role_master WHERE service_id = ? ORDER BY id DESC
    `).bind(serviceId).all()

    return c.html(<AccountServiceDetailPage t={getLang(c)} userEmail={user.email} siteName={siteName} appConfig={config}
        service={service as any} roles={roles.results as any} error={c.req.query('error')} />)
})

adminRouter.post('/admin/api/service/app/add', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const serviceId = (body['service_id'] as string) || ''
    const appId = (body['app_id'] as string) || ''
    const now = Math.floor(Date.now() / 1000)
    try {
        await c.env.DB.prepare('INSERT INTO service_apps (service_id, app_id, created_at) VALUES (?, ?, ?)')
            .bind(serviceId, appId, now).run()
        const details = JSON.stringify({ key: 'log_service_app_add', params: { service: serviceId, app: appId, admin: user.email } });
        await logAudit(c, '', JSON.parse(details))
        return c.json({ success: true })
    } catch (e: any) {
        if (e.message.includes('UNIQUE')) return c.json({ success: true }) // 既に紐づいている
        return c.json({ error: e.message }, 500)
    }
})

adminRouter.post('/admin/api/service/app/remove', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const serviceId = (body['service_id'] as string) || ''
    const appId = (body['app_id'] as string) || ''
    await c.env.DB.prepare('DELETE FROM service_apps WHERE service_id = ? AND app_id = ?').bind(serviceId, appId).run()
    const details = JSON.stringify({ key: 'log_service_app_remove', params: { service: serviceId, app: appId, admin: user.email } });
    await logAudit(c, '', JSON.parse(details))
    return c.json({ success: true })
})
adminRouter.post('/admin/am/providers', async (c) => {
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
adminRouter.post('/admin/am/providers/delete', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const id = (await c.req.parseBody())['id'] as string
    // 提供企業の配下サービス、さらにその下の契約/利用枠/役割/割当を連鎖削除する。
    const svc = await c.env.DB.prepare('SELECT id FROM services WHERE provider_id = ?').bind(id).all<{ id: string }>()
    for (const s of svc.results) await deleteServiceCascade(c, s.id)
    await c.env.DB.prepare('DELETE FROM service_providers WHERE id = ?').bind(id).run()
    await logAudit(c, 'PROVIDER_DELETE', { key: 'log_provider_delete', params: { id, admin: user.email } })
    return c.redirect('/admin/am/services')
})
adminRouter.post('/admin/am/services', async (c) => {
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
// グループ管理者が構成・申請したサービス(status='pending')を承諾して有効化する。運営者専用。
adminRouter.post('/admin/am/services/approve', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const id = body['id'] as string
    
    // 構成変更チェック(TOCTOU対策)
    const expectedAppsRaw = (body['expected_apps'] as string) || ''
    const expectedApps = expectedAppsRaw.split(',').filter(Boolean).sort().join(',')
    
    const currentAppsRows = await c.env.DB.prepare('SELECT app_id FROM service_apps WHERE service_id = ? ORDER BY app_id').bind(id).all<{ app_id: string }>()
    const currentApps = currentAppsRows.results.map((r) => r.app_id).sort().join(',')
    
    if (expectedApps !== currentApps) {
        return c.text('Error: The service composition has changed since you opened this page. Please return to the previous page, refresh, and review again.', 409)
    }

    const service = await c.env.DB.prepare("SELECT owner_group_id FROM services WHERE id = ?").bind(id).first<{ owner_group_id: string | null }>()
    
    const statements = []
    statements.push(c.env.DB.prepare("UPDATE services SET status = 'active' WHERE id = ? AND status = 'pending'").bind(id))

    if (service && service.owner_group_id) {
        // 自社サービスの場合、ルート契約と直系経路上の利用枠を物理作成する
        const { results: allGroups } = await c.env.DB.prepare('SELECT id, parent_id FROM groups').all<{ id: string; parent_id: string | null }>()
        const parentMap = new Map(allGroups.map((g): [string, string | null] => [g.id, g.parent_id]))
        const path: string[] = []
        let cur: string | null = service.owner_group_id
        let rootId = service.owner_group_id
        while (cur) {
            path.unshift(cur) // [Root, ..., HQ, Dev]
            rootId = cur
            cur = parentMap.get(cur) || null
        }
        
        const contractId = crypto.randomUUID()
        statements.push(
            c.env.DB.prepare('INSERT INTO service_contracts (id, service_id, customer_group_id, seat_limit, valid_from, valid_to) VALUES (?, ?, ?, NULL, 0, 2147483647)')
            .bind(contractId, id, rootId)
        )
        
        for (const gid of path) {
            statements.push(
                c.env.DB.prepare('INSERT INTO group_service_grants (group_id, service_id, contract_id, seat_limit, valid_from, valid_to) VALUES (?, ?, ?, NULL, 0, 2147483647)')
                .bind(gid, id, contractId)
            )
        }
    }
    
    await c.env.DB.batch(statements)
    
    await logAudit(c, 'SERVICE_APPROVED', { key: 'log_service_add', params: { name: id, admin: user.email } })
    
    return c.redirect('/admin/am/services')
})
// サービス申請を却下する(status='rejected')。運営者専用。
adminRouter.post('/admin/am/services/reject', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const id = body['id'] as string
    const reason = (body['reason'] as string) || ''
    
    // 構成変更チェック(TOCTOU対策)
    const expectedAppsRaw = (body['expected_apps'] as string) || ''
    const expectedApps = expectedAppsRaw.split(',').filter(Boolean).sort().join(',')
    const currentAppsRows = await c.env.DB.prepare('SELECT app_id FROM service_apps WHERE service_id = ? ORDER BY app_id').bind(id).all<{ app_id: string }>()
    const currentApps = currentAppsRows.results.map((r) => r.app_id).sort().join(',')
    
    if (expectedApps !== currentApps) {
        return c.text('Error: The service composition has changed since you opened this page. Please return to the previous page, refresh, and review again.', 409)
    }

    await c.env.DB.prepare("UPDATE services SET status = 'rejected', reason = ? WHERE id = ? AND status = 'pending'").bind(reason, id).run()
    await logAudit(c, 'SERVICE_REJECTED', { key: 'log_service_delete', params: { id, reason, admin: user.email } })
    return c.redirect('/admin/am/services')
})
adminRouter.post('/admin/am/services/delete', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const id = (await c.req.parseBody())['id'] as string
    await deleteServiceCascade(c, id)
    await logAudit(c, 'SERVICE_DELETE', { key: 'log_service_delete', params: { id, admin: user.email } })
    return c.redirect('/admin/am/services')
})
adminRouter.post('/admin/am/contracts', async (c) => {
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
    return c.redirect('/admin/am/contracts')
})
adminRouter.post('/admin/am/contracts/delete', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const id = (await c.req.parseBody())['id'] as string
    const ct = await c.env.DB.prepare('SELECT service_id FROM service_contracts WHERE id = ?').bind(id).first<{ service_id: string }>()
    await c.env.DB.batch([
        c.env.DB.prepare('DELETE FROM group_service_grants WHERE contract_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM service_contracts WHERE id = ?').bind(id),
    ])
    await logAudit(c, 'CONTRACT_DELETE', { key: 'log_contract_delete', params: { id, admin: user.email } })
    return c.redirect('/admin/am/contracts')
})

// ============================================================
// アカウントマネージャ: 利用枠(ゲート②)。契約をグループノードへ明示開放。
// ============================================================
adminRouter.post('/admin/api/am/grant/add', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const groupId = (body['group_id'] as string) || ''
    const contractId = (body['contract_id'] as string) || ''
    if (!groupId || !contractId) return c.json({ error: 'Missing required fields' }, 400)
    
    const ct = await c.env.DB.prepare('SELECT service_id FROM service_contracts WHERE id = ?').bind(contractId).first<{ service_id: string }>()
    if (!ct) return c.json({ error: 'Contract not found' }, 404)
    
    const seatRaw = (body['seat_limit'] as string || '').trim()
    const seatLimit = seatRaw === '' ? null : Number(seatRaw)
    const validFrom = Math.floor(new Date(body['valid_from'] as string).getTime() / 1000)
    const validTo = Math.floor(new Date(body['valid_to'] as string).getTime() / 1000)
    
    await c.env.DB.prepare(`
        INSERT INTO group_service_grants (group_id, service_id, contract_id, seat_limit, valid_from, valid_to) VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(group_id, service_id) DO UPDATE SET contract_id=excluded.contract_id, seat_limit=excluded.seat_limit, valid_from=excluded.valid_from, valid_to=excluded.valid_to
    `).bind(groupId, ct.service_id, contractId, seatLimit, validFrom, validTo).run()
    await logAudit(c, 'GRANT_ADD', { key: 'log_grant_add', params: { group: groupId, service: ct.service_id, admin: user.email } })
    return c.json({ success: true })
})
adminRouter.post('/admin/api/am/grant/remove', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const id = body['id'] as string
    await c.env.DB.prepare('DELETE FROM group_service_grants WHERE id = ?').bind(id).run()
    await logAudit(c, 'GRANT_DELETE', { key: 'log_grant_delete', params: { id, admin: user.email } })
    return c.json({ success: true })
})

// ============================================================
// アカウントマネージャ: 施設(建物)。管理グループ(支店)に紐づく。
// ============================================================
adminRouter.get('/admin/api/am/group-facilities/:id', async (c) => {
    if (!await getAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)
    const groupId = c.req.param('id')
    const { results } = await c.env.DB.prepare(`
        SELECT * FROM facilities WHERE managing_group_id = ? ORDER BY created_at DESC
    `).bind(groupId).all()
    return c.json({ facilities: results })
})

adminRouter.get('/admin/api/am/group-grants/:id', async (c) => {
    if (!await getAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)
    const groupId = c.req.param('id')
    const { results } = await c.env.DB.prepare(`
        SELECT gr.*, s.name AS service_name, ct.customer_group_id
        FROM group_service_grants gr
        LEFT JOIN services s ON gr.service_id = s.id
        LEFT JOIN service_contracts ct ON gr.contract_id = ct.id
        WHERE gr.group_id = ? ORDER BY gr.valid_from DESC
    `).bind(groupId).all()
    return c.json({ grants: results })
})
adminRouter.post('/admin/api/am/facility/add', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const groupId = (body['managing_group_id'] as string) || ''
    const structureNo = ((body['structure_no'] as string) || '').trim() || null
    const buildingUse = ((body['building_use'] as string) || '').trim() || null
    if (!groupId) return c.json({ error: 'managing_group_id required' }, 400)

    // UNIQUE制約解除に伴い、常に新規INSERTする
    await c.env.DB.prepare('INSERT INTO facilities (id, structure_no, building_use, managing_group_id, created_at) VALUES (?, ?, ?, ?, ?)')
        .bind(crypto.randomUUID(), structureNo, buildingUse, groupId, Math.floor(Date.now() / 1000)).run()
    await logAudit(c, 'FACILITY_ADD', { key: 'log_facility_add', params: { structure_no: structureNo, admin: user.email } })
    return c.json({ success: true })
})

adminRouter.get('/admin/api/am/facilities/all', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const facilities = await c.env.DB.prepare(`
        SELECT f.id, f.structure_no, f.building_use, f.managing_group_id, g.name AS group_name 
        FROM facilities f 
        LEFT JOIN groups g ON f.managing_group_id = g.id 
        ORDER BY f.structure_no
    `).all()
    return c.json(facilities.results)
})

adminRouter.post('/admin/api/am/facility/move', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const facilityId = body['facility_id'] as string
    const targetGroupId = body['managing_group_id'] as string
    
    if (!facilityId || !targetGroupId) return c.json({ error: 'missing fields' }, 400)
    
    // 権限バリデーション: 今回は getAdmin(c) でシステム管理者が保証されているため全グループ移動可能
    // (将来的にグループ管理者に開放される場合は、ここで移動元・移動先が getManagedGroupIds の範囲内かチェックする)
    
    await c.env.DB.prepare('UPDATE facilities SET managing_group_id = ? WHERE id = ?').bind(targetGroupId, facilityId).run()
    
    // 監査ログ
    const facility = await c.env.DB.prepare('SELECT structure_no FROM facilities WHERE id = ?').bind(facilityId).first() as { structure_no: string | null } | null
    await logAudit(c, 'FACILITY_MOVE', { key: 'log_facility_move', params: { structure_no: facility?.structure_no || facilityId, admin: user.email } })
    
    return c.json({ success: true, moved: true })
})
adminRouter.post('/admin/api/am/facility/remove', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const id = body['id'] as string
    if (!id) return c.json({ error: 'id required' }, 400)
    await c.env.DB.batch([
        c.env.DB.prepare('DELETE FROM service_user_assignments WHERE facility_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM facilities WHERE id = ?').bind(id),
    ])
    await logAudit(c, 'FACILITY_DELETE', { key: 'log_facility_delete', params: { id, admin: user.email } })
    return c.json({ success: true })
})

// ============================================================
// アカウントマネージャ: 役割マスタ + 利用者割当(ゲート③)。
//   割当はゲート②(利用枠)が前提。席数上限を超える場合は拒否する。
// ============================================================
adminRouter.post('/admin/am/roles', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    const serviceId = (body['service_id'] as string) || ''
    const facilityType = ((body['facility_type'] as string) || '').trim() || null
    const roleCode = ((body['role_code'] as string) || '').trim() || 'general'
    const roleName = ((body['role_name'] as string) || '').trim()
    if (serviceId && roleName) {
        await c.env.DB.prepare('INSERT INTO service_role_master (service_id, facility_type, role_code, role_name) VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING')
            .bind(serviceId, facilityType, roleCode, roleName).run()
        await logAudit(c, 'ROLE_ADD', { key: 'log_role_add', params: { role: roleName, admin: user.email } })
    }
    return c.redirect(serviceId ? '/admin/am/services/' + serviceId : '/admin/am/services')
})
adminRouter.post('/admin/am/roles/delete', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const id = (await c.req.parseBody())['id'] as string
    const rm = await c.env.DB.prepare('SELECT service_id FROM service_role_master WHERE id = ?').bind(id).first<{ service_id: string }>()
    await c.env.DB.batch([
        c.env.DB.prepare('DELETE FROM service_user_assignments WHERE service_role_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM service_role_master WHERE id = ?').bind(id),
    ])
    await logAudit(c, 'ROLE_DELETE', { key: 'log_role_delete', params: { id, admin: user.email } })
    return c.redirect(rm ? '/admin/am/services/' + rm.service_id : '/admin/am/services')
})
adminRouter.post('/admin/api/am/assignment/add', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const userId = (body['user_id'] as string) || ''
    const groupId = (body['group_id'] as string) || ''
    const serviceId = (body['service_id'] as string) || ''
    const facilityId = body['facility_id'] ? (body['facility_id'] as string) : null
    const roleId = body['service_role_id'] != null && body['service_role_id'] !== '' ? Number(body['service_role_id']) : null
    const validFrom = Math.floor(new Date(body['valid_from'] as string).getTime() / 1000)
    const validTo = Math.floor(new Date(body['valid_to'] as string).getTime() / 1000)
    if (!userId || !groupId || !serviceId) return c.json({ error: 'Missing fields' }, 400)

    const res = await createAssignment(c, { userId, groupId, serviceId, facilityId, roleId, validFrom, validTo })
    if (res !== 'ok') return c.json({ error: res }, 400)
    await logAudit(c, 'ASSIGNMENT_ADD', { key: 'log_assignment_add', params: { user: userId, service: serviceId, admin: user.email } })
    return c.json({ success: true })
})
adminRouter.post('/admin/api/am/assignment/remove', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const id = (await c.req.json())['id'] as string
    const a = await c.env.DB.prepare('SELECT service_id FROM service_user_assignments WHERE id = ?').bind(id).first<{ service_id: string }>()
    await c.env.DB.prepare('DELETE FROM service_user_assignments WHERE id = ?').bind(id).run()
    await logAudit(c, 'ASSIGNMENT_DELETE', { key: 'log_assignment_delete', params: { id, admin: user.email } })
    return c.json({ success: true })
})

adminRouter.get('/admin/logs', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const config = await getSystemConfig(c.env.DB)
    const siteName = getLocalizedValue(c, config.appName)
    const { results } = await c.env.DB.prepare('SELECT * FROM recent_audit_logs ORDER BY id DESC LIMIT 500').all<RecentAuditLog>()
    return c.html(<LogsPage
        t={getLang(c)}
        userEmail={user.email}
        logs={results}
        siteName={siteName}
        appConfig={config}
    />)
})

// 招待・パスワード忘れ等のルートは変更なし
adminRouter.get('/invite', async (c) => {
    const t = getLang(c)
    const token = c.req.query('token')
    if (!token) return c.html(<Invite t={t} error={t.error_invalid_invite} />)
    const hashedToken = await hashToken(token)
    const invite = await c.env.DB.prepare('SELECT * FROM invitations WHERE id = ? AND expires_at > ?')
        .bind(hashedToken, Math.floor(Date.now() / 1000)).first<{ email: string }>()
    if (!invite) return c.html(<Invite t={t} error={t.error_invalid_invite} />)
    return c.html(<Invite t={t} token={token} email={invite.email} />)
})
adminRouter.post('/invite', async (c) => {
    const t = getLang(c)
    const body = await c.req.parseBody()
    const token = (body['token'] as string).replace(/\s+/g, '')
    const password = body['password'] as string
    
    if (!validatePassword(password)) {
        return c.html(<Invite t={t} token={token} error={t.error_password_too_short || 'Password must be at least 8 characters long.'} />)
    }

    const hashedToken = await hashToken(token)
    const invite = await c.env.DB.prepare('SELECT * FROM invitations WHERE id = ? AND expires_at > ?')
        .bind(hashedToken, Math.floor(Date.now() / 1000)).first<{ email: string }>()
    if (!invite) return c.html(<Invite t={t} error={t.error_invalid_invite} />)
    const userId = crypto.randomUUID()
    const pwHash = await hashPassword(password)
    const now = Math.floor(Date.now() / 1000)
    try {
        await c.env.DB.prepare('INSERT INTO users (id, email, password_hash, created_at, updated_at, email_verified) VALUES (?, ?, ?, ?, ?, 1)')
            .bind(userId, invite.email, pwHash, now, now).run()
        await c.env.DB.prepare('DELETE FROM invitations WHERE id = ?').bind(hashedToken).run()
        return c.redirect('/login?msg=msg_account_created')
    } catch (e) {
        return c.html(<Invite t={t} token={token} error={t.error_user_exists} />)
    }
})
adminRouter.get('/forgot-password', (c) => c.html(<ForgotPassword t={getLang(c)} />))
adminRouter.post('/forgot-password', async (c) => {
    const t = getLang(c)
    const body = await c.req.parseBody()
    const email = ((body['email'] as string) || '').trim().toLowerCase()
    // レート制限: IP単位で1時間あたり5回まで
    const ip = c.req.header('CF-Connecting-IP') || 'unknown'
    if (!(await rateLimit(c.env.DB, `forgot:${ip}`, 5, 3600))) {
        return c.html(<ForgotPassword t={t} message={t.link_sent} />)
    }
    const user = await c.env.DB.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').bind(email).first() as User | null
    if (user) {
        const token = generateToken()
        const hashedToken = await hashToken(token)
        const expires = Math.floor(Date.now() / 1000) + 3600
        // 既存の平文トークンは無効化され、新規分からハッシュ保存になります（仕様変更）
        await c.env.DB.prepare('INSERT INTO password_resets (token, user_id, expires_at) VALUES (?, ?, ?)').bind(hashedToken, user.id, expires).run()
        const resetLink = `${new URL(c.req.url).origin}/reset-password?token=${token}`;
        const htmlBody = `
      <div style="font-family: sans-serif; color: #333; line-height: 1.6;">
        <p><strong>Password Reset</strong></p>
        <p>You requested a password reset. Please click the link below to set a new password:</p>
        <p><a href="${resetLink}" style="color: #0288d1; word-break: break-all;">${resetLink}</a></p>
        <p>This link will expire in 1 hour.</p>
        <p><strong>パスワードリセット</strong></p>
        <p>パスワードリセットのリクエストを受け付けました。以下のリンクをクリックして、新しいパスワードを設定してください。</p>
        <p><a href="${resetLink}" style="color: #0288d1; word-break: break-all;">${resetLink}</a></p>
        <p>このリンクは1時間で無効になります。</p>
      </div>
    `;
        await sendEmail(c.env, email, 'Password Reset / パスワードリセット', htmlBody);
    }
    return c.html(<ForgotPassword t={t} message={t.link_sent} />)
})
adminRouter.get('/reset-password', async (c) => {
    const t = getLang(c)
    const token = c.req.query('token')
    if (!token) return c.redirect('/forgot-password')
    const hashedToken = await hashToken(token)
    const reset = await c.env.DB.prepare('SELECT * FROM password_resets WHERE token = ? AND expires_at > ?').bind(hashedToken, Math.floor(Date.now() / 1000)).first()
    if (!reset) return c.html(<ResetPassword t={t} token="" error={t.error_invalid_invite} />)
    return c.html(<ResetPassword t={t} token={token} />)
})
adminRouter.post('/reset-password', async (c) => {
    const t = getLang(c)
    const body = await c.req.parseBody()
    const token = (body['token'] as string).replace(/\s+/g, '')
    const password = body['password'] as string
    
    if (!validatePassword(password)) {
        return c.html(<ResetPassword t={t} token={token} error={t.error_password_too_short || 'Password must be at least 8 characters long.'} />)
    }

    const hashedToken = await hashToken(token)
    const now = Math.floor(Date.now() / 1000)
    // DELETE ... RETURNING で原子的に消費。同一トークンを2リクエスト同時に使えない
    const consumed = await c.env.DB.prepare('DELETE FROM password_resets WHERE token = ? AND expires_at > ? RETURNING user_id').bind(hashedToken, now).first<{ user_id: string }>()
    if (!consumed) return c.html(<ResetPassword t={t} token="" error={t.error_invalid_invite} />)
    const pwHash = await hashPassword(password)
    await c.env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(pwHash, consumed.user_id).run()
    await c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(consumed.user_id).run()
    try { await c.env.DB.prepare('DELETE FROM app_sessions WHERE user_id = ?').bind(consumed.user_id).run() } catch (e) { }
    return c.redirect('/login')
})
adminRouter.post('/admin/config', async (c) => {
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
        await logAudit(c, '', JSON.parse(details))
        return c.redirect('/admin')
    } catch (e: any) {
        return c.text('Error updating config: ' + e.message, 500)
    }
})



// ============================================================
// システム管理者: 権限申請の管理 (role_applications)
//   運営が処理するのは「有効な決裁権者が一人も居ないグループ」の申請のみ。
//   決裁権者の居るグループの申請は、その決裁権者が委任ポータルで処理する。
//   承認/却下の実処理は委任側の汎用エンドポイント(/group-admin/api/roles/*)を共用する
//   (運営は決裁権者不在グループに対して canApproveFor が真になる)。
// ============================================================
adminRouter.get('/admin/am/developers', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const config = await getSystemConfig(c.env.DB)
    const siteName = getLocalizedValue(c, config.appName)
    const now = Math.floor(Date.now() / 1000)

    // 決裁権者不在グループの申請を、保留中を先頭にして取得する。
    const { results } = await c.env.DB.prepare(`
        SELECT
            ra.id, ra.user_id, ra.group_id, ra.role_type, ra.status, ra.reason, ra.admin_reason,
            ra.created_at AS applied_at, ra.updated_at AS processed_at,
            u.email, u.name AS user_name, g.name AS group_name
        FROM role_applications ra
        LEFT JOIN users u ON ra.user_id = u.id
        LEFT JOIN groups g ON ra.group_id = g.id
        WHERE NOT EXISTS (
            SELECT 1 FROM group_memberships bm
            WHERE bm.group_id = ra.group_id AND bm.is_billing_admin = 1
              AND bm.valid_from <= ? AND bm.valid_to >= ?
        )
        ORDER BY (ra.status = 'pending') DESC, ra.created_at DESC
    `).bind(now, now).all()

    return c.html(<AccountDevelopersPage
        t={getLang(c)}
        userEmail={user.email}
        applications={results as any}
        siteName={siteName}
        appConfig={config}
    />)
})
