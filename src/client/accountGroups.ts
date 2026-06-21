/**
 * アカウントグループ管理ページ用のクライアントサイドスクリプト。
 *
 * このファイルは esbuild で IIFE にバンドルされ、SSR HTML の <script> タグ内に
 * インライン展開されてブラウザ上で実行される。
 */

// サーバー側HTMLが埋め込むグローバル変数・DOM型の拡張
declare global {
  interface Window {
    showAlert: (msg: string) => void;
    showConfirm: (msg: string, cb: () => void) => void;
    TomSelect?: any;
    tomSelects?: Record<string, any>
    openGroupModal: (id: string, name: string, parentId?: string) => void
    closeGroupModal: () => void
    saveParent: () => void
    resetAddButton: () => void
    highlightAddForm: () => void
    editMember: (userId: string, ga: number, ba: number, dev: number, startTs: number, endTs: number) => void
    loadMembers: (id: string) => void
    renderMembers: (list?: any) => void
    switchTab: (tab: string) => void
    loadAllFacilitiesForMove: (groupIdToExclude?: string) => void
    loadFacilities: (id: string) => void
    renderFacilities: (list?: any) => void
    addFacility: () => void
    moveFacility: () => void
    removeFacility: (fid: any) => void
    closeRemoveFacModal: () => void
    executeRemoveFac: () => void
    removeGrant: (gid: any) => void
    addGrant: () => void
    loadGrants: (id: string) => void
    renderGrants: (list?: any) => void
    addMembers: () => void
    removeMember: (mid: string) => void
    closeRemoveModal: () => void
    executeRemove: () => void
    deleteGroup: (gid: string, e?: Event) => void
    closeDeleteModal: () => void
    executeDelete: () => void
    calcDate: (targetId: string, offset: number, unit: string) => void
  }
}

interface MemberData {
  id: number
  user_id: string
  email: string
  name: string | null
  is_group_admin: number
  is_billing_admin: number
  is_developer: number
  valid_from: number
  valid_to: number
}

interface FacilityData {
  id: string
  structure_no: string | null
  building_use: string | null
  managing_group_id: string
}

interface GrantData {
  id: number
  service_name: string
  seat_limit: number | null
  valid_from: number
  valid_to: number
}

