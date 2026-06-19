import { html, raw } from 'hono/html'
import { css } from 'hono/css'
import { dict } from '../i18n'
import { Layout } from './components/Layout'
import { UserTopbar } from './components/UserTopbar'
import { Group, App } from '../types'
import { Button } from './components/Button'
import { Modal } from './components/Modal'
import { MultiSelect } from './components/MultiSelect'
import { ServiceAppsModal } from './components/ServiceAppsModal'

import { sectionTitle, card, tabBar, groupSelectWrapper, badge, tableWrap, formLabel, dateInput, selectInput, infoBox, actionBtn, tabStyles } from './styles/groupAdminStyles'
import { groupAdminClientScript } from './scripts/generated/groupAdmin'
import { GroupAdminModals } from './components/GroupAdminModals'
import { safeJsonStringify } from '../utils/json'

interface ManagedGroup extends Group {
  member_count: number
}

interface GroupMember {
  id: number
  user_id: string
  email: string
  name: string | null
  // 兼任可能なロールフラグ(0/1)。member は全フラグ 0。
  is_group_admin: number
  is_billing_admin: number
  is_developer: number
  valid_from: number
  valid_to: number
}

interface Assignment {
  id: number
  user_id: string
  service_id: string
  user_email: string
  user_name: string | null
  service_name: string
  facility_id: string
  structure_no: string | null
  building_use: string | null
  role_name: string
  valid_from: number
  valid_to: number
}

interface AppPermission {
  app_id: string
  app_name: string
  source: 'user' | 'group'
  valid_from: number
  valid_to: number
  user_email: string
}

interface Props {
  t: typeof dict.en
  userEmail: string
  siteName: string
  profileName?: string | null
  profilePicture?: string | null
  managedGroups: ManagedGroup[]
  allUsers: { id: string; email: string; name: string | null }[]
  // グループIDをキーとした各種データ
  membersByGroup: Record<string, GroupMember[]>
  assignmentsByGroup: Record<string, Assignment[]>
  permissionsByGroup: Record<string, AppPermission[]>
  // 割当作成(ゲート③)用
  grantsByGroup: Record<string, { service_id: string; service_name: string }[]>
  facilities: { id: string; structure_no: string | null; building_use: string | null; managing_group_id: string }[]
  rolesByService: Record<string, { id: number; service_id: string; facility_type: string | null; role_name: string }[]>
  // 利用枠(ゲート②)用
  grantsDetailByGroup: Record<string, { id: number; service_id: string; service_name: string; contract_id: string; seat_limit: number | null; valid_from: number; valid_to: number }[]>
  availableContracts: { id: string; service_id: string; customer_group_id: string; seat_limit: number | null; service_name: string; group_name: string | null }[]
  // 決済権者(billing_admin)か。利用枠タブの表示可否を制御する。
  isBillingAdmin: boolean
  // 各グループの直接の子グループ(管理サブツリー内)。子枠の分配先・配分済み一覧に使う。
  childrenByGroup: Record<string, { id: string; name: string }[]>
  // セルフサービス(アプリ申請 / 自グループのサービス作成)用
  servicesByGroup: Record<string, { id: string; name: string; status: string; apps: { id: string; name: string }[] }[]>
  appsByGroup: Record<string, { id: string; name: string; base_url: string; status: string }[]>
  // サービスに組み込める = 自グループの承認済み(active)アプリ
  approvedAppsByGroup: Record<string, { id: string; name: string }[]>
  devStatuses?: Record<string, { status: string; reason: string | null; admin_reason?: string | null }>
  apps: App[]
  serviceTagsByGroup: Record<string, any[]>
  customTagsByGroup: Record<string, any[]>
  availableTags: any[]
}

