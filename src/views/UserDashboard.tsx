import { html, raw } from 'hono/html'
import { css } from 'hono/css'
import { dict } from '../i18n'
import { App } from '../types'
import { Layout } from './components/Layout'
import { UserTopbar } from './components/UserTopbar'
import { Modal } from './components/Modal'


interface Props {
  t: typeof dict.en
  userEmail: string
  apps: App[]
  services?: { id: string, name: string, apps: App[], tags?: { id: string, name: string }[] }[]
  availableServiceTags?: { id: string, name: string }[]
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

  const serviceCard = css`
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.6);
    box-shadow: 0 4px 16px -6px rgba(31, 38, 135, 0.18);
    margin-bottom: 1.5rem;
    overflow: hidden;
  `

  const serviceSummary = css`
    padding: 1.25rem 1.5rem;
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--text-main);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0.1));
    transition: background 0.2s;
    list-style: none;
    &::-webkit-details-marker { display: none; }
    &:hover { background: rgba(79, 70, 229, 0.05); }
    & .material-symbols-outlined {
      color: var(--primary);
      transition: transform 0.3s ease;
    }
    details[open] & .material-symbols-outlined.expand-icon {
      transform: rotate(180deg);
    }
  `

  const serviceContent = css`
    padding: 1.5rem;
    border-top: 1px solid rgba(0,0,0,0.05);
    background: rgba(249, 250, 251, 0.5);
  `

  const displayName = props.profileName || props.userEmail

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

        <section style="margin-bottom: 3rem;">
          <div class="${sectionTitle}">
            <span class="material-symbols-outlined">domain</span>
            利用可能なサービス
          </div>

          ${props.availableServiceTags && props.availableServiceTags.length > 0 ? html`
            <div style="margin-bottom: 1.5rem; display: flex; gap: 0.5rem; flex-wrap: wrap;" id="tag-filters">
              <span style="font-size: 0.85rem; color: var(--text-sub); display: flex; align-items: center; margin-right: 0.5rem;">
                <span class="material-symbols-outlined" style="font-size: 16px; margin-right: 4px;">filter_alt</span>フィルタ:
              </span>
              ${props.availableServiceTags.map(tag => html`
                <button type="button" class="tag-filter-btn" data-tag-id="${tag.id}" style="
                  background: rgba(255,255,255,0.7);
                  border: 1px solid #cbd5e1;
                  color: #475569;
                  padding: 4px 12px;
                  border-radius: 999px;
                  font-size: 0.85rem;
                  cursor: pointer;
                  transition: all 0.2s;
                ">
                  ${tag.name}
                </button>
              `)}
            </div>
            <style>
              .tag-filter-btn.active {
                background: #eef2ff !important;
                border-color: #818cf8 !important;
                color: #4338ca !important;
                font-weight: 600;
              }
            </style>
          ` : ''}

          ${(!props.services || props.services.length === 0) ? html`
            <div class="${emptyState}">
              <div><span class="material-symbols-outlined">domain_disabled</span></div>
              <p>割り当てられているサービスはありません</p>
            </div>
          ` : html`
            <div>
              ${props.services.map(svc => html`
                <details class="${serviceCard} service-card-item" open data-tag-ids="${svc.tags ? svc.tags.map(t => t.id).join(',') : ''}">
                  <summary class="${serviceSummary}">
                    <span class="material-symbols-outlined">business_center</span>
                    ${svc.name}
                    <div style="flex: 1;"></div>
                    <span class="material-symbols-outlined expand-icon">expand_more</span>
                  </summary>
                  <div class="${serviceContent}">
                    ${svc.apps.length === 0 ? html`
                      <p style="color: var(--text-sub); font-size: 0.9rem;">このサービスにはアプリが紐づいていません</p>
                    ` : html`
                      <div class="${appGrid}">
                        ${svc.apps.map((app: any) => html`
                          <a href="${app.initiate_login_uri || app.base_url}" class="${appCardLink}">
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
                  </div>
                </details>
              `)}
            </div>
          `}
        </section>

        <section>
          <div class="${sectionTitle}">
            <span class="material-symbols-outlined">apps</span>
            個別に割り当てられたアプリ（旧システム直接）
          </div>

          ${props.apps.length === 0 ? html`
            <div class="${emptyState}">
              <div><span class="material-symbols-outlined">apps</span></div>
              <p>${t.no_apps_assigned}</p>
            </div>
          ` : html`
            <div class="${appGrid}">
              ${props.apps.map(app => html`
                <a href="${app.initiate_login_uri || app.base_url}" class="${appCardLink}">
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

        ${props.availableServiceTags && props.availableServiceTags.length > 0 ? html`
          <script>
            (function() {
              const filterBtns = document.querySelectorAll('.tag-filter-btn');
              const serviceCards = document.querySelectorAll('.service-card-item');
              let activeTagId = null;

              filterBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                  const tagId = btn.getAttribute('data-tag-id');
                  if (activeTagId === tagId) {
                    activeTagId = null;
                    btn.classList.remove('active');
                  } else {
                    filterBtns.forEach(b => b.classList.remove('active'));
                    activeTagId = tagId;
                    btn.classList.add('active');
                  }

                  serviceCards.forEach(card => {
                    if (!activeTagId) {
                      card.style.display = '';
                    } else {
                      const idsStr = card.getAttribute('data-tag-ids') || '';
                      const ids = idsStr.split(',').filter(Boolean);
                      if (ids.includes(activeTagId)) {
                        card.style.display = '';
                      } else {
                        card.style.display = 'none';
                      }
                    }
                  });
                });
              });
            })();
          </script>
        ` : ''}

    `
  })
}
