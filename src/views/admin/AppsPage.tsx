import { html, raw } from 'hono/html'
import { css } from 'hono/css'
import { Layout } from './Layout'
import { dict } from '../../i18n'
import { App, SystemConfig } from '../../types'
import { Modal } from '../components/Modal'
import { Button } from '../components/Button'

interface RegToken {
  token: string
  created_at: number
  expires_at: number | null
}

interface Props {
  t: typeof dict.en
  userEmail: string
  apps: App[]
  services?: { id: string; name: string }[]
  regTokens?: RegToken[]
  siteName: string
  appConfig: SystemConfig
}

export const AppsPage = (props: Props) => {
  const t = props.t
  const scriptContent = raw(`
        (function() {
            // 画像プレビュー機能
            window.handleIconPreview = function(input, previewId) {
                if (input.files && input.files[0]) {
                    var reader = new FileReader();
                    reader.onload = function(e) {
                        var div = document.getElementById(previewId);
                        var img = div ? div.querySelector('img') : null;
                        if(img) {
                            img.src = e.target.result;
                            div.style.display = 'block';
                        }
                    };
                    reader.readAsDataURL(input.files[0]);
                }
            };
    
            var editModal = document.getElementById('edit-app-modal');
            
            // 編集モーダルを開く関数
            window.openEditAppModal = function(btn) {
                if(!editModal) return;
                var form = editModal.querySelector('form');
                
                // 基本データ
                form.querySelector('input[name="id"]').value = btn.dataset.id;
                form.querySelector('input[name="name"]').value = btn.dataset.name;
                form.querySelector('input[name="base_url"]').value = btn.dataset.url;
                
                // 説明文
                var descEl = form.querySelector('textarea[name="description"]');
                if(descEl) descEl.value = btn.dataset.desc || '';

                // Redirect URIs (OIDC)
                var ruEl = form.querySelector('textarea[name="redirect_uris"]');
                if(ruEl) ruEl.value = btn.dataset.redirectUris || '';

                // Back-Channel Logout URI (OIDC)
                var bclEl = form.querySelector('input[name="backchannel_logout_uri"]');
                if(bclEl) bclEl.value = btn.dataset.backchannelLogoutUri || '';

                // 紐付けサービス (service_id)
                var svcEl = form.querySelector('select[name="service_id"]');
                if(svcEl) svcEl.value = btn.dataset.serviceId || '';

                // アイコン関連
                var iconEl = form.querySelector('input[name="icon_url"]');
                var iconUrl = btn.dataset.icon || '';
                if(iconEl) iconEl.value = iconUrl;
                
                // プレビュー表示制御
                var previewDiv = document.getElementById('edit-icon-preview');
                var previewImg = previewDiv ? previewDiv.querySelector('img') : null;
                if(previewDiv && previewImg) {
                    if(iconUrl && iconUrl !== 'null' && iconUrl !== 'undefined') {
                        previewImg.src = iconUrl;
                        previewDiv.style.display = 'block';
                    } else {
                        previewImg.src = '';
                        previewDiv.style.display = 'none';
                    }
                }
                
                // ファイル入力はリセット
                var fileInput = form.querySelector('input[name="icon_file"]');
                if(fileInput) fileInput.value = '';

                // Client Secret (OIDC)
                var secEl = document.getElementById('edit-secret');
                var noteEl = document.getElementById('edit-secret-note');
                var sec = btn.dataset.secret || '';
                if(secEl) secEl.value = sec || '${t.secret_public_placeholder}';
                if(noteEl) noteEl.innerText = sec
                    ? '${t.note_confidential}'
                    : '${t.note_public}';

                editModal.showModal();
                setTimeout(function() {
            // 画像プレビュー機能
            window.handleIconPreview = function(input, previewId) {
                if (input.files && input.files[0]) {
                    var reader = new FileReader();
                    reader.onload = function(e) {
                        var div = document.getElementById(previewId);
                        var img = div ? div.querySelector('img') : null;
                        if(img) {
                            img.src = e.target.result;
                            div.style.display = 'block';
                        }
                    };
                    reader.readAsDataURL(input.files[0]);
                }
            };
    
                    var closeBtn = document.getElementById('edit-close-btn');
                    if(closeBtn) closeBtn.focus();
                }, 50);
            };
            
            window.closeEditAppModal = function() {
                if(editModal) editModal.close();
            };
            // Toggle App Status
            var toggleTargetId = null;
            var toggleTargetStatus = null;
            window.toggleAppStatus = function(id, nextStatus, name) {
                toggleTargetId = id;
                toggleTargetStatus = nextStatus;
                var tm = document.getElementById('toggle-confirm-modal');
                if(tm) {
                    var msgEl = document.getElementById('toggle-msg-text');
                    var tmpl = i18n.confirmChangeStatus || 'Change status?';
                    if(msgEl) msgEl.innerText = tmpl.replace('{name}', name);
                    tm.showModal();
                }
            };
            window.closeToggleModal = function() {
                var tm = document.getElementById('toggle-confirm-modal');
                if(tm) tm.close();
                toggleTargetId = null;
                toggleTargetStatus = null;
            };
            window.executeToggle = function() {
                if(!toggleTargetId) return;
                var form = document.getElementById('toggle-app-form');
                if(form) {
                    form.querySelector('input[name="id"]').value = toggleTargetId;
                    form.querySelector('input[name="status"]').value = toggleTargetStatus;
                    form.submit();
                }
            };

            // Delete App
            var deleteTargetId = null;
            window.deleteApp = function(id) {
                deleteTargetId = id;
                var dm = document.getElementById('delete-confirm-modal');
                if(dm) dm.showModal();
            };
            window.closeDeleteModal = function() {
                var dm = document.getElementById('delete-confirm-modal');
                if(dm) dm.close();
                deleteTargetId = null;
            };
            window.executeDelete = function() {
                if(!deleteTargetId) return;
                var form = document.getElementById('delete-app-form');
                if(form) {
                    form.querySelector('input[name="id"]').value = deleteTargetId;
                    form.submit();
                }
            };

            // Client secret: regenerate / clear (make public)
            window.appSecretAction = function(action) {
                if(!editModal) return;
                var id = editModal.querySelector('input[name="id"]').value;
                if(!id) return;
                if(action === 'clear' && !confirm('${t.confirm_make_public}')) return;
                var f = document.getElementById('secret-app-form');
                if(f) {
                    f.querySelector('input[name="id"]').value = id;
                    f.querySelector('input[name="action"]').value = action;
                    f.submit();
                }
            };
        })();
  `);

  const listGrid = css`display: flex; flex-direction: column; gap: 1rem;`
  
  const listCard = css`
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.2rem 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: all 0.2s ease;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    cursor: pointer;
    &:hover {
        outline: 1px solid var(--primary);
    }
  `

  const itemTitle = css`font-weight: 600; font-size: 1rem; color: #1e293b; margin-bottom: 0.2rem;`
  const itemSub = css`font-size: 0.85rem; color: #64748b; display: flex; align-items: center; gap: 0.4rem;`
  
  const actionBtn = css`
    background: transparent !important; 
    border: none !important; 
    color: #94a3b8 !important; 
    cursor: pointer !important; 
    padding: 8px !important; 
    border-radius: 50% !important; 
    transition: all 0.2s !important;
    box-shadow: none !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 36px !important;
    height: 36px !important;
    flex-shrink: 0 !important;
    &:hover { background: #f1f5f9 !important; color: var(--text-main) !important; }
  `
  const deleteBtn = css`${actionBtn} &:hover { background: #fef2f2 !important; color: #ef4444 !important; }`

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

      <details style="margin-bottom:2rem; border:1px solid #e2e8f0; border-radius:12px; padding:1rem 1.25rem; background:#f8fafc;">
        <summary style="cursor:pointer; font-weight:600; color:#334155;">動的登録トークン (RFC 7591 Initial Access Token)</summary>
        <p style="font-size:0.85rem; color:#64748b; margin:0.75rem 0;">
          ここで発行した Bearer トークンを <code>Authorization: Bearer …</code> に付けて
          <code>POST /register</code> を呼ぶと、アプリ(クライアント)を動的に登録できます。
          トークンを持たない・期限切れの呼び出しは拒否されます。
        </p>
        <form method="POST" action="/admin/registration-tokens" style="display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap; margin-bottom:1rem;">
          <label style="font-size:0.85rem; color:#475569;">有効日数
            <input type="number" name="days" min="0" placeholder="0=無期限" style="width:120px; padding:0.5rem; border-radius:8px; border:1px solid #cbd5e1; margin-left:0.4rem;" />
          </label>
          <button type="submit" class="btn" style="width:auto; padding:0.55rem 1rem; margin:0;">トークンを発行</button>
        </form>
        ${(props.regTokens && props.regTokens.length)
          ? html`<div style="display:flex; flex-direction:column; gap:0.5rem;">
              ${props.regTokens.map(rt => html`
                <div style="display:flex; align-items:center; gap:0.5rem; background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:0.5rem 0.75rem;">
                  <code style="flex:1; font-size:0.78rem; word-break:break-all; color:#0f172a;">${rt.token}</code>
                  <span style="font-size:0.75rem; color:#94a3b8; white-space:nowrap;">${rt.expires_at ? '期限 ' + new Date(rt.expires_at * 1000).toISOString().slice(0, 10) : '無期限'}</span>
                  <form method="POST" action="/admin/registration-tokens/delete" style="margin:0;" onsubmit="return confirm('このトークンを失効しますか？');">
                    <input type="hidden" name="token" value="${rt.token}" />
                    <button type="submit" title="失効" style="background:transparent; border:none; color:#ef4444; cursor:pointer; font-size:0.8rem;">失効</button>
                  </form>
                </div>`)}
            </div>`
          : html`<p style="font-size:0.85rem; color:#94a3b8; margin:0;">まだトークンはありません。</p>`}
      </details>

      ${Modal({
        id: "new-app-modal",
        title: t.header_new_app,
        closeAction: "this.closest('dialog').close()",
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
                      <span class="form-label">紐付けサービス</span>
                      <select name="service_id" style="width:100%; padding:0.8rem; border-radius:8px; border:1px solid #cbd5e1; font-size:1rem; background-color:#fff;">
                        <option value="">-- 紐付けなし (エンタイトルメント対象外) --</option>
                        ${(props.services || []).map(s => html`<option value="${s.id}">${s.name}</option>`)}
                      </select>
                      <small style="display:block; color:#64748b; margin-top:0.35rem;">アプリが要求する権限（ライセンス）の提供元となるサービスを選びます。</small>
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
               data-service-id="${app.service_id || ''}"
               onclick="openEditAppModal(this)">
            
            <div style="flex-grow:1;">
                <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.25rem;">
                    ${app.icon_url ? html`<img src="${app.icon_url}" style="width:32px; height:32px; border-radius:6px; object-fit:contain; background:#f8fafc; border:1px solid #e2e8f0;">` : ''}
                    <div class="${itemTitle}" style="margin-bottom:0;">${app.name}</div>
                    ${app.status === 'inactive'
                        ? html`<span style="color:#d97706; background:#fffbeb; border:1px solid #fcd34d; padding:2px 6px; border-radius:4px; font-size:0.75rem; font-weight:bold;">${t.status_inactive}</span>`
                        : html`<span style="color:#16a34a; background:#f0fdf4; border:1px solid #bbf7d0; padding:2px 6px; border-radius:4px; font-size:0.75rem; font-weight:bold;">${t.status_active}</span>`}
                    ${app.service_name 
                        ? html`<span style="color:#2563eb; background:#eff6ff; border:1px solid #bfdbfe; padding:2px 6px; border-radius:4px; font-size:0.75rem; font-weight:bold; display:inline-flex; align-items:center; gap:0.2rem;"><span class="material-symbols-outlined" style="font-size:12px;">link</span> ${app.service_name}</span>` 
                        : html`<span style="color:#64748b; background:#f1f5f9; border:1px solid #e2e8f0; padding:2px 6px; border-radius:4px; font-size:0.75rem; font-weight:bold;">紐付けなし</span>`}
                </div>
                ${app.description ? html`<div style="font-size:0.85rem; color:#64748b; margin-bottom:0.5rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:400px;">${app.description}</div>` : ''}
                <div class="${itemSub}">
                    <span style="font-family:monospace; background:#f1f5f9; padding:2px 4px; border-radius:4px; margin-right:0.5rem;">${app.id}</span>
                    <a href="${app.base_url}" target="_blank" style="text-decoration:none; color:inherit; display:inline-flex; align-items:center; gap:0.2rem;" onclick="event.stopPropagation()">
                        ${app.base_url} <span class="material-symbols-outlined" style="font-size: 14px;">open_in_new</span>
                    </a>
                </div>
            </div>
            
            <div style="display: flex; gap: 0.5rem; align-items: center;">
                <button type="button" class="${actionBtn}" title="${app.status === 'inactive' ? t.btn_resume : t.btn_pause}" onclick="event.stopPropagation(); toggleAppStatus('${app.id}', '${app.status === 'inactive' ? 'active' : 'inactive'}', '${app.name}')">
                    <span class="material-symbols-outlined">${app.status === 'inactive' ? 'play_arrow' : 'pause'}</span>
                </button>
                
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
                      <span class="form-label">紐付けサービス</span>
                      <select name="service_id" style="width:100%; padding:0.8rem; border-radius:8px; border:1px solid #cbd5e1; font-size:1rem; background-color:#fff;">
                        <option value="">-- 紐付けなし (エンタイトルメント対象外) --</option>
                        ${(props.services || []).map(s => html`<option value="${s.id}">${s.name}</option>`)}
                      </select>
                      <small style="display:block; color:#64748b; margin-top:0.35rem;">アプリが要求する権限（ライセンス）の提供元となるサービスを選びます。</small>
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

      <div id="i18n-data" style="display:none;"
        data-confirm-change-status="${t.confirm_change_status || 'Change status?'}"
      ></div>

      <script>
      ${scriptContent}
      </script>
    `
  })
}
