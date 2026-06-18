/**
 * ユーザー管理ページ用クライアントスクリプト。
 * ユーザーモーダル、権限付与・取り消し、割当管理、一括操作等を制御。
 */

declare global {
  interface Window {
    isBulkMode: boolean
    openUserModal: (id: string) => void
    closeUserModal: () => void
    refreshUserDetails: () => void
    resetGrantButton: () => void
    highlightGrantForm: () => void
    editPerm: (appId: string, startTs: number, endTs: number) => void
    renderPerms: (list: PermData[]) => void
    switchUserTab: (tab: string) => void
    loadAssignments: (list: AssignmentData[]) => void
    addAssignment: () => void
    removeAssignment: (id: string) => void
    updateRoleOptions: () => void
    grantPermission: () => void
    revokePerm: (pid: string) => void
    closeRevokeModal: () => void
    executeRevoke: () => void
    deleteUser: (id: string) => void
    updateUserGroup: () => void
    handleUserCardClick: (e: Event, id: string) => void
    toggleAllCheckboxes: (source: HTMLInputElement) => void
    calcDate: (targetId: string, offset: number, unit: string) => void
  }
}

interface PermData {
  id: number
  app_id: string
  app_name: string
  valid_from: number
  valid_to: number
  source: 'user' | 'group'
  is_override?: boolean
}

