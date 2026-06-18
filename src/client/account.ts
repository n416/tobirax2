/**
 * アカウントページ（権限申請モーダル）用クライアントスクリプト。
 * ユーザーがグループ管理者・決裁権者等の権限を申請する際に使用。
 */

declare global {
  interface Window {
    openApplyModal: (gid: string, rt: string, label: string) => void
    closeApplyModal: () => void
    submitApply: () => void
  }
}

let applyGroupId: string | null = null;
let applyRoleType: string | null = null;

function openApplyModal(gid: string, rt: string, label: string): void {
  applyGroupId = gid;
  applyRoleType = rt;
  const lblEl = document.getElementById('apply-role-label');
  if (lblEl) lblEl.textContent = label;
  const ta = document.getElementById('apply-reason') as HTMLTextAreaElement | null;
  if (ta) ta.value = '';
  const err = document.getElementById('apply-error');
  if (err) err.style.display = 'none';
  const m = document.getElementById('apply-modal') as CustomModalElement | null;
  if (m) m.showModal();
}

function closeApplyModal(): void {
  const m = document.getElementById('apply-modal') as CustomModalElement | null;
  if (m) m.close();
}

function submitApply(): void {
  const reason = ((document.getElementById('apply-reason') as HTMLTextAreaElement)?.value || '').trim();
  const err = document.getElementById('apply-error');
  if (!reason) { if (err) { err.style.display = 'block'; } return; }
  fetch('/group-admin/api/roles/apply', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ group_id: applyGroupId, role_type: applyRoleType, reason: reason })
  }).then((r) => {
    if (!r.ok) return r.json().catch(() => ({})).then((e: any) => { throw new Error(e.error || ('Error ' + r.status)); });
    return r.json();
  })
    .then(() => { window.location.reload(); })
    .catch((e) => { if (err) { err.style.display = 'block'; err.textContent = e.message; } });
}

export {}
