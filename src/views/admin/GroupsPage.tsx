import { html, raw } from 'hono/html'
import { css, keyframes } from 'hono/css'
import { groupsClientScript } from '../scripts/generated/groups'
import { blinkActive, listGrid, listCard, itemTitle, actionBtn, deleteBtn, grantFormCard, formLabel, dateInput, quickBtnGroup, pageWrapper } from '../styles/groupsStyles';
import { Layout } from './Layout'
import { dict } from '../../i18n'
import { Group, App, SystemConfig } from '../../types'
import { Modal } from '../components/Modal'
import { Button } from '../components/Button'
import { MultiSelect } from '../components/MultiSelect'
import { safeJsonStringify } from '../../utils/json'

interface Props {
  t: typeof dict.en
  userEmail: string
  groups: Group[]
  apps: App[]
  siteName: string
  appConfig: SystemConfig
}

export const GroupsPage = (props: Props) => {
  const t = props.t
  const allAppsJson = safeJsonStringify(props.apps.map(a => ({value: a.id, text: a.name})));

  ;

  

  
  
  

  
  
  

  
  
  

  

  

  

  return Layout({
    t: t,
    userEmail: props.userEmail,
    activeTab: 'groups',
    siteName: props.siteName,
    appConfig: props.appConfig,
    children: html`
      <div class="${pageWrapper}">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
            <h2 style="margin-bottom: 0;">${t.section_groups}</h2>
            ${Button({
                onclick: "document.getElementById('new-group-modal').showModal()",
                style: "width: auto; margin-bottom: 0;",
                children: html`<span class="material-symbols-outlined" style="font-size:18px;">add</span> ${t.btn_add_group}`
            })}
          </div>

          ${Modal({
            id: "new-group-modal",
            title: t.header_new_group,
            closeAction: "this.closest('.custom-modal').close()",
            children: html`
                  <form method="POST" action="/admin/groups">
                    <div class="grid-vertical">
                        <label style="width:100%;">
                          <span class="${formLabel}">${t.label_group_name}</span>
                          <input type="text" name="name" placeholder="${t.placeholder_group_name}" required style="margin-top:0.2rem;" />
                        </label>
                        <div style="margin-top:1rem;">
                            ${Button({ type: "submit", children: t.btn_add_group })}
                        </div>
                    </div>
                  </form>
            `
          })}

          <hr />

          <form id="delete-group-form" method="POST" action="/admin/groups/delete">
            <input type="hidden" name="id" value="" />
          </form>

          <div class="${listGrid}">
            ${props.groups.length === 0 ? html`<div style="text-align:center; padding:2rem; color:#94a3b8;">${t.no_groups}</div>` : ''}
            ${props.groups.map((g) => {
                return html`
              <div class="${listCard}" onclick="openGroupModal('${g.id}', '${g.name}')">
                <div style="flex-grow:1;">
                    <div class="${itemTitle}">${g.name}</div>
                </div>
                <div>
                     <button type="button" class="${deleteBtn}" title="${t.delete}" onclick="deleteGroup('${g.id}', event)">
                        <span class="material-symbols-outlined">delete</span>
                     </button>
                </div>
              </div>
            `})}
          </div>

          ${Modal({
            id: "group-modal",
            title: html`${t.modal_section_group}: <span id="modal-group-name" style="font-weight:400; color:#64748b; margin-left:0.5rem;"></span>`,
            closeAction: "closeGroupModal()",
            closeBtnId: "modal-close-btn",
            children: html`
                 <div id="grant-form-card" class="${grantFormCard}">
                    <div style="margin-bottom: 1.5rem;">
                       <label class="${formLabel}">${t.modal_label_app}</label>
                       ${MultiSelect({
                           id: "g-perm-app-id",
                           placeholder: t.placeholder_select,
                           options: props.apps.map(a => ({ value: a.id, text: a.name }))
                       })}
                    </div>

                    <div style="display:grid; grid-template-columns: 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
                         <div>
                              <label class="${formLabel}">
                                ${t.label_valid_from} <span style="font-weight:normal; color:#94a3b8; font-size:0.85em;">(開始予定日)</span>
                              </label>
                              <input type="date" id="g-perm-valid-from" class="${dateInput}" />
                              <div class="${quickBtnGroup}">
                                  ${Button({ variant: "outline", onclick: "calcGroupDate('g-perm-valid-from', -1, 'month')", children: "-1ヶ月", style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                  ${Button({ variant: "outline", onclick: "calcGroupDate('g-perm-valid-from', -7, 'day')", children: "-1週間", style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                  ${Button({ variant: "outline", onclick: "calcGroupDate('g-perm-valid-from', -1, 'day')", children: "-1日", style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                  ${Button({ variant: "outline", onclick: "calcGroupDate('g-perm-valid-from', 0, 'day')", children: t.btn_date_today, style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                              </div>
                         </div>
                         <div>
                             <label class="${formLabel}">${t.label_valid_to}</label>
                             <input type="date" id="g-perm-valid-to" class="${dateInput}" />
                             <div class="${quickBtnGroup}">
                                  ${Button({ variant: "outline", onclick: "calcGroupDate('g-perm-valid-to', 0, 'day')", children: t.btn_date_today, style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                  ${Button({ variant: "outline", onclick: "calcGroupDate('g-perm-valid-to', 1, 'month')", children: t.btn_term_1mo, style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                  ${Button({ variant: "outline", onclick: "calcGroupDate('g-perm-valid-to', 1, 'year')", children: t.btn_term_1yr, style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                  ${Button({ variant: "outline", onclick: "calcGroupDate('g-perm-valid-to', 99, 'forever')", children: t.btn_term_forever, style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                             </div>
                         </div>
                    </div>

                    ${Button({ id: "btn-grant-perm", onclick: "grantGroupPermission()", children: html`<span class="material-symbols-outlined">add</span> <span>${t.btn_grant}</span>` })}
                 </div>
                 
                 <h4 style="font-size:1.1rem; margin:2rem 0 1rem; font-weight:600; color:#334155;">${t.header_active_permissions}</h4>
                 
                 <div id="modal-g-perm-list"></div>
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
                      <button type="button" onclick="closeRevokeModal()" style="background: transparent; color: #64748b; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer;">Cancel</button>
                      <button type="button" onclick="executeRevoke()" style="background: #ef4444; color: white; border: none; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                         <span class="material-symbols-outlined" style="font-size:18px;">delete</span> Revoke
                      </button>
                  </div>
            `
          })}

          ${Modal({
            id: "delete-confirm-modal",
            title: html`<span style="color:#ef4444; display:flex; align-items:center; gap:0.5rem;"><span class="material-symbols-outlined">warning</span> ${t.delete || 'Delete'}</span>`,
            closeAction: "closeDeleteModal()",
            children: html`
                  <div style="margin-bottom: 2rem;">
                    <p style="color:#475569; font-size:1rem; line-height:1.5; white-space:pre-wrap;">${t.confirm_delete_group || 'Are you sure you want to delete this group?'}</p>
                  </div>
                  <div style="display: flex; justify-content: flex-end; gap: 1rem;">
                      <button type="button" onclick="closeDeleteModal()" style="background: transparent; color: #64748b; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer;">Cancel</button>
                      <button type="button" onclick="executeDelete()" style="background: #ef4444; color: white; border: none; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                         <span class="material-symbols-outlined" style="font-size:18px;">delete</span> Delete
                      </button>
                  </div>
            `
          })}

          ${Modal({
            id: "overwrite-confirm-modal",
            title: html`<span style="color:#d97706; display:flex; align-items:center; gap:0.5rem;"><span class="material-symbols-outlined">warning</span> ${t.confirm_overwrite || 'Overwrite?'}</span>`,
            closeAction: "this.closest('.custom-modal').close()",
            children: html`
                  <div style="margin-bottom: 2rem;">
                    <p id="overwrite-msg-text" style="color:#475569; font-size:1rem; line-height:1.5; white-space:pre-wrap;"></p>
                  </div>
                  <div style="display: flex; justify-content: flex-end; gap: 1rem;">
                      <button type="button" onclick="this.closest('.custom-modal').close()" style="background: transparent; color: #64748b; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer;">Cancel</button>
                      <button type="button" onclick="window._executeOverwrite()" style="background: #d97706; color: white; border: none; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                         <span class="material-symbols-outlined" style="font-size:18px;">check</span> Overwrite
                      </button>
                  </div>
            `
          })}

          <div id="i18n-data" style="display:none;"
            data-msg-revoke="${t.confirm_revoke_permission}"
            data-term-forever="${t.btn_term_forever}"
            data-msg-overwrite-confirm="${t.confirm_overwrite}"
            data-alert-select-app="${t.alert_select_app}"
            data-alert-update-fail="${t.alert_update_fail}"
            data-alert-error="${t.alert_error}"
            data-placeholder-select="${t.placeholder_select}" 
            data-btn-grant="${t.btn_grant}"
            data-btn-change="${t.btn_change || 'Change'}"
            data-text-no-results="${t.text_no_results}"
          ></div>
          
          <script type="application/json" id="app-data">${raw(allAppsJson)}</script>

          <script>
          window.__name = function(f) { return f; };
          ${raw(groupsClientScript)}
          </script>
      </div>
    `
  })
}