interface AssignmentData {
  id: number
  service_name: string
  role_name: string
  group_name: string | null
  structure_no: string | null
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
let ALL_ROLES: any[] = [];
try {
  const appDataEl = document.getElementById('app-data');
  if (appDataEl) ALL_APPS = JSON.parse(appDataEl.textContent || '[]');
  const roleDataEl = document.getElementById('roles-data');
  if (roleDataEl) ALL_ROLES = JSON.parse(roleDataEl.textContent || '[]');
} catch (e) { console.error(e); }

let tsControl: any = null;
let currentExistingIds: string[] = [];
let currentUserPermissions: PermData[] = [];

// 一括モード
window.isBulkMode = false;

document.addEventListener('DOMContentLoaded', () => {
  if (typeof TomSelect !== 'undefined') {
    tsControl = new TomSelect('#perm-app-id', {
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
  const filterCheck = document.getElementById('exclude-existing-check') as HTMLInputElement | null;
  if (filterCheck) { filterCheck.addEventListener('change', refreshAppOptions); }
});

function refreshAppOptions(): void {
  if (!tsControl) return;
  const exclude = (document.getElementById('exclude-existing-check') as HTMLInputElement).checked;
  tsControl.clearOptions();
  let optionsToShow = ALL_APPS;
  if (exclude) { optionsToShow = ALL_APPS.filter((app: any) => !currentExistingIds.includes(app.value)); }
  tsControl.addOption(optionsToShow);
  tsControl.refreshOptions(false);
}

window.toggleAllCheckboxes = (source: HTMLInputElement) => {
  const checkboxes = document.querySelectorAll('.user-check') as NodeListOf<HTMLInputElement>;
  for (let i = 0; i < checkboxes.length; i++) { checkboxes[i].checked = source.checked; }
};

window.handleUserCardClick = (e: Event, id: string) => {
  const target = e.target as HTMLElement;
  if (target.closest('button') || target.closest('a') || target.tagName === 'INPUT') return;
  if (window.isBulkMode) {
    const cb = document.querySelector('input.user-check[value="' + id + '"]') as HTMLInputElement | null;
    if (cb) cb.checked = !cb.checked;
  } else {
    window.openUserModal(id);
  }
};

window.deleteUser = (id: string) => {
  // TODO: confirmを専用モーダルに置き換える
  if (!confirm(i18n.deleteConfirm || 'Delete?')) return;
  const form = document.getElementById('delete-user-form') as HTMLFormElement | null;
  if (!form) return;
  const input = form.querySelector('input[name="id"]') as HTMLInputElement;
  input.value = id;
  form.submit();
};

const modal = document.getElementById('user-modal') as CustomModalElement | null;
let currentUserId = '';

window.openUserModal = (id: string) => {
  currentUserId = id;
  if (modal) {
    modal.showModal();
    setTimeout(() => { const closeBtn = document.getElementById('modal-close-btn'); if (closeBtn) { closeBtn.focus(); closeBtn.blur(); closeBtn.focus(); } }, 50);
  }
  if (tsControl) tsControl.clear();
  const validFrom = document.getElementById('perm-valid-from') as HTMLInputElement | null;
  if (validFrom) validFrom.value = new Date().toISOString().split('T')[0];
  const validTo = document.getElementById('perm-valid-to') as HTMLInputElement | null;
  if (validTo) validTo.value = '';
  window.resetGrantButton();
  if (window.switchUserTab) window.switchUserTab('permissions');
  window.refreshUserDetails();
};

window.refreshUserDetails = () => {
  if (!currentUserId) return;
  fetch('/admin/api/user-details/' + currentUserId + '?t=' + new Date().getTime())
    .then((r) => r.json())
    .then((data: any) => {
      const emailEl = document.getElementById('modal-user-email');
      if (emailEl) emailEl.innerText = data.email;
      const groupSel = document.getElementById('modal-group-select') as HTMLSelectElement | null;
      if (groupSel) groupSel.value = data.group_id || '';
      window.renderPerms(data.permissions);
      if (window.loadAssignments) window.loadAssignments(data.assignments || []);
      currentUserPermissions = data.permissions;
      currentExistingIds = data.permissions.map((p: PermData) => p.app_id);
      refreshAppOptions();
    })
    .catch((e) => { console.error(e); });
};

window.closeUserModal = () => { if (modal) modal.close(); window.resetGrantButton(); };

window.resetGrantButton = () => {
  const btn = document.getElementById('btn-grant-perm');
  if (btn) { btn.innerHTML = '<span class="material-symbols-outlined">add</span> <span>' + (i18n.btnGrant || 'Grant') + '</span>'; }
  const card = document.getElementById('grant-form-card');
  if (card) { card.classList.remove('blink-active'); }
  if (tsControl) { tsControl.settings.maxItems = null; tsControl.refreshOptions(); }
};

window.highlightGrantForm = () => {
  const btn = document.getElementById('btn-grant-perm');
  if (btn) {
    btn.innerHTML = '<span class="material-symbols-outlined">edit</span> <span>' + (i18n.btnChange || '変更') + '</span>';
    btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  const card = document.getElementById('grant-form-card');
  if (card) {
    card.classList.remove('blink-active');
    void card.offsetWidth;
    card.classList.add('blink-active');
  }
};

window.editPerm = (appId: string, startTs: number, endTs: number) => {
  const filterCheck = document.getElementById('exclude-existing-check') as HTMLInputElement | null;
  if (filterCheck && filterCheck.checked) { filterCheck.checked = false; refreshAppOptions(); }
  if (tsControl) { tsControl.setValue([appId]); }
  const validFrom = document.getElementById('perm-valid-from') as HTMLInputElement | null;
  if (validFrom) validFrom.value = new Date(startTs * 1000).toISOString().split('T')[0];
  const validTo = document.getElementById('perm-valid-to') as HTMLInputElement | null;
  if (validTo) { const isForever = endTs > 2000000000; validTo.value = isForever ? '' : new Date(endTs * 1000).toISOString().split('T')[0]; }
  window.highlightGrantForm();
};

window.renderPerms = (list: PermData[]) => {
  const container = document.getElementById('modal-perm-list');
  if (!container) return;
  container.innerHTML = '';
  if (!list || list.length === 0) {
    const empty = document.createElement('div');
    empty.style.textAlign = 'center';
    empty.style.padding = '2rem';
    empty.style.color = 'var(--text-sub)';
    empty.textContent = i18n.noAffiliation || '(None)';
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
    const dateHtml = dateStrStart + ' ～ ' + (isForever ? (i18n.termForever || 'Forever') : dateStrEnd);
    const sourceIcon = p.source === 'group' ? 'domain' : 'person';
    const sourceText = p.source === 'group' ? (i18n.sourceGroup || 'Group') : (i18n.sourceUser || 'User');
    const sourceColor = p.source === 'group' ? '#94a3b8' : 'var(--primary)';

    meta.innerHTML = '<div style="display:flex; align-items:center; gap:0.5rem;"><span class="material-symbols-outlined" style="font-size:18px; color:' + sourceColor + '">' + sourceIcon + '</span> ' + sourceText + ' : ' + dateHtml + '</div>';
    if (p.is_override) meta.innerHTML += ' <span style="color:#d97706; margin-left:4px;">⚠</span>';
    left.appendChild(meta);

    row.appendChild(left);

    const right = document.createElement('div');
    right.style.display = 'flex';
    right.style.gap = '0.5rem';
    right.style.alignItems = 'center';

    if (p.source === 'user') {
      const btnEdit = document.createElement('button');
      btnEdit.type = 'button';
      btnEdit.className = 'action-btn';
      btnEdit.innerHTML = '<span class="material-symbols-outlined">edit</span>';
      btnEdit.onclick = () => { window.editPerm(p.app_id, p.valid_from, p.valid_to); };
      right.appendChild(btnEdit);
      const btnRevoke = document.createElement('button');
      btnRevoke.type = 'button';
      btnRevoke.className = 'action-btn delete';
      btnRevoke.innerHTML = '<span class="material-symbols-outlined">delete</span>';
      btnRevoke.onclick = () => { window.revokePerm(String(p.id)); };
      right.appendChild(btnRevoke);
    } else {
      right.innerHTML = '<span class="material-symbols-outlined" style="color:#cbd5e1;">lock</span>';
    }
    row.appendChild(right);
    item.appendChild(row);
    container.appendChild(item);
  });
};

window.switchUserTab = (tab: string) => {
  const pTab = document.getElementById('tab-permissions');
  const aTab = document.getElementById('tab-assignments');
  const pBtn = document.getElementById('btn-tab-permissions');
  const aBtn = document.getElementById('btn-tab-assignments');
  if (pTab) pTab.style.display = tab === 'permissions' ? 'block' : 'none';
  if (aTab) aTab.style.display = tab === 'assignments' ? 'block' : 'none';
  if (pBtn) pBtn.className = tab === 'permissions' ? 'btn-tab active' : 'btn-tab';
  if (aBtn) aBtn.className = tab === 'assignments' ? 'btn-tab active' : 'btn-tab';
};

window.loadAssignments = (list: AssignmentData[]) => {
  const container = document.getElementById('modal-assignment-list');
  if (!container) return;
  container.innerHTML = '';
  if (!list || list.length === 0) {
    container.innerHTML = '<div style="text-align:center; padding:2rem; color:#94a3b8;">No assignments</div>';
    return;
  }
  list.forEach((a) => {
    const item = document.createElement('div');
    item.style.padding = '0.75rem 0';
    item.style.borderBottom = '1px solid #f1f5f9';
    item.style.display = 'flex';
    item.style.justifyContent = 'space-between';
    item.style.alignItems = 'center';

    const left = document.createElement('div');
    const title = document.createElement('div');
    title.className = 'item-title';
    title.innerText = a.service_name + ' / ' + a.role_name;
    const sub = document.createElement('div');
    sub.className = 'item-sub';
    sub.innerText = (a.group_name || '-') + ' / ' + (a.structure_no || '-');
    const dateSub = document.createElement('div');
    dateSub.className = 'item-sub';
    const fmt = (ts: number) => new Date(ts * 1000).toLocaleDateString();
    dateSub.innerText = fmt(a.valid_from) + ' - ' + (a.valid_to > 2000000000 ? 'Forever' : fmt(a.valid_to));
    left.appendChild(title);
    left.appendChild(sub);
    left.appendChild(dateSub);

    const right = document.createElement('div');
    const btnRemove = document.createElement('button');
    btnRemove.type = 'button';
    btnRemove.className = 'action-btn delete';
    btnRemove.innerHTML = '<span class="material-symbols-outlined">delete</span>';
    btnRemove.onclick = () => { window.removeAssignment(String(a.id)); };
    right.appendChild(btnRemove);

    item.appendChild(left);
    item.appendChild(right);
    container.appendChild(item);
  });
};

window.addAssignment = () => {
  const sid = (document.getElementById('a-service-id') as HTMLSelectElement).value;
  const gid = (document.getElementById('modal-group-select') as HTMLSelectElement).value;
  const fid = (document.getElementById('a-facility-id') as HTMLSelectElement).value;
  const rid = (document.getElementById('a-role-id') as HTMLSelectElement).value;
  const vf = (document.getElementById('a-valid-from') as HTMLInputElement).value;
  const vt = (document.getElementById('a-valid-to') as HTMLInputElement).value;
  // TODO: alertを専用UIに置き換える
  if (!sid || !fid || !rid) { console.error('必須項目が入力されていません'); return; }

  fetch('/admin/api/am/assignment/add', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: currentUserId, service_id: sid, group_id: gid, facility_id: fid, service_role_id: rid, valid_from: vf, valid_to: vt })
  })
    .then((r) => r.json())
    .then((data: any) => {
      if (data.error) throw new Error(data.error);
      window.refreshUserDetails();
    })
    .catch((e) => { console.error(e); console.error('Error: ' + e.message); });
};

window.removeAssignment = (id: string) => {
  // TODO: confirmを専用モーダルに置き換える
  if (!confirm('本当にこの割当を削除しますか？')) return;
  fetch('/admin/api/am/assignment/remove', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: id })
  })
    .then((r) => r.json())
    .then(() => { window.refreshUserDetails(); })
    .catch((e) => { console.error(e); console.error('Error: ' + e.message); });
};

