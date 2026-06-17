import { css, keyframes } from 'hono/css';

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
    &:hover {
        outline: 1px solid var(--primary);
    }
  `;

export const itemTitle = css`font-weight: 600; font-size: 1rem; color: #1e293b; margin-bottom: 0.2rem;`;

export const itemSub = css`font-size: 0.85rem; color: #64748b; display: flex; align-items: center; gap: 0.4rem;`;

export const actionBtn = css`
    background: transparent !important; 
    border: none !important; 
    color: #94a3b8 !important; 
    cursor: pointer !important; 
    padding: 8px !important; 
    border-radius: 50% !important; 
    transition: all 0.2s !important;
    box-shadow: none !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 36px !important;
    height: 36px !important;
    flex-shrink: 0 !important;
    &:hover { background: #f1f5f9 !important; color: var(--text-main) !important; }
  `;

export const deleteBtn = css`${actionBtn} &:hover { background: #fef2f2 !important; color: #ef4444 !important; }`;

