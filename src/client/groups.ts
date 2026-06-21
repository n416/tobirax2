/**
 * グループ管理（アクセス権）ページ用クライアントスクリプト。
 * グループへのアプリアクセス権の付与・取り消し・削除を制御。
 */

declare global {

  interface CustomModalElement extends HTMLDialogElement {
    showModal: () => void;
    close: () => void;
  }
  interface Window {
    openGroupModal: (id: string, name: string, parentId?: string) => void
    closeGroupModal: () => void
    resetGrantButton: () => void
    highlightGrantForm: () => void
    editGroupPerm: (appId: string, startTs: number, endTs: number) => void
    loadGroupPerms: (id: string) => void
    renderGroupPerms: (list: PermData[]) => void
    grantGroupPermission: () => void
    revokeGroupPerm: (pid: string) => void
    closeRevokeModal: () => void
    executeRevoke: () => void
    deleteGroup: (gid: string, e?: Event) => void
    closeDeleteModal: () => void
    executeDelete: () => void
    calcGroupDate: (targetId: string, offset: number, unit: string) => void
    _executeOverwrite?: () => void
  }
}

interface PermData {
  id: number
  app_id: string
  app_name: string
  valid_from: number
  valid_to: number
}

// HTMLエスケープ関数
function escapeHtml(v: unknown): string {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const i18nEl = document.getElementById('i18n-data') as HTMLElement | null;
const i18n: DOMStringMap = i18nEl ? i18nEl.dataset : {} as DOMStringMap;
let ALL_APPS: any[] = [];
try {
  const appDataEl = document.getElementById('app-data');
  if (appDataEl) ALL_APPS = JSON.parse(appDataEl.textContent || '[]');
} catch (e) { console.error(e); }

let tsControl: any = null;
let currentGroupId = '';
let currentGroupPermissions: PermData[] = [];

document.addEventListener('DOMContentLoaded', () => {
  if (typeof window.TomSelect !== 'undefined') {
    tsControl = new window.TomSelect('#g-perm-app-id', {
      controlInput: '<input type="text" autocomplete="off" data-lpignore="true" data-1p-ignore="true" data-bwignore="true" />',
      plugins: ['remove_button'],
      create: false,
      maxItems: null,
      placeholder: i18n.placeholderSelect || 'Select...',
      render: {
        option: (data: any, escape: (s: string) => string) => '<div>' + escape(data.text) + '</div>',
        item: (data: any, escape: (s: string) => string) => '<div>' + escape(data.text) + '</div>',
        no_results: () => '<div class="no-results">' + (i18n.textNoResults || 'No results found') + '</div>',
      }
    });
  }

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (!target) return;

    const actionBtn = target.closest('[data-action]') as HTMLElement | null;
    if (actionBtn) {
      const action = actionBtn.getAttribute('data-action');
      if (action === 'open-new-group-modal') {
        const m = document.getElementById('new-group-modal') as CustomModalElement | null;
        if (m) m.showModal();
        return;
      }
      if (action === 'delete-group') {
        e.stopPropagation();
        const gid = actionBtn.getAttribute('data-group-id');
        if (gid && window.deleteGroup) {
          window.deleteGroup(gid);
        }
        return;
      }
      if (action === 'calc-date') {
        const targetId = actionBtn.getAttribute('data-target') || '';
        const amount = Number(actionBtn.getAttribute('data-amount') || '0');
        const unit = actionBtn.getAttribute('data-unit') || '';
        if (window.calcGroupDate) {
          window.calcGroupDate(targetId, amount, unit);
        }
        return;
      }
      if (action === 'grant-permission') {
        if (window.grantGroupPermission) window.grantGroupPermission();
        return;
      }
      if (action === 'close-revoke-modal') {
        if (window.closeRevokeModal) window.closeRevokeModal();
        return;
      }
      if (action === 'execute-revoke') {
        if (window.executeRevoke) window.executeRevoke();
        return;
      }
      if (action === 'close-delete-modal') {
        if (window.closeDeleteModal) window.closeDeleteModal();
        return;
      }
      if (action === 'execute-delete') {
        if (window.executeDelete) window.executeDelete();
        return;
      }
      if (action === 'close-overwrite-modal') {
        const om = document.getElementById('overwrite-confirm-modal') as CustomModalElement | null;
        if (om) om.close();
        return;
      }
      if (action === 'execute-overwrite') {
        if (window._executeOverwrite) window._executeOverwrite();
        return;
      }
    }

    const card = target.closest('.list-card-clickable') as HTMLElement | null;
    if (card && !target.closest('button')) {
      const id = card.getAttribute('data-id') || '';
      const name = card.getAttribute('data-name') || '';
      if (window.openGroupModal) {
        window.openGroupModal(id, name);
      }
    }
  });
});


