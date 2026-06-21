import { html, raw } from 'hono/html'
import { css } from 'hono/css'
import { Modal } from './Modal'
import { Button } from './Button'
import { serviceAppsModalClientScript } from '../scripts/generated/serviceAppsModal'

const formLabel = css`display: block; font-weight: 700; font-size: 0.9rem; color: #1e293b; margin-bottom: 0.4rem;`
const selectInput = css`
  width: 100%; padding: 0.6rem 0.75rem; border: 1px solid #cbd5e1;
  border-radius: 8px; font-size: 0.95rem; background: #fff;
  transition: all 0.2s; outline: none;
  &:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
`
const infoBox = css`
  background: #f1f5f9; border-left: 4px solid #3b82f6;
  padding: 1rem; color: #334155; font-size: 0.9rem; line-height: 1.5;
  display: flex; align-items: flex-start; gap: 0.75rem;
`

export const ServiceAppsModal = (t: typeof import('../../i18n').dict.en, apiPrefix: string, nonce?: string) => {
  return html`

    <!-- サービスへのアプリ組み込みモーダル -->
    ${Modal({
    id: 'service-apps-modal',
    title: t.ga_svc_manage_apps || 'アプリの管理',
    nonce: nonce,
    children: html`
        <div style="display:flex; flex-direction:column; gap:1.25rem;">
          <input type="hidden" id="sa-service-id" />
          <input type="hidden" id="sa-api-prefix" value="${apiPrefix}" />
          <div style="font-weight:700; font-size:1.1rem; color:var(--text-main); border-bottom:1px solid #e2e8f0; padding-bottom:0.5rem; margin-bottom:0.25rem;">
            <span id="sa-service-name"></span>
          </div>
          
          <div>
            <label class="${formLabel}">組み込み済みのアプリ</label>
            <div id="sa-composed" style="margin-top:0.5rem;"></div>
          </div>

          <div style="margin-top:1rem; padding-top:1rem; border-top:1px dashed #cbd5e1;">
            <label class="${formLabel}">承認済みアプリを追加</label>
            <div id="sa-no-approved" style="display:none; margin-bottom:0.5rem;" class="${infoBox}">
              <span class="material-symbols-outlined" style="vertical-align:middle;">info</span>利用可能なアプリがありません。
            </div>
            <div style="display:flex; flex-direction:column; gap:0.5rem;">
              <select id="sa-app" class="${selectInput}"></select>
              ${Button({ attr: { "data-action": "add-service-app" }, children: html`<span class="material-symbols-outlined">add_link</span> 組み込む` })}
            </div>
          </div>
        </div>
      `
  })}
    <script nonce="${nonce}">
      ${raw(serviceAppsModalClientScript)}
    </script>
  `
}
