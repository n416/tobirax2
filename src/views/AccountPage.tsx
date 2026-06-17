import { html, raw } from 'hono/html'
import { css } from 'hono/css'
import { dict } from '../i18n'
import { Layout } from './components/Layout'
import { UserTopbar } from './components/UserTopbar'
import { Modal } from './components/Modal'
import { Button } from './components/Button'

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
  siteName: string
  has2FA: boolean
  profileName?: string | null
  profileUsername?: string | null
  profilePicture?: string | null
  message?: string
  isGroupAdmin?: boolean
  myMemberships?: MyMembership[]
}

// プロフィール編集 + セキュリティ(2段階認証 / パスワード変更)の専用画面。
// ダッシュボードから分離し、カードで装飾して品質を担保する。
export const AccountPage = (props: Props) => {
  const t = props.t

  const pageHead = css`
    margin-bottom: 1.75rem;
    & h1 {
      font-size: 1.6rem; font-weight: 800; color: var(--text-main);
      letter-spacing: -0.02em; margin-bottom: 0.25rem;
    }
    & p { font-size: 0.95rem; color: var(--text-sub); }
  `

  const card = css`
    background: rgba(255, 255, 255, 0.72);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.6);
    border-radius: 18px;
    padding: 1.75rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 4px 20px -6px rgba(31, 38, 135, 0.18);
  `

  const cardHead = css`
    display: flex; align-items: center; gap: 0.6rem;
    margin-bottom: 1.4rem;
    & .material-symbols-outlined {
      color: var(--primary);
      background: #eef2ff;
      border-radius: 10px;
      padding: 6px;
      font-size: 22px;
    }
    & h2 { font-size: 1.15rem; font-weight: 700; color: var(--text-main); }
    & p { font-size: 0.85rem; color: var(--text-sub); margin-top: 0.1rem; }
  `

  const avatarRow = css`
    display: flex; align-items: center; gap: 1.1rem; margin-bottom: 1.5rem;
  `
  const bigAvatar = css`
    width: 72px; height: 72px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.9rem; font-weight: 700; color: #fff;
    background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
    box-shadow: 0 4px 12px -2px rgba(79, 70, 229, 0.45);
    overflow: hidden; flex-shrink: 0;
    & img { width: 100%; height: 100%; object-fit: cover; }
  `

  const field = css`
    display: block; margin-bottom: 1.1rem;
    & .lbl { display: block; font-size: 0.88rem; font-weight: 600; color: var(--text-main); margin-bottom: 0.4rem; }
    & input {
      width: 100%; padding: 0.7rem 0.9rem;
      border: 1px solid #cbd5e1; border-radius: 10px;
      font-size: 0.95rem; color: var(--text-main); background: #fff;
      transition: all 0.2s;
    }
    & input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(79,70,229,0.12); }
  `

  const secRow = css`
    display: flex; align-items: center; justify-content: space-between; gap: 1rem;
    padding: 1rem 0;
    & + & { border-top: 1px solid rgba(0,0,0,0.06); }
  `
  const secInfo = css`
    & .ttl { display: flex; align-items: center; gap: 0.5rem; font-weight: 600; color: var(--text-main); }
    & .ttl .material-symbols-outlined { font-size: 20px; color: var(--text-sub); }
    & .sub { font-size: 0.82rem; color: var(--text-sub); margin-top: 0.2rem; }
  `
  const badgeOn = css`color:#16a34a; background:#dcfce7; padding:2px 10px; border-radius:99px; font-size:0.8rem; font-weight:700;`
  const badgeOff = css`color:#64748b; background:#f1f5f9; padding:2px 10px; border-radius:99px; font-size:0.8rem; font-weight:700;`

  const successBanner = css`
    display: flex; align-items: center; gap: 0.5rem;
    background: var(--success-bg); color: var(--success-text);
    border: 1px solid var(--success-border); border-radius: 12px;
    padding: 0.8rem 1rem; margin-bottom: 1.5rem; font-size: 0.9rem; font-weight: 600;
    & .material-symbols-outlined { font-size: 20px; }
  `

  const initial = (props.profileName || props.userEmail || '?').trim().charAt(0).toUpperCase()

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
    title: t.account_settings,
    siteName: props.siteName,
    lang: t.lang,
    width: 1000,
    align: 'top',
    children: html`
        ${UserTopbar({
          t, siteName: props.siteName, userEmail: props.userEmail, active: 'account',
          profileName: props.profileName, profilePicture: props.profilePicture,
          isGroupAdmin: props.isGroupAdmin,
        })}

        <div class="${pageHead}">
          <h1>${t.account_settings}</h1>
          <p>${t.account_subtitle}</p>
        </div>

        ${props.message ? html`
          <div class="${successBanner}">
            <span class="material-symbols-outlined">check_circle</span>${props.message}
          </div>` : ''}

        <!-- プロフィール -->
        <section class="${card}">
          <div class="${cardHead}">
            <span class="material-symbols-outlined">badge</span>
            <div>
              <h2>${t.profile_header}</h2>
              <p>${t.profile_hint}</p>
            </div>
          </div>

          <form method="POST" action="/user/profile">
            <div class="${avatarRow}">
              <div class="${bigAvatar}">
                ${props.profilePicture ? html`<img src="${props.profilePicture}" alt="" />` : html`${initial}`}
              </div>
              <div style="font-size:0.85rem; color:var(--text-sub);">${props.userEmail}</div>
            </div>

            <label class="${field}">
              <span class="lbl">${t.label_name}</span>
              <input type="text" name="name" value="${props.profileName || ''}" placeholder="${props.userEmail}" />
            </label>
            <label class="${field}">
              <span class="lbl">${t.label_preferred_username}</span>
              <input type="text" name="preferred_username" value="${props.profileUsername || ''}" placeholder="${props.userEmail}" />
            </label>
            <label class="${field}">
              <span class="lbl">${t.label_picture}</span>
              <input type="url" name="picture" value="${props.profilePicture || ''}" placeholder="https://..." />
            </label>
            <div style="text-align:right;">
              ${Button({ type: "submit", children: html`<span class="material-symbols-outlined">save</span>${t.save}`, style: "width: auto; padding: 0.6rem 1.3rem;" })}
            </div>
          </form>
        </section>

        <!-- セキュリティ -->
        <section class="${card}">
          <div class="${cardHead}">
            <span class="material-symbols-outlined">shield</span>
            <div><h2>${t.security_header}</h2></div>
          </div>

          <div class="${secRow}">
            <div class="${secInfo}">
              <div class="ttl"><span class="material-symbols-outlined">encrypted</span>${t.label_2fa_status}
                ${props.has2FA ? html`<span class="${badgeOn}">${t.status_enabled}</span>` : html`<span class="${badgeOff}">${t.status_disabled}</span>`}
              </div>
              <div class="sub">${t.desc_2fa_account}</div>
            </div>
            <div>
              ${props.has2FA
                ? Button({ type: "button", variant: "danger", onclick: "document.getElementById('disable-2fa-modal').showModal()", children: html`<span class="material-symbols-outlined">lock_open</span>${t.btn_disable_2fa}`, style: "width: auto; padding: 0.5rem 1rem;" })
                : Button({ href: "/user/2fa/setup", children: html`<span class="material-symbols-outlined">add_moderator</span>${t.btn_setup_2fa}`, style: "width: auto; padding: 0.5rem 1rem;" })}
            </div>
          </div>

          <div class="${secRow}">
            <div class="${secInfo}">
              <div class="ttl"><span class="material-symbols-outlined">key</span>${t.header_change_password}</div>
            </div>
            <div>
              ${Button({ variant: "ghost", href: "/change-password", children: html`<span class="material-symbols-outlined">key</span>${t.btn_change_password}`, style: "width: auto; padding: 0.5rem 1rem;" })}
            </div>
          </div>
        </section>

        ${Modal({
          id: "disable-2fa-modal",
          title: html`<span style="color:#d97706; display:flex; align-items:center; gap:0.5rem;"><span class="material-symbols-outlined">warning</span> ${t.btn_disable_2fa}</span>`,
          closeAction: "this.closest('.custom-modal').close()",
          children: html`
            <form id="disable-2fa-form" method="POST" action="/user/2fa/disable" style="margin:0;">
              <div style="margin-bottom: 2rem;">
                <p style="color:#475569; font-size:1rem; line-height:1.5;">${t.confirm_disable_2fa}</p>
              </div>
              <div style="display: flex; justify-content: flex-end; gap: 1rem;">
                <button type="button" onclick="this.closest('.custom-modal').close()" style="background: transparent; color: #64748b; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer;">${t.cancel}</button>
                <button type="submit" style="background: #d97706; color: white; border: none; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                  <span class="material-symbols-outlined" style="font-size:18px;">check</span> ${t.btn_disable_2fa}
                </button>
              </div>
            </form>
          `
        })}

        <!-- 権限・ロール -->
        ${(props.myMemberships && props.myMemberships.length > 0) ? html`
        <section class="${card}">
          <div class="${cardHead}">
            <span class="material-symbols-outlined">corporate_fare</span>
            <div>
              <h2>${t.ud_roles_header}</h2>
              <p>${t.ud_roles_desc}</p>
            </div>
          </div>

          <div style="display:flex; flex-direction:column; gap:1rem;">
            ${props.myMemberships.map(m => html`
              <div style="background:var(--bg-card, #f8fafc); border:1px solid #e2e8f0; border-radius:12px; padding:1.25rem;">
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
