import { html, raw } from 'hono/html'
import { css, keyframes } from 'hono/css'
import { accountGroupsClientScript } from '../scripts/accountGroupsClient'
import { blinkActive, tabContainer, tabBtn, listGrid, listCard, itemTitle, itemSub, actionBtn, deleteBtn, addFormCard, formLabel, dateInput, tomSelectWrapper, quickBtnGroup } from '../styles/accountGroupsStyles';
import { Layout } from './Layout'
import { dict } from '../../i18n'
import { Group, User, SystemConfig } from '../../types'
import { Modal } from '../components/Modal'
import { Button } from '../components/Button'
import { MultiSelect } from '../components/MultiSelect'

interface Props {
  t: typeof dict.en
  userEmail: string
  // グループ一覧（メンバー数つき）
  groups: (Group & { member_count?: number })[]
  // メンバー追加候補のユーザー全件
  users: User[]
  facilities?: { id: string, structure_no: string, building_use: string, managing_group_id: string }[]
  contracts?: any[]
  siteName: string
  appConfig: SystemConfig
}

export const AccountGroupsPage = (props: Props) => {
  const t = props.t
  // ユーザー選択(TomSelect)用の選択肢。表示は「名前 <email>」または email のみ。
  const userOptions = props.users.map(u => ({
    value: u.id,
    text: u.name ? `${u.name} <${u.email}>` : u.email,
  }))
  const allUsersJson = JSON.stringify(userOptions)

  // 親子(parent_id)からツリーを構築し、深さつきのフラット配列にする。
  // 親が存在しない/未設定のものは最上位として扱う。兄弟は名前順。
  const byId = new Map(props.groups.map(g => [g.id, g]))
  const childrenMap = new Map<string, (Group & { member_count?: number })[]>()
  for (const g of props.groups) {
    const key = g.parent_id && byId.has(g.parent_id) ? g.parent_id : '__root__'
    if (!childrenMap.has(key)) childrenMap.set(key, [])
    childrenMap.get(key)!.push(g)
  }
  for (const arr of childrenMap.values()) arr.sort((a, b) => a.name.localeCompare(b.name))
  const flatTree: { g: Group & { member_count?: number }; depth: number }[] = []
  const walk = (key: string, depth: number) => {
    for (const g of childrenMap.get(key) || []) {
      flatTree.push({ g, depth })
      walk(g.id, depth + 1)
    }
  }
  walk('__root__', 0)
  // 親選択プルダウン用（全グループ、名前順）。
  const parentOptions = props.groups.slice().sort((a, b) => a.name.localeCompare(b.name))

  

  

  
  

  
  
  
  
  
  
  
  
  
  
  

  return Layout({
    t: t,
    userEmail: props.userEmail,
    activeTab: 'am-groups',
    siteName: props.siteName,
    appConfig: props.appConfig,
    children: html`
      <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem;">
            <hgroup>
              <h2 style="margin-bottom: 0;">${t.am_section_groups}</h2>
              <h3 style="font-size:1rem; font-weight:normal; color:#64748b;">${t.am_subtitle}</h3>
            </hgroup>
            ${Button({
              onclick: "document.getElementById('new-group-modal').showModal()",
              style: "width: auto; margin-bottom: 0;",
              children: html`<span class="material-symbols-outlined" style="font-size:18px;">add</span> ${t.am_btn_add_group}`
            })}
          </div>

          ${Modal({
            id: "new-group-modal",
            title: t.am_header_new_group,
            closeAction: "this.closest('.custom-modal').close()",
            children: html`
                  <form method="POST" action="/admin/am/groups">
                    <div class="grid-vertical">
                        <label style="width:100%;">
                          <span class="${formLabel}">${t.label_group_name}</span>
                          <input type="text" name="name" placeholder="${t.placeholder_group_name}" required style="margin-top:0.2rem;" />
                        </label>
                        <label style="width:100%;">
                          <span class="${formLabel}">${t.am_label_parent}</span>
                          <div class="${tomSelectWrapper} searchable">
                            <select id="new-group-parent" name="parent_id">
                              <option value="">${t.am_parent_none}</option>
                              ${parentOptions.map(g => html`<option value="${g.id}">${g.name}</option>`)}
                            </select>
                          </div>
                        </label>
                        <div style="margin-top:1rem;">
                            ${Button({ type: "submit", children: t.am_btn_add_group })}
                        </div>
                    </div>
                  </form>
            `
          })}

          <hr />

          <form id="delete-group-form" method="POST" action="/admin/am/groups/delete">
            <input type="hidden" name="id" value="" />
          </form>

          <div class="${listGrid}">
            ${flatTree.length === 0 ? html`<div style="text-align:center; padding:2rem; color:#94a3b8;">${t.no_groups}</div>` : ''}
            ${flatTree.map(({ g, depth }) => html`
              <div class="${listCard}" style="margin-left:${depth * 1.75}rem;" onclick="openGroupModal('${g.id}', '${g.name}', '${g.parent_id || ''}')">
                <div style="flex-grow:1; display:flex; align-items:center; gap:0.6rem;">
                    ${depth > 0 ? html`<span class="material-symbols-outlined" style="font-size:18px; color:#cbd5e1; flex-shrink:0;">subdirectory_arrow_right</span>` : ''}
                    <div>
                        <div class="${itemTitle}">${g.name}</div>
                        <div class="${itemSub}">
                            <span class="material-symbols-outlined" style="font-size:16px;">group</span>
                            ${t.am_member_count.replace('{count}', String(g.member_count ?? 0))}
                        </div>
                    </div>
                </div>
                <div>
                     <button type="button" class="${deleteBtn}" title="${t.delete}" onclick="deleteGroup('${g.id}', event)">
                        <span class="material-symbols-outlined">delete</span>
                     </button>
                </div>
              </div>
            `)}
          </div>

          ${Modal({
            id: "group-modal",
            title: html`${t.am_header_members}: <span id="modal-group-name" style="font-weight:400; color:#64748b; margin-left:0.5rem;"></span>`,
            closeAction: "closeGroupModal()",
            closeBtnId: "modal-close-btn",
            children: html`
                 <div style="margin-bottom: 2rem;">
                    <label class="${formLabel}">${t.am_label_parent}</label>
                    <div style="display:flex; gap:0.5rem; align-items:center;">
                        <div class="${tomSelectWrapper} searchable" style="flex-grow:1;">
                            <select id="m-parent" style="margin-bottom:0; display:none;">
                                <option value="">${t.am_parent_none}</option>
                                ${parentOptions.map(g => html`<option value="${g.id}">${g.name}</option>`)}
                            </select>
                        </div>
                        ${Button({ onclick: "saveParent()", style: "width:auto; white-space:nowrap; flex-shrink:0;", children: t.save })}
                    </div>
                 </div>

                 <div class="${tabContainer}">
                     <button type="button" id="btn-tab-members" class="${tabBtn} active" onclick="switchTab('members')">${t.am_header_members}</button>
                     <button type="button" id="btn-tab-facilities" class="${tabBtn}" onclick="switchTab('facilities')">${t.am_section_facilities || '施設'}</button>
                     <button type="button" id="btn-tab-grants" class="${tabBtn}" onclick="switchTab('grants')">利用枠</button>
                 </div>

                 <div id="tab-members" style="display:block;">
                     <div id="add-form-card" class="${addFormCard}">
                        <div style="margin-bottom: 1.5rem;">
                           <label class="${formLabel}">${t.am_label_member}</label>
                           ${MultiSelect({
                             id: "m-user-id",
                             placeholder: t.placeholder_select,
                             options: userOptions
                           })}
                        </div>

                        <div style="margin-bottom: 1.5rem;">
                           <label class="${formLabel}">${t.am_label_role}</label>
                           <div style="display:flex; flex-direction:column; gap:0.6rem; padding:0.25rem 0;">
                             <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
                               <input type="checkbox" id="chk_group_admin" style="width:18px; height:18px; cursor:pointer;" /> ${t.am_role_group_admin}
                             </label>
                             <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
                               <input type="checkbox" id="chk_billing_admin" style="width:18px; height:18px; cursor:pointer;" /> ${t.am_role_billing_admin}
                             </label>
                             <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
                               <input type="checkbox" id="chk_developer" style="width:18px; height:18px; cursor:pointer;" /> ${t.am_role_developer}
                             </label>
                             <div style="font-size:0.78rem; color:#94a3b8;">${t.am_role_hint}</div>
                           </div>
                        </div>

                        <div style="display:grid; grid-template-columns: 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
                             <div>
                                  <label class="${formLabel}">${t.label_valid_from}</label>
                                  <input type="date" id="m-valid-from" class="${dateInput}" />
                                  <div class="${quickBtnGroup}">
                                      ${Button({ variant: "outline", onclick: "calcDate('m-valid-from', -1, 'month')", children: "-1ヶ月", style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                      ${Button({ variant: "outline", onclick: "calcDate('m-valid-from', -7, 'day')", children: "-1週間", style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                      ${Button({ variant: "outline", onclick: "calcDate('m-valid-from', -1, 'day')", children: "-1日", style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                      ${Button({ variant: "outline", onclick: "calcDate('m-valid-from', 0, 'day')", children: t.btn_date_today, style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                  </div>
                             </div>
                             <div>
                                 <label class="${formLabel}">${t.label_valid_to}</label>
                                 <input type="date" id="m-valid-to" class="${dateInput}" />
                                 <div class="${quickBtnGroup}">
                                      ${Button({ variant: "outline", onclick: "calcDate('m-valid-to', 0, 'day')", children: t.btn_date_today, style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                      ${Button({ variant: "outline", onclick: "calcDate('m-valid-to', 1, 'month')", children: t.btn_term_1mo, style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                      ${Button({ variant: "outline", onclick: "calcDate('m-valid-to', 1, 'year')", children: t.btn_term_1yr, style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                      ${Button({ variant: "outline", onclick: "calcDate('m-valid-to', 99, 'forever')", children: t.btn_term_forever, style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                 </div>
                             </div>
                        </div>

                        ${Button({ id: "btn-add-member", onclick: "addMembers()", children: html`<span class="material-symbols-outlined">person_add</span> <span>${t.am_add_member}</span>` })}
                     </div>

                     <h4 style="font-size:1.1rem; margin:2rem 0 1rem; font-weight:600; color:#334155;">${t.am_header_members}</h4>
                     <div id="modal-member-list"></div>
                 </div>

                 <div id="tab-facilities" style="display:none;">
                     <div class="${addFormCard}">
                        <div style="margin-bottom: 1.5rem;">
                           <label class="${formLabel}">構造物番号/施設名 (Structure No. / Name)</label>
                           <input type="text" id="f-structure-no" class="${dateInput}" placeholder="F-12345" />
                        </div>
                        <div style="margin-bottom: 1.5rem;">
                           <label class="${formLabel}">用途 (Use)</label>
                           <input type="text" id="f-building-use" class="${dateInput}" placeholder="Office" />
                        </div>
                        ${Button({ onclick: "addFacility()", children: html`<span class="material-symbols-outlined">add_business</span> <span>追加</span>` })}
                     </div>

                     <h4 style="font-size:1.1rem; margin:2rem 0 1rem; font-weight:600; color:#334155;">${t.am_section_facilities || '施設一覧'}</h4>
                     <div id="modal-facility-list"></div>
                 </div>

                 <div id="tab-grants" style="display:none;">
                     <div class="${addFormCard}">
                        <div style="margin-bottom: 1.5rem;">
                           <label class="${formLabel}">契約 (Contract)</label>
                           <select id="g-contract-id" class="${dateInput}" style="margin-bottom:0;">
                             ${(props.contracts || []).map(c => html`<option value="${c.id}">${c.service_name} (${c.group_name}向け)</option>`)}
                           </select>
                        </div>
                        <div style="margin-bottom: 1.5rem;">
                           <label class="${formLabel}">配分枠数 (Seat Limit) ※空白で無制限</label>
                           <input type="number" id="g-seat-limit" class="${dateInput}" placeholder="10" />
                        </div>
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
                             <div>
                                  <label class="${formLabel}">${t.label_valid_from}</label>
                                  <input type="date" id="g-valid-from" class="${dateInput}" value="${new Date().toISOString().split('T')[0]}" />
                             </div>
                             <div>
                                 <label class="${formLabel}">${t.label_valid_to}</label>
                                 <input type="date" id="g-valid-to" class="${dateInput}" value="${new Date(Date.now()+31536000000).toISOString().split('T')[0]}" />
                             </div>
                        </div>
                        ${Button({ onclick: "addGrant()", children: html`<span class="material-symbols-outlined">add</span> <span>追加</span>` })}
                     </div>

                     <h4 style="font-size:1.1rem; margin:2rem 0 1rem; font-weight:600; color:#334155;">利用枠一覧</h4>
                     <div id="modal-grant-list"></div>
                 </div>
            `
          })}

          ${Modal({
            id: "remove-confirm-modal",
            title: html`<span style="color:#ef4444; display:flex; align-items:center; gap:0.5rem;"><span class="material-symbols-outlined">warning</span> ${t.am_btn_remove}</span>`,
            closeAction: "closeRemoveModal()",
            children: html`
                  <div style="margin-bottom: 2rem;">
                    <p style="color:#475569; font-size:1rem; line-height:1.5;">${t.am_confirm_remove_member}</p>
                  </div>
                  <div style="display: flex; justify-content: flex-end; gap: 1rem;">
                      <button type="button" onclick="closeRemoveModal()" style="background: transparent; color: #64748b; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer;">${t.cancel}</button>
                      <button type="button" onclick="executeRemove()" style="background: #ef4444; color: white; border: none; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                         <span class="material-symbols-outlined" style="font-size:18px;">person_remove</span> ${t.am_btn_remove}
                      </button>
                  </div>
            `
          })}

          ${Modal({
            id: "remove-fac-modal",
            title: html`<span style="color:#ef4444; display:flex; align-items:center; gap:0.5rem;"><span class="material-symbols-outlined">warning</span> ${t.delete}</span>`,
            closeAction: "closeRemoveFacModal()",
            children: html`
                  <div style="margin-bottom: 2rem;">
                    <p style="color:#475569; font-size:1rem; line-height:1.5;">本当にこの施設を削除しますか？（割当も解除されます）</p>
                  </div>
                  <div style="display: flex; justify-content: flex-end; gap: 1rem;">
                      <button type="button" onclick="closeRemoveFacModal()" style="background: transparent; color: #64748b; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer;">${t.cancel}</button>
                      <button type="button" onclick="executeRemoveFac()" style="background: #ef4444; color: white; border: none; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                         <span class="material-symbols-outlined" style="font-size:18px;">delete</span> ${t.delete}
                      </button>
                  </div>
            `
          })}

          ${Modal({
            id: "delete-confirm-modal",
            title: html`<span style="color:#ef4444; display:flex; align-items:center; gap:0.5rem;"><span class="material-symbols-outlined">warning</span> ${t.delete}</span>`,
            closeAction: "closeDeleteModal()",
            children: html`
                  <div style="margin-bottom: 2rem;">
                    <p style="color:#475569; font-size:1rem; line-height:1.5; white-space:pre-wrap;">${t.am_confirm_delete_group}</p>
                  </div>
                  <div style="display: flex; justify-content: flex-end; gap: 1rem;">
                      <button type="button" onclick="closeDeleteModal()" style="background: transparent; color: #64748b; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer;">${t.cancel}</button>
                      <button type="button" onclick="executeDelete()" style="background: #ef4444; color: white; border: none; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                         <span class="material-symbols-outlined" style="font-size:18px;">delete</span> ${t.delete}
                      </button>
                  </div>
            `
          })}

          <div id="i18n-data" style="display:none;"
            data-placeholder-select="${t.placeholder_select}"
            data-text-no-results="${t.text_no_results}"
            data-term-forever="${t.btn_term_forever}"
            data-no-members="${t.am_no_members}"
            data-role-admin="${t.am_role_group_admin}"
            data-role-billing="${t.am_role_billing_admin}"
            data-role-developer="${t.am_role_developer}"
            data-role-member="${t.am_role_member}"
            data-move-warn="${t.am_move_group_warn}"
            data-alert-select-user="${t.am_alert_select_user}"
            data-btn-add="${t.am_add_member}"
            data-btn-change="${t.btn_change}"
            data-alert-cycle="${t.am_alert_cycle}"
            data-alert-required="${t.error_invalid_invite || 'Required'}"
            data-no-facilities="${t.am_no_members || 'No facilities'}"
          ></div>

          <script type="application/json" id="user-data">${raw(allUsersJson)}</script>

          <script>
          window.__name = function(f) { return f; };
          ${raw(accountGroupsClientScript)}
          </script>
      </div>
    `
  })
}