// HTMLエスケープ関数: innerHTML連結時にXSSを防止する
function escapeHtml(v: unknown): string {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// i18nデータをHTMLの data 属性から取得
const i18nEl = document.getElementById('i18n-data') as HTMLElement | null;
const i18n: DOMStringMap = i18nEl ? i18nEl.dataset : {} as DOMStringMap;

// TomSelectインスタンス
let tsControl: any = null;
let tsControlParentNew: any = null;
let tsControlParentEdit: any = null;
let tsControlMoveFacility: any = null;
let tsControlMoveSourceGroup: any = null;

// 現在開いているグループの状態
let currentGroupId = '';
let currentMembers: MemberData[] = [];
let currentFacilities: FacilityData[] = [];

document.addEventListener('DOMContentLoaded', () => {
  if (typeof TomSelect !== 'undefined') {
    tsControl = new TomSelect('#m-user-id', {
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

    const newParentEl = document.getElementById('new-group-parent');
    if (newParentEl) {
      tsControlParentNew = new TomSelect('#new-group-parent', {
        controlInput: '<input type="text" autocomplete="off" data-lpignore="true" data-1p-ignore="true" data-bwignore="true" />',
        create: false,
        sortField: { field: '$order' },
        placeholder: i18n.placeholderSearch || '検索...',
        allowEmptyOption: true
      });
    }
    const editParentEl = document.getElementById('m-parent');
    if (editParentEl) {
      tsControlParentEdit = new TomSelect('#m-parent', {
        controlInput: '<input type="text" autocomplete="off" data-lpignore="true" data-1p-ignore="true" data-bwignore="true" />',
        create: false,
        sortField: { field: '$order' },
        placeholder: i18n.placeholderSearch || '検索...',
        allowEmptyOption: true
      });
    }
  }

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (!target) return;
    const actionEl = target.closest('[data-action]') as HTMLElement | null;
    if (!actionEl) return;
    const action = actionEl.getAttribute('data-action');
    if (!action) return;

    if (action === 'open-new-group-modal') {
      const modal = document.getElementById('new-group-modal') as CustomModalElement | null;
      if (modal) modal.showModal();
      return;
    }
    if (action === 'open-group-modal') {
      const id = actionEl.getAttribute('data-id') || '';
      const name = actionEl.getAttribute('data-name') || '';
      const parentId = actionEl.getAttribute('data-parent-id') || '';
      window.openGroupModal(id, name, parentId);
      return;
    }
    if (action === 'delete-group') {
      e.stopPropagation();
      const id = actionEl.getAttribute('data-id') || '';
      window.deleteGroup(id);
      return;
    }
    if (action === 'save-parent') {
      window.saveParent();
      return;
    }
    if (action === 'switch-tab') {
      const tab = actionEl.getAttribute('data-tab') || '';
      window.switchTab(tab);
      return;
    }
    if (action === 'calc-date') {
      const targetId = actionEl.getAttribute('data-target') || '';
      const offset = parseInt(actionEl.getAttribute('data-offset') || '0', 10);
      const unit = actionEl.getAttribute('data-unit') || '';
      window.calcDate(targetId, offset, unit);
      return;
    }
    if (action === 'add-members') {
      window.addMembers();
      return;
    }
    if (action === 'add-facility') {
      window.addFacility();
      return;
    }
    if (action === 'move-facility') {
      window.moveFacility();
      return;
    }
    if (action === 'add-grant') {
      window.addGrant();
      return;
    }
    if (action === 'close-remove-modal') {
      window.closeRemoveModal();
      return;
    }
    if (action === 'execute-remove') {
      window.executeRemove();
      return;
    }
    if (action === 'close-remove-fac-modal') {
      window.closeRemoveFacModal();
      return;
    }
    if (action === 'execute-remove-fac') {
      window.executeRemoveFac();
      return;
    }
    if (action === 'close-delete-modal') {
      window.closeDeleteModal();
      return;
    }
    if (action === 'execute-delete') {
      window.executeDelete();
      return;
    }
  });
});

const gModal = document.getElementById('group-modal') as CustomModalElement | null;

window.openGroupModal = (id: string, name: string, parentId?: string) => {
  currentGroupId = id;
  const titleEl = document.getElementById('modal-group-name');
  if (titleEl) titleEl.innerText = name;

  // 親グループ選択: 現在値をセットし、自分自身は親候補から無効化
  const parentSel = document.getElementById('m-parent') as HTMLSelectElement | null;
  if (parentSel) {
    for (let i = 0; i < parentSel.options.length; i++) {
      parentSel.options[i].disabled = (parentSel.options[i].value === id);
    }
    if (tsControlParentEdit) {
      tsControlParentEdit.sync();
      tsControlParentEdit.setValue(parentId || '');
    } else {
      parentSel.value = parentId || '';
    }
  }
  if (gModal) {
    gModal.showModal();
    setTimeout(() => { const b = document.getElementById('modal-close-btn'); if (b) b.focus(); }, 50);
  }
  if (tsControl) tsControl.clear();
  ['chk_group_admin', 'chk_billing_admin', 'chk_developer'].forEach((cid) => {
    const e = document.getElementById(cid) as HTMLInputElement | null;
    if (e) e.checked = false;
  });
  const vf = document.getElementById('m-valid-from') as HTMLInputElement | null;
  if (vf) vf.value = new Date().toISOString().split('T')[0];
  const vt = document.getElementById('m-valid-to') as HTMLInputElement | null;
  if (vt) vt.value = '';
  window.resetAddButton();
  window.loadMembers(id);
  window.loadFacilities(id);
  if (window.loadAllFacilitiesForMove) window.loadAllFacilitiesForMove();
  window.loadGrants(id);
  if (window.switchTab) window.switchTab('members');
};

window.closeGroupModal = () => { if (gModal) gModal.close(); window.resetAddButton(); };

window.saveParent = () => {
  const pid = tsControlParentEdit
    ? tsControlParentEdit.getValue()
    : ((document.getElementById('m-parent') as HTMLSelectElement | null)?.value ?? '');
  window.showConfirm(i18n.moveWarn || 'Moving this group revokes all license grants held by it and its descendants. They must be re-distributed from the new parent. Continue?', () => {
    fetch('/admin/am/groups/parent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: currentGroupId, parent_id: pid }) })
      .then((r) => { if (!r.ok) { return r.json().catch(() => ({})).then((e: any) => { throw new Error(e.error || 'err'); }); } return r.json(); })
      .then(() => { window.location.reload(); })
      .catch((e) => {
        if (e.message === 'cycle' || e.message === 'self') {
          const msg = i18n.alertCycle || 'Cannot set this parent.';
          console.error(msg);
          if (window.showAlert) window.showAlert(msg);
        } else {
          const msg = 'Error: ' + e.message;
          console.error(msg);
          if (window.showAlert) window.showAlert(msg);
        }
      });
  });
};

window.resetAddButton = () => {
  const btn = document.getElementById('btn-add-member');
  if (btn) { btn.innerHTML = '<span class="material-symbols-outlined">person_add</span> <span>' + (i18n.btnAdd || 'Add') + '</span>'; }
  const card = document.getElementById('add-form-card');
  if (card) { card.classList.remove('blink-active'); }
  if (tsControl) { tsControl.clear(); tsControl.refreshOptions(); }
};

window.highlightAddForm = () => {
  const btn = document.getElementById('btn-add-member');
  if (btn) {
    btn.innerHTML = '<span class="material-symbols-outlined">edit</span> <span>' + (i18n.btnChange || 'Change') + '</span>';
    btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  const card = document.getElementById('add-form-card');
  if (card) { card.classList.remove('blink-active'); void card.offsetWidth; card.classList.add('blink-active'); }
};

window.editMember = (userId: string, ga: number, ba: number, dev: number, startTs: number, endTs: number) => {
  if (tsControl) { tsControl.setValue([userId]); }
  const cga = document.getElementById('chk_group_admin') as HTMLInputElement | null; if (cga) cga.checked = !!ga;
  const cba = document.getElementById('chk_billing_admin') as HTMLInputElement | null; if (cba) cba.checked = !!ba;
  const cdv = document.getElementById('chk_developer') as HTMLInputElement | null; if (cdv) cdv.checked = !!dev;
  const vf = document.getElementById('m-valid-from') as HTMLInputElement | null; if (vf) vf.value = new Date(startTs * 1000).toISOString().split('T')[0];
  const vt = document.getElementById('m-valid-to') as HTMLInputElement | null;
  if (vt) { const isForever = endTs > 2000000000; vt.value = isForever ? '' : new Date(endTs * 1000).toISOString().split('T')[0]; }
  window.highlightAddForm();
};

window.loadMembers = (id: string) => {
  fetch('/admin/api/am/group-members/' + id + '?t=' + new Date().getTime())
    .then((r) => r.json())
    .then((data) => { currentMembers = data.members || []; window.renderMembers(currentMembers); })
    .catch((e) => { console.error(e); });
};

window.renderMembers = (list: MemberData[]) => {
  const container = document.getElementById('modal-member-list');
  if (!container) return;
  container.innerHTML = '';
  if (!list || list.length === 0) {
    const empty = document.createElement('div');
    empty.style.textAlign = 'center';
    empty.style.padding = '2rem';
    empty.style.color = '#94a3b8';
    empty.textContent = i18n.noMembers || '(No members)';
    container.appendChild(empty);
    return;
  }
  list.forEach((m) => {
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
    left.style.gap = '0.25rem';

    const titleWrap = document.createElement('div');
    titleWrap.style.display = 'flex';
    titleWrap.style.alignItems = 'center';
    titleWrap.style.gap = '0.5rem';

    const title = document.createElement('div');
    title.className = 'item-title';
    title.innerText = m.name ? m.name : m.email;
    titleWrap.appendChild(title);

    // 兼任可能。保持しているフラグごとにバッジを並べる。すべて 0 ならメンバー。
    function addBadge(label: string, color: string, bg: string) {
      const b = document.createElement('span');
      b.textContent = label;
      b.style.fontSize = '0.72rem';
      b.style.fontWeight = '700';
      b.style.padding = '2px 8px';
      b.style.borderRadius = '999px';
      b.style.marginRight = '4px';
      b.style.color = color;
      b.style.background = bg;
      titleWrap.appendChild(b);
    }
    let anyRole = false;
    if (m.is_billing_admin) { addBadge(i18n.roleBilling || 'Billing Admin', '#5b21b6', '#ede9fe'); anyRole = true; }
    if (m.is_group_admin) { addBadge(i18n.roleAdmin || 'Group Admin', '#9a3412', '#ffedd5'); anyRole = true; }
    if (m.is_developer) { addBadge(i18n.roleDeveloper || 'Developer', '#0e7490', '#cffafe'); anyRole = true; }
    if (!anyRole) { addBadge(i18n.roleMember || 'Member', '#475569', '#f1f5f9'); }
    left.appendChild(titleWrap);

    const meta = document.createElement('div');
    meta.className = 'item-sub';
    meta.style.fontSize = '0.85rem';
    meta.style.color = '#64748b';
    const dStart = new Date(m.valid_from * 1000).toLocaleDateString();
    const isForever = m.valid_to > 2000000000;
    const dEnd = isForever ? (i18n.termForever || 'Forever') : new Date(m.valid_to * 1000).toLocaleDateString();
    const sub = m.name ? (escapeHtml(m.email) + ' · ') : '';
    meta.innerHTML = '<div style="display:flex; align-items:center; gap:0.4rem;"><span class="material-symbols-outlined" style="font-size:16px;">date_range</span> ' + sub + dStart + ' ～ ' + dEnd + '</div>';
    left.appendChild(meta);

    row.appendChild(left);

    const right = document.createElement('div');
    right.style.display = 'flex';
    right.style.gap = '0.5rem';
    right.style.alignItems = 'center';

    const btnEdit = document.createElement('button');
    btnEdit.type = 'button';
    btnEdit.className = 'action-btn';
    btnEdit.innerHTML = '<span class="material-symbols-outlined">edit</span>';
    btnEdit.onclick = () => { window.editMember(m.user_id, m.is_group_admin, m.is_billing_admin, m.is_developer, m.valid_from, m.valid_to); };
    right.appendChild(btnEdit);

    const btnRemove = document.createElement('button');
    btnRemove.type = 'button';
    btnRemove.className = 'action-btn delete';
    btnRemove.innerHTML = '<span class="material-symbols-outlined">person_remove</span>';
    btnRemove.onclick = () => { window.removeMember(String(m.id)); };
    right.appendChild(btnRemove);

    row.appendChild(right);
    item.appendChild(row);
    container.appendChild(item);
  });
};

window.switchTab = (tab: string) => {
  const tabs = ['members', 'facilities', 'grants'];
  tabs.forEach((t) => {
    const content = document.getElementById('tab-' + t);
    const btn = document.getElementById('btn-tab-' + t);
    if (content) content.style.display = (tab === t) ? 'block' : 'none';
    if (btn) {
      if (tab === t) btn.classList.add('active');
      else btn.classList.remove('active');
    }
  });
};

window.loadAllFacilitiesForMove = () => {
  const sourceSelect = document.getElementById('f-move-source-group');
  const facilitySelect = document.getElementById('f-move-id');
  if (!sourceSelect || !facilitySelect) return;

  if (!tsControlMoveFacility && typeof TomSelect !== 'undefined') {
    tsControlMoveFacility = new TomSelect('#f-move-id', {
      valueField: 'value',
      labelField: 'text',
      searchField: ['text'],
      maxOptions: 2000,
      placeholder: i18n.placeholderSelect || '施設を選択...',
      create: false
    });
    if (!window.tomSelects) window.tomSelects = {};
    window.tomSelects['f-move-id'] = tsControlMoveFacility;
  }

  if (!tsControlMoveSourceGroup && typeof TomSelect !== 'undefined') {
    tsControlMoveSourceGroup = new TomSelect('#f-move-source-group', {
      create: false,
      onChange: (value: string) => {
        tsControlMoveFacility.clearOptions();
        tsControlMoveFacility.clear();
        if (!value) return;

        fetch('/admin/api/am/group-facilities/' + encodeURIComponent(value) + '?t=' + new Date().getTime())
          .then((r) => r.json())
          .then((data) => {
            if (data.facilities) {
              data.facilities.forEach((f: FacilityData) => {
                if (f.managing_group_id === currentGroupId) return; // 自分のグループの施設は移動候補に出さない
                const label = (f.structure_no || '') + ' ' + (f.building_use || '');
                tsControlMoveFacility.addOption({ value: f.id, text: label });
              });
              tsControlMoveFacility.refreshOptions(false);
            }
          });
      }
    });
    if (!window.tomSelects) window.tomSelects = {};
    window.tomSelects['f-move-source-group'] = tsControlMoveSourceGroup;
  } else if (tsControlMoveSourceGroup) {
    // 再読み込み時はいったんクリアしてユーザーに再度選ばせる
    tsControlMoveSourceGroup.clear();
    if (tsControlMoveFacility) {
      tsControlMoveFacility.clearOptions();
      tsControlMoveFacility.clear();
    }
  }
};

window.loadFacilities = (id: string) => {
  fetch('/admin/api/am/group-facilities/' + id + '?t=' + new Date().getTime())
    .then((r) => r.json())
    .then((data) => { currentFacilities = data.facilities || []; window.renderFacilities(currentFacilities); })
    .catch((e) => { console.error(e); });
};

window.renderFacilities = (list: FacilityData[]) => {
  const container = document.getElementById('modal-facility-list');
  if (!container) return;
  container.innerHTML = '';
  if (!list || list.length === 0) {
    const empty = document.createElement('div');
    empty.style.textAlign = 'center';
    empty.style.padding = '2rem';
    empty.style.color = '#94a3b8';
    empty.textContent = i18n.noFacilities || '(No facilities)';
    container.appendChild(empty);
    return;
  }
  list.forEach((f) => {
    const item = document.createElement('div');
    item.style.padding = '0.75rem 0';
    item.style.borderBottom = '1px solid #f1f5f9';
    item.style.display = 'flex';
    item.style.justifyContent = 'space-between';
    item.style.alignItems = 'center';

    const left = document.createElement('div');
    left.className = 'item-title';
    left.innerText = f.structure_no || '(No ID)';
    const sub = document.createElement('div');
    sub.className = 'item-sub';
    sub.innerText = f.building_use || '';
    left.appendChild(sub);

    const right = document.createElement('div');
    const btnRemove = document.createElement('button');
    btnRemove.type = 'button';
    btnRemove.className = 'action-btn delete';
    btnRemove.innerHTML = '<span class="material-symbols-outlined">delete</span>';
    btnRemove.onclick = () => { window.removeFacility(f.id); };
    right.appendChild(btnRemove);

    item.appendChild(left);
    item.appendChild(right);
    container.appendChild(item);
  });
};

window.addFacility = () => {
  const no = (document.getElementById('f-structure-no') as HTMLInputElement).value;
  const use = (document.getElementById('f-building-use') as HTMLInputElement).value;
  if (!no) { console.error('Required'); return; }
  fetch('/admin/api/am/facility/add', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ managing_group_id: currentGroupId, structure_no: no, building_use: use })
  })
    .then((r) => { if (!r.ok) { return r.json().catch(() => ({})).then((e: any) => { throw new Error(e.error || 'Server error'); }); } return r.json(); })
    .then(() => {
      (document.getElementById('f-structure-no') as HTMLInputElement).value = '';
      (document.getElementById('f-building-use') as HTMLInputElement).value = '';
      window.loadFacilities(currentGroupId);
      if (window.loadAllFacilitiesForMove) window.loadAllFacilitiesForMove();
    })
    .catch((e) => { console.error(e); if (window.showAlert) window.showAlert(e.message || 'Error'); });
};

