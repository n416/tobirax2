import { html, raw } from 'hono/html'
import { css } from 'hono/css'
import { dict } from '../../i18n'
import { Layout } from './Layout'


interface DeveloperApplication {
  id: number
  user_id: string
  group_id: string
  developer_status: 'pending' | 'approved' | 'rejected'
  developer_reason: string | null
  valid_from: number
  valid_to: number
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
    & table { width: 100%; border-collapse: separate; border-spacing: 0 0.4rem; }
    & th { font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-sub); padding: 0.4rem 0.75rem; border-bottom: none; }
    & td { background: rgba(255,255,255,0.5); padding: 0.8rem 0.75rem; font-size: 0.92rem; vertical-align: middle; border: none; }
    & td:first-child { border-radius: 10px 0 0 10px; }
    & td:last-child { border-radius: 0 10px 10px 0; }
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
    function approveRequest(user_id, group_id) {
      fetch('/admin/api/developers/approve', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id, group_id })
      }).then(res => {
        if (!res.ok) throw new Error('Error ' + res.status);
        window.location.reload();
      }).catch(err => console.error(err.message));
    }

    function rejectRequest(user_id, group_id) {
      fetch('/admin/api/developers/reject', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id, group_id })
      }).then(res => {
        if (!res.ok) throw new Error('Error ' + res.status);
        window.location.reload();
      }).catch(err => console.error(err.message));
    }
  `

  function statusBadge(st: string) {
    const map: any = {
      pending:  ['#c2410c', '#fff7ed', '申請中 (Pending)'],
      rejected: ['#b91c1c', '#fef2f2', '却下 (Rejected)'],
      approved: ['#16a34a', '#f0fdf4', '承認済 (Approved)']
    }
    const s = map[st] || map.pending
    return html`<span style="font-size:0.75rem;font-weight:700;padding:4px 10px;border-radius:999px;color:${s[0]};background:${s[1]};">${s[2]}</span>`
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
                <th>ユーザー</th>
                <th>対象グループ</th>
                <th>ステータス</th>
                <th>申請理由</th>
                <th style="width:120px;"></th>
              </tr>
            </thead>
            <tbody>
              ${applications.length === 0 ? html`
                <tr><td colspan="5" style="text-align:center; color:#94a3b8; padding:2rem;">申請はありません</td></tr>
              ` : applications.map(a => html`
                <tr>
                  <td>
                    <div style="font-weight:600;">${a.user_name || a.email}</div>
                    <div style="font-size:0.8rem; color:#64748b;">${a.email}</div>
                  </td>
                  <td>
                    <div style="font-weight:600;">${a.group_name}</div>
                    <div style="font-size:0.75rem; color:#64748b; font-family:monospace;">${a.group_id}</div>
                  </td>
                  <td>${statusBadge(a.developer_status)}</td>
                  <td>
                    <div style="font-size:0.85rem; color:#334155; max-width:300px; white-space:pre-wrap; word-wrap:break-word; background:#f8fafc; padding:0.5rem; border-radius:6px; border:1px solid #e2e8f0;">${a.developer_reason || '(理由なし)'}</div>
                  </td>
                  <td style="text-align:right;">
                    ${a.developer_status === 'pending' ? html`
                      <button type="button" title="承認" onclick="approveRequest('${a.user_id}', '${a.group_id}')" class="${actionBtn}" style="color:#16a34a !important; margin-right:0.25rem;" onmouseover="this.style.background='#f0fdf4';this.style.color='#15803d';" onmouseout="this.style.background='transparent';">
                        <span class="material-symbols-outlined">check_circle</span>
                      </button>
                      <button type="button" title="却下" onclick="rejectRequest('${a.user_id}', '${a.group_id}')" class="${actionBtn}" style="color:#ef4444 !important;" onmouseover="this.style.background='#fef2f2';this.style.color='#b91c1c';" onmouseout="this.style.background='transparent';">
                        <span class="material-symbols-outlined">cancel</span>
                      </button>
                    ` : html`
                      <span style="font-size:0.8rem; color:#94a3b8;">審査済</span>
                    `}
                  </td>
                </tr>
              `)}
            </tbody>
          </table>
        </div>
      </div>
      
      <script>${raw(scriptContent)}</script>
    `
  })
}
