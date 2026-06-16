import { Hono } from 'hono';
import type { Env, User, App, Session } from '../types';
import { Layout } from '../views/admin/Layout';
import { GroupAdminPage } from '../views/GroupAdminPage';
import { dict } from '../i18n';
import { generateToken, hashPassword } from '../utils/auth';
import {
  getLang,
  getSystemConfig,
  getLocalizedValue,
  getUser,
  checkPermission,
  logAudit,
  getEntitlements,
  getManagedGroupIds,
  createAssignment,
  deleteServiceCascade,
  ensureGroupProvider
} from '../index';

export const groupAdminRouter = new Hono<{ Bindings: Env }>();

groupAdminRouter.get('/group-admin', async (c) => {
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
            grantsByGroup={{}} grantsDetailByGroup={{}} availableContracts={[]} facilities={[]} rolesByService={{}}
            
            servicesByGroup={{}} appsByGroup={{}} approvedAppsByGroup={{}} devStatuses={{}} apps={[]} />)

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
            UNION
            SELECT id AS service_id, name AS service_name
            FROM services
            WHERE owner_group_id = ? AND status = 'active'
            ORDER BY service_name
        `).bind(gid, now, now, gid).all()
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

    // セルフサービス用データ:
    //   - servicesByGroup: 各グループが所有するサービス(status + 組み込み済みアプリ一覧)。
    //   - appsByGroup: 各グループが申請/所有するアプリ(status 込み)。
    //   - approvedAppsByGroup: 各グループが所有する「承認済み(active)」アプリ = サービスに組み込める部品。
    const servicesByGroup: Record<string, any[]> = {}
    const appsByGroup: Record<string, any[]> = {}
    
    const approvedAppsByGroup: Record<string, any[]> = {}
    
    // 開発者申請のステータスを取得
    const devStatuses: Record<string, { status: string, reason: string | null, admin_reason: string | null }> = {}
    const { results: devRows } = await c.env.DB.prepare(
        'SELECT group_id, status, reason, admin_reason FROM group_developer_applications WHERE user_id = ?'
    ).bind(user.id).all()
    for (const r of (devRows as any[])) {
        devStatuses[r.group_id] = { status: r.status, reason: r.reason, admin_reason: r.admin_reason }
    }

    for (const gid of groupIds) {
        const { results: svcRows } = await c.env.DB.prepare(
            'SELECT id, name, status FROM services WHERE owner_group_id = ? ORDER BY created_at DESC'
        ).bind(gid).all()
        // 各サービスに組み込み済みのアプリ(id, name)を付ける。
        for (const s of (svcRows as any[])) {
            const { results: comp } = await c.env.DB.prepare(`
                SELECT sa.app_id AS id, a.name AS name FROM service_apps sa
                JOIN apps a ON a.id = sa.app_id WHERE sa.service_id = ? ORDER BY a.name
            `).bind(s.id).all()
            s.apps = comp || []
        }
        servicesByGroup[gid] = svcRows || []
        const { results: appRows } = await c.env.DB.prepare(`
            SELECT id, name, base_url, status FROM apps
            WHERE owner_group_id = ? ORDER BY created_at DESC
        `).bind(gid).all()
        appsByGroup[gid] = appRows || []
        approvedAppsByGroup[gid] = (appRows as any[]).filter(a => a.status === 'active').map(a => ({ id: a.id, name: a.name }))
    }

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
        servicesByGroup={servicesByGroup}
        appsByGroup={appsByGroup}
        
        approvedAppsByGroup={approvedAppsByGroup}
        devStatuses={devStatuses}
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
groupAdminRouter.post('/group-admin/api/membership/add', async (c) => {
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
groupAdminRouter.post('/group-admin/api/membership/remove', async (c) => {
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
groupAdminRouter.post('/group-admin/api/assignment/add', async (c) => {
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
groupAdminRouter.post('/group-admin/api/assignment/remove', async (c) => {
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
groupAdminRouter.post('/group-admin/api/grant/add', async (c) => {
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
groupAdminRouter.post('/group-admin/api/grant/remove', async (c) => {
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

// ============================================================
// 委任セルフサービス: グループ管理者による「自グループのサービス作成」と
//   「アプリ登録の申請」。いずれも対象グループ/所有が自分の管理サブツリー内かを
//   getManagedGroupIds で必ず検証する。アプリは status='pending' で作られ、運営者の
//   承諾(/admin/apps/approve)で 'active' になるまで利用できない(=checkPermission で遮断)。
//   「サービス」は本システム固有概念(Auth0には無い)。memory: service-layer-is-ours-not-auth0。
// ============================================================

// 自グループのサービスを作成(即時・承諾不要)。所有グループを刻み、提供企業は自動採番。
groupAdminRouter.post('/group-admin/api/service/create', async (c) => {
    const user = await getUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const groupId = body['group_id'] as string
    const name = ((body['name'] as string) || '').trim()
    if (!groupId || !name) return c.json({ error: 'group_id and name required' }, 400)
    const managed = await getManagedGroupIds(c, user.id)
    if (!managed.has(groupId)) return c.json({ error: 'Forbidden' }, 403)
    const providerId = await ensureGroupProvider(c, groupId)
    const id = 'svc-' + crypto.randomUUID()
    // サービスは承認待ち(pending)で作成。承認済みアプリを組み込んでから運営者が承認する。
    await c.env.DB.prepare("INSERT INTO services (id, provider_id, name, created_at, owner_group_id, status) VALUES (?, ?, ?, ?, ?, 'pending')")
        .bind(id, providerId, name, Math.floor(Date.now() / 1000), groupId).run()
    // 割当用にデフォルトの「一般利用」役割を自動作成する
    await c.env.DB.prepare("INSERT INTO service_role_master (service_id, role_code, role_name) VALUES (?, 'general', '一般利用')").bind(id).run()
    await logAudit(c, 'DELEGATED_SERVICE_CREATE', { key: 'log_service_add', params: { name, admin: user.email } })
    return c.json({ success: true, id })
})

// 自グループのサービスを削除。紐づくアプリは紐付け解除し、契約/利用枠/役割/割当を連鎖削除。
groupAdminRouter.post('/group-admin/api/service/delete', async (c) => {
    const user = await getUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const id = (await c.req.json())['id'] as string
    const row = await c.env.DB.prepare('SELECT owner_group_id, status FROM services WHERE id = ?').bind(id).first() as { owner_group_id: string | null, status: string } | null
    if (!row) return c.json({ error: 'Not found' }, 404)
    const managed = await getManagedGroupIds(c, user.id)
    // owner が無い(運営者作成のグローバルサービス)は委任では消せない。
    if (!row.owner_group_id || !managed.has(row.owner_group_id)) return c.json({ error: 'Forbidden' }, 403)
    if (row.status === 'active') return c.json({ error: 'Cannot delete an active service. Please request a pause first.' }, 403)
    // 構成(service_apps)を外し、契約/利用枠/役割/割当を連鎖削除する(アプリ自体は消さない)。
    await c.env.DB.prepare('DELETE FROM service_apps WHERE service_id = ?').bind(id).run()
    await deleteServiceCascade(c, id)
    await logAudit(c, 'DELEGATED_SERVICE_DELETE', { key: 'log_service_delete', params: { id, admin: user.email } })
    return c.json({ success: true })
})

// サービス構成: 承認済みアプリを自グループのサービスへ組み込む(多対多)。
//   対象サービスが自グループ所有 かつ アプリが自グループ所有の承認済み(active) であること。
groupAdminRouter.post('/group-admin/api/service/app/add', async (c) => {
    const user = await getUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const serviceId = (body['service_id'] as string) || ''
    const appId = (body['app_id'] as string) || ''
    if (!serviceId || !appId) return c.json({ error: 'missing fields' }, 400)
    const managed = await getManagedGroupIds(c, user.id)
    const svc = await c.env.DB.prepare('SELECT owner_group_id, status FROM services WHERE id = ?').bind(serviceId).first() as { owner_group_id: string | null, status: string } | null
    if (!svc || !svc.owner_group_id || !managed.has(svc.owner_group_id)) return c.json({ error: 'Forbidden' }, 403)
    if (svc.status === 'active') return c.json({ error: 'Cannot modify an active service' }, 403)
    // 組み込めるのは「自グループ所有 かつ 承認済み(active)」のアプリのみ。
    const app = await c.env.DB.prepare('SELECT owner_group_id, status FROM apps WHERE id = ?').bind(appId).first() as { owner_group_id: string | null; status: string } | null
    if (!app || !app.owner_group_id || !managed.has(app.owner_group_id)) return c.json({ error: 'bad_app' }, 403)
    if (app.status !== 'active') return c.json({ error: 'app_not_approved' }, 400)
    await c.env.DB.prepare('INSERT OR IGNORE INTO service_apps (service_id, app_id, created_at) VALUES (?, ?, ?)')
        .bind(serviceId, appId, Math.floor(Date.now() / 1000)).run()
    await logAudit(c, 'DELEGATED_SERVICE_APP_ADD', { key: 'log_service_app_add', params: { service: serviceId, app: appId, admin: user.email } })
    return c.json({ success: true })
})

// サービス構成: 組み込んだアプリを外す。
groupAdminRouter.post('/group-admin/api/service/app/remove', async (c) => {
    const user = await getUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const serviceId = (body['service_id'] as string) || ''
    const appId = (body['app_id'] as string) || ''
    const managed = await getManagedGroupIds(c, user.id)
    const svc = await c.env.DB.prepare('SELECT owner_group_id, status FROM services WHERE id = ?').bind(serviceId).first() as { owner_group_id: string | null, status: string } | null
    if (!svc || !svc.owner_group_id || !managed.has(svc.owner_group_id)) return c.json({ error: 'Forbidden' }, 403)
    if (svc.status === 'active') return c.json({ error: 'Cannot modify an active service' }, 403)
    await c.env.DB.prepare('DELETE FROM service_apps WHERE service_id = ? AND app_id = ?').bind(serviceId, appId).run()
    await logAudit(c, 'DELEGATED_SERVICE_APP_REMOVE', { key: 'log_service_app_remove', params: { service: serviceId, app: appId, admin: user.email } })
    return c.json({ success: true })
})


// 開発者申請のエンドポイント
groupAdminRouter.post('/group-admin/api/developer/apply', async (c) => {
    const user = await getUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const groupId = body['group_id'] as string
    const reason = body['reason'] as string
    
    // Check if user is in the group (or managed subtree)
    const managedIds = await getManagedGroupIds(c, user.id)
    if (!managedIds.has(groupId)) return c.json({ error: 'Forbidden' }, 403)
    
    const now = Math.floor(Date.now() / 1000)
    await c.env.DB.prepare(`
        INSERT INTO group_developer_applications (user_id, group_id, status, reason, created_at, updated_at) 
        VALUES (?, ?, 'pending', ?, ?, ?)
        ON CONFLICT(user_id, group_id) DO UPDATE SET status='pending', reason=excluded.reason, admin_reason=NULL, updated_at=excluded.updated_at
    `).bind(user.id, groupId, reason, now, now).run()
    
    const details = JSON.stringify({ key: 'log_dev_apply', params: { group: groupId, user: user.email } })
    await c.env.DB.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)').bind('DEV_APPLY', details).run()
    return c.json({ success: true })
})

// アプリ登録の申請
// 。status='pending' で作成し owner_group_id を刻む。
//   サービスへの紐づけはここでは行わない(承認後にサービス構成側で組み込む)。
//   client_secret は機密既定で生成。
groupAdminRouter.post('/group-admin/api/app/request', async (c) => {
    const user = await getUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    
    const groupId = body['group_id'] as string
    
    const devApp = await c.env.DB.prepare('SELECT status FROM group_developer_applications WHERE user_id = ? AND group_id = ?').bind(user.id, groupId).first<{ status: string }>()
    if (!devApp || devApp.status !== 'approved') return c.json({ error: 'Developer status not approved for this group' }, 403)

    const id = ((body['id'] as string) || '').trim()
    const name = ((body['name'] as string) || '').trim()
    const baseUrl = ((body['base_url'] as string) || '').trim()
    const redirectUris = ((body['redirect_uris'] as string) || '').trim() || null
    const description = ((body['description'] as string) || '').trim() || null
    if (!groupId || !id || !name || !baseUrl) return c.json({ error: 'missing fields' }, 400)
    const managed = await getManagedGroupIds(c, user.id)
    if (!managed.has(groupId)) return c.json({ error: 'Forbidden' }, 403)
    // ID 衝突チェック(PK)。
    const dup = await c.env.DB.prepare('SELECT id FROM apps WHERE id = ?').bind(id).first()
    if (dup) return c.json({ error: 'id_taken' }, 409)
    const clientSecret = generateToken() + generateToken().replace(/-/g, '')
    await c.env.DB.prepare(`
        INSERT INTO apps (id, name, base_url, status, created_at, description, client_secret, redirect_uris, owner_group_id)
        VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?)
    `).bind(id, name, baseUrl, Math.floor(Date.now() / 1000), description, clientSecret, redirectUris, groupId).run()
    await logAudit(c, 'DELEGATED_APP_REQUEST', { key: 'log_app_created', params: { appName: name, id, admin: user.email } })
    return c.json({ success: true })
})

// 自グループのアプリ(申請含む)を更新。status は変更不可(自己承諾の防止)。サービス紐づけは扱わない。
groupAdminRouter.post('/group-admin/api/app/update', async (c) => {
    const user = await getUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const id = (body['id'] as string) || ''
    const name = ((body['name'] as string) || '').trim()
    const baseUrl = ((body['base_url'] as string) || '').trim()
    const redirectUris = ((body['redirect_uris'] as string) || '').trim() || null
    const description = ((body['description'] as string) || '').trim() || null
    if (!id || !name || !baseUrl) return c.json({ error: 'missing fields' }, 400)
    const row = await c.env.DB.prepare('SELECT owner_group_id, status FROM apps WHERE id = ?').bind(id).first() as { owner_group_id: string | null, status: string } | null
    if (!row) return c.json({ error: 'Not found' }, 404)
    const managed = await getManagedGroupIds(c, user.id)
    if (!row.owner_group_id || !managed.has(row.owner_group_id)) return c.json({ error: 'Forbidden' }, 403)
    if (row.status === 'active') return c.json({ error: 'Cannot edit an active app' }, 403)
    const newStatus = row.status === 'rejected' ? 'pending' : row.status
    await c.env.DB.prepare('UPDATE apps SET name = ?, base_url = ?, redirect_uris = ?, description = ?, status = ? WHERE id = ?')
        .bind(name, baseUrl, redirectUris, description, newStatus, id).run()
    await logAudit(c, 'DELEGATED_APP_UPDATE', { key: 'log_app_updated', params: { appName: name, status: newStatus, admin: user.email } })
    return c.json({ success: true })
})

// 自グループのアプリ(申請含む)を削除。
groupAdminRouter.post('/group-admin/api/app/delete', async (c) => {
    const user = await getUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const id = (await c.req.json())['id'] as string
    const row = await c.env.DB.prepare('SELECT owner_group_id, status FROM apps WHERE id = ?').bind(id).first() as { owner_group_id: string | null, status: string } | null
    if (!row) return c.json({ error: 'Not found' }, 404)
    const managed = await getManagedGroupIds(c, user.id)
    if (!row.owner_group_id || !managed.has(row.owner_group_id)) return c.json({ error: 'Forbidden' }, 403)
    if (row.status === 'active') return c.json({ error: 'Cannot delete an active app. Please request a pause first.' }, 403)
    await c.env.DB.batch([
        c.env.DB.prepare('DELETE FROM permissions WHERE app_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM group_permissions WHERE app_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM auth_codes WHERE app_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM app_sessions WHERE app_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM service_apps WHERE app_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM apps WHERE id = ?').bind(id),
    ])
    await logAudit(c, 'DELEGATED_APP_DELETE', { key: 'log_app_deleted', params: { id, admin: user.email } })
    return c.json({ success: true })
})