window.moveFacility = () => {
  const facilityId = (document.getElementById('f-move-id') as HTMLInputElement).value;
  if (!facilityId) { console.error('Facility required'); return; }
  fetch('/admin/api/am/facility/move', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ managing_group_id: currentGroupId, facility_id: facilityId })
  })
    .then((r) => { if (!r.ok) { return r.json().catch(() => ({})).then((e: any) => { throw new Error(e.error || 'Server error'); }); } return r.json(); })
    .then(() => {
      if (window.tomSelects && window.tomSelects['f-move-id']) {
        window.tomSelects['f-move-id'].clear();
      } else {
        (document.getElementById('f-move-id') as HTMLInputElement).value = '';
      }
      window.loadFacilities(currentGroupId);
      if (window.loadAllFacilitiesForMove) window.loadAllFacilitiesForMove();
    })
    .catch((e) => { console.error(e); if (window.showAlert) window.showAlert(e.message || 'Error'); });
};

let removeFacTargetId: string | null = null;
window.removeFacility = (fid: string) => {
  removeFacTargetId = fid;
  const rm = document.getElementById('remove-fac-modal') as CustomModalElement | null;
  if (rm) rm.showModal();
};
window.closeRemoveFacModal = () => {
  const rm = document.getElementById('remove-fac-modal') as CustomModalElement | null;
  if (rm) rm.close();
  removeFacTargetId = null;
};
window.executeRemoveFac = () => {
  if (!removeFacTargetId) return;
  fetch('/admin/api/am/facility/remove', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: removeFacTargetId }) })
    .then((r) => { if (!r.ok) { return r.json().catch(() => ({})).then((e: any) => { throw new Error(e.error || 'Server error'); }); } return r.json(); })
    .then(() => { window.closeRemoveFacModal(); window.loadFacilities(currentGroupId); })
    .catch((e) => { console.error(e); console.error('Error: ' + e.message); if (window.showAlert) window.showAlert(e.message || 'Error'); });
};

