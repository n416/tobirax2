import { html } from 'hono/html'
import { Layout } from './Layout'
import { dict } from '../../i18n'
import { SystemConfig } from '../../types'
import { amListGrid, amListCard } from './amShared'
import { Button } from '../components/Button'

interface Props {
  t: typeof dict.en
  userEmail: string
  stats: { apps: number, users: number }
  siteName: string
  appConfig: SystemConfig
}

export const AdminHome = (props: Props) => {
  const t = props.t
  return Layout({
    t: t,
    userEmail: props.userEmail,
    activeTab: 'home',
    siteName: props.siteName,
    appConfig: props.appConfig,
    children: html`
      <div style="margin-bottom: 2rem;">
        <h2 style="font-size: 1.5rem; font-weight: 700; color: #1e293b; margin: 0 0 0.5rem 0;">${t.title_dashboard}</h2>
        <h3 style="font-size: 1rem; font-weight: 400; color: #64748b; margin: 0;">${t.welcome}</h3>
      </div>

      <div class="${amListGrid}">
        <div class="${amListCard}" style="display:flex; flex-direction:column; align-items:center; padding: 2rem;">
            <div style="font-weight:700; color:#334155; margin-bottom:1rem;">${t.stat_apps}</div>
            <div style="font-size: 3rem; font-weight: 800; color: #0288d1; margin-bottom: 1.5rem; line-height:1;">
                ${props.stats.apps}
            </div>
            <div style="width:100%;">
                ${Button({ variant: 'outline', onclick: "window.location.href='/admin/apps'", children: t.nav_apps })}
            </div>
        </div>
        
        <div class="${amListCard}" style="display:flex; flex-direction:column; align-items:center; padding: 2rem;">
            <div style="font-weight:700; color:#334155; margin-bottom:1rem;">${t.stat_users}</div>
            <div style="font-size: 3rem; font-weight: 800; color: #43a047; margin-bottom: 1.5rem; line-height:1;">
                ${props.stats.users}
            </div>
            <div style="width:100%;">
                ${Button({ variant: 'outline', onclick: "window.location.href='/admin/users'", children: t.nav_users })}
            </div>
        </div>
      </div>
    `
  })
}
