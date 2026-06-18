import { html, raw } from 'hono/html'
import { css } from 'hono/css'
import { getAppsClientScript } from '../scripts/appsClient'
import { listGrid, listCard, itemTitle, itemSub, actionBtn, deleteBtn } from '../styles/appsStyles';
import { Layout } from './Layout'
import { dict } from '../../i18n'
import { App, SystemConfig } from '../../types'
import { Modal } from '../components/Modal'
import { Button } from '../components/Button'
import { RejectReasonModal, RejectReasonModalScript } from '../components/RejectReasonModal'

interface RegToken {
  token: string
  created_at: number
  expires_at: number | null
}

interface Props {
  t: typeof dict.en
  userEmail: string
  apps: (App & { tags?: any[] })[]
  availableTags?: any[]
  siteName: string
  appConfig: SystemConfig
}

export const AppsPage = (props: Props) => {
  const t = props.t

  return Layout({
    t: t,
    userEmail: props.userEmail,
    activeTab: 'apps',
    siteName: props.siteName,
    appConfig: props.appConfig,
    children: html`
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <h2 style="margin-bottom: 0;">${t.section_apps}</h2>
        ${Button({
            onclick: "document.getElementById('new-app-modal').showModal()",
            style: "width: auto; margin-bottom: 0;",
            children: html`<span class="material-symbols-outlined" style="font-size: 18px;">add</span> ${t.btn_add_app}`
        })}
      </div>

      ${Modal({
        id: "new-app-modal",
        title: t.header_new_app,
        closeAction: "this.closest('.custom-modal').close()",
        children: html`
              <form method="POST" action="/admin/apps" enctype="multipart/form-data">
                <div class="grid-vertical" style="display:flex; flex-direction:column; gap:1.5rem;">
                    <label style="width:100%;">
                      <span class="form-label">${t.label_app_id}</span>
                      <input type="text" name="id" placeholder="${t.placeholder_app_id}" required />
                    </label>
                    <label style="width:100%;">
                      <span class="form-label">${t.label_app_name}</span>
                      <input type="text" name="name" placeholder="${t.placeholder_app_name}" required />
                    </label>
                    <label style="width:100%;">
                      <span class="form-label">${t.label_base_url}</span>
                      <input type="url" name="base_url" placeholder="https://..." required />
                    </label>

                    <label style="width:100%;">
                      <span class="form-label">${t.label_redirect_uris}</span>
                      <textarea name="redirect_uris" placeholder="${raw(t.ph_redirect_uris)}" style="width:100%; padding:0.8rem; border-radius:8px; border:1px solid #cbd5e1; font-family:monospace; font-size:0.85rem; min-height:70px;"></textarea>
                      <small style="display:block; color:#64748b; margin-top:0.35rem;">${t.help_redirect_uris}</small>
                    </label>

                    <label style="width:100%;">
                      <span class="form-label">${t.label_bcl_uri}</span>
                      <input type="url" name="backchannel_logout_uri" placeholder="https://app.example.com/backchannel-logout" style="width:100%; padding:0.8rem; border-radius:8px; border:1px solid #cbd5e1; font-family:monospace; font-size:0.85rem;" />
                      <small style="display:block; color:#64748b; margin-top:0.35rem;">${t.help_bcl_uri}</small>
                    </label>

                    <label style="width:100%;">
                      <span class="form-label">${t.label_initiate_login_uri}</span>
                      <input type="url" name="initiate_login_uri" placeholder="https://app.example.com/login" style="width:100%; padding:0.8rem; border-radius:8px; border:1px solid #cbd5e1; font-family:monospace; font-size:0.85rem;" />
                      <small style="display:block; color:#64748b; margin-top:0.35rem;">${t.help_initiate_login_uri}</small>
                    </label>

                    <label style="width:100%;">
                        <span class="form-label">${t.label_app_icon}</span>
                        <div style="display:flex; gap:0.5rem; align-items:center;">
                            <input type="file" name="icon_file" accept="image/*" style="font-size:0.9rem; padding: 0.4rem; height: auto;" onchange="handleIconPreview(this, 'new-icon-preview')" />
                            <input type="hidden" name="icon_url" />
                        </div>
                        <div id="new-icon-preview" style="margin-top:0.75rem; display:none;">
                            <p style="font-size:0.8rem; color:#64748b; margin-bottom:0.25rem;">${t.label_preview}</p>
                            <img src="" style="width:64px; height:64px; border-radius:12px; border:1px solid #e2e8f0; object-fit:contain; background: #fff;" />
                        </div>
                    </label>

                    <label style="width:100%;">
                      <span class="form-label">${t.label_description}</span>
                      <textarea name="description" placeholder="${t.placeholder_description}" style="width:100%; padding:0.8rem; border-radius:8px; border:1px solid #cbd5e1; font-family:inherit; min-height: 80px;"></textarea>
                    </label>

                    <div style="margin-top:1rem;">
                        ${Button({ type: "submit", children: t.btn_add_app })}
                    </div>
                </div>
              </form>
        `
      })}

      <form id="toggle-app-form" method="POST" action="/admin/apps/toggle">
        <input type="hidden" name="id" value="" />
        <input type="hidden" name="status" value="" />
      </form>
      <form id="delete-app-form" method="POST" action="/admin/apps/delete">
        <input type="hidden" name="id" value="" />
      </form>
      <form id="secret-app-form" method="POST" action="/admin/apps/secret">
        <input type="hidden" name="id" value="" />
        <input type="hidden" name="action" value="" />
      </form>
      <form id="approve-app-form" method="POST" action="/admin/apps/approve">
        <input type="hidden" name="id" value="" />
      </form>
      <form id="add-app-tag-form" method="POST" action="/admin/tags/app/add">
        <input type="hidden" name="app_id" value="" />
        <input type="hidden" name="tag_id" value="" />
      </form>
      <form id="remove-app-tag-form" method="POST" action="/admin/tags/app/remove">
        <input type="hidden" name="app_id" value="" />
        <input type="hidden" name="tag_id" value="" />
      </form>

      <div class="${listGrid}">
        ${props.apps.map(app => html`
          <div class="${listCard}" 
               data-id="${app.id}" 
               data-name="${app.name}" 
               data-url="${app.base_url}" 
               data-desc="${app.description || ''}"
               data-icon="${app.icon_url || ''}"
               data-secret="${app.client_secret || ''}"
               data-redirect-uris="${app.redirect_uris || ''}"
               data-backchannel-logout-uri="${app.backchannel_logout_uri || ''}"
               data-initiate-login-uri="${app.initiate_login_uri || ''}"
               onclick="openEditAppModal(this)">
            
            <div style="flex-grow:1;">
                <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.25rem;">
                    ${app.icon_url ? html`<img src="${app.icon_url}" style="width:32px; height:32px; border-radius:6px; object-fit:contain; background:#f8fafc; border:1px solid #e2e8f0;">` : ''}
                    <div class="${itemTitle}" style="margin-bottom:0;">${app.name}</div>
                    ${app.status === 'pending'
                        ? html`<span style="color:#c2410c; background:#fff7ed; border:1px solid #fdba74; padding:2px 6px; border-radius:4px; font-size:0.75rem; font-weight:bold;">${t.status_pending}</span>`
                        : app.status === 'rejected'
                        ? html`<span style="color:#b91c1c; background:#fef2f2; border:1px solid #fecaca; padding:2px 6px; border-radius:4px; font-size:0.75rem; font-weight:bold;">${t.status_rejected}</span>`
                        : app.status === 'inactive'
                        ? html`<span style="color:#d97706; background:#fffbeb; border:1px solid #fcd34d; padding:2px 6px; border-radius:4px; font-size:0.75rem; font-weight:bold;">${t.status_inactive}</span>`
                        : html`<span style="color:#16a34a; background:#f0fdf4; border:1px solid #bbf7d0; padding:2px 6px; border-radius:4px; font-size:0.75rem; font-weight:bold;">${t.status_active}</span>`}
                    ${app.owner_group_name
                        ? html`<span style="color:#7c3aed; background:#f5f3ff; border:1px solid #ddd6fe; padding:2px 6px; border-radius:4px; font-size:0.75rem; font-weight:bold; display:inline-flex; align-items:center; gap:0.2rem;"><span class="material-symbols-outlined" style="font-size:12px;">groups</span> ${t.app_owner_group}: ${app.owner_group_name}</span>`
                        : ''}
                    ${(app.service_count || 0) > 0
                        ? html`<span style="color:#2563eb; background:#eff6ff; border:1px solid #bfdbfe; padding:2px 6px; border-radius:4px; font-size:0.75rem; font-weight:bold; display:inline-flex; align-items:center; gap:0.2rem;"><span class="material-symbols-outlined" style="font-size:12px;">link</span> ${app.service_count} ${t.app_in_services}</span>`
                        : html`<span style="color:#64748b; background:#f1f5f9; border:1px solid #e2e8f0; padding:2px 6px; border-radius:4px; font-size:0.75rem; font-weight:bold;">${t.app_in_no_service}</span>`}
                </div>
                ${app.description ? html`<div style="font-size:0.85rem; color:#64748b; margin-bottom:0.5rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:400px;">${app.description}</div>` : ''}
                <div class="${itemSub}">
                    <span style="font-family:monospace; background:#f1f5f9; padding:2px 4px; border-radius:4px; margin-right:0.5rem;">${app.id}</span>
                    <a href="${app.base_url}" target="_blank" style="text-decoration:none; color:inherit; display:inline-flex; align-items:center; gap:0.2rem;" onclick="event.stopPropagation()">
                        ${app.base_url} <span class="material-symbols-outlined" style="font-size: 14px;">open_in_new</span>
                    </a>
                </div>

                <div style="display:flex; flex-wrap:wrap; gap:0.4rem; margin-top:0.5rem; align-items:center;">
                    ${(app.tags || []).map((at: any) => html`
                        <span style="display:inline-flex; align-items:center; gap:0.2rem; background:#f1f5f9; border:1px solid #e2e8f0; padding:2px 6px; border-radius:12px; font-size:0.75rem; color:#475569;">
                            <span class="material-symbols-outlined" style="font-size:12px;">label</span>
                            ${at.tag_name}
                            ${at.app_tag_status === 'pending' ? html`<span style="color:#c2410c; margin-left:4px;">(申請中)</span>` : ''}
                            <button type="button" onclick="event.stopPropagation(); if(confirm('タグを外しますか？')) { document.getElementById('remove-app-tag-form').querySelector('input[name=app_id]').value='${app.id}'; document.getElementById('remove-app-tag-form').querySelector('input[name=tag_id]').value='${at.tag_id}'; document.getElementById('remove-app-tag-form').submit(); }" style="background:transparent; border:none; color:#94a3b8; cursor:pointer; display:flex; align-items:center; padding:0; margin-left:4px;" title="タグを外す"><span class="material-symbols-outlined" style="font-size:14px;">close</span></button>
                        </span>
                    `)}
                    ${(props.availableTags && props.availableTags.length > 0) ? html`
                        <div style="display:inline-flex; align-items:center; gap:0.2rem;">
                            <select onchange="if(this.value) { event.stopPropagation(); document.getElementById('add-app-tag-form').querySelector('input[name=app_id]').value='${app.id}'; document.getElementById('add-app-tag-form').querySelector('input[name=tag_id]').value=this.value; document.getElementById('add-app-tag-form').submit(); }" onclick="event.stopPropagation()" style="font-size:0.75rem; padding:2px 4px; border:1px dashed #cbd5e1; border-radius:12px; background:transparent; color:#64748b; outline:none; cursor:pointer;">
                                <option value="">+ タグ追加</option>
                                ${(props.availableTags || []).filter(t => !(app.tags||[]).find((at:any) => at.tag_id === t.id)).map(t => html`
                                    <option value="${t.id}">${t.name}</option>
                                `)}
                            </select>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <div style="display: flex; gap: 0.5rem; align-items: center;">
                ${app.status === 'pending'
                    ? html`
                        <button type="button" title="${t.btn_approve}" onclick="event.stopPropagation(); approveApp('${app.id}')" style="background:#16a34a; color:#fff; border:none; border-radius:8px; padding:0.4rem 0.8rem; font-size:0.85rem; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:0.3rem;">
                            <span class="material-symbols-outlined" style="font-size:18px;">check</span> ${t.btn_approve}
                        </button>
                        <button type="button" title="${t.btn_reject}" onclick="event.stopPropagation(); openRejectModal('/admin/apps/reject', '${app.id}')" style="background:#fff; color:#dc2626; border:1px solid #fecaca; border-radius:8px; padding:0.4rem 0.8rem; font-size:0.85rem; font-weight:600; cursor:pointer;">
                            ${t.btn_reject}
                        </button>`
                    : html`
                        <button type="button" class="${actionBtn}" title="${app.status === 'inactive' ? t.btn_resume : t.btn_pause}" onclick="event.stopPropagation(); toggleAppStatus('${app.id}', '${app.status === 'inactive' ? 'active' : 'inactive'}', '${app.name}')">
                            <span class="material-symbols-outlined">${app.status === 'inactive' ? 'play_arrow' : 'pause'}</span>
                        </button>`}

                <button type="button" class="${deleteBtn}" title="${t.delete}" onclick="event.stopPropagation(); deleteApp('${app.id}')">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            </div>
          </div>
        `)}
      </div>

      ${Modal({
        id: "edit-app-modal",
        title: t.header_edit_app,
        closeAction: "closeEditAppModal()",
        closeBtnId: "edit-close-btn",
        children: html`
              <form method="POST" action="/admin/apps/update" enctype="multipart/form-data">
                <div class="grid-vertical" style="display:flex; flex-direction:column; gap:1.5rem;">
                    <input type="hidden" name="id" value="" />
                    <label style="width:100%;">
                        <span class="form-label">${t.label_app_name}</span>
                        <input type="text" name="name" required />
                    </label>
                    <label style="width:100%;">
                        <span class="form-label">${t.label_base_url}</span>
                        <input type="url" name="base_url" required />
                    </label>

                    <label style="width:100%;">
                        <span class="form-label">${t.label_redirect_uris}</span>
                        <textarea name="redirect_uris" placeholder="${raw(t.ph_redirect_uris)}" style="width:100%; padding:0.8rem; border-radius:8px; border:1px solid #cbd5e1; font-family:monospace; font-size:0.85rem; min-height:70px;"></textarea>
                        <small style="display:block; color:#64748b; margin-top:0.35rem;">${t.help_redirect_uris}</small>
                    </label>

                    <label style="width:100%;">
                        <span class="form-label">${t.label_bcl_uri}</span>
                        <input type="url" name="backchannel_logout_uri" placeholder="https://app.example.com/backchannel-logout" style="width:100%; padding:0.8rem; border-radius:8px; border:1px solid #cbd5e1; font-family:monospace; font-size:0.85rem;" />
                        <small style="display:block; color:#64748b; margin-top:0.35rem;">${t.help_bcl_uri}</small>
                    </label>

                    <label style="width:100%;">
                        <span class="form-label">${t.label_initiate_login_uri}</span>
                        <input type="url" name="initiate_login_uri" placeholder="https://app.example.com/login" style="width:100%; padding:0.8rem; border-radius:8px; border:1px solid #cbd5e1; font-family:monospace; font-size:0.85rem;" />
                        <small style="display:block; color:#64748b; margin-top:0.35rem;">${t.help_initiate_login_uri}</small>
                    </label>

                    <div style="width:100%; padding:0.9rem 1rem; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px;">
                        <span class="form-label">${t.label_client_secret}</span>
                        <input type="text" id="edit-secret" readonly onclick="this.select()" style="width:100%; font-family:monospace; font-size:0.85rem; background:#fff;" />
                        <small id="edit-secret-note" style="display:block; color:#64748b; margin-top:0.35rem;"></small>
                        <div style="display:flex; gap:0.5rem; margin-top:0.6rem;">
                            <button type="button" onclick="appSecretAction('regenerate')" style="background:#fff; border:1px solid #cbd5e1; border-radius:6px; padding:0.35rem 0.7rem; font-size:0.85rem; cursor:pointer;">🔄 ${t.btn_regenerate_secret}</button>
                            <button type="button" onclick="appSecretAction('clear')" style="background:#fff; border:1px solid #cbd5e1; border-radius:6px; padding:0.35rem 0.7rem; font-size:0.85rem; cursor:pointer;">${t.btn_make_public}</button>
                        </div>
                    </div>

                    <label style="width:100%;">
                        <span class="form-label">${t.label_app_icon}</span>
                        <div style="display:flex; gap:0.5rem; align-items:center;">
                            <input type="file" name="icon_file" accept="image/*" style="font-size:0.9rem; padding: 0.4rem; height: auto;" onchange="handleIconPreview(this, 'edit-icon-preview')" />
                            <input type="hidden" name="icon_url" />
                        </div>
                        <div id="edit-icon-preview" style="margin-top:0.75rem; display:none;">
                            <p style="font-size:0.8rem; color:#64748b; margin-bottom:0.25rem;">${t.label_current_icon}</p>
                            <img src="" style="width:64px; height:64px; border-radius:12px; border:1px solid #e2e8f0; object-fit:contain; background: #fff;" />
                        </div>
                    </label>

                    <label style="width:100%;">
                        <span class="form-label">${t.label_description}</span>
                        <textarea name="description" style="width:100%; padding:0.8rem; border-radius:8px; border:1px solid #cbd5e1; font-family:inherit; min-height: 80px;"></textarea>
                    </label>

                    <div style="margin-top:1rem;">
                        ${Button({ type: "submit", children: html`<span class="material-symbols-outlined" style="margin-right:4px;">save</span> ${t.save}` })}
                    </div>
                </div>
              </form>
        `
      })}

      ${Modal({
        id: "toggle-confirm-modal",
        title: html`<span style="color:#d97706; display:flex; align-items:center; gap:0.5rem;"><span class="material-symbols-outlined">info</span> ${t.btn_change || 'Change Status'}</span>`,
        closeAction: "closeToggleModal()",
        children: html`
              <div style="margin-bottom: 2rem;">
                <p id="toggle-msg-text" style="color:#475569; font-size:1rem; line-height:1.5; white-space:pre-wrap;"></p>
              </div>
              <div style="display: flex; justify-content: flex-end; gap: 1rem;">
                  <button type="button" onclick="closeToggleModal()" style="background: transparent; color: #64748b; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer;">Cancel</button>
                  <button type="button" onclick="executeToggle()" style="background: #d97706; color: white; border: none; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                     <span class="material-symbols-outlined" style="font-size:18px;">check</span> Execute
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
                <p style="color:#475569; font-size:1rem; line-height:1.5; white-space:pre-wrap;">${t.confirm_delete_app || 'Are you sure you want to delete this app?'}</p>
              </div>
              <div style="display: flex; justify-content: flex-end; gap: 1rem;">
                  <button type="button" onclick="closeDeleteModal()" style="background: transparent; color: #64748b; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer;">Cancel</button>
                  <button type="button" onclick="executeDelete()" style="background: #ef4444; color: white; border: none; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                     <span class="material-symbols-outlined" style="font-size:18px;">delete</span> Delete
                  </button>
              </div>
        `
      })}

      ${RejectReasonModal()}

      <div id="i18n-data" style="display:none;"
        data-confirm-change-status="${t.confirm_change_status || 'Change status?'}"
        data-confirm-approve="${t.confirm_approve_app}"
        data-confirm-reject="${t.confirm_reject_app}"
      ></div>

      <script>
      window.__name = function(f) { return f; };
          ${raw(getAppsClientScript(t))}
      ${raw(RejectReasonModalScript)}
      </script>
    `
  })
}
