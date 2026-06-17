import { css, keyframes } from 'hono/css';

export const blinkActive = keyframes`
        0% { border-color: #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        50% { border-color: var(--primary); box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.2); }
        100% { border-color: #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
  `;

export const tabContainer = css`display:flex; border-bottom: 1px solid #e2e8f0; margin-bottom: 1.5rem; gap: 1rem;`;

export const tabBtn = css`
    background: none !important; border: none !important; color: #64748b !important; padding: 0.5rem 0.5rem 0.8rem !important; font-weight: 600 !important; cursor: pointer !important; box-shadow: none !important; border-bottom: 2px solid transparent !important; border-radius: 0 !important;
    &:hover { color: var(--primary) !important; background: none !important; box-shadow: none !important; transform: none !important; }
    &.active { color: var(--primary) !important; border-bottom: 2px solid var(--primary) !important; }
  `;

export const listGrid = css`display: flex; flex-direction: column; gap: 1rem;`;

export const listCard = css`
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.2rem 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: all 0.2s ease;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    cursor: pointer;
    &:hover { outline: 1px solid var(--primary); }
  `;

export const itemTitle = css`font-weight: 600; font-size: 1rem; color: #1e293b; margin-bottom: 0.2rem;`;

export const itemSub = css`font-size: 0.85rem; color: #64748b; display: flex; align-items: center; gap: 0.4rem;`;

export const actionBtn = css`
    background: transparent !important; border: none !important; color: #94a3b8 !important; cursor: pointer !important; padding: 8px !important; border-radius: 50% !important; transition: all 0.2s !important; box-shadow: none !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; width: 36px !important; height: 36px !important; flex-shrink: 0 !important;
    &:hover { background: #f1f5f9 !important; color: var(--text-main) !important; }
  `;

export const deleteBtn = css`${actionBtn} &:hover { background: #fef2f2 !important; color: #ef4444 !important; }`;

export const addFormCard = css`
    background: #ffffff;
    padding: 2rem;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    margin-bottom: 2rem;
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
    &.blink-active { animation: ${blinkActive} 1s ease-in-out 3; }
  `;

export const formLabel = css`display: block; font-weight: 700; font-size: 0.95rem; color: #1e293b; margin-bottom: 0.5rem;`;

export const dateInput = css`
    width: 100%; padding: 0.8rem 1rem; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 1rem; color: #334155; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    &:focus { border-color: var(--primary); outline: none; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }
  `;

export const tomSelectWrapper = css`
    & .ts-wrapper {
        width: 100%;
    }
    & .ts-control {
      font-size: 1rem !important;
      color: var(--text-main) !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 8px !important;
      background: #ffffff !important;
      padding: 0.6rem 0.8rem !important;
      cursor: text !important;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
      min-height: 42px !important;
      display: flex !important;
      align-items: center !important;
      flex-wrap: wrap !important;
      gap: 4px !important;
      line-height: 1.5 !important;
    }
    &.searchable .ts-control::before {
      content: '\\e8b6'; /* Material Symbol search */
      font-family: 'Material Symbols Outlined';
      font-weight: normal;
      font-size: 20px;
      color: #94a3b8;
      margin-right: 4px;
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
    & .ts-wrapper.single .ts-control > .item {
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
      padding: 0 !important;
      margin: 0 !important;
      display: inline-block !important;
    }
    & .ts-wrapper.focus .ts-control {
      border-color: var(--primary) !important;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1) !important;
    }
    & .ts-dropdown {
      border-radius: 8px !important;
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
  `;

export const quickBtnGroup = css`display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; margin-top: 0.75rem;`;

