/**
 * 開発者権限承認/却下モーダル用クライアントスクリプト。
 * グループ管理者が開発者権限申請を承認・却下する際に使用。
 */

declare global {
  interface Window {
    approveRequest: (id: string) => void
    openRejectModal: (actionUrlOrId: any, targetId?: any, expectedApps?: any) => void
    closeRejectModal: () => void
    executeReject: () => void
  }
}

let targetId: string | null = null;

function approveRequest(id: string): void {
  fetch('/group-admin/api/roles/approve', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ application_id: id })
  }).then(res => {
    if (!res.ok) throw new Error('Error ' + res.status);
    window.location.reload();
  }).catch(err => console.error(err.message));
}

function openRejectModal(id: string): void {
  targetId = id;
  (document.getElementById('reject-reason') as HTMLTextAreaElement).value = '';
  (document.getElementById('reject-error') as HTMLElement).style.display = 'none';
  (document.getElementById('reject-modal') as CustomModalElement).showModal();
}

function closeRejectModal(): void {
  (document.getElementById('reject-modal') as CustomModalElement).close();
}

function executeReject(): void {
  const reason = (document.getElementById('reject-reason') as HTMLTextAreaElement).value.trim();
  if (!reason) { (document.getElementById('reject-error') as HTMLElement).style.display = 'block'; return; }
  fetch('/group-admin/api/roles/reject', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ application_id: targetId, admin_reason: reason })
  }).then(res => {
    if (!res.ok) throw new Error('Error ' + res.status);
    window.location.reload();
  }).catch(err => console.error(err.message));
}

window.approveRequest = approveRequest;
window.openRejectModal = openRejectModal;
window.closeRejectModal = closeRejectModal;
window.executeReject = executeReject;

export {}
