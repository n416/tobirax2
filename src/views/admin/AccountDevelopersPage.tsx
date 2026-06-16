import { html, raw } from 'hono/html'
import { css } from 'hono/css'
import { dict } from '../../i18n'
import { Layout } from './Layout'
import { Modal } from '../components/Modal'


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

      <div class="${card}">
        <div class="${tableWrap}">
          <table>
            <thead>
              <tr>
                <th style="text-align:left; width:25%;">ユーザー</th>
                <th style="text-align:left; width:20%;">対象グループ</th>
                <th style="text-align:left; width:15%;">ステータス</th>
                <th style="text-align:left;">申請理由</th>
                <th style="width:100px;"></th>
              </tr>
            </thead>
            <tbody>
              ${applications.length === 0 ? html`
                <tr><td colspan="5" style="text-align:center; color:#94a3b8; padding:2rem;">申請はありません</td></tr>
              ` : applications.map(a => html`
                <tr>
                  <td style="text-align:left;">
                    <div style="font-weight:600; color:var(--text-main);">${a.user_name || a.email}</div>
                    <div style="font-size:0.8rem; color:var(--text-sub);">${a.email}</div>
                  </td>
                  <td style="text-align:left;">
                    <div style="font-weight:600; color:var(--text-main);">${a.group_name}</div>
                    <div style="font-size:0.75rem; color:var(--text-sub); font-family:monospace;">${a.group_id}</div>
                  </td>
                  <td style="text-align:left;">${statusBadge(a.status)}</td>
                  <td style="text-align:left;">
                    <div style="font-size:0.85rem; color:var(--text-sub); max-width:300px; background:rgba(0,0,0,0.02); padding:0.6rem; border-radius:6px; line-height:1.4;">
                      <div style="font-size:0.75rem; color:#64748b; font-weight:600; margin-bottom:0.2rem;">申請理由:</div>
                      <div style="white-space:pre-wrap; margin-bottom: ${a.admin_reason ? '0.6rem' : '0'};">${a.reason || '(理由なし)'}</div>
                      ${a.admin_reason ? html`
                        <div style="font-size:0.75rem; color:#64748b; font-weight:600; margin-bottom:0.2rem; border-top:1px dashed #cbd5e1; padding-top:0.6rem;">管理者事由:</div>
                        <div style="color:${a.status === 'approved' ? 'inherit' : '#b91c1c'}; white-space:pre-wrap;">${a.admin_reason}</div>
                      ` : ''}
                    </div>
                  </td>
                  <td style="text-align:right;">
                    ${a.status === 'pending' ? html`
                      <button type="button" title="承認" onclick="approveRequest('${a.user_id}', '${a.group_id}')" class="${actionBtn}" style="color:#16a34a !important; margin-right:0.25rem;" onmouseover="this.style.background='#f0fdf4';this.style.color='#15803d';" onmouseout="this.style.background='transparent';">
                        <span class="material-symbols-outlined">check_circle</span>
                      </button>
                      <button type="button" title="却下" onclick="openRejectModal('${a.user_id}', '${a.group_id}')" class="${actionBtn}" style="color:#ef4444 !important;" onmouseover="this.style.background='#fef2f2';this.style.color='#b91c1c';" onmouseout="this.style.background='transparent';">
                        <span class="material-symbols-outlined">cancel</span>
                      </button>
                    ` : html`
                      <span style="font-size:0.8rem; color:#94a3b8; margin-right:0.5rem;">審査済</span>
                      ${a.status === 'approved' ? html`
                        <button type="button" title="権限はく奪" onclick="openRevokeModal('${a.user_id}', '${a.group_id}')" class="${actionBtn}" style="color:#64748b !important;" onmouseover="this.style.background='#f1f5f9';this.style.color='#0f172a';" onmouseout="this.style.background='transparent';">
                          <span class="material-symbols-outlined">person_remove</span>
                        </button>
                      ` : ''}
                    `}
                  </td>
                </tr>
              `)}
            </tbody>
          </table>
        </div>
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