const gModal = document.getElementById('group-modal') as CustomModalElement | null;

window.openGroupModal = (id: string, name: string) => {
  currentGroupId = id;
  const titleEl = document.getElementById('modal-group-name');
  if (titleEl) titleEl.innerText = name;
  if (gModal) {
    gModal.showModal();
    setTimeout(() => { const closeBtn = document.getElementById('modal-close-btn'); if (closeBtn) closeBtn.focus(); }, 50);
  }
  if (tsControl) tsControl.clear();
  const validFrom = document.getElementById('g-perm-valid-from') as HTMLInputElement | null;
  if (validFrom) validFrom.value = new Date().toISOString().split('T')[0];
  const validTo = document.getElementById('g-perm-valid-to') as HTMLInputElement | null;
  if (validTo) validTo.value = '';
  window.resetGrantButton();
  window.loadGroupPerms(id);
};

window.closeGroupModal = () => { if (gModal) gModal.close(); window.resetGrantButton(); };

window.resetGrantButton = () => {
  const btn = document.getElementById('btn-grant-perm');
  if (btn) { btn.innerHTML = '<span class="material-symbols-outlined">add</span> <span>' + (i18n.btnGrant || 'Grant') + '</span>'; }
  const card = document.getElementById('grant-form-card');
  if (card) { card.classList.remove('blink-active'); }
  if (tsControl) { tsControl.clear(); tsControl.refreshOptions(); }
};

