import { html } from 'hono/html'
import { css } from 'hono/css'
import { Layout } from './Layout'
import { dict } from '../../i18n'
import { SystemConfig, RecentAuditLog } from '../../types'

interface LogsPageProps {
  t: typeof dict.en
  userEmail: string
  logs: RecentAuditLog[]
  siteName: string
  appConfig: SystemConfig
  nonce?: string
}

export const LogsPage = (props: LogsPageProps) => {
  const t = props.t

  const logRow = css`
    border-bottom: 1px solid #f1f5f9;
    transition: background-color 0.2s;
    &:hover {
      background-color: #f8fafc;
    }
  `

  return Layout({
    t: t,
    userEmail: props.userEmail,
    activeTab: 'logs',
    siteName: props.siteName,
    appConfig: props.appConfig,
    nonce: props.nonce,
    children: html`
      <div style="margin-bottom: 2rem;">
        <h2 style="font-size: 1.5rem; font-weight: 700; color: #1e293b; margin: 0 0 0.5rem 0;">Live Monitor</h2>
        <h3 style="font-size: 1rem; font-weight: 400; color: #64748b; margin: 0;">直近のシステムイベント（最大500件）をリアルタイムに監視します。過去の全ログは外部の分析基盤へ転送されています。</h3>
      </div>

      <article style="padding: 0; overflow-x: auto;">
        <table style="width: 100%; text-align: left; border-spacing: 0;">
          <thead>
            <tr>
              <th style="padding: 1rem; border-bottom: 2px solid #e2e8f0; color: #475569; font-weight: 600;">Time</th>
              <th style="padding: 1rem; border-bottom: 2px solid #e2e8f0; color: #475569; font-weight: 600;">Event Type</th>
              <th style="padding: 1rem; border-bottom: 2px solid #e2e8f0; color: #475569; font-weight: 600;">User / App</th>
              <th style="padding: 1rem; border-bottom: 2px solid #e2e8f0; color: #475569; font-weight: 600;">IP / UA</th>
              <th style="padding: 1rem; border-bottom: 2px solid #e2e8f0; color: #475569; font-weight: 600;">Details</th>
            </tr>
          </thead>
          <tbody>
            ${props.logs.length === 0 ? html`<tr><td colspan="5" style="padding: 2rem; text-align: center; color: #64748b;">No recent events found.</td></tr>` : ''}
            ${props.logs.map((log) => html`
              <tr class="${logRow}">
                <td style="padding: 1rem; font-size: 0.85rem; color: #64748b; white-space: nowrap;">
                  ${new Date(log.created_at * 1000).toLocaleString()}
                </td>
                <td style="padding: 1rem;">
                  <span style="display: inline-block; padding: 0.25rem 0.5rem; background: #e0e7ff; color: #4338ca; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; white-space: nowrap;">
                    ${log.event_type}
                  </span>
                </td>
                <td style="padding: 1rem; font-size: 0.85rem; color: #334155;">
                  <div>${log.user_id ? 'U: ' + log.user_id : ''}</div>
                  <div style="color: #64748b;">${log.app_id ? 'A: ' + log.app_id : ''}</div>
                </td>
                <td style="padding: 1rem; font-size: 0.85rem; color: #64748b;">
                  <div>${log.ip_address || '-'}</div>
                  <div style="font-size: 0.7rem; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${log.user_agent || ''}">${log.user_agent || '-'}</div>
                </td>
                <td style="padding: 1rem; font-size: 0.85rem; color: #475569; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${log.details}">
                  ${log.details}
                </td>
              </tr>
            `)}
          </tbody>
        </table>
      </article>
    `
  })
}
