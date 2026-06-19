/**
 * 却下理由モーダル用クライアントスクリプト。
 * 管理画面でアプリ申請等を却下する際に使用するモーダルの制御。
 */

declare global {
  interface Window {
    openRejectModal: (actionUrlOrId: string, targetId?: string, expectedApps?: string) => void
    closeRejectModal: () => void
  }
}

function openRejectModal(actionUrl: string, targetId: string, expectedApps?: string): void {
  const form = document.getElementById('reject-form') as HTMLFormElement | null;
  if (form) {
    form.action = actionUrl;
  }
  const idInput = document.getElementById('reject-target-id') as HTMLInputElement | null;
  if (idInput) {
    idInput.value = targetId;
  }
  const expectedAppsInput = document.getElementById('reject-expected-apps') as HTMLInputElement | null;
  if (expectedAppsInput) {
    expectedAppsInput.value = expectedApps || '';
  }
  const reasonInput = document.getElementById('reject-reason') as HTMLTextAreaElement | null;
  if (reasonInput) {
    reasonInput.value = '';
  }
  const modal = document.getElementById('reject-modal') as CustomModalElement | null;
  if (modal) {
    modal.showModal();
  }
}

function closeRejectModal(): void {
  const modal = document.getElementById('reject-modal') as CustomModalElement | null;
  if (modal) {
    modal.close();
  }
}

window.openRejectModal = openRejectModal;
window.closeRejectModal = closeRejectModal;

export {}
