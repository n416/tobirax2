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
  getAdmin,
  checkPermission,
  logAudit,
  getEntitlements,
  getManagedGroupIds,
  getBillingGroupIds,
  createAssignment,
  deleteServiceCascade,
  ensureGroupProvider
} from '../index';

// 権限申請で扱えるロール種別。group_memberships の対応フラグ列にマップする。
const ROLE_TYPE_TO_FLAG: Record<string, 'is_group_admin' | 'is_billing_admin' | 'is_developer'> = {
  group_admin: 'is_group_admin',
  billing_admin: 'is_billing_admin',
  developer: 'is_developer',
}

export const groupAdminRouter = new Hono<{ Bindings: Env }>();

groupAdminRouter.get('/group-admin', async (c) => {
  try {
    const user = await getUser(c)
    if (!user) return c.redirect('/login')
    const t = getLang(c)
    const config = await getSystemConfig(c.env.DB)
    const siteName = getLocalizedValue(c, config.appName)
    const now = Math.floor(Date.now() / 1000)

    // 管理できるグループ = 自分が group_admin/billing_admin のグループ + その子孫(サブツリー)。
    // 親グループの管理者は配下支店も管理対象に含む(委任構造はツリーで降りる)。
    const managedIds = await getManagedGroupIds(c, user.id)
    // 決済権者(billing_admin)としての権限。利用枠タブの表示可否に使う(=どこかのグループで決済権者か)。
    const billingIds = await getBillingGroupIds(c, user.id)
    const isBillingAdmin = billingIds.size > 0

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
            isBillingAdmin={isBillingAdmin} childrenByGroup={{}}
            servicesByGroup={{}} appsByGroup={{}} approvedAppsByGroup={{}} devStatuses={{}} apps={[]}
            serviceTagsByGroup={{}} customTagsByGroup={{}} availableTags={[]} />)

    }

    const groupIds = managedGroups.map((g: any) => g.id as string)

    // 各グループの「直接の子グループ」(管理サブツリー内)。利用枠の分配先セレクトと
    //   「子グループへ配分済みの枠」テーブルの両方で使う。childrenByGroup[親id] = [{id, name}]。
    const childrenByGroup: Record<string, { id: string; name: string }[]> = {}
    for (const g of managedGroups as any[]) {
        if (!g.parent_id) continue
        if (!childrenByGroup[g.parent_id]) childrenByGroup[g.parent_id] = []
        childrenByGroup[g.parent_id].push({ id: g.id, name: g.original_name })
    }

    // 全ユーザー（メンバー追加候補）
    // 個人情報保護のため、自身が管理権限を持つグループ（およびその配下）に既に所属しているユーザーのみを選択可能とする。
    const groupIdsStr = groupIds.length > 0 ? groupIds.map(() => '?').join(',') : "''";
    const { results: allUsers } = await c.env.DB.prepare(`
        SELECT DISTINCT u.id, u.email, u.name 
        FROM users u
        JOIN group_memberships m ON u.id = m.user_id
        WHERE m.group_id IN (${groupIdsStr})
        ORDER BY u.email
    `).bind(...groupIds).all()

    // グループ別メンバー一覧
    const membersByGroup: Record<string, any[]> = {}
    for (const gid of groupIds) {
        const { results } = await c.env.DB.prepare(`
            SELECT m.id, m.user_id, u.email, u.name,
                   m.is_group_admin, m.is_billing_admin, m.is_developer,
                   m.valid_from, m.valid_to
            FROM group_memberships m JOIN users u ON m.user_id = u.id
            WHERE m.group_id = ? ORDER BY m.is_group_admin DESC, m.is_billing_admin DESC, u.email
        `).bind(gid).all()
        membersByGroup[gid] = results || []
    }

    // グループ別サービス割当
    const assignmentsByGroup: Record<string, any[]> = {}
    for (const gid of groupIds) {
        const { results } = await c.env.DB.prepare(`
            SELECT a.id, a.user_id, a.service_id, u.email AS user_email, u.name AS user_name,
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
    const { results: allRoles } = await c.env.DB.prepare('SELECT id, service_id, facility_type, role_code, role_name FROM service_role_master ORDER BY role_name').all()
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
    
    // 開発者ステータスを取得。真実は group_memberships.is_developer(=承認済み)。
    //   未承認のグループでは role_applications(role_type='developer') の最新申請状態を見せる。
    const devStatuses: Record<string, { status: string, reason: string | null, admin_reason: string | null }> = {}
    const { results: devAppRows } = await c.env.DB.prepare(
        `SELECT group_id, status, reason, admin_reason FROM role_applications
         WHERE user_id = ? AND role_type = 'developer' ORDER BY updated_at DESC`
    ).bind(user.id).all()
    for (const r of (devAppRows as any[])) {
        // 最新(updated_at DESC)を優先。同一グループの古い申請は上書きしない。
        if (!devStatuses[r.group_id]) devStatuses[r.group_id] = { status: r.status, reason: r.reason, admin_reason: r.admin_reason }
    }
    const { results: devFlagRows } = await c.env.DB.prepare(
        'SELECT group_id FROM group_memberships WHERE user_id = ? AND is_developer = 1'
    ).bind(user.id).all()
    for (const r of (devFlagRows as any[])) {
        // 承認済み(フラグ=1)は申請状態より優先して 'approved' を表示する。
        devStatuses[r.group_id] = { status: 'approved', reason: devStatuses[r.group_id]?.reason ?? null, admin_reason: null }
    }

    const serviceTagsByGroup: Record<string, any[]> = {}
    const customTagsByGroup: Record<string, any[]> = {}
    const { results: tagsResult } = await c.env.DB.prepare("SELECT id, name FROM tags WHERE status = 'active' ORDER BY name").all()
    const availableTags = tagsResult || []

    for (const gid of groupIds) {
        const { results: svcRows } = await c.env.DB.prepare(
            'SELECT id, name, status, reason FROM services WHERE owner_group_id = ? ORDER BY created_at DESC'
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
            SELECT id, name, base_url, status, reason, redirect_uris, description,
                   (CASE WHEN client_secret IS NOT NULL THEN 1 ELSE 0 END) AS has_secret
            FROM apps
            WHERE owner_group_id = ? ORDER BY created_at DESC
        `).bind(gid).all()
        appsByGroup[gid] = appRows || []
        approvedAppsByGroup[gid] = (appRows as any[]).filter(a => a.status === 'active').map(a => ({ id: a.id, name: a.name }))

        const { results: stRows } = await c.env.DB.prepare(`
            SELECT st.id, st.service_id, s.name as service_name, st.tag_id, t.name as tag_name, st.status, st.created_at
            FROM service_tags st
            JOIN services s ON st.service_id = s.id
            JOIN tags t ON st.tag_id = t.id
            WHERE s.owner_group_id = ?
            ORDER BY st.created_at DESC
        `).bind(gid).all()
        serviceTagsByGroup[gid] = stRows || []

        const { results: ctRows } = await c.env.DB.prepare(`
            SELECT t.id, t.name, t.status, t.created_at
            FROM tags t
            WHERE t.owner_group_id = ?
            ORDER BY t.created_at DESC
        `).bind(gid).all()
        customTagsByGroup[gid] = ctRows || []
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
        isBillingAdmin={isBillingAdmin}
        childrenByGroup={childrenByGroup}
        servicesByGroup={servicesByGroup}
        appsByGroup={appsByGroup}
        
        approvedAppsByGroup={approvedAppsByGroup}
        devStatuses={devStatuses}
        apps={[]}
        serviceTagsByGroup={serviceTagsByGroup}
        customTagsByGroup={customTagsByGroup}
        availableTags={availableTags as any}

    />)
  } catch (e: any) {
    console.error(e)
    const isDev = c.env.ENVIRONMENT === 'dev' || c.env.ENVIRONMENT === 'development'
    return c.json(isDev ? { error: e.message, stack: e.stack } : { error: 'Internal Server Error' }, 500)
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
    // 役割は兼任可能なフラグ(グループ管理者/決裁権者/開発者)。未指定はすべて 0(=メンバー)。
    const isGroupAdmin = body['is_group_admin'] ? 1 : 0
    const isBillingAdmin = body['is_billing_admin'] ? 1 : 0
    const isDeveloper = body['is_developer'] ? 1 : 0
    const validFrom = Number(body['valid_from'])
    const validTo = Number(body['valid_to'])
    if (!groupId || userIds.length === 0) return c.json({ error: 'group_id and user_ids required' }, 400)
    // 委任ゲート: 対象グループが自分の管理サブツリー内か。
    const managed = await getManagedGroupIds(c, user.id)
    if (!managed.has(groupId)) return c.json({ error: 'Forbidden' }, 403)

    if (isBillingAdmin === 1) {
        const billing = await getBillingGroupIds(c, user.id)
        if (!billing.has(groupId)) return c.json({ error: 'Forbidden: billing role requires billing admin' }, 403)
    }

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
    await logAudit(c, 'DELEGATED_MEMBERSHIP_ADD', { key: 'log_membership_add', params: { count: userIds.length, group: groupId, role: roleLabel, admin: user.email } })
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

// 委任: 子グループの作成と管理者の任命
groupAdminRouter.post('/group-admin/api/group/create', async (c) => {
    const user = await getUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const parentId = body['parent_group_id'] as string
    const name = ((body['name'] as string) || '').trim()
    const adminUserId = body['admin_user_id'] as string

    if (!parentId || !name || !adminUserId) return c.json({ error: 'missing fields' }, 400)

    const managed = await getManagedGroupIds(c, user.id)
    if (!managed.has(parentId)) return c.json({ error: 'Forbidden' }, 403)

    const newGroupId = 'grp-' + crypto.randomUUID()
    const now = Math.floor(Date.now() / 1000)

    // 新しいグループを作成
    await c.env.DB.prepare('INSERT INTO groups (id, name, parent_id, created_at) VALUES (?, ?, ?, ?)')
        .bind(newGroupId, name, parentId, now).run()

    // 管理者を任命
    const validTo = 2147483647 // 無期限相当
    await c.env.DB.prepare(`
        INSERT INTO group_memberships (user_id, group_id, is_group_admin, is_billing_admin, is_developer, valid_from, valid_to)
        VALUES (?, ?, 1, 0, 0, ?, ?)
    `).bind(adminUserId, newGroupId, now, validTo).run()

    await logAudit(c, 'DELEGATED_GROUP_CREATE', { key: 'log_group_create', params: { parent: parentId, new_group: newGroupId, admin: user.email } })
    return c.json({ success: true, id: newGroupId })
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
    const facilityId = body['facility_id'] ? (body['facility_id'] as string) : null
    const roleId = body['service_role_id'] != null && body['service_role_id'] !== '' ? Number(body['service_role_id']) : null
    const validFrom = Number(body['valid_from'])
    const validTo = Number(body['valid_to'])
    if (!userId || !groupId || !serviceId) return c.json({ error: 'missing fields' }, 400)
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

// 委任: ゲート② 利用枠の開放/取消。利用枠(Grant)の分配は予算と直結するため、決済権者
//   (billing_admin)のみが操作できる(getBillingGroupIds で権限チェック)。
//   開放先グループ・契約の顧客組織のいずれも自分の決済サブツリー内であることを要求する。
//   契約の顧客組織(customer_group_id)が「ルート枠」。それ以外への開放は子枠の切り出しとみなし、
//   seat_limit を必須化したうえで「親の枠 - 兄弟への配分」を超えないことを検証する。
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
    const billing = await getBillingGroupIds(c, user.id)
    if (!billing.has(groupId)) return c.json({ error: 'Forbidden' }, 403)
    // 予算ドメインの基点 = 操作中のグループ(context)。自グループへの開放は context=自身、
    //   子への分配は context=親(=操作中グループ)。
    const contextGroupId = (body['context_group_id'] as string) || groupId
    if (!billing.has(contextGroupId)) return c.json({ error: 'Forbidden' }, 403)
    // target は context 自身か、その直接の子であること(自グループの予算ドメイン内)。
    if (groupId !== contextGroupId) {
        const tg = await c.env.DB.prepare('SELECT parent_id FROM groups WHERE id = ?').bind(groupId).first() as { parent_id: string | null } | null
        if (!tg || tg.parent_id !== contextGroupId) return c.json({ error: 'Forbidden' }, 403)
    }
    // 契約から service_id と customer_group_id を引く。
    const ct = await c.env.DB.prepare('SELECT service_id, customer_group_id, seat_limit FROM service_contracts WHERE id = ?').bind(contractId).first() as { service_id: string; customer_group_id: string; seat_limit: number | null } | null
    if (!ct) return c.json({ error: 'contract not found' }, 404)
    
    // ルート枠の開放の場合のみ、顧客組織の決済権限を要求する。
    // 子枠の場合は上で contextGroupId の決済権限を検証済み。
    const isRootGrant = (groupId === ct.customer_group_id);
    if (isRootGrant && !billing.has(ct.customer_group_id)) {
        return c.json({ error: 'Forbidden' }, 403)
    }

    // ルート・子枠に関わらず、上限枠数(seat_limit)を必須とする(null/不正は不可)。
    if (seatLimit == null || !Number.isFinite(seatLimit) || seatLimit < 0) {
        return c.json({ error: 'seat_required' }, 400)
    }

    // 子枠の切り出し判定: 開放先が契約の顧客組織(=ルート枠)でなければ、親の枠を分け与える子枠。
    const isSubGrant = groupId !== ct.customer_group_id
    if (isSubGrant) {
        // 直接の親グループ(parent_id)の同一サービスの Grant を引き、親の枠を超えないか検証する。
        const grp = await c.env.DB.prepare('SELECT parent_id FROM groups WHERE id = ?').bind(groupId).first() as { parent_id: string | null } | null
        const parentId = grp?.parent_id || null
        if (!parentId) return c.json({ error: 'no_parent_grant' }, 403)

        const parentGrant = await c.env.DB.prepare('SELECT contract_id, seat_limit FROM group_service_grants WHERE group_id = ? AND service_id = ?')
            .bind(parentId, ct.service_id).first() as { contract_id: string; seat_limit: number | null } | null
        if (!parentGrant) return c.json({ error: 'no_parent_grant' }, 403)
        if (parentGrant.contract_id !== contractId) return c.json({ error: 'contract_mismatch' }, 403)

        // 親が枠上限を持つ場合のみオーバー検証(親が無制限なら上限なし)。
        if (parentGrant.seat_limit != null) {
            // 親の残り枠 = 親の seat_limit - 今回付与する分を除いた他兄弟グループへの配分合計。
            const sib = await c.env.DB.prepare(`
                SELECT COALESCE(SUM(seat_limit), 0) AS s
                FROM group_service_grants
                WHERE service_id = ? AND group_id != ?
                  AND group_id IN (SELECT id FROM groups WHERE parent_id = ?)
            `).bind(ct.service_id, groupId, parentId).first() as { s: number } | null
            const remaining = parentGrant.seat_limit - (sib?.s || 0)
            if (seatLimit > remaining) return c.json({ error: 'over_budget' }, 400)
        }
    } else {
        // ルート枠の場合: 契約(service_contracts)自体の上限枠数を超えていないか検証する。
        if (ct.seat_limit != null && seatLimit > ct.seat_limit) {
            return c.json({ error: 'over_budget' }, 400)
        }
    }

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
    const body = await c.req.json()
    const id = body['id']
    const row = await c.env.DB.prepare('SELECT group_id FROM group_service_grants WHERE id = ?').bind(id).first() as { group_id: string } | null
    if (!row) return c.json({ error: 'Not found' }, 404)
    // 利用枠の取消も決済権者のみ + 予算ドメイン(context)に限定する。
    const billing = await getBillingGroupIds(c, user.id)
    if (!billing.has(row.group_id)) return c.json({ error: 'Forbidden' }, 403)
    // context = 操作中グループ。取消対象は context 自身の枠か、その直接の子の枠であること。
    const contextGroupId = (body['context_group_id'] as string) || row.group_id
    if (!billing.has(contextGroupId)) return c.json({ error: 'Forbidden' }, 403)
    if (row.group_id !== contextGroupId) {
        // 子グループへ配分した枠を削除(回収)しようとしている。親が contextGroupId であることを確認。
        const tg = await c.env.DB.prepare('SELECT parent_id FROM groups WHERE id = ?').bind(row.group_id).first() as { parent_id: string | null } | null
        if (!tg || tg.parent_id !== contextGroupId) return c.json({ error: 'Forbidden' }, 403)
    } else {
        // 自グループの枠を削除しようとしている。これが「ルート枠（自分が顧客となっている契約から引いた枠）」であることを確認。
        // 親から貰った枠を子が勝手に削除(返還)することは禁止する(回収は配分した親からのみ可能)。
        const grantInfo = await c.env.DB.prepare(`
            SELECT sc.customer_group_id
            FROM group_service_grants gsg
            JOIN service_contracts sc ON gsg.contract_id = sc.id
            WHERE gsg.id = ?
        `).bind(id).first() as { customer_group_id: string } | null
        if (!grantInfo || grantInfo.customer_group_id !== contextGroupId) {
            return c.json({ error: 'Cannot remove grants distributed from a parent group. Only the parent group can revoke it.' }, 403)
        }
    }
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

// 自グループの却下されたサービスを再申請する
groupAdminRouter.post('/group-admin/api/service/reapply', async (c) => {
    const user = await getUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const id = (await c.req.json())['id'] as string
    const row = await c.env.DB.prepare('SELECT owner_group_id, status FROM services WHERE id = ?').bind(id).first() as { owner_group_id: string | null, status: string } | null
    if (!row) return c.json({ error: 'Not found' }, 404)
    const managed = await getManagedGroupIds(c, user.id)
    if (!row.owner_group_id || !managed.has(row.owner_group_id)) return c.json({ error: 'Forbidden' }, 403)
    if (row.status !== 'rejected') return c.json({ error: 'Can only reapply rejected services' }, 400)
    await c.env.DB.prepare("UPDATE services SET status = 'pending' WHERE id = ?").bind(id).run()
    await logAudit(c, 'DELEGATED_SERVICE_REAPPLY', { key: 'log_service_update', params: { id, status: 'pending', admin: user.email } })
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


// ============================================================
// 権限申請フロー(role_applications)
//   一般メンバーが不足している権限(グループ管理者/決裁権者/開発者)を申請理由つきで申請し、
//   承認者が承認/却下する。承認ルーティングは「決裁権者の有無」で決まる:
//     - そのグループに有効な決裁権者が居れば、その決裁権者が承認する。
//     - 決裁権者が一人も居なければ、システム管理者(運営)が承認する。
//   承認されると group_memberships の対応フラグが 1 になる(=兼任可能)。
// ============================================================

// 申請者が「指定グループの有効なメンバー」か。申請はメンバーのみ可。
async function isActiveMember(c: any, userId: string, groupId: string): Promise<boolean> {
    const now = Math.floor(Date.now() / 1000)
    const row = await c.env.DB.prepare(
        'SELECT 1 FROM group_memberships WHERE user_id = ? AND group_id = ? AND valid_from <= ? AND valid_to >= ? LIMIT 1'
    ).bind(userId, groupId, now, now).first()
    return !!row
}

// 指定グループに「有効な決裁権者」が一人でも居るか。
async function groupHasBillingAdmin(c: any, groupId: string): Promise<boolean> {
    const now = Math.floor(Date.now() / 1000)
    const row = await c.env.DB.prepare(
        'SELECT 1 FROM group_memberships WHERE group_id = ? AND is_billing_admin = 1 AND valid_from <= ? AND valid_to >= ? LIMIT 1'
    ).bind(groupId, now, now).first()
    return !!row
}

// caller がこのグループの申請を承認/却下できるか(ルーティング判定)。
//   決裁権者: そのグループの有効な is_billing_admin であれば可。
//   システム管理者: そのグループに決裁権者が一人も居ない場合のみ可。
async function canApproveFor(c: any, callerId: string, groupId: string): Promise<boolean> {
    const now = Math.floor(Date.now() / 1000)
    const billing = await c.env.DB.prepare(
        'SELECT 1 FROM group_memberships WHERE user_id = ? AND group_id = ? AND is_billing_admin = 1 AND valid_from <= ? AND valid_to >= ? LIMIT 1'
    ).bind(callerId, groupId, now, now).first()
    if (billing) return true
    const admin = await getAdmin(c)
    if (admin && !(await groupHasBillingAdmin(c, groupId))) return true
    return false
}

// 権限を申請する。申請理由(reason)は必須。
groupAdminRouter.post('/group-admin/api/roles/apply', async (c) => {
    const user = await getUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const groupId = (body['group_id'] as string) || ''
    const roleType = (body['role_type'] as string) || ''
    const reason = ((body['reason'] as string) || '').trim()
    const flag = ROLE_TYPE_TO_FLAG[roleType]
    if (!groupId || !flag) return c.json({ error: 'invalid_request' }, 400)
    if (!reason) return c.json({ error: 'reason_required' }, 400)
    // 申請できるのは対象グループの有効メンバーのみ。
    if (!await isActiveMember(c, user.id, groupId)) return c.json({ error: 'not_member' }, 403)
    // 既に当該権限を持っているなら申請不要。
    const m = await c.env.DB.prepare(`SELECT ${flag} AS f FROM group_memberships WHERE user_id = ? AND group_id = ?`)
        .bind(user.id, groupId).first() as { f: number } | null
    if (m && m.f) return c.json({ error: 'already_has' }, 409)
    const now = Math.floor(Date.now() / 1000)
    // 同一(user,group,role_type)の保留中申請があれば理由を更新、無ければ新規作成。
    const pending = await c.env.DB.prepare(
        "SELECT id FROM role_applications WHERE user_id = ? AND group_id = ? AND role_type = ? AND status = 'pending' LIMIT 1"
    ).bind(user.id, groupId, roleType).first() as { id: number } | null
    if (pending) {
        await c.env.DB.prepare('UPDATE role_applications SET reason = ?, updated_at = ? WHERE id = ?')
            .bind(reason, now, pending.id).run()
    } else {
        await c.env.DB.prepare(
            "INSERT INTO role_applications (user_id, group_id, role_type, status, reason, created_at, updated_at) VALUES (?, ?, ?, 'pending', ?, ?, ?)"
        ).bind(user.id, groupId, roleType, reason, now, now).run()
    }
    await logAudit(c, 'ROLE_APPLY', { key: 'log_role_apply', params: { group: groupId, role: roleType, user: user.email } })
    return c.json({ success: true })
})

// 申請を承認する。承認者の認可は canApproveFor(決裁権者 or 決裁権者不在グループの運営)。
groupAdminRouter.post('/group-admin/api/roles/approve', async (c) => {
    const user = await getUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const appId = (await c.req.json())['application_id']
    const app = await c.env.DB.prepare('SELECT id, user_id, group_id, role_type, status FROM role_applications WHERE id = ?')
        .bind(appId).first() as { id: number; user_id: string; group_id: string; role_type: string; status: string } | null
    if (!app) return c.json({ error: 'Not found' }, 404)
    if (app.status !== 'pending') return c.json({ error: 'not_pending' }, 409)
    const flag = ROLE_TYPE_TO_FLAG[app.role_type]
    if (!flag) return c.json({ error: 'invalid_role_type' }, 400)
    if (!await canApproveFor(c, user.id, app.group_id)) return c.json({ error: 'Forbidden' }, 403)
    const now = Math.floor(Date.now() / 1000)
    // 対応フラグを立てる(申請者はメンバー前提。メンバー行が無ければ 0 行更新)。
    await c.env.DB.prepare(`UPDATE group_memberships SET ${flag} = 1 WHERE user_id = ? AND group_id = ?`)
        .bind(app.user_id, app.group_id).run()
    await c.env.DB.prepare("UPDATE role_applications SET status = 'approved', approver_id = ?, admin_reason = NULL, updated_at = ? WHERE id = ?")
        .bind(user.id, now, app.id).run()
    await logAudit(c, 'ROLE_APPROVE', { key: 'log_role_approve', params: { group: app.group_id, role: app.role_type, target_user: app.user_id, admin: user.email } })
    return c.json({ success: true })
})

// 申請を却下する。却下理由(admin_reason)を保存する。
groupAdminRouter.post('/group-admin/api/roles/reject', async (c) => {
    const user = await getUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const appId = body['application_id']
    const adminReason = ((body['admin_reason'] as string) || '').trim() || null
    const app = await c.env.DB.prepare('SELECT id, group_id, role_type, status, user_id FROM role_applications WHERE id = ?')
        .bind(appId).first() as { id: number; group_id: string; role_type: string; status: string; user_id: string } | null
    if (!app) return c.json({ error: 'Not found' }, 404)
    if (app.status !== 'pending') return c.json({ error: 'not_pending' }, 409)
    if (!await canApproveFor(c, user.id, app.group_id)) return c.json({ error: 'Forbidden' }, 403)
    const now = Math.floor(Date.now() / 1000)
    await c.env.DB.prepare("UPDATE role_applications SET status = 'rejected', admin_reason = ?, approver_id = ?, updated_at = ? WHERE id = ?")
        .bind(adminReason, user.id, now, app.id).run()
    await logAudit(c, 'ROLE_REJECT', { key: 'log_role_reject', params: { group: app.group_id, role: app.role_type, target_user: app.user_id, admin: user.email } })
    return c.json({ success: true })
})

// 自分が承認すべき保留中の申請一覧を返す。
//   決裁権者: 自分が決裁権者である(=決裁権者の居る)グループの申請。
//   システム管理者: 決裁権者が一人も居ないグループの申請。
//   いずれも自分自身の申請は対象外(自己承認の防止)。
groupAdminRouter.get('/group-admin/api/roles/applications', async (c) => {
    const user = await getUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const now = Math.floor(Date.now() / 1000)
    const admin = await getAdmin(c)
    // 自分が決裁権者である有効グループ。
    const { results: myBilling } = await c.env.DB.prepare(
        'SELECT group_id FROM group_memberships WHERE user_id = ? AND is_billing_admin = 1 AND valid_from <= ? AND valid_to >= ?'
    ).bind(user.id, now, now).all()
    const myBillingGroups = new Set((myBilling as any[]).map(r => r.group_id as string))
    // 有効な決裁権者が居るグループの集合(=運営の管轄外)。
    const { results: billed } = await c.env.DB.prepare(
        'SELECT DISTINCT group_id FROM group_memberships WHERE is_billing_admin = 1 AND valid_from <= ? AND valid_to >= ?'
    ).bind(now, now).all()
    const groupsWithBilling = new Set((billed as any[]).map(r => r.group_id as string))
    const { results: pendings } = await c.env.DB.prepare(`
        SELECT ra.id, ra.user_id, ra.group_id, ra.role_type, ra.reason, ra.created_at,
               u.email AS user_email, u.name AS user_name, g.name AS group_name
        FROM role_applications ra
        JOIN users u ON ra.user_id = u.id
        JOIN groups g ON ra.group_id = g.id
        WHERE ra.status = 'pending'
        ORDER BY ra.created_at DESC
    `).all()
    const out = (pendings as any[]).filter(p => {
        if (p.user_id === user.id) return false                 // 自己承認の防止
        if (myBillingGroups.has(p.group_id)) return true        // 決裁権者として担当
        if (admin && !groupsWithBilling.has(p.group_id)) return true  // 運営として担当(決裁権者不在)
        return false
    })
    return c.json({ applications: out })
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
    
    const nowDev = Math.floor(Date.now() / 1000)
    const dev = await c.env.DB.prepare('SELECT 1 FROM group_memberships WHERE user_id = ? AND group_id = ? AND is_developer = 1 AND valid_from <= ? AND valid_to >= ? LIMIT 1')
        .bind(user.id, groupId, nowDev, nowDev).first()
    if (!dev) return c.json({ error: 'Developer status not approved for this group' }, 403)

    const id = ((body['id'] as string) || '').trim()
    const name = ((body['name'] as string) || '').trim()
    const baseUrl = ((body['base_url'] as string) || '').trim()
    const redirectUris = ((body['redirect_uris'] as string) || '').trim() || null
    const description = ((body['description'] as string) || '').trim() || null
    // TODO(initiate_login_uri): グループ管理者のアプリ申請画面(UI)に initiate_login_uri を追加した場合、
    // ここで req.json から受け取り、apps テーブルへ INSERT するよう修正すること。
    if (!groupId || !id || !name || !baseUrl) return c.json({ error: 'missing fields' }, 400)
    const managed = await getManagedGroupIds(c, user.id)
    if (!managed.has(groupId)) return c.json({ error: 'Forbidden' }, 403)
    // ID 衝突チェック(PK)。
    const dup = await c.env.DB.prepare('SELECT id FROM apps WHERE id = ?').bind(id).first()
    if (dup) return c.json({ error: 'id_taken' }, 409)
    const plainSecret = generateToken() + generateToken().replace(/-/g, '')
    const hashedSecret = await hashPassword(plainSecret)
    await c.env.DB.prepare(`
        INSERT INTO apps (id, name, base_url, status, created_at, description, client_secret, redirect_uris, owner_group_id)
        VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?)
    `).bind(id, name, baseUrl, Math.floor(Date.now() / 1000), description, hashedSecret, redirectUris, groupId).run()
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
    // TODO(initiate_login_uri): グループ管理者のアプリ更新画面(UI)に initiate_login_uri を追加した場合、
    // ここで req.json から受け取り、apps テーブルを UPDATE するよう修正すること。
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

// 自グループのアプリのシークレットを再生成/クリア
groupAdminRouter.post('/group-admin/api/app/secret', async (c) => {
    const user = await getUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const id = body['id'] as string
    const action = body['action'] as string

    const row = await c.env.DB.prepare('SELECT owner_group_id FROM apps WHERE id = ?').bind(id).first() as { owner_group_id: string | null } | null
    if (!row) return c.json({ error: 'Not found' }, 404)
    const managed = await getManagedGroupIds(c, user.id)
    if (!row.owner_group_id || !managed.has(row.owner_group_id)) return c.json({ error: 'Forbidden' }, 403)

    const plainSecret = action === 'clear' ? null : (generateToken() + generateToken().replace(/-/g, ''))
    const hashedSecret = plainSecret ? await hashPassword(plainSecret) : null

    await c.env.DB.prepare('UPDATE apps SET client_secret = ? WHERE id = ?').bind(hashedSecret, id).run()
    await logAudit(c, 'DELEGATED_APP_SECRET', { key: 'log_app_updated', params: { appName: id, status: action === 'clear' ? 'secret cleared' : 'secret regenerated', admin: user.email } })
    return c.json({ success: true, new_secret: plainSecret })
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

// ============================================================
// 委任管理: 施設の管理
// ============================================================

groupAdminRouter.get('/group-admin/api/group-facilities/:id', async (c) => {
    const user = await getUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const id = c.req.param('id')
    const managed = await getManagedGroupIds(c, user.id)
    if (!managed.has(id)) return c.json({ error: 'Forbidden' }, 403)
    const facilities = await c.env.DB.prepare('SELECT * FROM facilities WHERE managing_group_id = ? ORDER BY structure_no').bind(id).all()
    return c.json({ facilities: facilities.results })
})

groupAdminRouter.get('/group-admin/api/facilities/all', async (c) => {
    const user = await getUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const managed = await getManagedGroupIds(c, user.id)
    
    const facilities = await c.env.DB.prepare(`
        SELECT f.id, f.structure_no, f.building_use, f.managing_group_id, g.name AS group_name 
        FROM facilities f 
        LEFT JOIN groups g ON f.managing_group_id = g.id 
        ORDER BY f.structure_no
    `).all()
    
    // 管轄サブツリー内の施設のみを返す
    const filtered = (facilities.results as any[]).filter(f => managed.has(f.managing_group_id))
    return c.json(filtered)
})

groupAdminRouter.post('/group-admin/api/facility/add', async (c) => {
    const user = await getUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const groupId = body['managing_group_id'] as string
    const no = (body['structure_no'] as string) || null
    const use = (body['building_use'] as string) || null
    if (!groupId) return c.json({ error: 'managing_group_id required' }, 400)
    
    const managed = await getManagedGroupIds(c, user.id)
    if (!managed.has(groupId)) return c.json({ error: 'Forbidden' }, 403)
    
    const id = 'fac-' + crypto.randomUUID()
    await c.env.DB.prepare('INSERT INTO facilities (id, structure_no, building_use, managing_group_id, created_at) VALUES (?, ?, ?, ?, ?)')
        .bind(id, no, use, groupId, Math.floor(Date.now() / 1000)).run()
        
    await logAudit(c, 'DELEGATED_FACILITY_ADD', { key: 'log_facility_add', params: { structure_no: no || id, admin: user.email } })
    return c.json({ success: true, id })
})

groupAdminRouter.post('/group-admin/api/facility/move', async (c) => {
    const user = await getUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const facilityId = body['facility_id'] as string
    const targetGroupId = body['managing_group_id'] as string
    
    if (!facilityId || !targetGroupId) return c.json({ error: 'missing fields' }, 400)
    
    const managed = await getManagedGroupIds(c, user.id)
    
    // 移動先の権限チェック
    if (!managed.has(targetGroupId)) return c.json({ error: 'Forbidden (Target group)' }, 403)
    
    // 移動元の権限チェック
    const fac = await c.env.DB.prepare('SELECT managing_group_id, structure_no FROM facilities WHERE id = ?').bind(facilityId).first() as { managing_group_id: string; structure_no: string | null } | null
    if (!fac) return c.json({ error: 'Not found' }, 404)
    if (!managed.has(fac.managing_group_id)) return c.json({ error: 'Forbidden (Source group)' }, 403)
    
    await c.env.DB.prepare('UPDATE facilities SET managing_group_id = ? WHERE id = ?').bind(targetGroupId, facilityId).run()
    
    await logAudit(c, 'DELEGATED_FACILITY_MOVE', { key: 'log_facility_move', params: { structure_no: fac.structure_no || facilityId, admin: user.email } })
    return c.json({ success: true, moved: true })
})

groupAdminRouter.post('/group-admin/api/facility/remove', async (c) => {
    const user = await getUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const id = body['id'] as string
    
    const fac = await c.env.DB.prepare('SELECT managing_group_id, structure_no FROM facilities WHERE id = ?').bind(id).first() as { managing_group_id: string; structure_no: string | null } | null
    if (!fac) return c.json({ error: 'Not found' }, 404)
    
    const managed = await getManagedGroupIds(c, user.id)
    if (!managed.has(fac.managing_group_id)) return c.json({ error: 'Forbidden' }, 403)
    
    // 制約: 割当(service_user_assignments)に使われている施設は消せない（FK制約があるため手動チェック）
    const usage = await c.env.DB.prepare('SELECT 1 FROM service_user_assignments WHERE facility_id = ? LIMIT 1').bind(id).first()
    if (usage) return c.json({ error: 'Cannot delete facility in use by an assignment' }, 400)
    
    await c.env.DB.prepare('DELETE FROM facilities WHERE id = ?').bind(id).run()
    
    await logAudit(c, 'DELEGATED_FACILITY_REMOVE', { key: 'log_facility_remove', params: { structure_no: fac.structure_no || id, admin: user.email } })
    return c.json({ success: true })
})

// ============================================================
// 委任管理: 役割の管理
// ============================================================

groupAdminRouter.post('/group-admin/api/roles/add', async (c) => {
    const user = await getUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const serviceId = body['service_id'] as string
    const roleCode = ((body['role_code'] as string) || '').trim()
    const roleName = ((body['role_name'] as string) || '').trim()
    const facilityType = ((body['facility_type'] as string) || '').trim() || null

    if (!serviceId || !roleCode || !roleName) return c.json({ error: 'missing fields' }, 400)

    const managed = await getManagedGroupIds(c, user.id)
    const svc = await c.env.DB.prepare('SELECT owner_group_id FROM services WHERE id = ?').bind(serviceId).first() as { owner_group_id: string | null } | null
    if (!svc || !svc.owner_group_id || !managed.has(svc.owner_group_id)) return c.json({ error: 'Forbidden' }, 403)

    await c.env.DB.prepare('INSERT INTO service_role_master (service_id, facility_type, role_code, role_name) VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING')
        .bind(serviceId, facilityType, roleCode, roleName).run()
    
    await logAudit(c, 'DELEGATED_ROLE_ADD', { key: 'log_role_add', params: { serviceId, roleCode, admin: user.email } })
    return c.json({ success: true })
})

groupAdminRouter.post('/group-admin/api/roles/remove', async (c) => {
    const user = await getUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const id = (await c.req.json())['id']

    const rm = await c.env.DB.prepare('SELECT service_id FROM service_role_master WHERE id = ?').bind(id).first<{ service_id: string }>()
    if (!rm) return c.json({ error: 'Not found' }, 404)
    
    const managed = await getManagedGroupIds(c, user.id)
    const svc = await c.env.DB.prepare('SELECT owner_group_id FROM services WHERE id = ?').bind(rm.service_id).first() as { owner_group_id: string | null } | null
    if (!svc || !svc.owner_group_id || !managed.has(svc.owner_group_id)) return c.json({ error: 'Forbidden' }, 403)

    // 制約: 割当に使われている役割は消せない
    const usage = await c.env.DB.prepare('SELECT 1 FROM service_user_assignments WHERE service_role_id = ? LIMIT 1').bind(id).first()
    if (usage) return c.json({ error: 'Cannot delete role in use by an assignment' }, 400)

    await c.env.DB.prepare('DELETE FROM service_role_master WHERE id = ?').bind(id).run()

    await logAudit(c, 'DELEGATED_ROLE_REMOVE', { key: 'log_role_remove', params: { id, admin: user.email } })
    return c.json({ success: true })
})

// ============================================================
// 委任管理: タグ申請
// ============================================================

groupAdminRouter.post('/group-admin/api/service_tags/apply', async (c) => {
    const user = await getUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const serviceId = body['service_id'] as string
    const tagId = body['tag_id'] as string
    if (!serviceId || !tagId) return c.json({ error: 'missing fields' }, 400)

    const managed = await getManagedGroupIds(c, user.id)
    const svc = await c.env.DB.prepare('SELECT owner_group_id FROM services WHERE id = ?').bind(serviceId).first() as { owner_group_id: string | null } | null
    if (!svc || !svc.owner_group_id || !managed.has(svc.owner_group_id)) return c.json({ error: 'Forbidden' }, 403)

    // apply an existing tag to the service with pending status
    await c.env.DB.prepare('INSERT INTO service_tags (service_id, tag_id, status, created_at) VALUES (?, ?, ?, ?) ON CONFLICT(service_id, tag_id) DO UPDATE SET status = ?')
        .bind(serviceId, tagId, 'pending', Math.floor(Date.now() / 1000), 'pending').run()
    
    return c.json({ success: true })
})

groupAdminRouter.post('/group-admin/api/service_tags/remove', async (c) => {
    const user = await getUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const serviceId = body['service_id'] as string
    const tagId = body['tag_id'] as string
    if (!serviceId || !tagId) return c.json({ error: 'missing fields' }, 400)

    const managed = await getManagedGroupIds(c, user.id)
    const svc = await c.env.DB.prepare('SELECT owner_group_id FROM services WHERE id = ?').bind(serviceId).first() as { owner_group_id: string | null } | null
    if (!svc || !svc.owner_group_id || !managed.has(svc.owner_group_id)) return c.json({ error: 'Forbidden' }, 403)

    await c.env.DB.prepare('DELETE FROM service_tags WHERE service_id = ? AND tag_id = ?').bind(serviceId, tagId).run()
    
    return c.json({ success: true })
})

groupAdminRouter.post('/group-admin/api/service_tags/request_custom', async (c) => {
    const user = await getUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json()
    const serviceId = body['service_id'] as string
    const tagName = (body['tag_name'] as string).trim()
    if (!serviceId || !tagName) return c.json({ error: 'missing fields' }, 400)

    const managed = await getManagedGroupIds(c, user.id)
    const svc = await c.env.DB.prepare('SELECT owner_group_id FROM services WHERE id = ?').bind(serviceId).first() as { owner_group_id: string | null } | null
    if (!svc || !svc.owner_group_id || !managed.has(svc.owner_group_id)) return c.json({ error: 'Forbidden' }, 403)

    // check if tag already exists
    const existing = await c.env.DB.prepare('SELECT id FROM tags WHERE name = ?').bind(tagName).first() as { id: string } | null
    let tagId: string
    if (existing) {
        tagId = existing.id
    } else {
        // create new tag as pending
        tagId = crypto.randomUUID()
        await c.env.DB.prepare('INSERT INTO tags (id, name, status, owner_group_id, created_at) VALUES (?, ?, ?, ?, ?)')
            .bind(tagId, tagName, 'pending', svc.owner_group_id, Math.floor(Date.now() / 1000)).run()
    }

    // apply the custom tag
    await c.env.DB.prepare('INSERT INTO service_tags (service_id, tag_id, status, created_at) VALUES (?, ?, ?, ?) ON CONFLICT(service_id, tag_id) DO UPDATE SET status = ?')
        .bind(serviceId, tagId, 'pending', Math.floor(Date.now() / 1000), 'pending').run()
    
    return c.json({ success: true })
})