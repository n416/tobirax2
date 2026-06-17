// @ts-nocheck
// このファイルはクライアントサイドで実行されるJavaScriptです。
// コンパイル時に構文チェックを行うため、関数として定義し文字列化して配信します。

export const usersClientScript = '(' + function() {
  // バンドラ(esbuild等)が自動挿入するデバッグ用関数への対策
  var __name = function(f) { return f; };


        (function() {
            var i18nEl = document.getElementById('i18n-data');
            var i18n = i18nEl ? i18nEl.dataset : {};
            var ALL_APPS = [];
            var ALL_ROLES = [];
            try {
                var appDataEl = document.getElementById('app-data');
                if(appDataEl) ALL_APPS = JSON.parse(appDataEl.textContent);
                var roleDataEl = document.getElementById('roles-data');
                if(roleDataEl) ALL_ROLES = JSON.parse(roleDataEl.textContent);
            } catch(e) { console.error(e); }
            var tsControl = null;
            var currentExistingIds = []; 
            var currentUserPermissions = []; 
            
            // Global state for bulk mode
            window.isBulkMode = false;

            document.addEventListener('DOMContentLoaded', function() {
                if (typeof TomSelect !== 'undefined') {
                    tsControl = new TomSelect('#perm-app-id', { 
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
                }
                var filterCheck = document.getElementById('exclude-existing-check');
                if (filterCheck) { filterCheck.addEventListener('change', refreshAppOptions); }
            });
            function refreshAppOptions() {
                if (!tsControl) return;
                var exclude = document.getElementById('exclude-existing-check').checked;
                tsControl.clearOptions();
                var optionsToShow = ALL_APPS;
                if (exclude) { optionsToShow = ALL_APPS.filter(function(app) { return !currentExistingIds.includes(app.value); }); }
                tsControl.addOption(optionsToShow);
                tsControl.refreshOptions(false); 
            }
            window.toggleAllCheckboxes = function(source) {
                var checkboxes = document.querySelectorAll('.user-check');
                for(var i=0; i<checkboxes.length; i++) { checkboxes[i].checked = source.checked; }
            };
            window.handleUserCardClick = function(e, id) {
                if (e.target.closest('button') || e.target.closest('a') || e.target.tagName === 'INPUT') return;

                if (window.isBulkMode) {
                    var cb = document.querySelector('input.user-check[value="' + id + '"]');
                    if (cb) cb.checked = !cb.checked;
                } else {
                    window.openUserModal(id);
                }
            };
            window.deleteUser = function(id) {
                if(!confirm(i18n.deleteConfirm)) return;
                var form = document.getElementById('delete-user-form');
                if (!form) return;
                var input = form.querySelector('input[name="id"]');
                input.value = id;
                form.submit();
            };
            var modal = document.getElementById('user-modal');
            var currentUserId = '';
            window.openUserModal = function(id) {
                currentUserId = id;
                if(modal) {
                    modal.showModal();
                    setTimeout(function() { var closeBtn = document.getElementById('modal-close-btn'); if(closeBtn) { closeBtn.focus(); closeBtn.blur(); closeBtn.focus(); } }, 50);
                }
                if (tsControl) tsControl.clear();
                var validFrom = document.getElementById('perm-valid-from');
                if(validFrom) validFrom.value = new Date().toISOString().split('T')[0];
                var validTo = document.getElementById('perm-valid-to');
                if(validTo) validTo.value = '';
                window.resetGrantButton();
                if(window.switchUserTab) window.switchUserTab('permissions');
                window.refreshUserDetails();
            };
            window.refreshUserDetails = function() {
                if(!currentUserId) return;
                fetch('/admin/api/user-details/' + currentUserId + '?t=' + new Date().getTime())
                    .then(function(r) { return r.json(); })
                    .then(function(data) {
                        var emailEl = document.getElementById('modal-user-email');
                        if(emailEl) emailEl.innerText = data.email;
                        var groupSel = document.getElementById('modal-group-select');
                        if(groupSel) groupSel.value = data.group_id || '';
                        window.renderPerms(data.permissions);
                        if(window.loadAssignments) window.loadAssignments(data.assignments || []);
                        currentUserPermissions = data.permissions;
                        currentExistingIds = data.permissions.map(function(p) { return p.app_id; });
                        refreshAppOptions();
                    })
                    .catch(function(e) { console.error(e); });
            };
            window.closeUserModal = function() { if(modal) modal.close(); window.resetGrantButton(); };
            window.resetGrantButton = function() {
                var btn = document.getElementById('btn-grant-perm');
                if(btn) { btn.innerHTML = '<span class="material-symbols-outlined">add</span> <span>' + (i18n.btnGrant || 'Grant') + '</span>'; }
                var card = document.getElementById('grant-form-card');
                if(card) { card.classList.remove('blink-active'); }
                if(tsControl) { tsControl.settings.maxItems = null; tsControl.refreshOptions(); }
            };
            window.highlightGrantForm = function() {
                var btn = document.getElementById('btn-grant-perm');
                if(btn) { btn.innerHTML = '<span class="material-symbols-outlined">edit</span> <span>' + (i18n.btnChange || '変更') + '</span>'; btn.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
                
                var card = document.getElementById('grant-form-card');
                if(card) { 
                    card.classList.remove('blink-active'); 
                    void card.offsetWidth;
                    card.classList.add('blink-active'); 
                }
            };
            window.editPerm = function(appId, startTs, endTs) {
                var filterCheck = document.getElementById('exclude-existing-check');
                if(filterCheck && filterCheck.checked) { filterCheck.checked = false; refreshAppOptions(); }
                if (tsControl) { tsControl.setValue([appId]); }
                var validFrom = document.getElementById('perm-valid-from');
                if(validFrom) validFrom.value = new Date(startTs * 1000).toISOString().split('T')[0];
                var validTo = document.getElementById('perm-valid-to');
                if(validTo) { var isForever = endTs > 2000000000; validTo.value = isForever ? '' : new Date(endTs * 1000).toISOString().split('T')[0]; }
                window.highlightGrantForm();
            };
            window.renderPerms = function(list) {
                var container = document.getElementById('modal-perm-list');
                if(!container) return;
                container.innerHTML = '';
                if (!list || list.length === 0) {
                    var empty = document.createElement('div');
                    empty.style.textAlign = 'center';
                    empty.style.padding = '2rem';
                    empty.style.color = 'var(--text-sub)';
                    empty.textContent = i18n.noAffiliation || '(None)';
                    container.appendChild(empty);
                    return;
                }
                list.forEach(function(p) {
                    var item = document.createElement('div');
                    item.style.padding = '0.75rem 0';
                    item.style.borderBottom = '1px solid #f1f5f9';
                    
                    var row = document.createElement('div');
                    row.style.display = 'flex';
                    row.style.justifyContent = 'space-between';
                    row.style.alignItems = 'center'; // Center vertically
                    
                    var left = document.createElement('div');
                    left.style.display = 'flex';
                    left.style.flexDirection = 'column';
                    left.style.gap = '0.2rem';
                    
                    var title = document.createElement('div');
                    title.className = 'item-title';
                    title.innerText = p.app_name || 'Unknown';
                    left.appendChild(title);
                    
                    var meta = document.createElement('div');
                    meta.className = 'item-sub';
                    var dateStrStart = new Date(p.valid_from * 1000).toLocaleDateString();
                    var dateStrEnd = new Date(p.valid_to * 1000).toLocaleDateString();
                    var isForever = p.valid_to > 2000000000;
                    var dateHtml = dateStrStart + ' ～ ' + (isForever ? (i18n.termForever || 'Forever') : dateStrEnd);
                    var sourceIcon = p.source === 'group' ? 'domain' : 'person';
                    var sourceText = p.source === 'group' ? (i18n.sourceGroup || 'Group') : (i18n.sourceUser || 'User');
                    var sourceColor = p.source === 'group' ? '#94a3b8' : 'var(--primary)';
                    
                    meta.innerHTML = '<div style="display:flex; align-items:center; gap:0.5rem;"><span class="material-symbols-outlined" style="font-size:18px; color:'+sourceColor+'">' + sourceIcon + '</span> ' + sourceText + ' : ' + dateHtml + '</div>';
                    if(p.is_override) meta.innerHTML += ' <span style="color:#d97706; margin-left:4px;">⚠</span>';
                    left.appendChild(meta);
                    
                    row.appendChild(left);
                    
                    var right = document.createElement('div');
                    right.style.display = 'flex';
                    right.style.gap = '0.5rem';
                    right.style.alignItems = 'center';
                    
                    if (p.source === 'user') {
                        var btnEdit = document.createElement('button');
                        btnEdit.type = 'button';
                        btnEdit.className = 'action-btn';
                        btnEdit.innerHTML = '<span class="material-symbols-outlined">edit</span>';
                        btnEdit.onclick = function() { window.editPerm(p.app_id, p.valid_from, p.valid_to); };
                        right.appendChild(btnEdit);
                        var btnRevoke = document.createElement('button');
                        btnRevoke.type = 'button';
                        btnRevoke.className = 'action-btn delete';
                        btnRevoke.innerHTML = '<span class="material-symbols-outlined">delete</span>';
                        btnRevoke.onclick = function() { window.revokePerm(p.id); };
                        right.appendChild(btnRevoke);
                    } else {
                        right.innerHTML = '<span class="material-symbols-outlined" style="color:#cbd5e1;">lock</span>';
                    }
                    row.appendChild(right);
                    item.appendChild(row);
                    container.appendChild(item);
                });
            };

            window.switchUserTab = function(tab) {
                var pTab = document.getElementById('tab-permissions');
                var aTab = document.getElementById('tab-assignments');
                var pBtn = document.getElementById('btn-tab-permissions');
                var aBtn = document.getElementById('btn-tab-assignments');
                if(pTab) pTab.style.display = tab === 'permissions' ? 'block' : 'none';
                if(aTab) aTab.style.display = tab === 'assignments' ? 'block' : 'none';
                if(pBtn) pBtn.className = tab === 'permissions' ? 'btn-tab active' : 'btn-tab';
                if(aBtn) aBtn.className = tab === 'assignments' ? 'btn-tab active' : 'btn-tab';
            };

            window.loadAssignments = function(list) {
                var container = document.getElementById('modal-assignment-list');
                if(!container) return;
                container.innerHTML = '';
                if (!list || list.length === 0) {
                    container.innerHTML = '<div style="text-align:center; padding:2rem; color:#94a3b8;">No assignments</div>';
                    return;
                }
                list.forEach(function(a) {
                    var item = document.createElement('div');
                    item.style.padding = '0.75rem 0';
                    item.style.borderBottom = '1px solid #f1f5f9';
                    item.style.display = 'flex';
                    item.style.justifyContent = 'space-between';
                    item.style.alignItems = 'center';
                    
                    var left = document.createElement('div');
                    var title = document.createElement('div');
                    title.className = 'item-title';
                    title.innerText = a.service_name + ' / ' + a.role_name;
                    var sub = document.createElement('div');
                    sub.className = 'item-sub';
                    sub.innerText = (a.group_name || '-') + ' / ' + (a.structure_no || '-');
                    var dateSub = document.createElement('div');
                    dateSub.className = 'item-sub';
                    var fmt = function(ts) { return new Date(ts*1000).toLocaleDateString(); };
                    dateSub.innerText = fmt(a.valid_from) + ' - ' + (a.valid_to > 2000000000 ? 'Forever' : fmt(a.valid_to));
                    left.appendChild(title);
                    left.appendChild(sub);
                    left.appendChild(dateSub);
                    
                    var right = document.createElement('div');
                    var btnRemove = document.createElement('button');
                    btnRemove.type = 'button';
                    btnRemove.className = 'action-btn delete';
                    btnRemove.innerHTML = '<span class="material-symbols-outlined">delete</span>';
                    btnRemove.onclick = function() { window.removeAssignment(a.id); };
                    right.appendChild(btnRemove);
                    
                    item.appendChild(left);
                    item.appendChild(right);
                    container.appendChild(item);
                });
            };

            window.addAssignment = function() {
                var sid = document.getElementById('a-service-id').value;
                var gid = document.getElementById('modal-group-select').value;
                var fid = document.getElementById('a-facility-id').value;
                var rid = document.getElementById('a-role-id').value;
                var vf = document.getElementById('a-valid-from').value;
                var vt = document.getElementById('a-valid-to').value;
                if(!sid || !fid || !rid) return alert('必須項目が入力されていません');
                
                fetch('/admin/api/am/assignment/add', {
                    method: 'POST', headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ user_id: currentUserId, service_id: sid, group_id: gid, facility_id: fid, service_role_id: rid, valid_from: vf, valid_to: vt })
                })
                .then(function(r) { return r.json(); })
                .then(function(data) { 
                    if(data.error) throw new Error(data.error); 
                    window.refreshUserDetails();
                })
                .catch(function(e) { console.error(e); alert('Error: ' + e.message); });
            };

            window.removeAssignment = function(id) {
                if(!confirm('本当にこの割当を削除しますか？')) return;
                fetch('/admin/api/am/assignment/remove', {
                    method: 'POST', headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ id: id })
                })
                .then(function(r) { return r.json(); })
                .then(function() { window.refreshUserDetails(); })
                .catch(function(e) { console.error(e); alert('Error: ' + e.message); });
            };

            window.updateRoleOptions = function() {
                var sid = document.getElementById('a-service-id').value;
                var sel = document.getElementById('a-role-id');
                sel.innerHTML = '<option value="">-</option>';
                ALL_ROLES.forEach(function(r) {
                    if(r.service_id === sid) {
                        var opt = document.createElement('option');
                        opt.value = r.id;
                        opt.innerText = r.role_name;
                        sel.appendChild(opt);
                    }
                });
            };
            window.calcDate = function(targetId, offset, unit) {
                var d = new Date();
                if (unit === 'forever') { var el = document.getElementById(targetId); if(el) el.value = ''; return; }
                if (unit === 'year') { d.setFullYear(d.getFullYear() + offset); } else if (unit === 'month') { d.setMonth(d.getMonth() + offset); } else if (unit === 'day') { d.setDate(d.getDate() + offset); }
                var el = document.getElementById(targetId); if(el) el.value = d.toISOString().split('T')[0];
            };
            window.grantPermission = function() {
                var dateVal = document.getElementById('perm-valid-to').value;
                var startVal = document.getElementById('perm-valid-from').value;
                var dateStrStart = new Date(startVal).toLocaleDateString();
                var dateStrEnd = dateVal ? new Date(dateVal).toLocaleDateString() : (i18n.termForever || 'Forever');
                var appIds = [];
                if (tsControl) { appIds = tsControl.getValue(); if (!Array.isArray(appIds)) appIds = [appIds]; } 
                else { var appSelect = document.getElementById('perm-app-id'); if (appSelect.value) appIds = [appSelect.value]; }
                appIds = appIds.filter(function(id) { return id !== ''; });
                if(appIds.length === 0) { alert(i18n.alertSelectApp || 'Select at least one App'); return; }
                var warningMessages = [];
                appIds.forEach(function(id) {
                    var existing = currentUserPermissions.find(function(p) { return p.app_id === id && p.source === 'user'; });
                    if (existing) {
                        var exStart = new Date(existing.valid_from * 1000).toLocaleDateString();
                        var isForever = existing.valid_to > 2000000000;
                        var exEnd = isForever ? (i18n.termForever || 'Forever') : new Date(existing.valid_to * 1000).toLocaleDateString();
                        warningMessages.push('・' + existing.app_name + ' (' + exStart + ' ～ ' + exEnd + ')');
                    }
                });
                if (warningMessages.length > 0) {
                    var msgTemplate = i18n.msgOverwriteConfirm || 'Overwrite?\\n{list}';
                    var listStr = warningMessages.join('\\n');
                    var msg = msgTemplate.replace('{start}', dateStrStart).replace('{end}', dateStrEnd).replace('{list}', listStr);
                    if (!confirm(msg)) return;
                }
                var validTo = dateVal ? Math.floor(new Date(dateVal).getTime()/1000) : Math.floor(Date.now()/1000) + 315360000;
                var validFrom = startVal ? Math.floor(new Date(startVal).getTime()/1000) : Math.floor(Date.now()/1000);
                fetch('/admin/api/user/permission/grant', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ user_id: currentUserId, app_ids: appIds, valid_from: validFrom, valid_to: validTo }) })
                .then(function(r) { return r.json(); })
                .then(function() { window.openUserModal(currentUserId); window.resetGrantButton(); })
                .catch(function(e) { 
                    console.error(e); 
                    var tmpl = i18n.alertError || 'Error: {message}';
                    alert(tmpl.replace('{message}', e)); 
                });
            };
            var revokeTargetId = null;
            window.revokePerm = function(pid) {
                revokeTargetId = pid;
                var errEl = document.getElementById('revoke-error-msg');
                if(errEl) errEl.style.display = 'none';
                var rm = document.getElementById('revoke-confirm-modal');
                if(rm) {
                    rm.showModal();
                    setTimeout(function() { var closeBtn = document.getElementById('revoke-close-btn'); if(closeBtn) closeBtn.focus(); }, 50);
                }
            };
            window.closeRevokeModal = function() {
                var rm = document.getElementById('revoke-confirm-modal');
                if(rm) rm.close();
                revokeTargetId = null;
            };
            window.executeRevoke = function() {
                if(!revokeTargetId) return;
                var errEl = document.getElementById('revoke-error-msg');
                if(errEl) errEl.style.display = 'none';
                
                fetch('/admin/api/user/permission/revoke', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({id: revokeTargetId}) })
                .then(function(r) { 
                    if(!r.ok) {
                        return r.json().catch(function(){ return {}; }).then(function(err) { throw new Error(err.error || 'Server error ' + r.status); });
                    }
                    return r.json(); 
                })
                .then(function() { 
                    window.closeRevokeModal();
                    window.openUserModal(currentUserId); 
                })
                .catch(function(e) {
                    console.error('Revoke error:', e);
                    if(errEl) {
                        var tmpl = i18n.alertError || 'Error: {message}';
                        errEl.textContent = tmpl.replace('{message}', e.message);
                        errEl.style.display = 'block';
                    } else {
                        alert('Error: ' + e.message);
                    }
                });
            };
            window.updateUserGroup = function() {
                var gid = document.getElementById('modal-group-select').value;
                fetch('/admin/api/user/group', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({user_id: currentUserId, group_id: gid}) })
                .then(function(r) { if (!r.ok) { return r.json().catch(function(){ return {}; }).then(function(err) { throw new Error(err.error || 'Server returned ' + r.status); }); } return r.json(); })
                .then(function() { window.closeUserModal(); window.location.reload(); })
                .catch(function(e) { 
                    var tmpl = i18n.alertUpdateFail || 'Update failed: {message}';
                    alert(tmpl.replace('{message}', e.message)); 
                    console.error(e);
                });
            };
            var btn = document.getElementById('toggleBulkMode');
            var controls = document.getElementById('bulkControls');
            var selectAllContainer = document.getElementById('selectAllContainer');
            
            if(btn) {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    window.isBulkMode = !window.isBulkMode;
                    
                    var iconName = window.isBulkMode ? 'close' : 'bolt';
                    var text = window.isBulkMode ? (i18n.btnExit || 'Exit') : (i18n.btnEnter || 'Bulk Mode');
                    
                    btn.innerHTML = '<span class="material-symbols-outlined">' + iconName + '</span> ' + text;
                    
                    if(controls) controls.style.display = window.isBulkMode ? 'block' : 'none';
                    if(selectAllContainer) selectAllContainer.style.display = window.isBulkMode ? 'block' : 'none';
                    
                    document.querySelectorAll('.col-select').forEach(function(el) { el.style.display = window.isBulkMode ? 'table-cell' : 'none'; });
                });
            }
        })();
    
}.toString() + ')();';