window.removeGrant = (gid: string) => {
  window.showConfirm('本当にこの利用枠を削除しますか？', () => {
    fetch('/admin/api/am/grant/remove', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: gid }) })
      .then((r) => { if (!r.ok) throw new Error('err'); return r.json(); })
      .then(() => { window.loadGrants(currentGroupId); })
      .catch((e) => { console.error(e); console.error('Error: ' + e.message); if (window.showAlert) window.showAlert(e.message || 'Error'); });
  });
};

window.addGrant = () => {
  const cid = (document.getElementById('g-contract-id') as HTMLSelectElement).value;
  const seats = (document.getElementById('g-seat-limit') as HTMLInputElement).value;
  const vf = (document.getElementById('g-valid-from') as HTMLInputElement).value;
  const vt = (document.getElementById('g-valid-to') as HTMLInputElement).value;
  if (!cid) return;
  fetch('/admin/api/am/grant/add', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ group_id: currentGroupId, contract_id: cid, seat_limit: seats, valid_from: vf, valid_to: vt })
  })
    .then((r) => { if (!r.ok) throw new Error('err'); return r.json(); })
    .then(() => { window.loadGrants(currentGroupId); })
    .catch((e) => { console.error(e); console.error('Error: ' + e.message); if (window.showAlert) window.showAlert(e.message || 'Error'); });
};

