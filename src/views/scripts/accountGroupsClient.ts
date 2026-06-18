// @ts-nocheck
// このファイルはクライアントサイドで実行されるJavaScriptです。
// コンパイル時に構文チェックを行うため、関数として定義し文字列化して配信します。

export const accountGroupsClientScript = `
    (function() {
        // HTMLエスケープ関数: innerHTML連結時にXSSを防止する
        function escapeHtml(v) {
          return String(v == null ? '' : v)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        }

        var i18nEl = document.getElementById('i18n-data');
        var i18n = i18nEl ? i18nEl.dataset : {};
        var tsControl = null;
        var tsControlParentNew = null;
        var tsControlParentEdit = null;
        var tsControlMoveFacility = null;
        var tsControlMoveSourceGroup = null;
        var currentGroupId = '';
        var currentMembers = [];
        var currentFacilities = [];

        document.addEventListener('DOMContentLoaded', function() {
            if (typeof TomSelect !== 'undefined') {
                tsControl = new TomSelect('#m-user-id', {
                    controlInput: '<input type="text" autocomplete="off" data-lpignore="true" data-1p-ignore="true" data-bwignore="true" />',
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
                        controlInput: '<input type="text" autocomplete="off" data-lpignore="true" data-1p-ignore="true" data-bwignore="true" />',
                        create: false,
                        sortField: { field: '$order' },
                        placeholder: i18n.placeholderSearch || '検索...',
                        allowEmptyOption: true
                    });
                }
                var editParentEl = document.getElementById('m-parent');
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
            ['chk_group_admin','chk_billing_admin','chk_developer'].forEach(function(cid){ var e=document.getElementById(cid); if(e) e.checked=false; });
            var vf = document.getElementById('m-valid-from'); if(vf) vf.value = new Date().toISOString().split('T')[0];
            var vt = document.getElementById('m-valid-to'); if(vt) vt.value = '';
            window.resetAddButton();
            window.loadMembers(id);
            window.loadFacilities(id);
            if(window.loadAllFacilitiesForMove) window.loadAllFacilitiesForMove();
            window.loadGrants(id);
            if(window.switchTab) window.switchTab('members');
        };
        window.closeGroupModal = function() { if(gModal) gModal.close(); window.resetAddButton(); };

        window.saveParent = function() {
            var pid = tsControlParentEdit ? tsControlParentEdit.getValue() : (document.getElementById('m-parent') ? document.getElementById('m-parent').value : '');
            // 移動するとサブツリーの利用枠は強制没収される。誤操作で予算を消さないよう確認する。
            if (!confirm(i18n.moveWarn || 'Moving this group revokes all license grants held by it and its descendants. They must be re-distributed from the new parent. Continue?')) return;
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
        window.editMember = function(userId, ga, ba, dev, startTs, endTs) {
            if (tsControl) { tsControl.setValue([userId]); }
            var cga = document.getElementById('chk_group_admin'); if(cga) cga.checked = !!ga;
            var cba = document.getElementById('chk_billing_admin'); if(cba) cba.checked = !!ba;
            var cdv = document.getElementById('chk_developer'); if(cdv) cdv.checked = !!dev;
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

                // 兼任可能。保持しているフラグごとにバッジを並べる。すべて 0 ならメンバー。
                function addBadge(label, color, bg) {
                    var b = document.createElement('span');
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
                var anyRole = false;
                if (m.is_billing_admin) { addBadge(i18n.roleBilling || 'Billing Admin', '#5b21b6', '#ede9fe'); anyRole = true; }
                if (m.is_group_admin) { addBadge(i18n.roleAdmin || 'Group Admin', '#9a3412', '#ffedd5'); anyRole = true; }
                if (m.is_developer) { addBadge(i18n.roleDeveloper || 'Developer', '#0e7490', '#cffafe'); anyRole = true; }
                if (!anyRole) { addBadge(i18n.roleMember || 'Member', '#475569', '#f1f5f9'); }
                left.appendChild(titleWrap);

                var meta = document.createElement('div');
                meta.className = 'item-sub';
                meta.style.fontSize = '0.85rem';
                meta.style.color = '#64748b';
                var dStart = new Date(m.valid_from * 1000).toLocaleDateString();
                var isForever = m.valid_to > 2000000000;
                var dEnd = isForever ? (i18n.termForever || 'Forever') : new Date(m.valid_to * 1000).toLocaleDateString();
                var sub = (m.name ? (escapeHtml(m.email) + ' · ') : '');
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
                btnEdit.onclick = function() { window.editMember(m.user_id, m.is_group_admin, m.is_billing_admin, m.is_developer, m.valid_from, m.valid_to); };
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
            var tabs = ['members', 'facilities', 'grants'];
            tabs.forEach(function(t) {
                var content = document.getElementById('tab-' + t);
                var btn = document.getElementById('btn-tab-' + t);
                if(content) content.style.display = (tab === t) ? 'block' : 'none';
                if(btn) {
                    if(tab === t) btn.classList.add('active');
                    else btn.classList.remove('active');
                }
            });
        };

        window.loadAllFacilitiesForMove = function() {
            var sourceSelect = document.getElementById('f-move-source-group');
            var facilitySelect = document.getElementById('f-move-id');
            if(!sourceSelect || !facilitySelect) return;
            
            if (!tsControlMoveFacility && typeof TomSelect !== 'undefined') {
                tsControlMoveFacility = new TomSelect('#f-move-id', {
                    valueField: 'value',
                    labelField: 'text',
                    searchField: ['text'],
                    maxOptions: 2000,
                    placeholder: i18n.placeholderSelect || '施設を選択...',
                    create: false
                });
                if(!window.tomSelects) window.tomSelects = {};
                window.tomSelects['f-move-id'] = tsControlMoveFacility;
            }
            
            if (!tsControlMoveSourceGroup && typeof TomSelect !== 'undefined') {
                tsControlMoveSourceGroup = new TomSelect('#f-move-source-group', {
                    create: false,
                    onChange: function(value) {
                        tsControlMoveFacility.clearOptions();
                        tsControlMoveFacility.clear();
                        if (!value) return;
                        
                        fetch('/admin/api/am/group-facilities/' + encodeURIComponent(value) + '?t=' + new Date().getTime())
                        .then(function(r) { return r.json(); })
                        .then(function(data) {
                            if (data.facilities) {
                                data.facilities.forEach(function(f) {
                                    if (f.managing_group_id === currentGroupId) return; // 自分のグループの施設は移動候補に出さない
                                    var label = (f.structure_no || '') + ' ' + (f.building_use || '');
                                    tsControlMoveFacility.addOption({ value: f.id, text: label });
                                });
                                tsControlMoveFacility.refreshOptions(false);
                            }
                        });
                    }
                });
                if(!window.tomSelects) window.tomSelects = {};
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
            if(!no) { console.error('Required'); return; }
            fetch('/admin/api/am/facility/add', {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ managing_group_id: currentGroupId, structure_no: no, building_use: use })
            })
            .then(function(r) { if(!r.ok) { return r.json().catch(function(){return {};}).then(function(e){ throw new Error(e.error || 'Server error'); }); } return r.json(); })
            .then(function() { 
                document.getElementById('f-structure-no').value = '';
                document.getElementById('f-building-use').value = '';
                window.loadFacilities(currentGroupId); 
                if(window.loadAllFacilitiesForMove) window.loadAllFacilitiesForMove();
            })
            .catch(function(e) { console.error(e); });
        };

        window.moveFacility = function() {
            var facilityId = document.getElementById('f-move-id').value;
            if(!facilityId) { console.error('Facility required'); return; }
            fetch('/admin/api/am/facility/move', {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ managing_group_id: currentGroupId, facility_id: facilityId })
            })
            .then(function(r) { if(!r.ok) { return r.json().catch(function(){return {};}).then(function(e){ throw new Error(e.error || 'Server error'); }); } return r.json(); })
            .then(function() { 
                if (window.tomSelects && window.tomSelects['f-move-id']) {
                    window.tomSelects['f-move-id'].clear();
                } else {
                    document.getElementById('f-move-id').value = '';
                }
                window.loadFacilities(currentGroupId); 
                if(window.loadAllFacilitiesForMove) window.loadAllFacilitiesForMove();
            })
            .catch(function(e) { console.error(e); });
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

        window.removeGrant = function(gid) {
            if(!confirm('本当にこの利用枠を削除しますか？')) return;
            fetch('/admin/api/am/grant/remove', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id: gid }) })
            .then(function(r) { if(!r.ok) throw new Error('err'); return r.json(); })
            .then(function() { window.loadGrants(currentGroupId); })
            .catch(function(e) { console.error(e); alert('Error: ' + e.message); });
        };
        window.addGrant = function() {
            var cid = document.getElementById('g-contract-id').value;
            var seats = document.getElementById('g-seat-limit').value;
            var vf = document.getElementById('g-valid-from').value;
            var vt = document.getElementById('g-valid-to').value;
            if(!cid) return;
            fetch('/admin/api/am/grant/add', {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ group_id: currentGroupId, contract_id: cid, seat_limit: seats, valid_from: vf, valid_to: vt })
            })
            .then(function(r) { if(!r.ok) throw new Error('err'); return r.json(); })
            .then(function() { window.loadGrants(currentGroupId); })
            .catch(function(e) { console.error(e); alert('Error: ' + e.message); });
        };
        window.loadGrants = function(id) {
            fetch('/admin/api/am/group-grants/' + id + '?t=' + new Date().getTime())
                .then(function(r) { return r.json(); })
                .then(function(data) { window.renderGrants(data.grants || []); })
        };
        window.renderGrants = function(list) {
            var container = document.getElementById('modal-grant-list');
            if(!container) return;
            container.innerHTML = '';
            if (!list || list.length === 0) {
                container.innerHTML = '<div style="text-align:center; padding:2rem; color:#94a3b8;">No grants</div>';
                return;
            }
            list.forEach(function(g) {
                var item = document.createElement('div');
                item.style.padding = '0.75rem 0';
                item.style.borderBottom = '1px solid #f1f5f9';
                item.style.display = 'flex';
                item.style.justifyContent = 'space-between';
                item.style.alignItems = 'center';

                var left = document.createElement('div');
                left.className = 'item-title';
                left.innerText = g.service_name || '';
                var sub = document.createElement('div');
                sub.className = 'item-sub';
                var s_limit = g.seat_limit == null ? '無制限' : g.seat_limit + '枠';
                var fmt = function(ts) { return new Date(ts*1000).toLocaleDateString(); };
                sub.innerText = s_limit + ' (' + fmt(g.valid_from) + ' - ' + fmt(g.valid_to) + ')';
                left.appendChild(sub);

                var right = document.createElement('div');
                var btnRemove = document.createElement('button');
                btnRemove.type = 'button';
                btnRemove.className = 'action-btn delete';
                btnRemove.innerHTML = '<span class="material-symbols-outlined">delete</span>';
                btnRemove.onclick = function() { window.removeGrant(g.id); };
                right.appendChild(btnRemove);

                item.appendChild(left);
                item.appendChild(right);
                container.appendChild(item);
            });
        };

        window.addMembers = function() {
            var userIds = [];
            if (tsControl) { userIds = tsControl.getValue(); if (!Array.isArray(userIds)) userIds = [userIds]; }
            userIds = userIds.filter(function(id) { return id !== ''; });
            if(userIds.length === 0) { alert(i18n.alertSelectUser || 'Select at least one user'); return; }
            var isGroupAdmin = !!(document.getElementById('chk_group_admin') || {}).checked;
            var isBillingAdmin = !!(document.getElementById('chk_billing_admin') || {}).checked;
            var isDeveloper = !!(document.getElementById('chk_developer') || {}).checked;
            var startVal = document.getElementById('m-valid-from').value;
            var endVal = document.getElementById('m-valid-to').value;
            var validFrom = startVal ? Math.floor(new Date(startVal).getTime()/1000) : Math.floor(Date.now()/1000);
            var validTo = endVal ? Math.floor(new Date(endVal).getTime()/1000) : Math.floor(Date.now()/1000) + 315360000;
            fetch('/admin/api/am/membership/add', {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ group_id: currentGroupId, user_ids: userIds, is_group_admin: isGroupAdmin, is_billing_admin: isBillingAdmin, is_developer: isDeveloper, valid_from: validFrom, valid_to: validTo })
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
`;
