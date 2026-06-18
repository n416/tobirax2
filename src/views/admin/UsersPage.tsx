import { html, raw } from 'hono/html'
import { css, keyframes } from 'hono/css'
import { usersClientScript } from '../scripts/usersClient'
import { blinkActive, listGrid, listCard, itemTitle, itemSub, grantFormCard, formLabel, dateInput, quickBtnGroup, actionBtn, deleteBtn, checkboxLabel, selectAllLabel, tabContainer, tabBtn, pageWrapper } from '../styles/usersStyles';
import { Layout } from './Layout'
import { dict } from '../../i18n'
import { User, App, Group, SystemConfig } from '../../types'
import { Modal } from '../components/Modal'
import { Button } from '../components/Button'
import { MultiSelect } from '../components/MultiSelect'
import { safeJsonStringify } from '../../utils/json'

interface Props {
    t: typeof dict.en
    userEmail: string
    users: (User & { group_name?: string })[]
    apps: App[]
    groups: Group[]
    services: any[]
    roles: any[]
    facilities: any[]
    inviteUrl?: string
    error?: string
    siteName: string
    appConfig: SystemConfig
}

export const UsersPage = (props: Props) => {
    const t = props.t
    const allAppsJson = safeJsonStringify(props.apps.map(a => ({value: a.id, text: a.name})));
    const allServicesJson = safeJsonStringify(props.services.map(s => ({id: s.id, name: s.name})));
    const allRolesJson = safeJsonStringify(props.roles.map(r => ({id: r.id, service_id: r.service_id, role_name: r.role_name})));
    const allFacilitiesJson = safeJsonStringify(props.facilities.map(f => ({id: f.id, structure_no: f.structure_no, building_use: f.building_use})));
    ;

    

    
    
    
    
    
    
    
    
    
    
    

    // Styled Select All Label (Button-like)
    
    
    

    

    return Layout({
        t: t,
        userEmail: props.userEmail,
        activeTab: 'users',
        siteName: props.siteName,
        appConfig: props.appConfig,
        children: html`
      <div class="${pageWrapper}">
          <div class="grid">
            <hgroup>
              <h2 style="margin-bottom:0; font-size:1.5rem;">${t.section_users}</h2>
              <h3 style="font-size:1rem; font-weight:normal; color:#64748b;">${t.header_invite}</h3>
            </hgroup>
            <div style="text-align:right; display: flex; justify-content: flex-end; align-items: start;">
               ${Button({
                   id: "toggleBulkMode",
                   variant: "outline",
                   style: "width: auto; margin-bottom: 0;",
                   children: html`<span class="material-symbols-outlined">bolt</span> ${t.btn_bulk_mode}`
               })}
               ${Button({
                   onclick: "document.getElementById('invite-modal').showModal()",
                   style: "width: auto; margin-bottom: 0; margin-left: 1rem;",
                   children: html`<span class="material-symbols-outlined">add</span> ${t.header_invite}`
               })}
            </div>
          </div>
          
          ${props.error ? html`<article style="background:#ffebee; color:#c62828; border-left:4px solid #c62828; margin-bottom:1rem;">${props.error}</article>` : ''}

          ${Modal({
            id: "invite-modal",
            title: t.header_invite,
            closeAction: "this.closest('.custom-modal').close()",
            children: html`
                  <form method="POST" action="/admin/invite">
                    <div class="grid-vertical">
                        <label style="margin-bottom:0; width:100%;">
                            <span class="${formLabel}">${t.email}</span>
                            <input type="email" name="email" placeholder="${t.placeholder_invite_email}" required />
                        </label>
                        <div style="margin-top:1rem;">
                            ${Button({ type: "submit", children: html`<span class="material-symbols-outlined">send</span> ${t.btn_generate_invite}` })}
                        </div>
                    </div>
                  </form>
                  ${props.inviteUrl ? html`
                    <div style="background:#e8f5e9; padding:1rem; border-radius:8px; margin-top:1.5rem; border:1px solid #bbf7d0;">
                        <strong style="color:#15803d;">${t.invite_created}</strong><br>
                        <small style="color:#166534;">${t.invite_copy_hint}</small><br>
                        <input type="text" value="${props.inviteUrl}" readonly onclick="this.select()" style="margin-top:0.5rem; background:white;" />
                    </div>
                  `: ''}
            `
          })}

          <hr />

          <form id="bulkForm" method="POST" action="/admin/users/bulk">
            <div id="bulkControls" style="display:none; background:#f0f7ff; padding:1rem; border-radius:8px; margin-bottom:1rem; border:1px solid #cce5ff;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
                    <h4 style="margin:0; font-size:1.1rem; color:#0369a1;">${t.btn_bulk_mode}</h4>
                </div>
                <div class="grid">
                    <label>
                        <span class="${formLabel}">${t.modal_section_group}</span>
                        <select name="group_id">
                            <option value="">(No Change)</option>
                            <option value="__CLEAR__">${t.no_affiliation}</option>
                            ${props.groups.map(g => html`<option value="${g.id}">${g.name}</option>`)}
                        </select>
                    </label>
                    <label>
                        <span class="${formLabel}">${t.modal_section_add}</span>
                        <select name="app_id">
                            <option value="">(None)</option>
                            ${props.apps.map(a => html`<option value="${a.id}">${a.name}</option>`)}
                        </select>
                    </label>
                </div>
                <button type="submit" style="width: auto; min-width: 150px; margin-top:1rem; background:#0284c7; border:none;">
                    <span class="material-symbols-outlined" style="margin-right: 4px;">done_all</span> ${t.btn_bulk_apply}
                </button>
            </div>

            <div style="margin-bottom:1rem;">
                <h3 style="font-size:1.2rem; font-weight:600; margin-bottom:0.5rem;">${t.header_registered_users}</h3>
                
                <div id="selectAllContainer" style="display:none; margin-top: 0.5rem; margin-left: 0.7rem;">
                    <label class="${selectAllLabel}">
                        <input type="checkbox" onclick="toggleAllCheckboxes(this)">
                        <span class="icon-box">
                            <span class="material-symbols-outlined" style="font-size: 16px;">check</span>
                        </span>
                        <span>Select All</span>
                    </label>
                </div>
            </div>
            
            <div class="${listGrid}">
                ${props.users.map((u) => {
                const g = props.groups.find(x => x.id === u.group_id)
                const gName = g ? g.name : t.no_affiliation
                return html`
                <div class="${listCard}" onclick="handleUserCardClick(event, '${u.id}')">
                    <div style="display:flex; align-items:center; gap:1rem; flex-grow:1;">
                        <div class="col-select" style="display:none;" onclick="event.stopPropagation()">
                            <input type="checkbox" name="ids" value="${u.id}" class="user-check" style="margin:0; width:1.2em; height:1.2em;" />
                        </div>
                        <div>
                            <div class="${itemTitle}">${u.email}</div>
                            <div class="${itemSub}">
                                <span class="material-symbols-outlined" style="font-size:16px;">group</span>
                                ${gName}
                            </div>
                        </div>
                    </div>
                    <div>
                         <button type="button" class="${deleteBtn}" onclick="event.stopPropagation(); deleteUser('${u.id}')" title="${t.delete}">
                            <span class="material-symbols-outlined">delete</span>
                         </button>
                    </div>
                </div>
                `})}
            </div>
          </form>

          <form id="delete-user-form" method="POST" action="/admin/users/delete">
            <input type="hidden" name="id" value="" />
          </form>

          ${Modal({
            id: "user-modal",
            title: html`${t.header_user_details} <span id="modal-user-email" style="font-weight:400; font-size:1rem; color:#64748b; margin-left:0.5rem;"></span>`,
            closeAction: "closeUserModal()",
            closeBtnId: "modal-close-btn",
            children: html`
                  <div style="margin-bottom: 2rem;">
                    <label class="${formLabel}">${t.modal_section_group}</label>
                    <div style="display: flex; gap: 0.5rem; align-items: stretch;">
                        <select id="modal-group-select" style="flex-grow: 1; margin-bottom: 0;">
                            <option value="">${t.no_affiliation}</option>
                            ${props.groups.map(g => html`<option value="${g.id}">${g.name}</option>`)}
                        </select>
                        ${Button({ onclick: "updateUserGroup()", variant: "primary", style: "width:auto; white-space:nowrap; flex-shrink:0;", children: t.save })}
                    </div>
                    <small style="color:#94a3b8; margin-top:0.4rem; display:block;">${t.desc_group_override}</small>
                  </div>

                  <div class="${tabContainer}">
                      <button type="button" id="btn-tab-permissions" class="${tabBtn} active" onclick="switchUserTab('permissions')">アプリ権限</button>
                      <button type="button" id="btn-tab-assignments" class="${tabBtn}" onclick="switchUserTab('assignments')">サービス割当</button>
                  </div>

                  <div id="tab-permissions" style="display:block;">
                      <div id="grant-form-card" class="${grantFormCard}">
                        <div style="margin-bottom: 1.5rem;">
                           <label class="${formLabel}">${t.label_app}</label>
                           ${MultiSelect({
                               id: "perm-app-id",
                               placeholder: t.placeholder_select,
                               options: props.apps.map(a => ({ value: a.id, text: a.name }))
                           })}
                           <label class="${checkboxLabel}">
                               <input type="checkbox" id="exclude-existing-check" />
                               登録されているものは含まない
                           </label>
                        </div>

                        <div style="display:grid; grid-template-columns: 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
                             <div>
                                  <label class="${formLabel}">
                                    ${t.label_valid_from} <span style="font-weight:normal; color:#94a3b8; font-size:0.85em;">(開始予定日)</span>
                                  </label>
                                  <input type="date" id="perm-valid-from" class="${dateInput}" />
                                  <div class="${quickBtnGroup}">
                                      ${Button({ variant: "outline", onclick: "calcDate('perm-valid-from', -1, 'month')", children: "-1ヶ月", style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                      ${Button({ variant: "outline", onclick: "calcDate('perm-valid-from', -7, 'day')", children: "-1週間", style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                      ${Button({ variant: "outline", onclick: "calcDate('perm-valid-from', -1, 'day')", children: "-1日", style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                      ${Button({ variant: "outline", onclick: "calcDate('perm-valid-from', 0, 'day')", children: t.btn_date_today, style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                  </div>
                             </div>
                             <div>
                                 <label class="${formLabel}">${t.label_valid_to}</label>
                                 <input type="date" id="perm-valid-to" class="${dateInput}" />
                                 <div class="${quickBtnGroup}">
                                      ${Button({ variant: "outline", onclick: "calcDate('perm-valid-to', 0, 'day')", children: t.btn_date_today, style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                      ${Button({ variant: "outline", onclick: "calcDate('perm-valid-to', 1, 'month')", children: t.btn_term_1mo, style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                      ${Button({ variant: "outline", onclick: "calcDate('perm-valid-to', 1, 'year')", children: t.btn_term_1yr, style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                      ${Button({ variant: "outline", onclick: "calcDate('perm-valid-to', 99, 'forever')", children: t.btn_term_forever, style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                 </div>
                             </div>
                         </div>

                         ${Button({ id: "btn-grant-perm", onclick: "grantPermission()", children: html`<span class="material-symbols-outlined">add</span> <span>${t.btn_grant}</span>` })}
                      </div>

                      <div id="modal-perm-list"></div>
                  </div>

                  <div id="tab-assignments" style="display:none;">
                      <div class="${grantFormCard}">
                          <div style="margin-bottom: 1.5rem;">
                             <label class="${formLabel}">サービス (Service)</label>
                             <select id="a-service-id" class="${dateInput}" style="margin-bottom:0;" onchange="updateRoleOptions()">
                               <option value="">-</option>
                               ${props.services.map(s => html`<option value="${s.id}">${s.name}</option>`)}
                             </select>
                          </div>
                          <div style="margin-bottom: 1.5rem;">
                             <label class="${formLabel}">ロール (Role)</label>
                             <select id="a-role-id" class="${dateInput}" style="margin-bottom:0;">
                               <option value="">-</option>
                             </select>
                          </div>
                          <div style="margin-bottom: 1.5rem;">
                             <label class="${formLabel}">施設 (Facility)</label>
                             <select id="a-facility-id" class="${dateInput}" style="margin-bottom:0;">
                               <option value="">-</option>
                               ${props.facilities.map(f => html`<option value="${f.id}">${f.structure_no} ${f.building_use}</option>`)}
                             </select>
                          </div>
                          <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
                               <div>
                                    <label class="${formLabel}">${t.label_valid_from}</label>
                                    <input type="date" id="a-valid-from" class="${dateInput}" value="${new Date().toISOString().split('T')[0]}" />
                               </div>
                               <div>
                                   <label class="${formLabel}">${t.label_valid_to}</label>
                                   <input type="date" id="a-valid-to" class="${dateInput}" value="${new Date(Date.now()+31536000000).toISOString().split('T')[0]}" />
                               </div>
                          </div>
                          ${Button({ onclick: "addAssignment()", children: html`<span class="material-symbols-outlined">add</span> <span>追加</span>` })}
                      </div>
                      
                      <h4 style="font-size:1.1rem; margin:2rem 0 1rem; font-weight:600; color:#334155;">割当一覧</h4>
                      <div id="modal-assignment-list"></div>
                  </div>

            `
          })}

          ${Modal({
            id: "revoke-confirm-modal",
            title: html`<span style="color:#ef4444; display:flex; align-items:center; gap:0.5rem;"><span class="material-symbols-outlined">warning</span> ${t.confirm_revoke_permission || 'Revoke Permission'}</span>`,
            closeAction: "closeRevokeModal()",
            closeBtnId: "revoke-close-btn",
            children: html`
                  <div style="margin-bottom: 2rem;">
                    <p style="color:#475569; font-size:1rem; line-height:1.5;">${t.confirm_revoke_permission || 'Are you sure you want to revoke this permission?'}</p>
                    <div id="revoke-error-msg" style="margin-top: 1rem; padding: 0.75rem; background: #fef2f2; color: #b91c1c; border-radius: 6px; border: 1px solid #fecaca; display: none;"></div>
                  </div>
                  <div style="display: flex; justify-content: flex-end; gap: 1rem;">
                      <button type="button" onclick="closeRevokeModal()" style="background: transparent; color: #64748b; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer;">
                         Cancel
                      </button>
                      <button type="button" onclick="executeRevoke()" style="background: #ef4444; color: white; border: none; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                         <span class="material-symbols-outlined" style="font-size:18px;">delete</span> Revoke
                      </button>
                  </div>
            `
          })}

          <div id="i18n-data" style="display:none;"
            data-delete-confirm="${t.confirm_delete_user}"
            data-msg-revoke="${t.confirm_revoke_permission}"
            data-btn-grant="${t.btn_grant}"
            data-btn-apply="${t.btn_bulk_apply || 'Update'}"
            data-btn-change="変更"
            data-btn-exit="${t.btn_exit_bulk}"
            data-btn-enter="${t.btn_bulk_mode}"
            data-no-affiliation="${t.no_affiliation || '(None)'}"
            data-msg-override="${t.msg_override}"
            data-term-forever="${t.btn_term_forever}"
            data-source-group="${t.source_group}"
            data-source-user="${t.source_user}"
            data-msg-overwrite-confirm="${t.confirm_overwrite}"
            data-alert-select-app="${t.alert_select_app}"
            data-alert-update-fail="${t.alert_update_fail}"
            data-alert-error="${t.alert_error}"
            data-placeholder-select="${t.placeholder_select}" 
            data-text-no-results="${t.text_no_results}"
          ></div>
          
          <script type="application/json" id="app-data">${raw(allAppsJson)}</script>
          <script type="application/json" id="services-data">${raw(allServicesJson)}</script>
          <script type="application/json" id="roles-data">${raw(allRolesJson)}</script>
          <script type="application/json" id="facilities-data">${raw(allFacilitiesJson)}</script>

          <script>
          window.__name = function(f) { return f; };
          ${raw(usersClientScript)}
          ${props.inviteUrl ? raw(`
            window.addEventListener('DOMContentLoaded', function() {
                var modal = document.getElementById('invite-modal');
                if(modal) modal.showModal();
            });
          `) : ''}
          </script>
      </div>
    `
    })
}
