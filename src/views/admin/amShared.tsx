import { html, raw } from 'hono/html'
import type { Child } from 'hono/jsx'
import { css } from 'hono/css'

// アカウントマネージャ各画面で共通利用する見た目部品。
// グループ管理画面(AccountGroupsPage)のトーンに合わせ、一覧カード+削除ボタン+セクション見出しを揃える。

export const amListGrid = css`display: flex; flex-direction: column; gap: 0.75rem;`

export const amListCard = css`
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
`

export const amItemTitle = css`font-weight: 600; font-size: 1rem; color: #1e293b; margin-bottom: 0.2rem;`
export const amItemSub = css`font-size: 0.85rem; color: #64748b; display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;`

export const amDeleteBtn = css`
  background: transparent !important; border: none !important; color: #94a3b8 !important; cursor: pointer !important;
  padding: 8px !important; border-radius: 50% !important; transition: all 0.2s !important; box-shadow: none !important;
  display: inline-flex !important; align-items: center !important; justify-content: center !important;
  width: 36px !important; height: 36px !important; flex-shrink: 0 !important;
  &:hover { background: #fef2f2 !important; color: #ef4444 !important; }
`

export const amFormLabel = css`display: block; font-weight: 700; font-size: 0.95rem; color: #1e293b; margin-bottom: 0.5rem;`

export const amBadge = css`
  font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 999px;
  color: #475569; background: #f1f5f9;
`

// 一覧の空状態。
export const amEmpty = (text: string) => html`<div style="text-align:center; padding:1.5rem; color:#94a3b8;">${text}</div>`

// セクション見出し(タイトル+サブタイトル+右側アクション)。
export const amSectionHead = (title: string, subtitle: string, action?: Child) => html`
  <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; margin-bottom:1.5rem;">
    <hgroup>
      <h2 style="margin-bottom:0;">${title}</h2>
      <h3 style="font-size:1rem; font-weight:normal; color:#64748b;">${subtitle}</h3>
    </hgroup>
    ${action || ''}
  </div>
`

// 削除フォーム(POST + ネイティブ確認)。confirmMsg は改行を含みうる。
export const amDeleteForm = (action: string, id: string, confirmMsg: string, deleteTitle: string) => html`
  <form method="POST" action="${action}" style="margin:0;">
    <input type="hidden" name="id" value="${id}" />
    <button type="button" class="${amDeleteBtn}" title="${deleteTitle}" data-action="delete-confirm" data-confirm-msg="${confirmMsg}">
      <span class="material-symbols-outlined">delete</span>
    </button>
  </form>
`

// 日付の既定値(YYYY-MM-DD)。
export const todayStr = () => new Date().toISOString().split('T')[0]
export const plusYearStr = (n: number) => {
  const d = new Date(); d.setFullYear(d.getFullYear() + n)
  return d.toISOString().split('T')[0]
}

export const amApproveBtn = (title: string, attr?: Record<string, string>) => {
  const approveBtnStyle = css`
    display:inline-flex; align-items:center; justify-content:center; gap:0.4rem; background:#16a34a; color:#fff; border:none; border-radius:8px; padding:0.4rem 0.8rem; font-size:0.85rem; font-weight:600; cursor:pointer; transition:background 0.2s; box-shadow:0 1px 2px rgba(0,0,0,0.05); white-space:nowrap;
    &:hover { background:#15803d; }
  `
  const attrs = attr 
    ? html`${raw(Object.entries(attr).map(([k, v]) => `${k}="${v}"`).join(' '))}`
    : ''

  return html`
    <button type="button" class="${approveBtnStyle}" ${attrs} title="${title}">
      <span class="material-symbols-outlined" style="font-size:18px;">check_circle</span>
      ${title}
    </button>
  `
}

export const amRejectBtn = (title: string, attr?: Record<string, string>) => {
  const rejectBtnStyle = css`
    display:inline-flex; align-items:center; justify-content:center; gap:0.4rem; background:#fff; color:#dc2626; border:1px solid #fecaca; border-radius:8px; padding:0.4rem 0.8rem; font-size:0.85rem; font-weight:600; cursor:pointer; transition:all 0.2s; box-shadow:0 1px 2px rgba(0,0,0,0.02); white-space:nowrap;
    &:hover { background:#fef2f2; border-color:#f87171; }
  `
  const attrs = attr 
    ? html`${raw(Object.entries(attr).map(([k, v]) => `${k}="${v}"`).join(' '))}`
    : ''

  return html`
    <button type="button" class="${rejectBtnStyle}" ${attrs} title="${title}">
      <span class="material-symbols-outlined" style="font-size:18px;">cancel</span>
      ${title}
    </button>
  `
}