window.updateRoleOptions = () => {
  const sid = (document.getElementById('a-service-id') as HTMLSelectElement).value;
  const sel = document.getElementById('a-role-id') as HTMLSelectElement;
  sel.innerHTML = '<option value="">-</option>';
  ALL_ROLES.forEach((r: any) => {
    if (r.service_id === sid) {
      const opt = document.createElement('option');
      opt.value = r.id;
      opt.innerText = r.role_name;
      sel.appendChild(opt);
    }
  });
};

window.calcDate = (targetId: string, offset: number, unit: string) => {
  const d = new Date();
  if (unit === 'forever') { const el = document.getElementById(targetId) as HTMLInputElement | null; if (el) el.value = ''; return; }
  if (unit === 'year') { d.setFullYear(d.getFullYear() + offset); }
  else if (unit === 'month') { d.setMonth(d.getMonth() + offset); }
  else if (unit === 'day') { d.setDate(d.getDate() + offset); }
  const el = document.getElementById(targetId) as HTMLInputElement | null;
  if (el) el.value = d.toISOString().split('T')[0];
};

window.grantPermission = () => {
  const dateVal = (document.getElementById('perm-valid-to') as HTMLInputElement).value;
  const startVal = (document.getElementById('perm-valid-from') as HTMLInputElement).value;
  const dateStrStart = new Date(startVal).toLocaleDateString();
  const dateStrEnd = dateVal ? new Date(dateVal).toLocaleDateString() : (i18n.termForever || 'Forever');
  let appIds: string[] = [];
  if (tsControl) { appIds = tsControl.getValue(); if (!Array.isArray(appIds)) appIds = [appIds]; }
  else { const appSelect = document.getElementById('perm-app-id') as HTMLSelectElement; if (appSelect.value) appIds = [appSelect.value]; }
  appIds = appIds.filter((id: string) => id !== '');
  // TODO: alertを専用UIに置き換える
  if (appIds.length === 0) { console.error(i18n.alertSelectApp || 'Select at least one App'); return; }
  const warningMessages: string[] = [];
  appIds.forEach((id) => {
    const existing = currentUserPermissions.find((p) => p.app_id === id && p.source === 'user');
    if (existing) {
      const exStart = new Date(existing.valid_from * 1000).toLocaleDateString();
      const isForever = existing.valid_to > 2000000000;
      const exEnd = isForever ? (i18n.termForever || 'Forever') : new Date(existing.valid_to * 1000).toLocaleDateString();
      warningMessages.push('・' + existing.app_name + ' (' + exStart + ' ～ ' + exEnd + ')');
    }
  });
  if (warningMessages.length > 0) {
    const msgTemplate = i18n.msgOverwriteConfirm || 'Overwrite?\\n{list}';
    const listStr = warningMessages.join('\\n');
    const msg = msgTemplate.replace('{start}', dateStrStart).replace('{end}', dateStrEnd).replace('{list}', listStr);
    // TODO: confirmを専用モーダルに置き換える
    if (!confirm(msg)) return;
  }
  const validTo = dateVal ? Math.floor(new Date(dateVal).getTime() / 1000) : Math.floor(Date.now() / 1000) + 315360000;
  const validFrom = startVal ? Math.floor(new Date(startVal).getTime() / 1000) : Math.floor(Date.now() / 1000);
  fetch('/admin/api/user/permission/grant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: currentUserId, app_ids: appIds, valid_from: validFrom, valid_to: validTo }) })
    .then((r) => r.json())
    .then(() => { window.openUserModal(currentUserId); window.resetGrantButton(); })
    .catch((e) => {
      console.error(e);
      const tmpl = i18n.alertError || 'Error: {message}';
      console.error(tmpl.replace('{message}', e));
    });
};

let revokeTargetId: string | null = null;
window.revokePerm = (pid: string) => {
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

  fetch('/admin/api/user/permission/revoke', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: revokeTargetId }) })
    .then((r) => {
      if (!r.ok) {
        return r.json().catch(() => ({})).then((err: any) => { throw new Error(err.error || 'Server error ' + r.status); });
      }
      return r.json();
    })
    .then(() => {
      window.closeRevokeModal();
      window.openUserModal(currentUserId);
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

window.updateUserGroup = () => {
  const gid = (document.getElementById('modal-group-select') as HTMLSelectElement).value;
  fetch('/admin/api/user/group', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: currentUserId, group_id: gid }) })
    .then((r) => { if (!r.ok) { return r.json().catch(() => ({})).then((err: any) => { throw new Error(err.error || 'Server returned ' + r.status); }); } return r.json(); })
    .then(() => { window.closeUserModal(); window.location.reload(); })
    .catch((e) => {
      const tmpl = i18n.alertUpdateFail || 'Update failed: {message}';
      console.error(tmpl.replace('{message}', e.message));
      console.error(e);
    });
};

// 一括モードUI切替
const bulkBtn = document.getElementById('toggleBulkMode');
const controls = document.getElementById('bulkControls');
const selectAllContainer = document.getElementById('selectAllContainer');

if (bulkBtn) {
  bulkBtn.addEventListener('click', (e) => {
    e.preventDefault();
    window.isBulkMode = !window.isBulkMode;

    const iconName = window.isBulkMode ? 'close' : 'bolt';
    const text = window.isBulkMode ? (i18n.btnExit || 'Exit') : (i18n.btnEnter || 'Bulk Mode');

    bulkBtn.innerHTML = '<span class="material-symbols-outlined">' + iconName + '</span> ' + text;

    if (controls) controls.style.display = window.isBulkMode ? 'block' : 'none';
    if (selectAllContainer) selectAllContainer.style.display = window.isBulkMode ? 'block' : 'none';

    document.querySelectorAll('.col-select').forEach((el) => { (el as HTMLElement).style.display = window.isBulkMode ? 'table-cell' : 'none'; });
  });
}

export {}
