import { html } from 'hono/html'
import { css } from 'hono/css'
import { dict } from '../../i18n'

interface Props {
  t: typeof dict.en
  siteName: string
  userEmail: string
  active: 'dashboard' | 'account'
  profileName?: string | null
  profilePicture?: string | null
}

// ユーザー向け画面の共通トップバー（ブランド + ナビ + アバター/ログアウト）。
// ダッシュボードとアカウント設定で見た目を統一し、品質感を揃えるための部品。
export const UserTopbar = (props: Props) => {
  const t = props.t

  const bar = css`
    display: flex;
    align-items: center;
    gap: 1.25rem;
    padding: 0.85rem 1.25rem;
    margin-bottom: 2rem;
    background: rgba(255, 255, 255, 0.65);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.6);
    border-radius: 16px;
    box-shadow: 0 4px 20px -4px rgba(31, 38, 135, 0.18);
  `

  const brand = css`
    font-size: 1.35rem;
    font-weight: 800;
    color: var(--primary) !important;
    text-decoration: none;
    letter-spacing: -0.01em;
    flex-shrink: 0;
  `

  const nav = css`
    display: flex;
    align-items: center;
    gap: 0.35rem;
    margin-left: 0.5rem;

    & a {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.5rem 0.9rem;
      border-radius: 10px;
      font-size: 0.92rem;
      font-weight: 600;
      color: var(--text-sub);
      text-decoration: none;
      transition: all 0.2s;
      white-space: nowrap;
    }
    & a .material-symbols-outlined { font-size: 19px; }
    & a:hover { background: rgba(255, 255, 255, 0.7); color: var(--primary); }
    & a.active { background: #ffffff; color: var(--primary); box-shadow: 0 2px 6px -2px rgba(0,0,0,0.08); }

    @media (max-width: 560px) {
      & a span:not(.material-symbols-outlined) { display: none; }
    }
  `

  const right = css`
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 0.85rem;
  `

  const avatar = css`
    width: 38px;
    height: 38px;
    border-radius: 50%;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 1rem;
    color: #fff;
    background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
    box-shadow: 0 2px 6px -1px rgba(79, 70, 229, 0.4);
    overflow: hidden;
    & img { width: 100%; height: 100%; object-fit: cover; }
  `

  const emailText = css`
    font-size: 0.88rem;
    color: var(--text-sub);
    font-weight: 500;
    @media (max-width: 720px) { display: none; }
  `

  const logoutBtn = css`
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.5rem 0.9rem;
    background: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 10px;
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--text-main) !important;
    text-decoration: none;
    transition: all 0.2s;
    white-space: nowrap;
    & .material-symbols-outlined { font-size: 18px; }
    &:hover { background: #fff; color: #dc2626 !important; border-color: #fecaca; }
  `

  const initial = (props.profileName || props.userEmail || '?').trim().charAt(0).toUpperCase()

  return html`
    <header class="${bar}">
      <a href="/" class="${brand}">${props.siteName}</a>
      <nav class="${nav}">
        <a href="/" class="${props.active === 'dashboard' ? 'active' : ''}">
          <span class="material-symbols-outlined">grid_view</span><span>${t.nav_dashboard}</span>
        </a>
        <a href="/account" class="${props.active === 'account' ? 'active' : ''}">
          <span class="material-symbols-outlined">manage_accounts</span><span>${t.account_settings}</span>
        </a>
      </nav>
      <div class="${right}">
        <div class="${avatar}">
          ${props.profilePicture ? html`<img src="${props.profilePicture}" alt="" />` : html`${initial}`}
        </div>
        <span class="${emailText}">${props.userEmail}</span>
        <a href="/logout" class="${logoutBtn}">
          <span class="material-symbols-outlined">logout</span>${t.logout}
        </a>
      </div>
    </header>
  `
}
