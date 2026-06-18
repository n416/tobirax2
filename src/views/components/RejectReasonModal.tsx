import { html } from 'hono/html'
import { Modal } from './Modal'

export const RejectReasonModal = () => {
  return Modal({
    id: "reject-modal",
    title: html`<span style="color:#ef4444; display:flex; align-items:center; gap:0.5rem;"><span class="material-symbols-outlined">cancel</span> 却下事由の入力</span>`,
    closeAction: "closeRejectModal()",
    children: html`
      <form id="reject-form" method="POST" action="">
        <input type="hidden" name="id" id="reject-target-id" value="" />
        <input type="hidden" name="expected_apps" id="reject-expected-apps" value="" />
        <div style="margin-bottom: 1.5rem;">
          <p style="color:#475569; font-size:0.95rem; line-height:1.5; margin-bottom:1rem;">却下事由を入力してください。この事由は申請元のグループ管理者に表示されます。</p>
          <textarea name="reason" id="reject-reason" style="width:100%; min-height:100px; padding:0.75rem; border:1px solid #cbd5e1; border-radius:8px; font-size:0.95rem; color:#334155; box-sizing:border-box;" placeholder="却下事由を入力" required></textarea>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 1rem;">
          <button type="button" onclick="closeRejectModal()" style="background: transparent; color: #64748b; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer;">キャンセル</button>
          <button type="submit" style="background: #ef4444; color: white; border: none; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer;">却下する</button>
        </div>
      </form>
    `
  })
}

// スクリプトは scripts/rejectReasonModalClient.ts に分離
export { RejectReasonModalScript } from '../scripts/rejectReasonModalClient'
