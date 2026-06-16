import { html, raw } from 'hono/html'
import { css, keyframes } from 'hono/css'
import { Layout } from './Layout'
import { dict } from '../../i18n'
import { Group, User, SystemConfig } from '../../types'
import { Modal } from '../components/Modal'
import { Button } from '../components/Button'
import { MultiSelect } from '../components/MultiSelect'

interface Props {
  t: typeof dict.en
  userEmail: string
  // グループ一覧（メンバー数つき）
  groups: (Group & { member_count?: number })[]
  // メンバー追加候補のユーザー全件
  users: User[]
  siteName: string
  appConfig: SystemConfig
}

export const AccountGroupsPage = (props: Props) => {
  const t = props.t
  // ユーザー選択(TomSelect)用の選択肢。表示は「名前 <email>」または email のみ。
  const userOptions = props.users.map(u => ({
    value: u.id,
    text: u.name ? `${u.name} <${u.email}>` : u.email,
  }))
  const allUsersJson = JSON.stringify(userOptions)

  // 親子(parent_id)からツリーを構築し、深さつきのフラット配列にする。
  // 親が存在しない/未設定のものは最上位として扱う。兄弟は名前順。
  const byId = new Map(props.groups.map(g => [g.id, g]))
  const childrenMap = new Map<string, (Group & { member_count?: number })[]>()
  for (const g of props.groups) {
    const key = g.parent_id && byId.has(g.parent_id) ? g.parent_id : '__root__'
    if (!childrenMap.has(key)) childrenMap.set(key, [])
    childrenMap.get(key)!.push(g)
  }
  for (const arr of childrenMap.values()) arr.sort((a, b) => a.name.localeCompare(b.name))
  const flatTree: { g: Group & { member_count?: number }; depth: number }[] = []
  const walk = (key: string, depth: number) => {
    for (const g of childrenMap.get(key) || []) {
      flatTree.push({ g, depth })
      walk(g.id, depth + 1)
    }
  }
  walk('__root__', 0)
  // 親選択プルダウン用（全グループ、名前順）。
  const parentOptions = props.groups.slice().sort((a, b) => a.name.localeCompare(b.name))

  const scriptContent = raw(`
    (function() {
        var i18nEl = document.getElementById('i18n-data');
        var i18n = i18nEl ? i18nEl.dataset : {};
        var tsControl = null;
        var tsControlParentNew = null;
        var tsControlParentEdit = null;
        var currentGroupId = '';
        var currentMembers = [];
        var currentFacilities = [];

        document.addEventListener('DOMContentLoaded', function() {
            if (typeof TomSelect !== 'undefined') {
                tsControl = new TomSelect('#m-user-id', {
                    plugins: ['remove_button'],
                    create: false,
                    maxItems: null,
                    placeholder: i18n.placeholderSelect || 'Select...',
                    render: {
                        option: function(data, escape) { return '<div>' + escape(data.text) + '</div>'; },
                        item: function(data, escape) { return '<div>' + escape(data.text) + '</div>'; },
                        no_results: function(data, escape) {
                            return '<div class="no-results">' + (i18n.textNoResults || 'No results found') + '</div>';
                        }
                    }
                });
                
                var newParentEl = document.getElementById('new-group-parent');
                if (newParentEl) {
                    tsControlParentNew = new TomSelect('#new-group-parent', {
                        create: false,
                        sortField: { field: '$order' },
                        placeholder: i18n.placeholderSearch || '検索...',
                        allowEmptyOption: true
                    });
                }
                var editParentEl = document.getElementById('m-parent');
                if (editParentEl) {
                    tsControlParentEdit = new TomSelect('#m-parent', {
                        create: false,
                        sortField: { field: '$order' },
                        placeholder: i18n.placeholderSearch || '検索...',
                        allowEmptyOption: true
                    });
                }
                var editRoleEl = document.getElementById('m-role');
                if (editRoleEl) {
                    new TomSelect('#m-role', {
                        create: false,
                        controlInput: null, // 検索入力なし
                    });
                }
            }
        });

        var gModal = document.getElementById('group-modal');
        window.openGroupModal = function(id, name, parentId) {
            currentGroupId = id;
            var titleEl = document.getElementById('modal-group-name');
            if(titleEl) titleEl.innerText = name;
            // 親グループ選択: 現在値をセットし、自分自身は親候補から無効化。
            var parentSel = document.getElementById('m-parent');
            if(parentSel) {
                for (var i = 0; i < parentSel.options.length; i++) {
                    var opt = parentSel.options[i];
                    opt.disabled = (opt.value === id);
                }
                if (tsControlParentEdit) {
                    tsControlParentEdit.sync();
                    tsControlParentEdit.setValue(parentId || '');
                } else {
                    parentSel.value = parentId || '';
                }
            }
            if(gModal) {
                gModal.showModal();
                setTimeout(function() { var b = document.getElementById('modal-close-btn'); if(b) b.focus(); }, 50);
            }
            if (tsControl) tsControl.clear();
            var role = document.getElementById('m-role'); if(role) role.value = 'member';
            var vf = document.getElementById('m-valid-from'); if(vf) vf.value = new Date().toISOString().split('T')[0];
            var vt = document.getElementById('m-valid-to'); if(vt) vt.value = '';
            window.resetAddButton();
            window.loadMembers(id);
            window.loadFacilities(id);
            if(window.switchTab) window.switchTab('members');
        };
        window.closeGroupModal = function() { if(gModal) gModal.close(); window.resetAddButton(); };

        window.saveParent = function() {
            var pid = tsControlParentEdit ? tsControlParentEdit.getValue() : (document.getElementById('m-parent') ? document.getElementById('m-parent').value : '');
            fetch('/admin/am/groups/parent', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id: currentGroupId, parent_id: pid }) })
            .then(function(r) { if(!r.ok) { return r.json().catch(function(){return {};}).then(function(e){ throw new Error(e.error || 'err'); }); } return r.json(); })
            .then(function() { window.location.reload(); })
            .catch(function(e) {
                if (e.message === 'cycle' || e.message === 'self') { alert(i18n.alertCycle || 'Cannot set this parent.'); }
                else { alert('Error: ' + e.message); }
            });
        };

        window.resetAddButton = function() {
            var btn = document.getElementById('btn-add-member');
            if(btn) { btn.innerHTML = '<span class="material-symbols-outlined">person_add</span> <span>' + (i18n.btnAdd || 'Add') + '</span>'; }
            var card = document.getElementById('add-form-card');
            if(card) { card.classList.remove('blink-active'); }
            if(tsControl) { tsControl.clear(); tsControl.refreshOptions(); }
        };
        window.highlightAddForm = function() {
            var btn = document.getElementById('btn-add-member');
            if(btn) {
                btn.innerHTML = '<span class="material-symbols-outlined">edit</span> <span>' + (i18n.btnChange || 'Change') + '</span>';
                btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            var card = document.getElementById('add-form-card');
            if(card) { card.classList.remove('blink-active'); void card.offsetWidth; card.classList.add('blink-active'); }
        };
        window.editMember = function(userId, role, startTs, endTs) {
            if (tsControl) { tsControl.setValue([userId]); }
            var roleEl = document.getElementById('m-role'); if(roleEl) roleEl.value = role || 'member';
            var vf = document.getElementById('m-valid-from'); if(vf) vf.value = new Date(startTs * 1000).toISOString().split('T')[0];
            var vt = document.getElementById('m-valid-to');
            if(vt) { var isForever = endTs > 2000000000; vt.value = isForever ? '' : new Date(endTs * 1000).toISOString().split('T')[0]; }
            window.highlightAddForm();
        };

        window.loadMembers = function(id) {
            fetch('/admin/api/am/group-members/' + id + '?t=' + new Date().getTime())
                .then(function(r) { return r.json(); })
                .then(function(data) { currentMembers = data.members || []; window.renderMembers(currentMembers); })
                .catch(function(e) { console.error(e); });
        };
        window.renderMembers = function(list) {
            var container = document.getElementById('modal-member-list');
            if(!container) return;
            container.innerHTML = '';
            if (!list || list.length === 0) {
                var empty = document.createElement('div');
                empty.style.textAlign = 'center';
                empty.style.padding = '2rem';
                empty.style.color = '#94a3b8';
                empty.textContent = i18n.noMembers || '(No members)';
                container.appendChild(empty);
                return;
            }
            list.forEach(function(m) {
                var item = document.createElement('div');
                item.style.padding = '0.75rem 0';
                item.style.borderBottom = '1px solid #f1f5f9';

                var row = document.createElement('div');
                row.style.display = 'flex';
                row.style.justifyContent = 'space-between';
                row.style.alignItems = 'center';

                var left = document.createElement('div');
                left.style.display = 'flex';
                left.style.flexDirection = 'column';
                left.style.gap = '0.25rem';

                var titleWrap = document.createElement('div');
                titleWrap.style.display = 'flex';
                titleWrap.style.alignItems = 'center';
                titleWrap.style.gap = '0.5rem';

                var title = document.createElement('div');
                title.className = 'item-title';
                title.innerText = m.name ? m.name : m.email;
                titleWrap.appendChild(title);

                var isAdmin = m.role === 'group_admin';
                var badge = document.createElement('span');
                badge.textContent = isAdmin ? (i18n.roleAdmin || 'Group Admin') : (i18n.roleMember || 'Member');
                badge.style.fontSize = '0.72rem';
                badge.style.fontWeight = '700';
                badge.style.padding = '2px 8px';
                badge.style.borderRadius = '999px';
                badge.style.color = isAdmin ? '#9a3412' : '#475569';
                badge.style.background = isAdmin ? '#ffedd5' : '#f1f5f9';
                titleWrap.appendChild(badge);
                left.appendChild(titleWrap);

                var meta = document.createElement('div');
                meta.className = 'item-sub';
                meta.style.fontSize = '0.85rem';
                meta.style.color = '#64748b';
                var dStart = new Date(m.valid_from * 1000).toLocaleDateString();
                var isForever = m.valid_to > 2000000000;
                var dEnd = isForever ? (i18n.termForever || 'Forever') : new Date(m.valid_to * 1000).toLocaleDateString();
                var sub = (m.name ? (m.email + ' · ') : '');
                meta.innerHTML = '<div style="display:flex; align-items:center; gap:0.4rem;"><span class="material-symbols-outlined" style="font-size:16px;">date_range</span> ' + sub + dStart + ' ～ ' + dEnd + '</div>';
                left.appendChild(meta);

                row.appendChild(left);

                var right = document.createElement('div');
                right.style.display = 'flex';
                right.style.gap = '0.5rem';
                right.style.alignItems = 'center';

                var btnEdit = document.createElement('button');
                btnEdit.type = 'button';
                btnEdit.className = 'action-btn';
                btnEdit.innerHTML = '<span class="material-symbols-outlined">edit</span>';
                btnEdit.onclick = function() { window.editMember(m.user_id, m.role, m.valid_from, m.valid_to); };
                right.appendChild(btnEdit);

                var btnRemove = document.createElement('button');
                btnRemove.type = 'button';
                btnRemove.className = 'action-btn delete';
                btnRemove.innerHTML = '<span class="material-symbols-outlined">person_remove</span>';
                btnRemove.onclick = function() { window.removeMember(m.id); };
                right.appendChild(btnRemove);

                row.appendChild(right);
                item.appendChild(row);
                container.appendChild(item);
            });
        };

        window.switchTab = function(tab) {
            var tabMembers = document.getElementById('tab-members');
            var tabFacilities = document.getElementById('tab-facilities');
            var btnMembers = document.getElementById('btn-tab-members');
            var btnFacilities = document.getElementById('btn-tab-facilities');
            if(tab === 'members') {
                if(tabMembers) tabMembers.style.display = 'block';
                if(tabFacilities) tabFacilities.style.display = 'none';
                if(btnMembers) btnMembers.classList.add('active');
                if(btnFacilities) btnFacilities.classList.remove('active');
            } else {
                if(tabMembers) tabMembers.style.display = 'none';
                if(tabFacilities) tabFacilities.style.display = 'block';
                if(btnMembers) btnMembers.classList.remove('active');
                if(btnFacilities) btnFacilities.classList.add('active');
            }
        };

        window.loadFacilities = function(id) {
            fetch('/admin/api/am/group-facilities/' + id + '?t=' + new Date().getTime())
                .then(function(r) { return r.json(); })
                .then(function(data) { currentFacilities = data.facilities || []; window.renderFacilities(currentFacilities); })
                .catch(function(e) { console.error(e); });
        };

        window.renderFacilities = function(list) {
            var container = document.getElementById('modal-facility-list');
            if(!container) return;
            container.innerHTML = '';
            if (!list || list.length === 0) {
                var empty = document.createElement('div');
                empty.style.textAlign = 'center';
                empty.style.padding = '2rem';
                empty.style.color = '#94a3b8';
                empty.textContent = i18n.noFacilities || '(No facilities)';
                container.appendChild(empty);
                return;
            }
            list.forEach(function(f) {
                var item = document.createElement('div');
                item.style.padding = '0.75rem 0';
                item.style.borderBottom = '1px solid #f1f5f9';
                item.style.display = 'flex';
                item.style.justifyContent = 'space-between';
                item.style.alignItems = 'center';

                var left = document.createElement('div');
                left.className = 'item-title';
                left.innerText = f.structure_no || '(No ID)';
                var sub = document.createElement('div');
                sub.className = 'item-sub';
                sub.innerText = f.building_use || '';
                left.appendChild(sub);

                var right = document.createElement('div');
                var btnRemove = document.createElement('button');
                btnRemove.type = 'button';
                btnRemove.className = 'action-btn delete';
                btnRemove.innerHTML = '<span class="material-symbols-outlined">delete</span>';
                btnRemove.onclick = function() { window.removeFacility(f.id); };
                right.appendChild(btnRemove);

                item.appendChild(left);
                item.appendChild(right);
                container.appendChild(item);
            });
        };

        window.addFacility = function() {
            var no = document.getElementById('f-structure-no').value;
            var use = document.getElementById('f-building-use').value;
            if(!no) { alert(i18n.alertRequired || 'Required'); return; }
            fetch('/admin/api/am/facility/add', {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ managing_group_id: currentGroupId, structure_no: no, building_use: use })
            })
            .then(function(r) { if(!r.ok) { return r.json().catch(function(){return {};}).then(function(e){ throw new Error(e.error || 'Server error'); }); } return r.json(); })
            .then(function() { 
                document.getElementById('f-structure-no').value = '';
                document.getElementById('f-building-use').value = '';
                window.loadFacilities(currentGroupId); 
            })
            .catch(function(e) { console.error(e); alert('Error: ' + e.message); });
        };

        var removeFacTargetId = null;
        window.removeFacility = function(fid) {
            removeFacTargetId = fid;
            var rm = document.getElementById('remove-fac-modal');
            if(rm) rm.showModal();
        };
        window.closeRemoveFacModal = function() {
            var rm = document.getElementById('remove-fac-modal');
            if(rm) rm.close();
            removeFacTargetId = null;
        };
        window.executeRemoveFac = function() {
            if(!removeFacTargetId) return;
            fetch('/admin/api/am/facility/remove', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id: removeFacTargetId }) })
            .then(function(r) { if(!r.ok) { return r.json().catch(function(){return {};}).then(function(e){ throw new Error(e.error || 'Server error'); }); } return r.json(); })
            .then(function() { window.closeRemoveFacModal(); window.loadFacilities(currentGroupId); })
            .catch(function(e) { console.error(e); alert('Error: ' + e.message); });
        };

        window.addMembers = function() {
            var userIds = [];
            if (tsControl) { userIds = tsControl.getValue(); if (!Array.isArray(userIds)) userIds = [userIds]; }
            userIds = userIds.filter(function(id) { return id !== ''; });
            if(userIds.length === 0) { alert(i18n.alertSelectUser || 'Select at least one user'); return; }
            var role = document.getElementById('m-role').value || 'member';
            var startVal = document.getElementById('m-valid-from').value;
            var endVal = document.getElementById('m-valid-to').value;
            var validFrom = startVal ? Math.floor(new Date(startVal).getTime()/1000) : Math.floor(Date.now()/1000);
            var validTo = endVal ? Math.floor(new Date(endVal).getTime()/1000) : Math.floor(Date.now()/1000) + 315360000;
            fetch('/admin/api/am/membership/add', {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ group_id: currentGroupId, user_ids: userIds, role: role, valid_from: validFrom, valid_to: validTo })
            })
            .then(function(r) { if(!r.ok) { return r.json().catch(function(){return {};}).then(function(e){ throw new Error(e.error || 'Server error ' + r.status); }); } return r.json(); })
            .then(function() { window.resetAddButton(); window.loadMembers(currentGroupId); })
            .catch(function(e) { console.error(e); alert('Error: ' + e.message); });
        };

        var removeTargetId = null;
        window.removeMember = function(mid) {
            removeTargetId = mid;
            var rm = document.getElementById('remove-confirm-modal');
            if(rm) rm.showModal();
        };
        window.closeRemoveModal = function() {
            var rm = document.getElementById('remove-confirm-modal');
            if(rm) rm.close();
            removeTargetId = null;
        };
        window.executeRemove = function() {
            if(!removeTargetId) return;
            fetch('/admin/api/am/membership/remove', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id: removeTargetId }) })
            .then(function(r) { if(!r.ok) { return r.json().catch(function(){return {};}).then(function(e){ throw new Error(e.error || 'Server error ' + r.status); }); } return r.json(); })
            .then(function() { window.closeRemoveModal(); window.loadMembers(currentGroupId); })
            .catch(function(e) { console.error(e); alert('Error: ' + e.message); });
        };

        var deleteTargetId = null;
        window.deleteGroup = function(gid, e) {
            if(e) e.stopPropagation();
            deleteTargetId = gid;
            var dm = document.getElementById('delete-confirm-modal');
            if(dm) dm.showModal();
        };
        window.closeDeleteModal = function() {
            var dm = document.getElementById('delete-confirm-modal');
            if(dm) dm.close();
            deleteTargetId = null;
        };
        window.executeDelete = function() {
            if(!deleteTargetId) return;
            var form = document.getElementById('delete-group-form');
            if (!form) return;
            var input = form.querySelector('input[name="id"]');
            if(input) input.value = deleteTargetId;
            form.submit();
        };

        window.calcDate = function(targetId, offset, unit) {
            var d = new Date();
            if (unit === 'forever') { var el = document.getElementById(targetId); if(el) el.value = ''; return; }
            if (unit === 'year') { d.setFullYear(d.getFullYear() + offset); } else if (unit === 'month') { d.setMonth(d.getMonth() + offset); } else if (unit === 'day') { d.setDate(d.getDate() + offset); }
            var el = document.getElementById(targetId); if(el) el.value = d.toISOString().split('T')[0];
        };
    })();
  `)

  const blinkActive = keyframes`
        0% { border-color: #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        50% { border-color: var(--primary); box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.2); }
        100% { border-color: #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
  `

  const tabContainer = css`display:flex; border-bottom: 1px solid #e2e8f0; margin-bottom: 1.5rem; gap: 1rem;`
  const tabBtn = css`
    background: none !important; border: none !important; color: #64748b !important; padding: 0.5rem 0.5rem 0.8rem !important; font-weight: 600 !important; cursor: pointer !important; box-shadow: none !important; border-bottom: 2px solid transparent !important; border-radius: 0 !important;
    &:hover { color: var(--primary) !important; background: none !important; box-shadow: none !important; transform: none !important; }
    &.active { color: var(--primary) !important; border-bottom: 2px solid var(--primary) !important; }
  `

  const listGrid = css`display: flex; flex-direction: column; gap: 1rem;`
  const listCard = css`
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
    &:hover { outline: 1px solid var(--primary); }
  `
  const itemTitle = css`font-weight: 600; font-size: 1rem; color: #1e293b; margin-bottom: 0.2rem;`
  const itemSub = css`font-size: 0.85rem; color: #64748b; display: flex; align-items: center; gap: 0.4rem;`
  const actionBtn = css`
    background: transparent !important; border: none !important; color: #94a3b8 !important; cursor: pointer !important; padding: 8px !important; border-radius: 50% !important; transition: all 0.2s !important; box-shadow: none !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; width: 36px !important; height: 36px !important; flex-shrink: 0 !important;
    &:hover { background: #f1f5f9 !important; color: var(--text-main) !important; }
  `
  const deleteBtn = css`${actionBtn} &:hover { background: #fef2f2 !important; color: #ef4444 !important; }`
  const addFormCard = css`
    background: #ffffff;
    padding: 2rem;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    margin-bottom: 2rem;
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
    &.blink-active { animation: ${blinkActive} 1s ease-in-out 3; }
  `
  const formLabel = css`display: block; font-weight: 700; font-size: 0.95rem; color: #1e293b; margin-bottom: 0.5rem;`
  const dateInput = css`
    width: 100%; padding: 0.8rem 1rem; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 1rem; color: #334155; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    &:focus { border-color: var(--primary); outline: none; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }
  `
  const tomSelectWrapper = css`
    & .ts-wrapper {
        width: 100%;
    }
    & .ts-control {
      font-size: 1rem !important;
      color: var(--text-main) !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 8px !important;
      background: #ffffff !important;
      padding: 0.6rem 0.8rem !important;
      cursor: text !important;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
      min-height: 42px !important;
      display: flex !important;
      align-items: center !important;
      flex-wrap: wrap !important;
      gap: 4px !important;
      line-height: 1.5 !important;
    }
    &.searchable .ts-control::before {
      content: '\\e8b6'; /* Material Symbol search */
      font-family: 'Material Symbols Outlined';
      font-weight: normal;
      font-size: 20px;
      color: #94a3b8;
      margin-right: 4px;
    }
    & .ts-control > input {
      border: none !important;
      background: transparent !important;
      box-shadow: none !important;
      margin: 0 !important;
      padding: 0 !important;
      width: auto !important;
      flex: 1 1 auto !important;
      min-width: 2rem !important;
      display: inline-block !important;
      height: auto !important;
      line-height: inherit !important;
    }
    & .ts-wrapper.single .ts-control > .item {
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
      padding: 0 !important;
      margin: 0 !important;
      display: inline-block !important;
    }
    & .ts-wrapper.focus .ts-control {
      border-color: var(--primary) !important;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1) !important;
    }
    & .ts-dropdown {
      border-radius: 8px !important;
      border: 1px solid #e2e8f0 !important;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1) !important;
      font-size: 0.95rem !important;
    }
    & .ts-dropdown .option {
      padding: 0.5rem 0.8rem !important;
    }
    & .ts-dropdown .option.active {
      background-color: #f1f5f9 !important;
      color: var(--primary) !important;
    }
  `
  const quickBtnGroup = css`display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; margin-top: 0.75rem;`

  return Layout({
    t: t,
    userEmail: props.userEmail,
    activeTab: 'am-groups',
    siteName: props.siteName,
    appConfig: props.appConfig,
    children: html`
      <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem;">
            <hgroup>
              <h2 style="margin-bottom: 0;">${t.am_section_groups}</h2>
              <h3 style="font-size:1rem; font-weight:normal; color:#64748b;">${t.am_subtitle}</h3>
            </hgroup>
            ${Button({
              onclick: "document.getElementById('new-group-modal').showModal()",
              style: "width: auto; margin-bottom: 0;",
              children: html`<span class="material-symbols-outlined" style="font-size:18px;">add</span> ${t.am_btn_add_group}`
            })}
          </div>

          ${Modal({
            id: "new-group-modal",
            title: t.am_header_new_group,
            closeAction: "this.closest('.custom-modal').close()",
            children: html`
                  <form method="POST" action="/admin/am/groups">
                    <div class="grid-vertical">
                        <label style="width:100%;">
                          <span class="${formLabel}">${t.label_group_name}</span>
                          <input type="text" name="name" placeholder="${t.placeholder_group_name}" required style="margin-top:0.2rem;" />
                        </label>
                        <label style="width:100%;">
                          <span class="${formLabel}">${t.am_label_parent}</span>
                          <div class="${tomSelectWrapper} searchable">
                            <select id="new-group-parent" name="parent_id">
                              <option value="">${t.am_parent_none}</option>
                              ${parentOptions.map(g => html`<option value="${g.id}">${g.name}</option>`)}
                            </select>
                          </div>
                        </label>
                        <div style="margin-top:1rem;">
                            ${Button({ type: "submit", children: t.am_btn_add_group })}
                        </div>
                    </div>
                  </form>
            `
          })}

          <hr />

          <form id="delete-group-form" method="POST" action="/admin/am/groups/delete">
            <input type="hidden" name="id" value="" />
          </form>

          <div class="${listGrid}">
            ${flatTree.length === 0 ? html`<div style="text-align:center; padding:2rem; color:#94a3b8;">${t.no_groups}</div>` : ''}
            ${flatTree.map(({ g, depth }) => html`
              <div class="${listCard}" style="margin-left:${depth * 1.75}rem;" onclick="openGroupModal('${g.id}', '${g.name}', '${g.parent_id || ''}')">
                <div style="flex-grow:1; display:flex; align-items:center; gap:0.6rem;">
                    ${depth > 0 ? html`<span class="material-symbols-outlined" style="font-size:18px; color:#cbd5e1; flex-shrink:0;">subdirectory_arrow_right</span>` : ''}
                    <div>
                        <div class="${itemTitle}">${g.name}</div>
                        <div class="${itemSub}">
                            <span class="material-symbols-outlined" style="font-size:16px;">group</span>
                            ${t.am_member_count.replace('{count}', String(g.member_count ?? 0))}
                        </div>
                    </div>
                </div>
                <div>
                     <button type="button" class="${deleteBtn}" title="${t.delete}" onclick="deleteGroup('${g.id}', event)">
                        <span class="material-symbols-outlined">delete</span>
                     </button>
                </div>
              </div>
            `)}
          </div>

          ${Modal({
            id: "group-modal",
            title: html`${t.am_header_members}: <span id="modal-group-name" style="font-weight:400; color:#64748b; margin-left:0.5rem;"></span>`,
            closeAction: "closeGroupModal()",
            closeBtnId: "modal-close-btn",
            children: html`
                 <div style="margin-bottom: 2rem;">
                    <label class="${formLabel}">${t.am_label_parent}</label>
                    <div style="display:flex; gap:0.5rem; align-items:center;">
                        <div class="${tomSelectWrapper} searchable" style="flex-grow:1;">
                            <select id="m-parent" style="margin-bottom:0; display:none;">
                                <option value="">${t.am_parent_none}</option>
                                ${parentOptions.map(g => html`<option value="${g.id}">${g.name}</option>`)}
                            </select>
                        </div>
                        ${Button({ onclick: "saveParent()", style: "width:auto; white-space:nowrap; flex-shrink:0;", children: t.save })}
                    </div>
                 </div>

                 <div class="${tabContainer}">
                     <button type="button" id="btn-tab-members" class="${tabBtn} active" onclick="switchTab('members')">${t.am_header_members}</button>
                     <button type="button" id="btn-tab-facilities" class="${tabBtn}" onclick="switchTab('facilities')">${t.am_section_facilities || '施設'}</button>
                 </div>

                 <div id="tab-members" style="display:block;">
                     <div id="add-form-card" class="${addFormCard}">
                        <div style="margin-bottom: 1.5rem;">
                           <label class="${formLabel}">${t.am_label_member}</label>
                           ${MultiSelect({
                             id: "m-user-id",
                             placeholder: t.placeholder_select,
                             options: userOptions
                           })}
                        </div>

                        <div style="margin-bottom: 1.5rem;">
                           <label class="${formLabel}">${t.am_label_role}</label>
                           <div class="${tomSelectWrapper}">
                             <select id="m-role">
                                <option value="member">${t.am_role_member}</option>
                                <option value="group_admin">${t.am_role_group_admin}</option>
                             </select>
                           </div>
                        </div>

                        <div style="display:grid; grid-template-columns: 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
                             <div>
                                  <label class="${formLabel}">${t.label_valid_from}</label>
                                  <input type="date" id="m-valid-from" class="${dateInput}" />
                                  <div class="${quickBtnGroup}">
                                      ${Button({ variant: "outline", onclick: "calcDate('m-valid-from', -1, 'month')", children: "-1ヶ月", style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                      ${Button({ variant: "outline", onclick: "calcDate('m-valid-from', -7, 'day')", children: "-1週間", style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                      ${Button({ variant: "outline", onclick: "calcDate('m-valid-from', -1, 'day')", children: "-1日", style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                      ${Button({ variant: "outline", onclick: "calcDate('m-valid-from', 0, 'day')", children: t.btn_date_today, style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                  </div>
                             </div>
                             <div>
                                 <label class="${formLabel}">${t.label_valid_to}</label>
                                 <input type="date" id="m-valid-to" class="${dateInput}" />
                                 <div class="${quickBtnGroup}">
                                      ${Button({ variant: "outline", onclick: "calcDate('m-valid-to', 0, 'day')", children: t.btn_date_today, style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                      ${Button({ variant: "outline", onclick: "calcDate('m-valid-to', 1, 'month')", children: t.btn_term_1mo, style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                      ${Button({ variant: "outline", onclick: "calcDate('m-valid-to', 1, 'year')", children: t.btn_term_1yr, style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                      ${Button({ variant: "outline", onclick: "calcDate('m-valid-to', 99, 'forever')", children: t.btn_term_forever, style: "padding:0.6rem 0.5rem; font-size:0.85rem;" })}
                                 </div>
                             </div>
                        </div>

                        ${Button({ id: "btn-add-member", onclick: "addMembers()", children: html`<span class="material-symbols-outlined">person_add</span> <span>${t.am_add_member}</span>` })}
                     </div>

                     <h4 style="font-size:1.1rem; margin:2rem 0 1rem; font-weight:600; color:#334155;">${t.am_header_members}</h4>
                     <div id="modal-member-list"></div>
                 </div>

                 <div id="tab-facilities" style="display:none;">
                     <div class="${addFormCard}">
                        <div style="margin-bottom: 1.5rem;">
                           <label class="${formLabel}">構造物番号/施設名 (Structure No. / Name)</label>
                           <input type="text" id="f-structure-no" class="${dateInput}" placeholder="F-12345" />
                        </div>
                        <div style="margin-bottom: 1.5rem;">
                           <label class="${formLabel}">用途 (Use)</label>
                           <input type="text" id="f-building-use" class="${dateInput}" placeholder="Office" />
                        </div>
                        ${Button({ onclick: "addFacility()", children: html`<span class="material-symbols-outlined">add_business</span> <span>追加</span>` })}
                     </div>

                     <h4 style="font-size:1.1rem; margin:2rem 0 1rem; font-weight:600; color:#334155;">${t.am_section_facilities || '施設一覧'}</h4>
                     <div id="modal-facility-list"></div>
                 </div>
            `
          })}

          ${Modal({
            id: "remove-confirm-modal",
            title: html`<span style="color:#ef4444; display:flex; align-items:center; gap:0.5rem;"><span class="material-symbols-outlined">warning</span> ${t.am_btn_remove}</span>`,
            closeAction: "closeRemoveModal()",
            children: html`
                  <div style="margin-bottom: 2rem;">
                    <p style="color:#475569; font-size:1rem; line-height:1.5;">${t.am_confirm_remove_member}</p>
                  </div>
                  <div style="display: flex; justify-content: flex-end; gap: 1rem;">
                      <button type="button" onclick="closeRemoveModal()" style="background: transparent; color: #64748b; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer;">${t.cancel}</button>
                      <button type="button" onclick="executeRemove()" style="background: #ef4444; color: white; border: none; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                         <span class="material-symbols-outlined" style="font-size:18px;">person_remove</span> ${t.am_btn_remove}
                      </button>
                  </div>
            `
          })}

          ${Modal({
            id: "remove-fac-modal",
            title: html`<span style="color:#ef4444; display:flex; align-items:center; gap:0.5rem;"><span class="material-symbols-outlined">warning</span> ${t.delete}</span>`,
            closeAction: "closeRemoveFacModal()",
            children: html`
                  <div style="margin-bottom: 2rem;">
                    <p style="color:#475569; font-size:1rem; line-height:1.5;">本当にこの施設を削除しますか？（割当も解除されます）</p>
                  </div>
                  <div style="display: flex; justify-content: flex-end; gap: 1rem;">
                      <button type="button" onclick="closeRemoveFacModal()" style="background: transparent; color: #64748b; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer;">${t.cancel}</button>
                      <button type="button" onclick="executeRemoveFac()" style="background: #ef4444; color: white; border: none; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                         <span class="material-symbols-outlined" style="font-size:18px;">delete</span> ${t.delete}
                      </button>
                  </div>
            `
          })}

          ${Modal({
            id: "delete-confirm-modal",
            title: html`<span style="color:#ef4444; display:flex; align-items:center; gap:0.5rem;"><span class="material-symbols-outlined">warning</span> ${t.delete}</span>`,
            closeAction: "closeDeleteModal()",
            children: html`
                  <div style="margin-bottom: 2rem;">
                    <p style="color:#475569; font-size:1rem; line-height:1.5; white-space:pre-wrap;">${t.am_confirm_delete_group}</p>
                  </div>
                  <div style="display: flex; justify-content: flex-end; gap: 1rem;">
                      <button type="button" onclick="closeDeleteModal()" style="background: transparent; color: #64748b; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer;">${t.cancel}</button>
                      <button type="button" onclick="executeDelete()" style="background: #ef4444; color: white; border: none; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                         <span class="material-symbols-outlined" style="font-size:18px;">delete</span> ${t.delete}
                      </button>
                  </div>
            `
          })}

          <div id="i18n-data" style="display:none;"
            data-placeholder-select="${t.placeholder_select}"
            data-text-no-results="${t.text_no_results}"
            data-term-forever="${t.btn_term_forever}"
            data-no-members="${t.am_no_members}"
            data-role-admin="${t.am_role_group_admin}"
            data-role-member="${t.am_role_member}"
            data-alert-select-user="${t.am_alert_select_user}"
            data-btn-add="${t.am_add_member}"
            data-btn-change="${t.btn_change}"
            data-alert-cycle="${t.am_alert_cycle}"
            data-alert-required="${t.error_invalid_invite || 'Required'}"
            data-no-facilities="${t.am_no_members || 'No facilities'}"
          ></div>

          <script type="application/json" id="user-data">${raw(allUsersJson)}</script>

          <script>
          ${scriptContent}
          </script>
      </div>
    `
  })
}
