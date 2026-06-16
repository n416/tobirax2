import { Hono } from 'hono';
import type { Env, App, Session, User } from '../types';
import { Layout } from '../views/admin/Layout';
import { AdminHome } from '../views/admin/AdminHome';
import { AppsPage } from '../views/admin/AppsPage';
import { GroupsPage } from '../views/admin/GroupsPage';
import { UsersPage } from '../views/admin/UsersPage';
import { LogsPage } from '../views/admin/LogsPage';
import { AccountDevelopersPage } from '../views/admin/AccountDevelopersPage';
import { AccountGroupsPage } from '../views/admin/AccountGroupsPage';
import { AccountServicesPage } from '../views/admin/AccountServicesPage';
import { AccountGrantsPage } from '../views/admin/AccountGrantsPage';
import { AccountFacilitiesPage } from '../views/admin/AccountFacilitiesPage';
import { AccountAssignmentsPage } from '../views/admin/AccountAssignmentsPage';
import { Invite } from '../views/Invite';
import { ForgotPassword } from '../views/ForgotPassword';
import { ResetPassword } from '../views/ResetPassword';
import { fetchAppIcon } from '../utils/icon';
import { dict } from '../i18n';
import {
  getLang,
  getSystemConfig,
  getLocalizedValue,
  getAdmin,
  handleIconUpload,
  logAudit,
  deleteServiceCascade,
  createAssignment
} from '../index';
import { sendEmail } from '../utils/mail';
import { generateToken, hashPassword } from '../utils/auth';

export const adminRouter = new Hono<{ Bindings: Env }>();

adminRouter.get('/admin', async (c) => {
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
    const regTokens = await c.env.DB.prepare('SELECT token, created_at, expires_at FROM registration_tokens ORDER BY created_at DESC').all()
    return c.html(<AppsPage t={getLang(c)} userEmail={user.email} apps={results as any} regTokens={regTokens.results as any} siteName={siteName} appConfig={config} />)
})

