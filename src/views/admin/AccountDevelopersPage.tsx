import { html, raw } from 'hono/html'
import { css } from 'hono/css'
import { dict } from '../../i18n'
import { Layout } from './Layout'
import { Modal } from '../components/Modal'
import { amListGrid, amListCard, amItemTitle, amItemSub, amEmpty, amApproveBtn, amRejectBtn } from './amShared'


interface DeveloperApplication {
  user_id: string
  group_id: string
  status: 'pending' | 'approved' | 'rejected' | 'revoked'
  reason: string | null
  admin_reason: string | null
  applied_at: number
  processed_at: number | null
  user_name: string | null
  email: string
  group_name: string
}

interface Props {
  t: typeof dict.en
  userEmail: string
  applications: DeveloperApplication[]
  siteName: string
  appConfig: any
}

export const AccountDevelopersPage = (props: Props) => {
  const { t, applications } = props

  const tableWrap = css`
    overflow-x: auto;
    & table { width: 100%; border-collapse: collapse; }
    & th { font-size: 0.85rem; font-weight: 600; color: var(--text-sub); padding: 0.75rem 1rem; border-bottom: 1px solid rgba(0,0,0,0.1); text-align: left; }
    & td { padding: 1rem; font-size: 0.92rem; vertical-align: middle; border-bottom: 1px solid rgba(0,0,0,0.05); }
    & tr:last-child td { border-bottom: none; }
  `

  const card = css`
    background: rgba(255,255,255,0.72);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.6);
    border-radius: 16px;
    box-shadow: 0 4px 16px -6px rgba(31,38,135,0.18);
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  `

  const actionBtn = css`
    background: transparent !important; border: none !important; color: #94a3b8 !important; cursor: pointer !important;
    padding: 7px !important; border-radius: 50% !important; transition: all 0.2s !important; box-shadow: none !important;
    display: inline-flex !important; align-items: center !important; justify-content: center !important;
    width: 34px !important; height: 34px !important; flex-shrink: 0 !important;
  `

  const scriptContent = `
    var targetUserId = null;
    var targetGroupId = null;

    function approveRequest(user_id, group_id) {
      fetch('/admin/api/developers/approve', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id, group_id })
      }).then(res => {
        if (!res.ok) throw new Error('Error ' + res.status);
        window.location.reload();
      }).catch(err => console.error(err.message));
    }

    function openRejectModal(uid, gid) {
      targetUserId = uid; targetGroupId = gid;
      document.getElementById('reject-reason').value = '';
      document.getElementById('reject-error').style.display = 'none';
      document.getElementById('reject-modal').showModal();
    }
    function closeRejectModal() { document.getElementById('reject-modal').close(); }
    function executeReject() {
      var reason = document.getElementById('reject-reason').value.trim();
      if (!reason) { document.getElementById('reject-error').style.display = 'block'; return; }
      fetch('/admin/api/developers/reject', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: targetUserId, group_id: targetGroupId, admin_reason: reason })
      }).then(res => {
        if (!res.ok) throw new Error('Error ' + res.status);
        window.location.reload();
      }).catch(err => console.error(err.message));
    }

    function openRevokeModal(uid, gid) {
      targetUserId = uid; targetGroupId = gid;
      document.getElementById('revoke-reason').value = '';
      document.getElementById('revoke-error').style.display = 'none';
      document.getElementById('revoke-modal').showModal();
    }
    function closeRevokeModal() { document.getElementById('revoke-modal').close(); }
    function executeRevoke() {
      var reason = document.getElementById('revoke-reason').value.trim();
      if (!reason) { document.getElementById('revoke-error').style.display = 'block'; return; }
      fetch('/admin/api/developers/revoke', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: targetUserId, group_id: targetGroupId, admin_reason: reason })
      }).then(res => {
        if (!res.ok) throw new Error('Error ' + res.status);
        window.location.reload();
      }).catch(err => console.error(err.message));
    }
  `

  function statusBadge(st: string) {
    const map: any = {
      pending:  ['#c2410c', '#fff7ed', '申請中'],
      rejected: ['#b91c1c', '#fef2f2', '却下'],
      approved: ['#16a34a', '#f0fdf4', '承認済'],
      revoked:  ['#475569', '#f1f5f9', 'はく奪済']
    }
    const s = map[st] || map.pending
    return html`<span style="white-space:nowrap;display:inline-block;font-size:0.75rem;font-weight:700;padding:4px 10px;border-radius:999px;color:${s[0]};background:${s[1]};">${s[2]}</span>`
  }

  return Layout({
    t: t,
    userEmail: props.userEmail,
    activeTab: 'developers',
    siteName: props.siteName,
    appConfig: props.appConfig,
    children: html`

      <div style="margin-bottom:1.75rem;">
        <h1 style="font-size:1.5rem; font-weight:800; color:var(--text-main); letter-spacing:-0.02em; margin-bottom:0.25rem;">
          <span class="material-symbols-outlined" style="color:var(--primary); vertical-align:middle; margin-right:0.4rem;">code</span>開発者申請の管理
        </h1>
        <p style="font-size:0.95rem; color:var(--text-sub);">各グループの開発者権限の申請を審査します。</p>
      </div>

      <div class="${amListGrid}">
        ${applications.length === 0 ? amEmpty('申請はありません') : ''}
        ${applications.map(a => html`
          <div class="${amListCard}" style="flex-direction:column; align-items:stretch; gap:1.25rem;">
            <!-- Header (User, Badges, Buttons) -->
            <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1rem;">
              <div style="display:flex; align-items:center; gap:1rem;">
                <div style="width:40px; height:40px; border-radius:50%; background:#f1f5f9; color:#64748b; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                  <span class="material-symbols-outlined">person</span>
                </div>
                <div>
                  <div class="${amItemTitle}" style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.2rem;">
                    ${a.user_name || a.email}
                    ${statusBadge(a.status)}
                  </div>
                  <div class="${amItemSub}" style="display:flex; align-items:center; gap:0.25rem;">
                    <span class="material-symbols-outlined" style="font-size:16px;">mail</span>${a.email}
                  </div>
                </div>
              </div>

              <!-- Buttons -->
              <div style="display:flex; gap:0.5rem; flex-wrap:nowrap; justify-content:flex-end;">
                ${a.status === 'pending' ? html`
                  ${amRejectBtn('却下', `openRejectModal('${a.user_id}', '${a.group_id}')`)}
                  ${amApproveBtn('承認', `approveRequest('${a.user_id}', '${a.group_id}')`)}
                ` : html`
                  ${a.status === 'approved' ? html`
                    <button type="button" title="権限はく奪" onclick="openRevokeModal('${a.user_id}', '${a.group_id}')" style="background:#fff; color:#64748b; border:1px solid #e2e8f0; border-radius:8px; padding:0.4rem 0.8rem; font-size:0.85rem; font-weight:600; cursor:pointer; transition:all 0.2s; box-shadow:0 1px 2px rgba(0,0,0,0.02); display:inline-flex; align-items:center; gap:0.4rem; white-space:nowrap;" onmouseover="this.style.background='#f1f5f9'; this.style.color='#0f172a';" onmouseout="this.style.background='#fff'; this.style.color='#64748b';">
                      <span class="material-symbols-outlined" style="font-size:18px;">person_remove</span> 権限はく奪
                    </button>
                  ` : ''}
                `}
              </div>
            </div>

            <!-- Divider -->
            <div style="height:1px; background:#e2e8f0; width:100%;"></div>

            <!-- Group & Reason -->
            <div style="display:flex; flex-wrap:wrap; gap:1.5rem;">
              <!-- Group -->
              <div style="flex:1; min-width:200px;">
                <div style="font-size:0.75rem; color:#94a3b8; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:0.4rem;">対象グループ</div>
                <div class="${amItemTitle}" style="font-size:0.95rem; margin-bottom:0.2rem; display:flex; align-items:center; gap:0.25rem;">
                  <span class="material-symbols-outlined" style="font-size:18px; color:#64748b;">corporate_fare</span> ${a.group_name}
                </div>
                <div class="${amItemSub}" style="font-family:monospace; padding-left:1.5rem;">${a.group_id}</div>
              </div>

              <!-- Reason -->
              <div style="flex:2; min-width:250px; background:#f8fafc; border:1px solid #e2e8f0; padding:1rem; border-radius:8px;">
                <div style="font-size:0.75rem; color:#64748b; font-weight:700; margin-bottom:0.5rem; display:flex; align-items:center; gap:0.25rem;">
                  <span class="material-symbols-outlined" style="font-size:16px;">chat</span>申請理由
                </div>
                <div style="font-size:0.9rem; color:#334155; line-height:1.6; white-space:pre-wrap; word-break:break-word;">${a.reason || html`<span style="color:#94a3b8;font-style:italic;">(理由なし)</span>`}</div>
                
                ${a.admin_reason ? html`
                  <div style="font-size:0.75rem; color:#64748b; font-weight:700; margin-top:1rem; padding-top:1rem; border-top:1px dashed #cbd5e1; margin-bottom:0.5rem; display:flex; align-items:center; gap:0.25rem;">
                    <span class="material-symbols-outlined" style="font-size:16px;">admin_panel_settings</span>管理者事由
                  </div>
                  <div style="font-size:0.9rem; color:${a.status === 'approved' ? '#334155' : '#b91c1c'}; white-space:pre-wrap; word-break:break-word; font-weight:${a.status === 'rejected' ? '600' : 'normal'}; line-height:1.6;">${a.admin_reason}</div>
                ` : ''}
              </div>
            </div>
          </div>
        `)}
      </div>
      
      ${Modal({
        id: "reject-modal",
        title: html`<span style="color:#ef4444; display:flex; align-items:center; gap:0.5rem;"><span class="material-symbols-outlined">cancel</span> 却下事由の入力</span>`,
        closeAction: "closeRejectModal()",
        children: html`
          <div style="margin-bottom: 1.5rem;">
            <p style="color:#475569; font-size:0.95rem; line-height:1.5; margin-bottom:1rem;">却下事由を入力してください。この事由はグループ管理者に表示されます。</p>
            <textarea id="reject-reason" style="width:100%; min-height:100px; padding:0.75rem; border:1px solid #cbd5e1; border-radius:8px; font-size:0.95rem; color:#334155; box-sizing:border-box;" placeholder="却下事由を入力"></textarea>
            <div id="reject-error" style="color:#ef4444; font-size:0.85rem; margin-top:0.5rem; display:none;">事由は必須です。</div>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 1rem;">
            <button type="button" onclick="closeRejectModal()" style="background: transparent; color: #64748b; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer;">キャンセル</button>
            <button type="button" onclick="executeReject()" style="background: #ef4444; color: white; border: none; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer;">却下する</button>
          </div>
        `
      })}

      ${Modal({
        id: "revoke-modal",
        title: html`<span style="color:#f59e0b; display:flex; align-items:center; gap:0.5rem;"><span class="material-symbols-outlined">person_remove</span> 権限はく奪事由の入力</span>`,
        closeAction: "closeRevokeModal()",
        children: html`
          <div style="margin-bottom: 1.5rem;">
            <p style="color:#475569; font-size:0.95rem; line-height:1.5; margin-bottom:1rem;">権限はく奪事由を入力してください。この事由はグループ管理者に表示されます。</p>
            <textarea id="revoke-reason" style="width:100%; min-height:100px; padding:0.75rem; border:1px solid #cbd5e1; border-radius:8px; font-size:0.95rem; color:#334155; box-sizing:border-box;" placeholder="はく奪事由を入力"></textarea>
            <div id="revoke-error" style="color:#ef4444; font-size:0.85rem; margin-top:0.5rem; display:none;">事由は必須です。</div>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 1rem;">
            <button type="button" onclick="closeRevokeModal()" style="background: transparent; color: #64748b; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer;">キャンセル</button>
            <button type="button" onclick="executeRevoke()" style="background: #f59e0b; color: white; border: none; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer;">権限をはく奪する</button>
          </div>
        `
      })}

      <script>${raw(scriptContent)}</script>
    `
  })
}
