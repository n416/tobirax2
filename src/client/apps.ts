/**
 * アプリ管理ページ用クライアントスクリプト。
 * アプリの編集・削除・ステータス変更・シークレット管理を制御。
 */

declare global {
  interface Window {
    showAlert: (msg: string) => void;
    showConfirm: (msg: string, cb: () => void) => void;
    handleIconPreview: (input: HTMLInputElement, previewId: string) => void
    openEditAppModal: (btn: HTMLElement) => void
    closeEditAppModal: () => void
    toggleAppStatus: (id: string, nextStatus: string, name: string) => void
    closeToggleModal: () => void
    executeToggle: () => void
    deleteApp: (id: string) => void
    closeDeleteModal: () => void
    executeDelete: () => void
    approveApp: (id: string) => void
    appSecretAction: (action: string) => void
    _executeOverwrite?: () => void
  }
}

// 画像プレビュー機能
window.handleIconPreview = (input: HTMLInputElement, previewId: string) => {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const div = document.getElementById(previewId);
      const img = div ? div.querySelector('img') as HTMLImageElement | null : null;
      if (img && e.target) {
        img.src = e.target.result as string;
        div!.style.display = 'block';
      }
    };
    reader.readAsDataURL(input.files[0]);
  }
};

const editModal = document.getElementById('edit-app-modal') as CustomModalElement | null;

// 編集モーダルを開く関数
window.openEditAppModal = (btn: HTMLElement) => {
  if (!editModal) return;
  const form = editModal.querySelector('form') as HTMLFormElement;

  // 基本データ
  (form.querySelector('input[name="id"]') as HTMLInputElement).value = btn.dataset.id || '';
  (form.querySelector('input[name="name"]') as HTMLInputElement).value = btn.dataset.name || '';
  (form.querySelector('input[name="base_url"]') as HTMLInputElement).value = btn.dataset.url || '';

  // 説明文
  const descEl = form.querySelector('textarea[name="description"]') as HTMLTextAreaElement | null;
  if (descEl) descEl.value = btn.dataset.desc || '';

  // Redirect URIs (OIDC)
  const ruEl = form.querySelector('textarea[name="redirect_uris"]') as HTMLTextAreaElement | null;
  if (ruEl) ruEl.value = btn.dataset.redirectUris || '';

  // Back-Channel Logout URI (OIDC)
  const bclEl = form.querySelector('input[name="backchannel_logout_uri"]') as HTMLInputElement | null;
  if (bclEl) bclEl.value = btn.dataset.backchannelLogoutUri || '';

  // Initiate Login URI (OIDC)
  const iniEl = form.querySelector('input[name="initiate_login_uri"]') as HTMLInputElement | null;
  if (iniEl) iniEl.value = btn.dataset.initiateLoginUri || '';

  // アイコン関連
  const iconEl = form.querySelector('input[name="icon_url"]') as HTMLInputElement | null;
  const iconUrl = btn.dataset.icon || '';
  if (iconEl) iconEl.value = iconUrl;

  // プレビュー表示制御
  const previewDiv = document.getElementById('edit-icon-preview');
  const previewImg = previewDiv ? previewDiv.querySelector('img') as HTMLImageElement | null : null;
  if (previewDiv && previewImg) {
    if (iconUrl && iconUrl !== 'null' && iconUrl !== 'undefined') {
      previewImg.src = iconUrl;
      previewDiv.style.display = 'block';
    } else {
      previewImg.src = '';
      previewDiv.style.display = 'none';
    }
  }

  // ファイル入力はリセット
  const fileInput = form.querySelector('input[name="icon_file"]') as HTMLInputElement | null;
  if (fileInput) fileInput.value = '';

  // Client Secret (OIDC)
  const hasSecretStr = btn.dataset.hasSecret || 'false';
  const hasSecret = hasSecretStr === 'true';
  const statusEl = document.getElementById('edit-secret-status');
  const hasSecInput = document.getElementById('edit-has-secret') as HTMLInputElement | null;

  if (hasSecInput) hasSecInput.value = hasSecretStr;
  if (statusEl) {
    statusEl.innerText = hasSecret ? '機密クライアント (Confidential Client - シークレット設定済)' : 'パブリッククライアント (Public Client - シークレット未設定)';
    statusEl.style.color = hasSecret ? '#16a34a' : '#64748b';
  }

  editModal.showModal();
  setTimeout(() => {
    const closeBtn = document.getElementById('edit-close-btn');
    if (closeBtn) closeBtn.focus();
  }, 50);
};

