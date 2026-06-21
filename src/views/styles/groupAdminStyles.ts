import { css } from 'hono/css'
import { raw } from 'hono/html'

export const sectionTitle = css`
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-main);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
  & .material-symbols-outlined { color: var(--primary); }
`

export const card = css`
  background: rgba(255,255,255,0.72);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.6);
  border-radius: 16px;
  box-shadow: 0 4px 16px -6px rgba(31,38,135,0.18);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`

export const tabBar = css`
  display: flex;
  gap: 0.35rem;
  margin-bottom: 1.75rem;
  background: rgba(255,255,255,0.5);
  border-radius: 12px;
  padding: 0.35rem;
  & button {
    flex: 1;
    padding: 0.65rem 1rem;
    border: none !important;
    border-radius: 9px;
    font-size: 0.92rem;
    font-weight: 600;
    color: var(--text-sub);
    background: transparent !important;
    box-shadow: none !important;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    & .material-symbols-outlined { font-size: 19px; }
  }
  & button:hover { background: rgba(255,255,255,0.7) !important; color: var(--primary); }
  input:not([type="checkbox"]):not([type="radio"]):not([role="combobox"]), select:not(.tomselected) { width: 100%; padding: 0.6rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem; background: #fff; transition: all 0.2s; outline: none; }
  input:not([type="checkbox"]):not([type="radio"]):not([role="combobox"]):focus, select:not(.tomselected):focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }
`

export const groupSelectWrapper = css`
  min-width: 280px;
  & .ts-control {
    font-size: 1rem !important;
    font-weight: 600 !important;
    color: var(--text-main) !important;
    border: 1px solid #e2e8f0 !important;
    border-radius: 12px !important;
    background: rgba(255,255,255,0.9) !important;
    padding: 0.7rem 1rem !important;
    cursor: text !important;
    box-shadow: none !important;
    min-height: auto !important;
    display: flex !important;
    align-items: center !important;
  }
  & .ts-control > input {
    border: none !important;
    background: transparent !important;
    box-shadow: none !important;
    margin: 0 !important;
    padding: 0 !important;
    width: auto !important;
    flex: 1 1 auto !important;
    min-width: 2rem !important;
    display: inline-block !important;
    height: auto !important;
    line-height: inherit !important;
  }
  & .ts-control::before {
    content: '\\e8b6'; /* Material Symbol search */
    font-family: 'Material Symbols Outlined';
    font-weight: normal;
    font-size: 20px;
    color: #94a3b8;
    margin-right: 4px;
  }
  & .ts-wrapper.focus .ts-control {
    border-color: var(--primary) !important;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1) !important;
  }
  & .ts-dropdown {
    border-radius: 12px !important;
    border: 1px solid #e2e8f0 !important;
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1) !important;
    font-size: 0.95rem !important;
  }
  & .ts-dropdown .option {
    padding: 0.5rem 0.8rem !important;
  }
  & .ts-dropdown .option.active {
    background-color: #f1f5f9 !important;
    color: var(--primary) !important;
  }
`

export const badge = css`
  display: inline-flex;
  align-items: center;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
`

export const tableWrap = css`
  overflow-x: auto;
  & table { width: 100%; border-collapse: separate; border-spacing: 0 0.4rem; }
  & th { font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-sub); padding: 0.4rem 0.75rem; border-bottom: none; }
  & td { background: rgba(255,255,255,0.5); padding: 0.8rem 0.75rem; font-size: 0.92rem; vertical-align: middle; border: none; }
  & td:first-child { border-radius: 10px 0 0 10px; }
  & td:last-child { border-radius: 0 10px 10px 0; }
`

export const formLabel = css`display: block; font-weight: 700; font-size: 0.9rem; color: #1e293b; margin-bottom: 0.4rem;`

export const dateInput = css`
  width: 100%; padding: 0.7rem 1rem; background: #fff; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem; color: #334155;
  &:focus { border-color: var(--primary); outline: none; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }
`

