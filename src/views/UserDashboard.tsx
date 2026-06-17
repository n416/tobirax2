import { html, raw } from 'hono/html'
import { css } from 'hono/css'
import { dict } from '../i18n'
import { App } from '../types'
import { Layout } from './components/Layout'
import { UserTopbar } from './components/UserTopbar'
import { Modal } from './components/Modal'

interface RoleAppState {
  status: string
  admin_reason: string | null
}

interface MyMembership {
  group_id: string
  group_name: string
  is_group_admin: boolean
  is_billing_admin: boolean
  is_developer: boolean
  app_group_admin: RoleAppState | null
  app_billing_admin: RoleAppState | null
  app_developer: RoleAppState | null
}

interface Props {
  t: typeof dict.en
  userEmail: string
  apps: App[]
  siteName: string
  profileName?: string | null
  profilePicture?: string | null
  isGroupAdmin?: boolean
  myMemberships?: MyMembership[]
}

export const UserDashboard = (props: Props) => {
  const t = props.t

  const welcome = css`
    margin-bottom: 1.75rem;
    & h1 {
      font-size: 1.6rem;
      font-weight: 800;
      color: var(--text-main);
      letter-spacing: -0.02em;
      margin-bottom: 0.25rem;
    }
    & p { font-size: 0.95rem; color: var(--text-sub); }
  `

  const sectionTitle = css`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1.25rem;
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--text-main);
    & .material-symbols-outlined { color: var(--primary); }
  `

  const appGrid = css`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
    gap: 1.25rem;
  `

  const appCardLink = css`
    text-decoration: none;
    color: inherit;
    display: block;
    height: 100%;
    transition: transform 0.2s, box-shadow 0.2s;
    border-radius: 16px;
    &:hover { transform: translateY(-4px); }
  `

  const appCard = css`
    background: rgba(255, 255, 255, 0.72);
    backdrop-filter: blur(10px);
    padding: 1.4rem;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.6);
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 0 4px 16px -6px rgba(31, 38, 135, 0.18);
    transition: border-color 0.2s;
    ${appCardLink}:hover & { border-color: var(--primary); }
  `

  const appIcon = css`
    width: 44px; height: 44px;
    border-radius: 10px;
    object-fit: contain;
    background: #fff;
    padding: 3px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    flex-shrink: 0;
  `

  const appIconFallback = css`
    width: 44px; height: 44px;
    border-radius: 10px;
    flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, #eef2ff, #e0e7ff);
    color: var(--primary);
    & .material-symbols-outlined { font-size: 24px; }
  `

  const appName = css`font-size: 1.15rem; font-weight: 700; color: var(--text-main); line-height: 1.2;`
  const appDesc = css`font-size: 0.88rem; color: var(--text-sub); margin: 0.85rem 0; line-height: 1.45;`
  const appUrl = css`font-size: 0.8rem; color: var(--text-sub); opacity: 0.7; word-break: break-all;`

  const launch = css`
    display: inline-flex; align-items: center; gap: 0.3rem;
    font-size: 0.9rem; font-weight: 700; color: var(--primary);
    & .material-symbols-outlined { font-size: 18px; transition: transform 0.2s; }
    ${appCardLink}:hover & .material-symbols-outlined { transform: translateX(3px); }
  `

  const emptyState = css`
    text-align: center;
    padding: 3.5rem 2rem;
    background: rgba(255, 255, 255, 0.5);
    border: 1px dashed rgba(79, 70, 229, 0.25);
    border-radius: 16px;
    color: var(--text-sub);
    & .material-symbols-outlined { font-size: 44px; color: #c7d2fe; margin-bottom: 0.5rem; }
  `

  const displayName = props.profileName || props.userEmail

  // 1ロール分の行。保持済み/申請中/申請可能(却下なら再申請)を出し分ける。
  const roleRow = (groupId: string, roleType: string, label: string, held: boolean, app: RoleAppState | null) => {
    let right
    if (held) {
      right = html`<span style="font-size:0.78rem; font-weight:700; color:#16a34a; background:#f0fdf4; padding:3px 10px; border-radius:999px;">${t.ud_role_granted}</span>`
    } else if (app && app.status === 'pending') {
      right = html`<span style="font-size:0.78rem; font-weight:700; color:#c2410c; background:#fff7ed; padding:3px 10px; border-radius:999px;">${t.ud_role_pending}</span>`
    } else {
      const rejected = !!(app && app.status === 'rejected')
      right = html`
        ${rejected ? html`<span title="${app!.admin_reason || ''}" style="font-size:0.75rem; color:#b91c1c; margin-right:0.5rem; cursor:help;">${t.ud_role_rejected}</span>` : ''}
        <button type="button" onclick="openApplyModal('${groupId}','${roleType}','${label}')" style="font-size:0.82rem; font-weight:700; color:var(--primary); background:#eef2ff; border:1px solid #c7d2fe; border-radius:8px; padding:0.35rem 0.85rem; cursor:pointer;">${rejected ? t.ud_role_reapply : t.ud_role_apply}</button>
      `
    }
    return html`<div style="display:flex; justify-content:space-between; align-items:center; gap:0.75rem; padding:0.35rem 0;">
      <span style="font-size:0.92rem; color:var(--text-main);">${label}</span>
      <span style="display:flex; align-items:center;">${right}</span>
    </div>`
  }

  const applyScript = `
    var applyGroupId = null, applyRoleType = null;
    function openApplyModal(gid, rt, label) {
      applyGroupId = gid; applyRoleType = rt;
      var lblEl = document.getElementById('apply-role-label'); if (lblEl) lblEl.textContent = label;
      var ta = document.getElementById('apply-reason'); if (ta) ta.value = '';
      var err = document.getElementById('apply-error'); if (err) err.style.display = 'none';
      var m = document.getElementById('apply-modal'); if (m) m.showModal();
    }
    function closeApplyModal() { var m = document.getElementById('apply-modal'); if (m) m.close(); }
    function submitApply() {
      var reason = (document.getElementById('apply-reason').value || '').trim();
      var err = document.getElementById('apply-error');
      if (!reason) { if (err) { err.style.display='block'; } return; }
      fetch('/group-admin/api/roles/apply', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ group_id: applyGroupId, role_type: applyRoleType, reason: reason })
      }).then(function(r){ if(!r.ok) return r.json().catch(function(){return{};}).then(function(e){ throw new Error(e.error||('Error '+r.status)); }); return r.json(); })
        .then(function(){ window.location.reload(); })
        .catch(function(e){ if (err) { err.style.display='block'; err.textContent = e.message; } });
    }
  `

  return Layout({
    title: t.title_user_dashboard,
    siteName: props.siteName,
    lang: t.lang,
    width: 1000,
    align: 'top',
    children: html`
        ${UserTopbar({
          t, siteName: props.siteName, userEmail: props.userEmail, active: 'dashboard',
          profileName: props.profileName, profilePicture: props.profilePicture,
          isGroupAdmin: props.isGroupAdmin,
        })}

        <div class="${welcome}">
          <h1>${t.dashboard_welcome.replace('{email}', displayName)}</h1>
          <p>${props.siteName}</p>
        </div>

        <section>
          <div class="${sectionTitle}">
            <span class="material-symbols-outlined">apps</span>
            ${t.dashboard_apps_header}
          </div>

          ${props.apps.length === 0 ? html`
            <div class="${emptyState}">
              <div><span class="material-symbols-outlined">apps</span></div>
              <p>${t.no_apps_assigned}</p>
            </div>
          ` : html`
            <div class="${appGrid}">
              ${props.apps.map(app => html`
                <a href="/login?redirect_to=${app.base_url}" class="${appCardLink}">
                  <div class="${appCard}">
                    <div>
                      <div style="display:flex; align-items:center; gap:0.85rem; margin-bottom:0.5rem;">
                        ${app.icon_url
                          ? html`<img src="${app.icon_url}" class="${appIcon}" alt="" />`
                          : html`<div class="${appIconFallback}"><span class="material-symbols-outlined">widgets</span></div>`}
                        <div class="${appName}">${app.name}</div>
                      </div>
                      ${app.description ? html`<div class="${appDesc}">${app.description}</div>` : ''}
                      <div class="${appUrl}">${app.base_url}</div>
                    </div>
                    <div style="text-align:right; margin-top:1.1rem;">
                      <span class="${launch}">${t.btn_open_app} <span class="material-symbols-outlined">arrow_forward</span></span>
                    </div>
                  </div>
                </a>
              `)}
            </div>
          `}
        </section>

        ${(props.myMemberships && props.myMemberships.length > 0) ? html`
        <section style="margin-top:2.5rem;">
          <div class="${sectionTitle}">
            <span class="material-symbols-outlined">badge</span>
            ${t.ud_roles_header}
          </div>
          <p style="font-size:0.88rem; color:var(--text-sub); margin:-0.75rem 0 1.25rem;">${t.ud_roles_desc}</p>
          <div style="display:flex; flex-direction:column; gap:1rem;">
            ${props.myMemberships.map(m => html`
              <div style="background:rgba(255,255,255,0.72); backdrop-filter:blur(10px); border:1px solid rgba(255,255,255,0.6); border-radius:14px; padding:1.25rem; box-shadow:0 4px 16px -6px rgba(31,38,135,0.18);">
                <div style="font-weight:700; color:var(--text-main); margin-bottom:0.85rem; display:flex; align-items:center; gap:0.4rem;">
                  <span class="material-symbols-outlined" style="font-size:18px; color:#64748b;">corporate_fare</span>${m.group_name}
                </div>
                <div style="display:flex; flex-direction:column; gap:0.35rem;">
                  ${roleRow(m.group_id, 'group_admin', t.am_role_group_admin, m.is_group_admin, m.app_group_admin)}
                  ${roleRow(m.group_id, 'billing_admin', t.am_role_billing_admin, m.is_billing_admin, m.app_billing_admin)}
                  ${roleRow(m.group_id, 'developer', t.am_role_developer, m.is_developer, m.app_developer)}
                </div>
              </div>
            `)}
          </div>
        </section>

        ${Modal({
          id: 'apply-modal',
          title: html`${t.ud_apply_title} <span id="apply-role-label" style="color:var(--primary);"></span>`,
          closeAction: 'closeApplyModal()',
          children: html`
            <p style="font-size:0.88rem; color:var(--text-sub); line-height:1.5; margin-bottom:1rem;">${t.ud_apply_desc}</p>
            <textarea id="apply-reason" style="width:100%; min-height:100px; padding:0.75rem; border:1px solid #cbd5e1; border-radius:8px; font-size:0.95rem; color:#334155; box-sizing:border-box;" placeholder="${t.ud_apply_reason_ph}"></textarea>
            <div id="apply-error" style="color:#ef4444; font-size:0.85rem; margin-top:0.5rem; display:none;">${t.ud_apply_required}</div>
            <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1.25rem;">
              <button type="button" onclick="closeApplyModal()" style="background:transparent; color:#64748b; border:1px solid #cbd5e1; border-radius:8px; padding:0.5rem 1rem; font-weight:600; cursor:pointer;">${t.cancel}</button>
              <button type="button" onclick="submitApply()" style="background:var(--primary); color:white; border:none; border-radius:8px; padding:0.5rem 1.25rem; font-weight:700; cursor:pointer;">${t.ud_apply_submit}</button>
            </div>
          `
        })}
        <script>${raw(applyScript)}</script>
        ` : ''}
    `
  })
}