window.loadGrants = (id: string) => {
  fetch('/admin/api/am/group-grants/' + id + '?t=' + new Date().getTime())
    .then((r) => r.json())
    .then((data) => { window.renderGrants(data.grants || []); });
};

window.renderGrants = (list: GrantData[]) => {
  const container = document.getElementById('modal-grant-list');
  if (!container) return;
  container.innerHTML = '';
  if (!list || list.length === 0) {
    container.innerHTML = '<div style="text-align:center; padding:2rem; color:#94a3b8;">No grants</div>';
    return;
  }
  list.forEach((g) => {
    const item = document.createElement('div');
    item.style.padding = '0.75rem 0';
    item.style.borderBottom = '1px solid #f1f5f9';
    item.style.display = 'flex';
    item.style.justifyContent = 'space-between';
    item.style.alignItems = 'center';

    const left = document.createElement('div');
    left.className = 'item-title';
    left.innerText = g.service_name || '';
    const sub = document.createElement('div');
    sub.className = 'item-sub';
    const sLimit = g.seat_limit == null ? '無制限' : g.seat_limit + '枠';
    const fmt = (ts: number) => new Date(ts * 1000).toLocaleDateString();
    sub.innerText = sLimit + ' (' + fmt(g.valid_from) + ' - ' + fmt(g.valid_to) + ')';
    left.appendChild(sub);

    const right = document.createElement('div');
    const btnRemove = document.createElement('button');
    btnRemove.type = 'button';
    btnRemove.className = 'action-btn delete';
    btnRemove.innerHTML = '<span class="material-symbols-outlined">delete</span>';
    btnRemove.onclick = () => { window.removeGrant(String(g.id)); };
    right.appendChild(btnRemove);

    item.appendChild(left);
    item.appendChild(right);
    container.appendChild(item);
  });
};