export const selectInput = css`
  width: 100%; padding: 0.7rem 2.2rem 0.7rem 1rem; background-color: #fff;
  border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem; color: #334155; cursor: pointer;
  appearance: none; -webkit-appearance: none; -moz-appearance: none;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 0.75rem center; background-size: 1rem;
  &:focus { border-color: var(--primary); outline: none; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }
`

export const infoBox = css`
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.85rem 1rem;
  background: rgba(79,70,229,0.06);
  border: 1px solid rgba(79,70,229,0.15);
  border-radius: 10px;
  font-size: 0.88rem;
  color: var(--text-sub);
  margin-bottom: 1rem;
  & .material-symbols-outlined { color: var(--primary); font-size: 18px; flex-shrink: 0; margin-top: 1px; }
`

export const actionBtn = css`
  background: transparent !important; border: none !important; color: #94a3b8 !important; cursor: pointer !important;
  padding: 7px !important; border-radius: 50% !important; transition: all 0.2s !important; box-shadow: none !important;
  display: inline-flex !important; align-items: center !important; justify-content: center !important;
  width: 34px !important; height: 34px !important; flex-shrink: 0 !important;
  &:hover { background: #fef2f2 !important; color: #ef4444 !important; }
`

export const tabStyles = raw(`
  .tab-content { display: none; }
  html[data-active-tab="members"] #tab-members,
  html[data-active-tab="assignments"] #tab-assignments,
  html[data-active-tab="grants"] #tab-grants,
  html[data-active-tab="access"] #tab-access,
  html[data-active-tab="facilities"] #tab-facilities,
  html[data-active-tab="apps"] #tab-apps { display: block; }
  html[data-active-tab="members"] #tab-btn-members,
  html[data-active-tab="assignments"] #tab-btn-assignments,
  html[data-active-tab="grants"] #tab-btn-grants,
  html[data-active-tab="access"] #tab-btn-access,
  html[data-active-tab="facilities"] #tab-btn-facilities,
  html[data-active-tab="apps"] #tab-btn-apps {
    background: #fff !important; color: var(--primary) !important; box-shadow: 0 2px 6px -2px rgba(0,0,0,0.1) !important;
  }
`);

// CSP 対応: 行アクションボタンのホバー演出は、従来インラインの onmouseover/onmouseout
// (this.style.* 書き換え)で実装していたが、script-src から 'unsafe-inline' を外したことで
// これらが CSP に弾かれるようになった。そこで既存の data-action 属性をフックにした
// CSS :hover へ移行する。ボタンには基本スタイルがインライン style= で付いており、それを
// ホバー時に上書きする必要があるため !important を付与する。
export const rowActionHoverStyles = raw(`
  /* 危険系アイコンボタン(削除/除外): 透明 → 薄赤背景・赤文字 */
  [data-action="remove-assignment"]:hover,
  [data-action="remove-facility"]:hover,
  [data-action="remove-grant"]:hover,
  [data-action="remove-member"]:hover,
  [data-action="remove-service"]:hover,
  [data-action="remove-app"]:hover {
    background: #fef2f2 !important; color: #ef4444 !important;
  }
  /* 中立アイコンボタン(詳細/編集/タグ管理): 透明 → 薄灰背景・藍文字 */
  [data-action="open-app-edit-modal"]:hover,
  [data-action="open-service-tags-modal"]:hover {
    background: #f1f5f9 !important; color: #4f46e5 !important;
  }
  /* ピル(再申請): 白 → 薄赤背景 */
  [data-action="reapply-service"]:hover { background: #fef2f2 !important; }
  /* ピル(アプリを組み込む): 薄藍背景・藍枠 */
  [data-action="manage-service-apps"]:hover { background: #eef2ff !important; border-color: #a5b4fc !important; }
  /* ピル(役割を管理): 薄緑背景・緑枠 */
  [data-action="manage-roles"]:hover { background: #d1fae5 !important; border-color: #6ee7b7 !important; }
  /* タグ除去の×ボタン: 不透明度 0.7 → 1 */
  [data-action="remove-service-tag"]:hover { opacity: 1 !important; }
`);
