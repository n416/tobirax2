import { html } from 'hono/html'
import { css } from 'hono/css'
import { dict } from '../i18n'
import { Layout } from './components/Layout'
import { UserTopbar } from './components/UserTopbar'

interface Props {
  t: typeof dict.en
  siteName: string
  userEmail: string
  qrCodeDataUrl: string
  secret: string
  profileName?: string | null
  profilePicture?: string | null
  error?: string
  nonce?: string
}

// 2段階認証のセットアップ画面。アカウント設定と同じトップバー/カードトーンで視覚統一する。
export const Setup2FA = (props: Props) => {
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

  const qrBlock = css`
    text-align: center; margin-bottom: 1.5rem;
    & .qr {
      background: #fff; padding: 1rem; display: inline-block;
      border-radius: 12px; border: 1px solid #e2e8f0;
    }
    & .qr img { display: block; width: 200px; height: 200px; }
    & .secret {
      margin-top: 1rem; font-family: monospace; background: #f1f5f9;
      padding: 0.6rem 0.8rem; border-radius: 8px; font-size: 0.9rem;
      word-break: break-all; color: var(--text-main);
    }
    & .secret-label { font-size: 0.8rem; color: var(--text-sub); margin-top: 0.4rem; }
  `

  const field = css`
    display: block; margin-bottom: 1.1rem;
    & .lbl { display: block; font-size: 0.88rem; font-weight: 600; color: var(--text-main); margin-bottom: 0.4rem; }
    & input {
      width: 100%; padding: 0.7rem 0.9rem;
      border: 1px solid #cbd5e1; border-radius: 10px;
      font-size: 1.1rem; letter-spacing: 0.3em; text-align: center;
      color: var(--text-main); background: #fff; transition: all 0.2s;
    }
    & input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(79,70,229,0.12); }
  `

  const primaryBtn = css`
    display: inline-flex; align-items: center; gap: 0.4rem;
    background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
    color: #fff; border: none; border-radius: 10px;
    padding: 0.6rem 1.3rem; font-size: 0.92rem; font-weight: 700; cursor: pointer;
    box-shadow: 0 4px 6px -1px rgba(79,70,229,0.25); transition: all 0.2s;
    & .material-symbols-outlined { font-size: 18px; }
    &:hover { transform: translateY(-1px); box-shadow: 0 8px 14px -3px rgba(79,70,229,0.35); }
  `

  const backLink = css`
    display: inline-flex; align-items: center; gap: 0.35rem;
    font-size: 0.9rem; font-weight: 600; color: var(--text-sub) !important; text-decoration: none;
    & .material-symbols-outlined { font-size: 18px; }
    &:hover { color: var(--primary) !important; }
  `

  const errorBanner = css`
    display: flex; align-items: center; gap: 0.5rem;
    background: var(--error-bg); color: var(--error-text);
    border: 1px solid var(--error-border); border-radius: 12px;
    padding: 0.8rem 1rem; margin-bottom: 1.5rem; font-size: 0.9rem; font-weight: 600;
    & .material-symbols-outlined { font-size: 20px; }
  `

  return Layout({
    title: t.title_setup_2fa,
    siteName: props.siteName,
    lang: t.lang,
    width: 760,
    align: 'top',
    nonce: props.nonce,
    children: html`
        ${UserTopbar({
          t, siteName: props.siteName, userEmail: props.userEmail, active: 'account',
          profileName: props.profileName, profilePicture: props.profilePicture,
        })}

        <div class="${pageHead}">
          <h1>${t.header_setup_2fa}</h1>
          <p>${t.account_subtitle}</p>
        </div>

        ${props.error ? html`
          <div class="${errorBanner}">
            <span class="material-symbols-outlined">error</span>${props.error}
          </div>` : ''}

        <section class="${card}">
          <div class="${cardHead}">
            <span class="material-symbols-outlined">add_moderator</span>
            <div>
              <h2>${t.header_setup_2fa}</h2>
              <p>${t.desc_setup_2fa}</p>
            </div>
          </div>

          <div class="${qrBlock}">
            <div class="qr"><img src="${props.qrCodeDataUrl}" alt="QR Code" /></div>
            <div class="secret">${props.secret}</div>
            <div class="secret-label">${t.label_secret_key}</div>
          </div>

          <form method="POST" action="">
            <input type="hidden" name="secret" value="${props.secret}" />
            <label class="${field}">
              <span class="lbl">${t.btn_setup_2fa}</span>
              <input type="text" name="token" inputmode="numeric" autocomplete="one-time-code" required placeholder="000000" />
            </label>
            <div style="text-align:right;">
              <button type="submit" class="${primaryBtn}"><span class="material-symbols-outlined">check</span>${t.btn_setup_2fa}</button>
            </div>
          </form>
        </section>

        <a href="/account" class="${backLink}">
          <span class="material-symbols-outlined">arrow_back</span>${t.back_to_account}
        </a>
    `
  })
}
