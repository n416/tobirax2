import { html } from 'hono/html'
import { css } from 'hono/css'
import { dict } from '../i18n'
import { App } from '../types'
import { Layout } from './components/Layout'
import { UserTopbar } from './components/UserTopbar'

interface Props {
  t: typeof dict.en
  userEmail: string
  apps: App[]
  siteName: string
  profileName?: string | null
  profilePicture?: string | null
  isGroupAdmin?: boolean
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

  return Layout({
    title: t.title_user_dashboard,
    siteName: props.siteName,
    lang: t.lang,
    width: 960,
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
    `
  })
}