window.highlightGrantForm = () => {
  const btn = document.getElementById('btn-grant-perm');
  if (btn) {
    btn.innerHTML = '<span class="material-symbols-outlined">edit</span> <span>' + (i18n.btnChange || 'Change') + '</span>';
    btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  const card = document.getElementById('grant-form-card');
  if (card) {
    card.classList.remove('blink-active');
    void card.offsetWidth;
    card.classList.add('blink-active');
  }
};

window.editGroupPerm = (appId: string, startTs: number, endTs: number) => {
  if (tsControl) { tsControl.setValue([appId]); }
  const validFrom = document.getElementById('g-perm-valid-from') as HTMLInputElement | null;
  if (validFrom) validFrom.value = new Date(startTs * 1000).toISOString().split('T')[0];
  const validTo = document.getElementById('g-perm-valid-to') as HTMLInputElement | null;
  if (validTo) {
    const isForever = endTs > 2000000000;
    validTo.value = isForever ? '' : new Date(endTs * 1000).toISOString().split('T')[0];
  }
  window.highlightGrantForm();
};

window.loadGroupPerms = (id: string) => {
  fetch('/admin/api/group-details/' + id + '?t=' + new Date().getTime())
    .then((r) => r.json())
    .then((_data: unknown) => { const data = _data as any; window.renderGroupPerms(data.permissions);
      currentGroupPermissions = data.permissions;
    })
    .catch((e) => { console.error(e); });
};

window.renderGroupPerms = (list: PermData[]) => {
  const container = document.getElementById('modal-g-perm-list');
  if (!container) return;
  container.innerHTML = '';
  if (!list || list.length === 0) {
    const empty = document.createElement('div');
    empty.style.textAlign = 'center';
    empty.style.padding = '2rem';
    empty.style.color = '#94a3b8';
    empty.textContent = '(権限なし)';
    container.appendChild(empty);
    return;
  }
  list.forEach((p) => {
    const item = document.createElement('div');
    item.style.padding = '0.75rem 0';
    item.style.borderBottom = '1px solid #f1f5f9';

    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.justifyContent = 'space-between';
    row.style.alignItems = 'center';

    const left = document.createElement('div');
    left.style.display = 'flex';
    left.style.flexDirection = 'column';
    left.style.gap = '0.2rem';

    const title = document.createElement('div');
    title.className = 'item-title';
    title.innerText = p.app_name || 'Unknown';
    left.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'item-sub';
    const dateStrStart = new Date(p.valid_from * 1000).toLocaleDateString();
    const dateStrEnd = new Date(p.valid_to * 1000).toLocaleDateString();
    const isForever = p.valid_to > 2000000000;
    meta.innerHTML = '<div style="display:flex; align-items:center; gap:0.5rem;"><span class="material-symbols-outlined" style="font-size:16px; margin-right:4px;">date_range</span> ' + dateStrStart + ' ～ ' + (isForever ? (i18n.termForever || 'Forever') : dateStrEnd) + '</div>';
    left.appendChild(meta);

    row.appendChild(left);

    const right = document.createElement('div');
    right.style.display = 'flex';
    right.style.gap = '0.5rem';
    right.style.alignItems = 'center';

    const btnEdit = document.createElement('button');
    btnEdit.className = 'action-btn';
    btnEdit.innerHTML = '<span class="material-symbols-outlined">edit</span>';
    btnEdit.onclick = () => { window.editGroupPerm(p.app_id, p.valid_from, p.valid_to); };
    right.appendChild(btnEdit);

    const btnRevoke = document.createElement('button');
    btnRevoke.className = 'action-btn delete';
    btnRevoke.innerHTML = '<span class="material-symbols-outlined">delete</span>';
    btnRevoke.onclick = () => { window.revokeGroupPerm(String(p.id)); };
    right.appendChild(btnRevoke);

    row.appendChild(right);
    item.appendChild(row);
    container.appendChild(item);
  });
};

window.grantGroupPermission = () => {
  const dateVal = (document.getElementById('g-perm-valid-to') as HTMLInputElement).value;
  const startVal = (document.getElementById('g-perm-valid-from') as HTMLInputElement).value;
  const dateStrStart = new Date(startVal).toLocaleDateString();
  const dateStrEnd = dateVal ? new Date(dateVal).toLocaleDateString() : (i18n.termForever || 'Forever');
  let appIds: string[] = [];
  if (tsControl) { appIds = tsControl.getValue(); if (!Array.isArray(appIds)) appIds = [appIds]; }
  else { const appSelect = document.getElementById('g-perm-app-id') as unknown as HTMLSelectElement; if (appSelect.value) appIds = [appSelect.value]; }
  appIds = appIds.filter((id: string) => id !== '');
  if (appIds.length === 0) { window.showAlert(i18n.alertSelectApp || 'Select at least one App'); return; }
  const warningMessages: string[] = [];
  appIds.forEach((id) => {
    const existing = currentGroupPermissions.find((p) => p.app_id === id);
    if (existing) {
      const exStart = new Date(existing.valid_from * 1000).toLocaleDateString();
      const isForever = existing.valid_to > 2000000000;
      const exEnd = isForever ? (i18n.termForever || 'Forever') : new Date(existing.valid_to * 1000).toLocaleDateString();
      warningMessages.push('・' + existing.app_name + ' (' + exStart + ' ～ ' + exEnd + ')');
    }
  });

  const validTo = dateVal ? Math.floor(new Date(dateVal).getTime() / 1000) : Math.floor(Date.now() / 1000) + 315360000;
  const validFrom = startVal ? Math.floor(new Date(startVal).getTime() / 1000) : Math.floor(Date.now() / 1000);

  const doGrant = () => {
    fetch('/admin/api/group/permission/grant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ group_id: currentGroupId, app_ids: appIds, valid_from: validFrom, valid_to: validTo }) })
      .then(() => { window.loadGroupPerms(currentGroupId); if (tsControl) tsControl.clear(); })
      .catch((e) => { console.error(e); console.error('Error: ' + e); });
  };

  if (warningMessages.length > 0) {
    const msgTemplate = i18n.msgOverwriteConfirm || 'Overwrite?\\n{list}';
    const listStr = warningMessages.join('\\n');
    const msg = msgTemplate.replace('{start}', dateStrStart).replace('{end}', dateStrEnd).replace('{list}', listStr);

    const om = document.getElementById('overwrite-confirm-modal') as CustomModalElement | null;
    if (om) {
      document.getElementById('overwrite-msg-text')!.innerText = msg;
      window._executeOverwrite = () => {
        om.close();
        doGrant();
      };
      om.showModal();
      return;
    }
  }
  doGrant();
};

let revokeTargetId: string | null = null;
window.revokeGroupPerm = (pid: string) => {
  revokeTargetId = pid;
  const errEl = document.getElementById('revoke-error-msg');
  if (errEl) errEl.style.display = 'none';
  const rm = document.getElementById('revoke-confirm-modal') as CustomModalElement | null;
  if (rm) {
    rm.showModal();
    setTimeout(() => { const closeBtn = document.getElementById('revoke-close-btn'); if (closeBtn) closeBtn.focus(); }, 50);
  }
};

window.closeRevokeModal = () => {
  const rm = document.getElementById('revoke-confirm-modal') as CustomModalElement | null;
  if (rm) rm.close();
  revokeTargetId = null;
};

window.executeRevoke = () => {
  if (!revokeTargetId) return;
  const errEl = document.getElementById('revoke-error-msg');
  if (errEl) errEl.style.display = 'none';

  fetch('/admin/api/group/permission/revoke', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: revokeTargetId }) })
    .then((r) => {
      if (!r.ok) {
        return r.json().catch(() => ({})).then((err: any) => { throw new Error(err.error || 'Server error ' + r.status); });
      }
      return r.json();
    })
    .then(() => {
      window.closeRevokeModal();
      window.loadGroupPerms(currentGroupId);
    })
    .catch((e) => {
      console.error('Revoke error:', e);
      if (errEl) {
        const tmpl = i18n.alertError || 'Error: {message}';
        errEl.textContent = tmpl.replace('{message}', e.message);
        errEl.style.display = 'block';
      } else {
        console.error('Error: ' + e.message);
      }
    });
};

let deleteTargetId: string | null = null;
window.deleteGroup = (gid: string, e?: Event) => {
  if (e) e.stopPropagation();
  deleteTargetId = gid;
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
  const form = document.getElementById('delete-group-form') as HTMLFormElement | null;
  if (!form) return;
  const input = form.querySelector('input[name="id"]') as HTMLInputElement | null;
  if (input) input.value = deleteTargetId;
  form.submit();
};

window.calcGroupDate = (targetId: string, offset: number, unit: string) => {
  const d = new Date();
  if (unit === 'forever') { const el = document.getElementById(targetId) as HTMLInputElement | null; if (el) el.value = ''; return; }
  if (unit === 'year') { d.setFullYear(d.getFullYear() + offset); }
  else if (unit === 'month') { d.setMonth(d.getMonth() + offset); }
  else if (unit === 'day') { d.setDate(d.getDate() + offset); }
  const el = document.getElementById(targetId) as HTMLInputElement | null;
  if (el) el.value = d.toISOString().split('T')[0];
};

export {}