window.closeEditAppModal = () => {
  if (editModal) editModal.close();
};

// Toggle App Status
let toggleTargetId: string | null = null;
let toggleTargetStatus: string | null = null;

window.toggleAppStatus = (id: string, nextStatus: string, name: string) => {
  toggleTargetId = id;
  toggleTargetStatus = nextStatus;
  const tm = document.getElementById('toggle-confirm-modal') as CustomModalElement | null;
  if (tm) {
    const msgEl = document.getElementById('toggle-msg-text');
    const i18nDataEl = document.getElementById('i18n-data') as HTMLElement | null;
    const tmpl = (i18nDataEl && i18nDataEl.dataset.confirmChangeStatus) || 'Change status?';
    if (msgEl) msgEl.innerText = tmpl.replace('{name}', name);
    tm.showModal();
  }
};

window.closeToggleModal = () => {
  const tm = document.getElementById('toggle-confirm-modal') as CustomModalElement | null;
  if (tm) tm.close();
  toggleTargetId = null;
  toggleTargetStatus = null;
};

window.executeToggle = () => {
  if (!toggleTargetId) return;
  const form = document.getElementById('toggle-app-form') as HTMLFormElement | null;
  if (form) {
    (form.querySelector('input[name="id"]') as HTMLInputElement).value = toggleTargetId;
    (form.querySelector('input[name="status"]') as HTMLInputElement).value = toggleTargetStatus || '';
    form.submit();
  }
};

// Delete App
let deleteTargetId: string | null = null;

window.deleteApp = (id: string) => {
  deleteTargetId = id;
  const dm = document.getElementById('delete-confirm-modal') as CustomModalElement | null;
  if (dm) dm.showModal();
};

window.closeDeleteModal = () => {
  const dm = document.getElementById('delete-confirm-modal') as CustomModalElement | null;
  if (dm) dm.close();
  deleteTargetId = null;
};

window.executeDelete = () => {
  if (!deleteTargetId) return;
  const form = document.getElementById('delete-app-form') as HTMLFormElement | null;
  if (form) {
    (form.querySelector('input[name="id"]') as HTMLInputElement).value = deleteTargetId;
    form.submit();
  }
};

window.approveApp = (id: string) => {
  const i18nDataEl = document.getElementById('i18n-data') as HTMLElement | null;
  window.showConfirm((i18nDataEl && i18nDataEl.dataset.confirmApprove) || 'Approve?', () => {
    const f = document.getElementById('approve-app-form') as HTMLFormElement | null;
    if (f) { (f.querySelector('input[name="id"]') as HTMLInputElement).value = id; f.submit(); }
  });
};

// Client secret: regenerate / clear (make public)
window.appSecretAction = (action: string) => {
  if (!editModal) return;
  const id = (editModal.querySelector('input[name="id"]') as HTMLInputElement).value;
  if (!id) return;

  fetch('/admin/apps/secret', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ id: id, action: action })
  })
    .then((res) => res.json())
    .then((data: any) => {
      if (data.error) {
        console.error('Error:', data.error);
        return;
      }
      if (action === 'clear') {
        const sEl = document.getElementById('edit-secret-status');
        if (sEl) {
          sEl.innerText = 'パブリッククライアント (Public Client - シークレット未設定)';
          sEl.style.color = '#64748b';
        }
        const hsInput = document.getElementById('edit-has-secret') as HTMLInputElement | null;
        if (hsInput) hsInput.value = 'false';
        const banner = document.getElementById('new-secret-banner-admin');
        if (banner) banner.style.display = 'none';
      } else if (action === 'regenerate') {
        const sEl = document.getElementById('edit-secret-status');
        if (sEl) {
          sEl.innerText = '機密クライアント (Confidential Client - シークレット設定済)';
          sEl.style.color = '#16a34a';
        }
        const hsInput = document.getElementById('edit-has-secret') as HTMLInputElement | null;
        if (hsInput) hsInput.value = 'true';
        const banner = document.getElementById('new-secret-banner-admin');
        const codeVal = document.getElementById('new-secret-value-admin');
        if (banner && codeVal) {
          codeVal.innerText = data.new_secret;
          banner.style.display = 'block';
        }
      }
    })
    .catch((err) => { console.error('Error changing secret:', err); });
};

export {}