// RFC 7591 動的登録用の Initial Access Token を発行する。任意の `days` で有効期限を
// 設定する(空欄/0 = 無期限)。管理者専用。
adminRouter.post('/admin/registration-tokens', async (c) => {
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
adminRouter.post('/admin/registration-tokens/delete', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const body = await c.req.parseBody()
    await c.env.DB.prepare('DELETE FROM registration_tokens WHERE token = ?').bind(body['token']).run()
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)')
        .bind('REG_TOKEN_REVOKED', JSON.stringify({ key: 'log_app_updated', params: { appName: 'registration token', status: 'revoked', admin: user.email } })).run()
    return c.redirect('/admin/apps')
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
    const clientSecret = generateToken() + generateToken().replace(/-/g, '')

    const redirectUris = ((body['redirect_uris'] as string) || '').trim() || null
    const backchannelLogoutUri = ((body['backchannel_logout_uri'] as string) || '').trim() || null
    // アプリ↔サービスの紐づけはここでは行わない(サービス構成側 service_apps で組み込む)。
    await c.env.DB.prepare('INSERT INTO apps (id, name, base_url, status, created_at, description, icon_url, client_secret, redirect_uris, backchannel_logout_uri) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(body['id'], body['name'], body['base_url'], 'active', now, body['description'], iconUrl, clientSecret, redirectUris, backchannelLogoutUri).run()

    const details = JSON.stringify({ key: 'log_app_created', params: { appName: body['name'], id: body['id'], admin: user.email } });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('APP_CREATED', details).run()
    return c.redirect('/admin/apps')
})

// アプリの client_secret を再生成、またはクリア(=パブリック化)する。
adminRouter.post('/admin/apps/secret', async (c) => {
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
    // アプリ↔サービスの紐づけはここでは行わない(サービス構成側 service_apps で組み込む)。
    await c.env.DB.prepare('UPDATE apps SET name = ?, base_url = ?, description = ?, icon_url = ?, redirect_uris = ?, backchannel_logout_uri = ? WHERE id = ?')
        .bind(body['name'], body['base_url'], body['description'], iconUrl, redirectUris, backchannelLogoutUri, id).run()
        
    const details = JSON.stringify({ key: 'log_app_updated', params: { appName: body['name'], status: 'Updated', admin: user.email } });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('APP_UPDATED', details).run()
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
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('APP_UPDATED', details).run()
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
    const id = (await c.req.parseBody())['id'] as string
    await c.env.DB.prepare("UPDATE apps SET status = 'rejected' WHERE id = ? AND status = 'pending'").bind(id).run()
    await logAudit(c, 'APP_REJECTED', { key: 'log_app_updated', params: { appName: id, status: 'rejected', admin: user.email } })
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
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('APP_DELETED', details).run()
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
        return c.text('Error: ' + e.message + '\n' + e.stack, 500)
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
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('GROUP_DELETED', details).run()
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
    return c.html(<UsersPage t={getLang(c)} userEmail={user.email} users={users.results as any} apps={apps.results as any} groups={groups.results as any} inviteUrl={c.req.query('invite_url')} error={c.req.query('error')} siteName={siteName} appConfig={config} />)
})
adminRouter.post('/admin/invite', async (c) => {
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
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('USER_DELETED', details).run()
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
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('USER_UPDATE', details).run()
    return c.redirect('/admin/users')
})
adminRouter.get('/admin/api/user-details/:id', async (c) => {
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
        await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('USER_UPDATE', details).run()
        return c.json({ success: true })
    } catch (e: any) {
        return c.json({ error: e.message, stack: e.stack }, 500)
    }
})
adminRouter.post('/admin/api/user/permission/revoke', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const id = body['id']
    await c.env.DB.prepare('DELETE FROM permissions WHERE id = ?').bind(id).run()
    const details = JSON.stringify({ key: 'log_permission_revoke', params: { id: id, admin: user.email } });
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('PERMISSION_REVOKE', details).run()
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
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('PERMISSION_GRANT', details).run()
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
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('GROUP_PERMISSION_GRANT', details).run()
    return c.json({ success: true })
})
adminRouter.post('/admin/api/group/permission/revoke', async (c) => {
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
        if (!groups.success) throw new Error('Groups DB Error: ' + groups.error)
        if (!users.success) throw new Error('Users DB Error: ' + users.error)
        return c.html(<AccountGroupsPage t={getLang(c)} userEmail={user.email} groups={groups.results as any} users={users.results as any} siteName={siteName} appConfig={config} />)
    } catch (e: any) {
        return c.text('Error: ' + e.message + '\n' + e.stack, 500)
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
adminRouter.post('/admin/am/groups/parent', async (c) => {
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
adminRouter.post('/admin/am/groups/delete', async (c) => {
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
adminRouter.get('/admin/api/am/group-members/:id', async (c) => {
    if (!await getAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)
    const groupId = c.req.param('id')
    const { results } = await c.env.DB.prepare(`
        SELECT m.id, m.user_id, m.role, m.valid_from, m.valid_to, u.email, u.name
        FROM group_memberships m JOIN users u ON m.user_id = u.id
        WHERE m.group_id = ? ORDER BY (m.role = 'group_admin') DESC, u.email
    `).bind(groupId).all()
    return c.json({ members: results })
})
adminRouter.post('/admin/api/am/membership/add', async (c) => {
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
adminRouter.post('/admin/api/am/membership/remove', async (c) => {
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
    const svc = await c.env.DB.prepare('SELECT id FROM services WHERE provider_id = ?').bind(id).all()
    for (const s of (svc.results as any[])) await deleteServiceCascade(c, s.id)
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
    
    const currentAppsRows = await c.env.DB.prepare('SELECT app_id FROM service_apps WHERE service_id = ? ORDER BY app_id').bind(id).all()
    const currentApps = currentAppsRows.results.map((r: any) => r.app_id).sort().join(',')
    
    if (expectedApps !== currentApps) {
        return c.text('Error: The service composition has changed since you opened this page. Please return to the previous page, refresh, and review again.', 409)
    }

    await c.env.DB.prepare("UPDATE services SET status = 'active' WHERE id = ? AND status = 'pending'").bind(id).run()
    await logAudit(c, 'SERVICE_APPROVED', { key: 'log_service_add', params: { name: id, admin: user.email } })
    return c.redirect('/admin/am/services')
})
// サービス申請を却下する(status='rejected')。運営者専用。
adminRouter.post('/admin/am/services/reject', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const id = (await c.req.parseBody())['id'] as string
    await c.env.DB.prepare("UPDATE services SET status = 'rejected' WHERE id = ? AND status = 'pending'").bind(id).run()
    await logAudit(c, 'SERVICE_REJECTED', { key: 'log_service_delete', params: { id, admin: user.email } })
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
    return c.redirect('/admin/am/services')
})
adminRouter.post('/admin/am/contracts/delete', async (c) => {
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
adminRouter.get('/admin/am/grants', async (c) => {
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
adminRouter.post('/admin/am/grants', async (c) => {
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
adminRouter.post('/admin/am/grants/delete', async (c) => {
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
adminRouter.get('/admin/am/facilities', async (c) => {
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
adminRouter.post('/admin/am/facilities', async (c) => {
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
adminRouter.post('/admin/am/facilities/delete', async (c) => {
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
adminRouter.get('/admin/am/assignments', async (c) => {
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
    return c.redirect('/admin/am/assignments')
})
adminRouter.post('/admin/am/roles/delete', async (c) => {
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
adminRouter.post('/admin/am/assignments', async (c) => {
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
adminRouter.post('/admin/am/assignments/delete', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const id = (await c.req.parseBody())['id'] as string
    await c.env.DB.prepare('DELETE FROM service_user_assignments WHERE id = ?').bind(id).run()
    await logAudit(c, 'ASSIGNMENT_DELETE', { key: 'log_assignment_delete', params: { id, admin: user.email } })
    return c.redirect('/admin/am/assignments')
})

adminRouter.get('/admin/logs', async (c) => {
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
adminRouter.get('/invite', async (c) => {
    const t = getLang(c)
    const token = c.req.query('token')
    if (!token) return c.html(<Invite t={t} error={t.error_invalid_invite} />)
    const invite = await c.env.DB.prepare('SELECT * FROM invitations WHERE id = ? AND expires_at > ?')
        .bind(token, Math.floor(Date.now() / 1000)).first<{ email: string }>()
    if (!invite) return c.html(<Invite t={t} error={t.error_invalid_invite} />)
    return c.html(<Invite t={t} token={token} email={invite.email} />)
})
adminRouter.post('/invite', async (c) => {
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
adminRouter.get('/forgot-password', (c) => c.html(<ForgotPassword t={getLang(c)} />))
adminRouter.post('/forgot-password', async (c) => {
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
adminRouter.get('/reset-password', async (c) => {
    const t = getLang(c)
    const token = c.req.query('token')
    if (!token) return c.redirect('/forgot-password')
    const reset = await c.env.DB.prepare('SELECT * FROM password_resets WHERE token = ? AND expires_at > ?').bind(token, Math.floor(Date.now() / 1000)).first()
    if (!reset) return c.html(<ResetPassword t={t} token="" error={t.error_invalid_invite} />)
    return c.html(<ResetPassword t={t} token={token} />)
})
adminRouter.post('/reset-password', async (c) => {
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
        await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('CONFIG_UPDATE', details).run()
        return c.redirect('/admin')
    } catch (e: any) {
        return c.text('Error updating config: ' + e.message, 500)
    }
})



// ============================================================
// システム管理者: 開発者申請の管理 (group_developer_applications)
// ============================================================
adminRouter.get('/admin/am/developers', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.redirect('/login')
    const config = await getSystemConfig(c.env.DB)
    const siteName = getLocalizedValue(c, config.appName)

    // 全申請を取得
    const { results } = await c.env.DB.prepare(`
        SELECT 
            d.user_id, d.group_id, d.status, d.reason, d.admin_reason, d.created_at as applied_at, d.updated_at as processed_at,
            u.email, u.name as user_name,
            g.name as group_name
        FROM group_developer_applications d
        LEFT JOIN users u ON d.user_id = u.id
        LEFT JOIN groups g ON d.group_id = g.id
        ORDER BY (d.status = 'pending') DESC, d.created_at DESC
    `).all()

    return c.html(<AccountDevelopersPage 
        t={getLang(c)} 
        userEmail={user.email} 
        applications={results as any} 
        siteName={siteName} 
        appConfig={config} 
    />)
})

adminRouter.post('/admin/api/developers/approve', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const { user_id, group_id } = body
    
    const now = Math.floor(Date.now() / 1000)
    await c.env.DB.prepare(`
        UPDATE group_developer_applications 
        SET status = 'approved', updated_at = ?
        WHERE user_id = ? AND group_id = ? AND status = 'pending'
    `).bind(now, user_id, group_id).run()

    const details = JSON.stringify({ key: 'log_dev_approve', params: { group: group_id, target_user: user_id, admin: user.email } })
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('DEV_APPROVE', details).run()
    
    return c.json({ success: true })
})

adminRouter.post('/admin/api/developers/reject', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const { user_id, group_id, admin_reason } = body
    
    const now = Math.floor(Date.now() / 1000)
    await c.env.DB.prepare(`
        UPDATE group_developer_applications 
        SET status = 'rejected', admin_reason = ?, updated_at = ?
        WHERE user_id = ? AND group_id = ? AND status = 'pending'
    `).bind(admin_reason || null, now, user_id, group_id).run()

    const details = JSON.stringify({ key: 'log_dev_reject', params: { group: group_id, target_user: user_id, admin: user.email } })
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('DEV_REJECT', details).run()
    
    return c.json({ success: true })
})

adminRouter.post('/admin/api/developers/revoke', async (c) => {
    const user = await getAdmin(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const { user_id, group_id, admin_reason } = body
    
    const now = Math.floor(Date.now() / 1000)
    await c.env.DB.prepare(`
        UPDATE group_developer_applications 
        SET status = 'revoked', admin_reason = ?, updated_at = ?
        WHERE user_id = ? AND group_id = ? AND status = 'approved'
    `).bind(admin_reason || null, now, user_id, group_id).run()

    const details = JSON.stringify({ key: 'log_dev_revoke', params: { group: group_id, target_user: user_id, admin: user.email } })
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('DEV_REVOKE', details).run()
    
    return c.json({ success: true })
})