window.addMembers = () => {
  let userIds: string[] = [];
  if (tsControl) { userIds = tsControl.getValue(); if (!Array.isArray(userIds)) userIds = [userIds]; }
  userIds = userIds.filter((id: string) => id !== '');
  if (userIds.length === 0) { console.error(i18n.alertSelectUser || 'Select at least one user'); return; }
  const isGroupAdmin = !!(document.getElementById('chk_group_admin') as HTMLInputElement | null)?.checked;
  const isBillingAdmin = !!(document.getElementById('chk_billing_admin') as HTMLInputElement | null)?.checked;
  const isDeveloper = !!(document.getElementById('chk_developer') as HTMLInputElement | null)?.checked;
  const startVal = (document.getElementById('m-valid-from') as HTMLInputElement).value;
  const endVal = (document.getElementById('m-valid-to') as HTMLInputElement).value;
  const validFrom = startVal ? Math.floor(new Date(startVal).getTime() / 1000) : Math.floor(Date.now() / 1000);
  const validTo = endVal ? Math.floor(new Date(endVal).getTime() / 1000) : Math.floor(Date.now() / 1000) + 315360000;
  fetch('/admin/api/am/membership/add', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ group_id: currentGroupId, user_ids: userIds, is_group_admin: isGroupAdmin, is_billing_admin: isBillingAdmin, is_developer: isDeveloper, valid_from: validFrom, valid_to: validTo })
  })
    .then((r) => { if (!r.ok) { return r.json().catch(() => ({})).then((e: any) => { throw new Error(e.error || 'Server error ' + r.status); }); } return r.json(); })
    .then(() => { window.resetAddButton(); window.loadMembers(currentGroupId); })
    .catch((e) => { console.error(e); console.error('Error: ' + e.message); if (window.showAlert) window.showAlert(e.message || 'Error'); });
};