export const GroupAdminPage = (props: Props) => {
  const t = props.t
  const groups = props.managedGroups

  const userOptions = props.allUsers.map(u => ({
    value: u.id,
    text: u.name ? `${u.name} <${u.email}>` : u.email,
  }))
  const allUsersJson = safeJsonStringify(userOptions)

  // タブ切替 + グループ切替はすべてクライアントJS で処理する。
  // グループ×タブのデータは JSON として埋め込み、再フェッチ不要にする。
  const membersByGroupJson = safeJsonStringify(props.membersByGroup)
  const assignmentsByGroupJson = safeJsonStringify(props.assignmentsByGroup)
  const permsByGroupJson = safeJsonStringify(props.permissionsByGroup)
  const grantsByGroupJson = safeJsonStringify(props.grantsByGroup)
  const facilitiesJson = safeJsonStringify(props.facilities)
  const rolesByServiceJson = safeJsonStringify(props.rolesByService)
  const grantsDetailByGroupJson = safeJsonStringify(props.grantsDetailByGroup)
  const availableContractsJson = safeJsonStringify(props.availableContracts)
  const childrenByGroupJson = safeJsonStringify(props.childrenByGroup)
  const isBillingAdmin = props.isBillingAdmin
  const servicesByGroupJson = safeJsonStringify(props.servicesByGroup)
  const appsByGroupJson = safeJsonStringify(props.appsByGroup)
  const approvedAppsByGroupJson = safeJsonStringify(props.approvedAppsByGroup)
  const devStatusesJson = safeJsonStringify(props.devStatuses || {})
  const serviceTagsByGroupJson = safeJsonStringify(props.serviceTagsByGroup || {})
  const customTagsByGroupJson = safeJsonStringify(props.customTagsByGroup || {})
  const availableTagsJson = safeJsonStringify(props.availableTags || [])

  if (groups.length === 0) {
    return Layout({
      title: t.ga_title,
      siteName: props.siteName,
      lang: t.lang,
      width: 1000,
      align: 'top',
      children: html`
        ${UserTopbar({ t, siteName: props.siteName, userEmail: props.userEmail, active: 'group-admin', profileName: props.profileName, profilePicture: props.profilePicture, isGroupAdmin: true })}
        <div style="text-align:center; padding:4rem 2rem; color:var(--text-sub);">
          <span class="material-symbols-outlined" style="font-size:48px; color:#c7d2fe; display:block; margin-bottom:1rem;">group_off</span>
          <p>${t.ga_no_groups}</p>
          <a href="/" style="color:var(--primary); font-weight:600; text-decoration:none;">&larr; ${t.nav_dashboard}</a>
        </div>
      `
    })
  }

  const firstGroupId = groups[0].id

  return Layout({
    title: t.ga_title,
    siteName: props.siteName,
    lang: t.lang,
    width: 1000,
    align: 'top',
    children: html`
      ${UserTopbar({ t, siteName: props.siteName, userEmail: props.userEmail, active: 'group-admin', profileName: props.profileName, profilePicture: props.profilePicture, isGroupAdmin: true })}

      <div style="margin-bottom:1.75rem;">
        <h1 style="font-size:1.5rem; font-weight:800; color:var(--text-main); letter-spacing:-0.02em; margin-bottom:0.25rem;">
          <span class="material-symbols-outlined" style="color:var(--primary); vertical-align:middle; margin-right:0.4rem;">admin_panel_settings</span>${t.ga_title}
        </h1>
        <p style="font-size:0.95rem; color:var(--text-sub);">${t.ga_subtitle}</p>
      </div>

      <!-- 権限申請一覧(承認/却下)。決裁権者・運営として処理できる保留中申請のみ表示。 -->
      <div id="role-approvals-card" class="${card}" style="display:none; margin-bottom:1.5rem; padding:1.25rem;">
        <div class="${sectionTitle}" style="margin-bottom:0.75rem;"><span class="material-symbols-outlined">how_to_reg</span>${t.ra_pending_title}</div>
        <div id="role-approvals-body"></div>
      </div>

      ${groups.length > 1 ? html`
        <div style="margin-bottom:1.5rem; display:flex; align-items:center; justify-content:space-between;">
          <div style="display:flex; align-items:center; gap:0.75rem;">
            <span class="material-symbols-outlined" style="color:var(--primary);">group</span>
            <div class="${groupSelectWrapper}">
              <select id="group-select" style="display:none;">
                ${groups.map(g => html`<option value="${g.id}" data-depth="${(g as any).depth || 0}" data-origname="${(g as any).original_name || g.name}">${g.name}</option>`)}
              </select>
            </div>
          </div>
          ${Button({ onclick: "openCreateChildGroupModal()", style: "width:auto;", children: html`<span class="material-symbols-outlined" style="font-size:18px;">domain_add</span> 子グループを作成` })}
        </div>
      ` : html`
        <div style="margin-bottom:1.5rem; display:flex; align-items:center; justify-content:space-between;">
          <div style="display:flex; align-items:center; gap:0.75rem;">
            <span class="material-symbols-outlined" style="color:var(--primary);">group</span>
            <strong style="font-size:1.1rem;">${groups[0].name}</strong>
            <input type="hidden" id="group-select" value="${firstGroupId}" />
          </div>
          ${Button({ onclick: "openCreateChildGroupModal()", style: "width:auto;", children: html`<span class="material-symbols-outlined" style="font-size:18px;">domain_add</span> 子グループを作成` })}
        </div>
      `}

      <div class="${tabBar}">
        <button id="tab-btn-members" onclick="switchTab('members')">
          <span class="material-symbols-outlined">group</span>${t.ga_tab_members}
        </button>
        <button id="tab-btn-assignments" onclick="switchTab('assignments')">
          <span class="material-symbols-outlined">assignment_ind</span>${t.ga_tab_assignments}
        </button>
        ${isBillingAdmin ? html`
        <button id="tab-btn-grants" onclick="switchTab('grants')">
          <span class="material-symbols-outlined">card_membership</span>${t.ga_tab_grants}
        </button>
        ` : ''}
        <button id="tab-btn-access" onclick="switchTab('access')">
          <span class="material-symbols-outlined">lock_open</span>${t.ga_tab_access}
        </button>
        <button id="tab-btn-facilities" onclick="switchTab('facilities')">
          <span class="material-symbols-outlined">domain</span>施設
        </button>
        <button id="tab-btn-apps" onclick="switchTab('apps')">
          <span class="material-symbols-outlined">apps</span>${t.ga_tab_apps}
        </button>
      </div>

      <!-- メンバータブ -->
      <div id="tab-members" class="tab-content">
        <div style="display:flex; justify-content:flex-end; margin-bottom:1rem;">
          ${Button({ onclick: "openAddModal()", style: "width:auto;", children: html`<span class="material-symbols-outlined" style="font-size:18px;">person_add</span> ${t.am_add_member}` })}
        </div>
        <div class="${card}">
          <div class="${tableWrap}">
            <table>
              <thead>
                <tr>
                  <th>${t.ga_assign_user}</th>
                  <th>${t.am_label_role}</th>
                  <th>${t.ga_assign_valid}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody id="members-table-body">
                <tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:2rem;">読込中...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 割当タブ -->
      <div id="tab-assignments" class="tab-content">
        <div class="${infoBox}">
          <span class="material-symbols-outlined">info</span>${t.ga_desc_assignments}
        </div>
        
        <div id="assigns-summary" style="margin-bottom:1rem; display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:1rem;"></div>
        
        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:0.75rem; margin-top:1.5rem;">
          <div class="${sectionTitle}" style="margin:0;">
            <span class="material-symbols-outlined">group</span>割当済みメンバー
          </div>
          <div id="btn-add-assign-wrap" style="display:flex; justify-content:flex-end; align-items:center; gap:0.75rem;">
            ${Button({ onclick: "openAssignModal()", style: "width:auto;", children: html`<span class="material-symbols-outlined" style="font-size:18px;">assignment_add</span> ${t.ga_add_assignment}` })}
          </div>
        </div>
        
        <div class="${card}">
          <div class="${tableWrap}">
            <table>
              <thead>
                <tr>
                  <th>${t.ga_assign_user}</th>
                  <th>${t.ga_assign_service}</th>
                  <th>${t.ga_assign_facility}</th>
                  <th>${t.ga_assign_role}</th>
                  <th>${t.ga_assign_valid}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody id="assigns-table-body">
                <tr><td colspan="6" style="text-align:center; color:#94a3b8; padding:2rem;">読込中...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 施設タブ -->
      <div id="tab-facilities" class="tab-content">
         <div class="${infoBox}">
           <span class="material-symbols-outlined">info</span>
           自グループの管轄として施設を登録・管理します。既存の施設を他のグループに移動させることも可能ですが、移動先はご自身が管理権限を持つグループ（管轄内）に限られます。
         </div>
         <div class="${card}" style="margin-bottom: 1.5rem; padding: 1.5rem;">
            <div style="font-weight:bold; margin-bottom:1rem; color:#475569;">新規施設の登録</div>
            <div style="margin-bottom: 1.5rem;">
               <label class="${formLabel}">構造物番号/施設名 (Structure No. / Name)</label>
               <input type="text" id="f-structure-no" class="${dateInput}" placeholder="F-12345" />
            </div>
            <div style="margin-bottom: 1.5rem;">
               <label class="${formLabel}">用途 (Use)</label>
               <input type="text" id="f-building-use" class="${dateInput}" placeholder="Office" />
            </div>
            ${Button({ onclick: "addFacility()", children: html`<span class="material-symbols-outlined">add_business</span> <span>新規追加</span>` })}

            <hr style="margin: 1.5rem 0; border: none; border-top: 1px solid #e2e8f0;" />

            <div style="font-weight:bold; margin-bottom:1rem; color:#475569;">既存施設の管轄移動</div>
            <div style="margin-bottom: 1.5rem;">
               <label class="${formLabel}">移動する施設 (Select Facility)</label>
               <select id="f-move-id" class="tom-select" placeholder="施設を選択...">
                  <option value=""></option>
               </select>
            </div>
            ${Button({ onclick: "moveFacility()", children: html`<span class="material-symbols-outlined">drive_file_move</span> <span>このグループへ移動</span>` })}
         </div>

         <div class="${sectionTitle}" style="margin-bottom: 0.75rem;">
            <span class="material-symbols-outlined">domain</span>${t.am_section_facilities || '施設一覧'}
         </div>
         <div class="${card}">
            <div class="${tableWrap}">
               <table>
                  <thead>
                     <tr>
                        <th>構造物番号 (Structure No.)</th>
                        <th>用途 (Building Use)</th>
                        <th></th>
                     </tr>
                  </thead>
                  <tbody id="facilities-table-body">
                     <tr><td colspan="3" style="text-align:center; color:#94a3b8; padding:2rem;">読込中...</td></tr>
                  </tbody>
               </table>
            </div>
         </div>
      </div>

      <!-- 利用枠タブ(ゲート②) — 決済権者のみ -->
      ${isBillingAdmin ? html`
      <div id="tab-grants" class="tab-content">
        <div class="${infoBox}">
          <span class="material-symbols-outlined">info</span>${t.ga_desc_grants}
        </div>
        
        <div id="grants-summary" style="margin-bottom:1rem; display:flex; gap:1rem; flex-wrap:wrap;"></div>

        <!-- 所有している契約（箱） -->
        <div id="contracts-section" style="display:none; margin-bottom:1.5rem;">
          <div class="${sectionTitle}" style="margin-bottom:0.75rem;">
            <span class="material-symbols-outlined">file_copy</span>契約 (箱)
          </div>
          <div class="${card}">
            <div class="${tableWrap}">
              <table>
                <thead>
                  <tr>
                    <th>契約名</th>
                    <th>席数上限</th>
                  </tr>
                </thead>
                <tbody id="contracts-table-body">
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:0.75rem; margin-top:1.5rem;">
          <div class="${sectionTitle}" style="margin:0;">
            <span class="material-symbols-outlined">inventory_2</span>自グループの利用枠 (実体)
          </div>
          <div id="btn-open-grant-wrap" style="display:flex; justify-content:flex-end; align-items:center; gap:0.75rem;">
            ${Button({ onclick: "openGrantModal()", style: "width:auto;", children: html`<span class="material-symbols-outlined" style="font-size:18px;">add_card</span> ${t.ga_open_grant}` })}
          </div>
        </div>
        
        <div class="${card}">
          <div class="${tableWrap}">
            <table>
              <thead>
                <tr>
                  <th>${t.ga_grant_service}</th>
                  <th>${t.ga_grant_seat}</th>
                  <th>${t.ga_grant_valid}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody id="grants-table-body">
                <tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:2rem;">読込中...</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 子グループへ配分済みの枠 -->
        <div id="child-grants-section" style="display:none; margin-top:1.5rem;">
          <div class="${sectionTitle}" style="margin-bottom:0.75rem;">
            <span class="material-symbols-outlined">account_tree</span>${t.ga_child_grants_title}
          </div>
          <div class="${card}">
            <div class="${tableWrap}">
              <table>
                <thead>
                  <tr>
                    <th>${t.ga_grant_group}</th>
                    <th>${t.ga_grant_service}</th>
                    <th>${t.ga_grant_seat}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody id="child-grants-table-body">
                  <tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:2rem;">読込中...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      ` : ''}

      <!-- アクセス権タブ -->
      <div id="tab-access" class="tab-content">
        <div class="${infoBox}">
          <span class="material-symbols-outlined">info</span>
          ${t.ga_access_readonly}
        </div>
        <div class="${card}">
          <div class="${tableWrap}">
            <table>
              <thead>
                <tr>
                  <th>${t.ga_assign_user}</th>
                  <th>${t.ga_permission_app}</th>
                  <th>${t.ga_permission_source}</th>
                  <th>${t.ga_permission_valid}</th>
                </tr>
              </thead>
              <tbody id="perms-table-body">
                <tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:2rem;">読込中...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- アプリ／サービス タブ(セルフサービス) -->
      <div id="tab-apps" class="tab-content">

        <!-- 開発者申請前の表示 -->
        <div id="dev-not-approved" style="display:none; margin-bottom:1.5rem;">
          <div class="${sectionTitle}"><span class="material-symbols-outlined">developer_board</span>開発者機能の利用申請</div>
          <div class="${infoBox}"><span class="material-symbols-outlined">info</span>OIDCアプリの登録やサービスの作成を行うには、システム管理者の承認が必要です。</div>
          <div class="${card}" style="max-width:600px;">
            <label class="${formLabel}">申請理由 (必須)</label>
            <textarea id="dev-apply-reason" class="${dateInput}" style="min-height:80px; margin-bottom:1rem;" placeholder="アプリの利用目的などを入力してください"></textarea>
            ${Button({ onclick: "applyDeveloper()", style: "width:auto;", children: html`<span class="material-symbols-outlined">send</span> 承認を申請する` })}
            <div id="dev-rejected-msg" style="display:none; margin-top:1.5rem; color:#b91c1c; background:#fef2f2; padding:1rem; border-radius:8px; align-items:flex-start; gap:0.5rem; flex-direction:column;">
              <div style="display:flex; align-items:center; gap:0.5rem; font-weight:600;"><span class="material-symbols-outlined">error</span><span>前回の申請は以下の事由により却下されました。理由を修正して再度申請してください。</span></div>
              <div style="padding:0.75rem; background:rgba(0,0,0,0.03); border-radius:6px; width:100%; box-sizing:border-box; white-space:pre-wrap; margin-top:0.5rem;" id="dev-rejected-reason-text"></div>
            </div>
            <div id="dev-revoked-msg" style="display:none; margin-top:1.5rem; color:#b45309; background:#fffbeb; padding:1rem; border-radius:8px; align-items:flex-start; gap:0.5rem; flex-direction:column;">
              <div style="display:flex; align-items:center; gap:0.5rem; font-weight:600;"><span class="material-symbols-outlined">warning</span><span>開発者権限は以下の事由によりはく奪されました。再度権限が必要な場合は改めて申請してください。</span></div>
              <div style="padding:0.75rem; background:rgba(0,0,0,0.03); border-radius:6px; width:100%; box-sizing:border-box; white-space:pre-wrap; margin-top:0.5rem;" id="dev-revoked-reason-text"></div>
            </div>
          </div>
        </div>

        <!-- 申請中(Pending)の表示 -->
        <div id="dev-pending" style="display:none; margin-bottom:1.5rem;">
          <div class="${sectionTitle}"><span class="material-symbols-outlined">developer_board</span>開発者機能の利用申請</div>
          <div class="${infoBox}" style="background:#fffbeb; color:#b45309; border-color:#fcd34d;">
            <span class="material-symbols-outlined" style="color:#f59e0b;">hourglass_empty</span>
            システム管理者の承認をお待ちください。承認されるまでアプリやサービスの作成はできません。
          </div>
        </div>

        <!-- 承認済み(Approved)の表示 -->
        <div id="dev-approved" style="display:none;">
          <!-- 自グループのサービス -->
          <div class="${sectionTitle}"><span class="material-symbols-outlined">category</span>${t.ga_svc_section}</div>
          <div class="${infoBox}"><span class="material-symbols-outlined">info</span>${t.ga_svc_desc}</div>
          <div style="display:flex; justify-content:flex-end; margin-bottom:1rem;">
            ${Button({ onclick: "openServiceModal()", style: "width:auto;", children: html`<span class="material-symbols-outlined" style="font-size:18px;">add</span> ${t.ga_svc_create}` })}
          </div>
          <div class="${card}">
            <div class="${tableWrap}">
              <table>
                <thead><tr><th>${t.ga_svc_name}</th><th></th></tr></thead>
                <tbody id="services-table-body">
                  <tr><td colspan="2" style="text-align:center; color:#94a3b8; padding:1.5rem;">読込中...</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- アプリ登録の申請 -->
          <div class="${sectionTitle}" style="margin-top:1rem;"><span class="material-symbols-outlined">apps</span>${t.ga_app_section}</div>
          <div class="${infoBox}"><span class="material-symbols-outlined">info</span>${t.ga_app_desc}</div>
          <div style="display:flex; justify-content:flex-end; margin-bottom:1rem;">
            ${Button({ onclick: "openAppModal()", style: "width:auto;", children: html`<span class="material-symbols-outlined" style="font-size:18px;">note_add</span> ${t.ga_app_request}` })}
          </div>
          <div class="${card}">
            <div class="${tableWrap}">
              <table>
                <thead><tr><th>${t.ga_app_name}</th><th>${t.status}</th><th></th></tr></thead>
                <tbody id="apps-table-body">
                  <tr><td colspan="3" style="text-align:center; color:#94a3b8; padding:1.5rem;">読込中...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      
      ${GroupAdminModals(props, t, userOptions)}
      <script type="application/json" id="ga-members-data">${raw(membersByGroupJson)}</script>
      <script type="application/json" id="ga-assigns-data">${raw(assignmentsByGroupJson)}</script>
      <script type="application/json" id="ga-perms-data">${raw(permsByGroupJson)}</script>
      <script type="application/json" id="ga-users-data">${raw(allUsersJson)}</script>
      <script type="application/json" id="ga-grants-data">${raw(grantsByGroupJson)}</script>
      <script type="application/json" id="ga-facilities-data">${raw(facilitiesJson)}</script>
      <script type="application/json" id="ga-roles-data">${raw(rolesByServiceJson)}</script>
      <script type="application/json" id="ga-grants-detail-data">${raw(grantsDetailByGroupJson)}</script>
      <script type="application/json" id="ga-contracts-data">${raw(availableContractsJson)}</script>
      <script type="application/json" id="ga-children-data">${raw(childrenByGroupJson)}</script>
      <script type="application/json" id="ga-services-data">${raw(servicesByGroupJson)}</script>
      <script type="application/json" id="ga-apps-data">${raw(appsByGroupJson)}</script>
      <script type="application/json" id="ga-approved-apps-data">${raw(approvedAppsByGroupJson)}</script>
      <script type="application/json" id="ga-dev-status-data">${raw(devStatusesJson)}</script>
      <script type="application/json" id="ga-service-tags-data">${raw(serviceTagsByGroupJson)}</script>
      <script type="application/json" id="ga-custom-tags-data">${raw(customTagsByGroupJson)}</script>
      <script type="application/json" id="ga-available-tags-data">${raw(availableTagsJson)}</script>
      <script>
        window.i18n = {
          noMembers: '${t.am_no_members}',
          roleAdmin: '${t.am_role_group_admin}',
          roleBilling: '${t.am_role_billing_admin}',
          roleDeveloper: '${t.am_role_developer}',
          roleMember: '${t.am_role_member}',
          noAssignments: '${t.ga_no_assignments}',
          noAccess: '${t.ga_no_access}',
          srcUser: '${t.ga_source_user}',
          srcGroup: '${t.ga_source_group}',
          selectUser: '${t.placeholder_select}',
          selectService: '${t.ga_select_service}',
          selectFacility: '${t.ga_select_facility}',
          selectRole: '${t.ga_select_role}',
          selectAll: '${t.ga_select_role}',
          errNoGrant: '${t.ga_err_no_grant}',
          errSeat: '${t.ga_err_seat}',
          noGrants: '${t.ga_no_grants}',
          selectContract: '${t.ga_select_contract}',
          seatUnlimited: '${t.am_seat_unlimited}',
          grantSelf: '${t.ga_grant_self}',
          grantUnlimited: '${t.ga_grant_unlimited}',
          grantTotal: '${t.ga_grant_total}',
          grantDistributed: '${t.ga_grant_distributed}',
          grantAvailable: '${t.ga_grant_available}',
          noChildGrants: '${t.ga_no_child_grants}',
          errOverBudget: '${t.ga_err_over_budget}',
          errSeatRequired: '${t.ga_err_seat_required}',
          raApprove: '${t.ra_approve}',
          raReject: '${t.ra_reject}',
          svcNone: '${t.ga_svc_none}',
          svcName: '${t.ga_svc_name}',
          svcConfirmRemove: '${t.ga_svc_confirm_remove}',
          appNone: '${t.ga_app_none}',
          appConfirmRemove: '${t.ga_app_confirm_remove}',
          appBindNone: '${t.ga_app_bind_none}',
          noOwnServices: '${t.ga_no_own_services}',
          statusPending: '${t.ga_status_pending}',
          statusRejected: '${t.ga_status_rejected}',
          statusActive: '${t.ga_status_active}',
          statusInactive: '${t.ga_status_inactive}',
          appFillRequired: 'ID / 名前 / URL は必須です',
          appIdTaken: 'そのアプリIDは既に使われています',
          svcManageApps: '${t.ga_svc_manage_apps}',
          btnRemove: '${t.ga_btn_remove}',
          svcNoApps: '${t.ga_svc_no_apps}',
          svcSelectApp: '${t.ga_svc_select_app}',
          appNotApproved: '${t.ga_app_not_approved}',
          svcConfirmRemoveApp: '${t.ga_svc_confirm_remove_app}',
        };
      </script>
      <script>
      window.__name = function(f) { return f; };
      window.__isBillingAdmin = ${isBillingAdmin ? 'true' : 'false'};
      ${raw(groupAdminClientScript)}
      </script>
      <style>
      ${tabStyles}
      </style>
    `
  })
}