let removeTargetId: string | null = null;
window.removeMember = (mid: string) => {
  removeTargetId = mid;
  const rm = document.getElementById('remove-confirm-modal') as CustomModalElement | null;
  if (rm) rm.showModal();
};
window.closeRemoveModal = () => {
  const rm = document.getElementById('remove-confirm-modal') as CustomModalElement | null;
  if (rm) rm.close();
  removeTargetId = null;
};
window.executeRemove = () => {
  if (!removeTargetId) return;
  fetch('/admin/api/am/membership/remove', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: removeTargetId }) })
    .then((r) => { if (!r.ok) { return r.json().catch(() => ({})).then((e: any) => { throw new Error(e.error || 'Server error ' + r.status); }); } return r.json(); })
    .then(() => { window.closeRemoveModal(); window.loadMembers(currentGroupId); })
    .catch((e) => { console.error(e); console.error('Error: ' + e.message); if (window.showAlert) window.showAlert(e.message || 'Error'); });
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

window.calcDate = (targetId: string, offset: number, unit: string) => {
  const d = new Date();
  if (unit === 'forever') { const el = document.getElementById(targetId) as HTMLInputElement | null; if (el) el.value = ''; return; }
  if (unit === 'year') { d.setFullYear(d.getFullYear() + offset); }
  else if (unit === 'month') { d.setMonth(d.getMonth() + offset); }
  else if (unit === 'day') { d.setDate(d.getDate() + offset); }
  const el = document.getElementById(targetId) as HTMLInputElement | null;
  if (el) el.value = d.toISOString().split('T')[0];
};

export {}
