// @ts-nocheck
// このファイルはクライアントサイドで実行されるJavaScriptです。
// コンパイル時に構文チェックを行うため、関数として定義し文字列化して配信します。

export const groupsClientScript = '(' + function() {
  // バンドラ(esbuild等)が自動挿入するデバッグ用関数への対策
  var __name = function(f) { return f; };

    (function() {
        // HTMLエスケープ関数: innerHTML連結時にXSSを防止する
        function escapeHtml(v) {
          return String(v == null ? '' : v)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        }

        var i18nEl = document.getElementById('i18n-data');
        var i18n = i18nEl ? i18nEl.dataset : {};
        var ALL_APPS = [];
        try {
            var appDataEl = document.getElementById('app-data');
            if(appDataEl) ALL_APPS = JSON.parse(appDataEl.textContent);
        } catch(e) { console.error(e); }
        var tsControl = null;
        var currentGroupId = '';
        var currentGroupPermissions = [];
        document.addEventListener('DOMContentLoaded', function() {
            if (typeof TomSelect !== 'undefined') {
                tsControl = new TomSelect('#g-perm-app-id', { 
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
        });
        var gModal = document.getElementById('group-modal');
        window.openGroupModal = function(id, name) {
            currentGroupId = id;
            var titleEl = document.getElementById('modal-group-name');
            if(titleEl) titleEl.innerText = name;
            if(gModal) {
                gModal.showModal();
                setTimeout(function() { var closeBtn = document.getElementById('modal-close-btn'); if(closeBtn) closeBtn.focus(); }, 50);
            }
            if (tsControl) tsControl.clear();
            var validFrom = document.getElementById('g-perm-valid-from');
            if(validFrom) validFrom.value = new Date().toISOString().split('T')[0];
            var validTo = document.getElementById('g-perm-valid-to');
            if(validTo) validTo.value = '';
            window.resetGrantButton();
            window.loadGroupPerms(id);
        };
        window.closeGroupModal = function() { if(gModal) gModal.close(); window.resetGrantButton(); };
        window.resetGrantButton = function() {
            var btn = document.getElementById('btn-grant-perm');
            if(btn) { btn.innerHTML = '<span class="material-symbols-outlined">add</span> <span>' + (i18n.btnGrant || 'Grant') + '</span>'; }
            var card = document.getElementById('grant-form-card');
            if(card) { card.classList.remove('blink-active'); }
            if(tsControl) { tsControl.clear(); tsControl.refreshOptions(); }
        };
        window.highlightGrantForm = function() {
            var btn = document.getElementById('btn-grant-perm');
            if(btn) { 
                btn.innerHTML = '<span class="material-symbols-outlined">edit</span> <span>' + (i18n.btnChange || 'Change') + '</span>'; 
                btn.scrollIntoView({ behavior: 'smooth', block: 'center' }); 
            }
            var card = document.getElementById('grant-form-card');
            if(card) { 
                card.classList.remove('blink-active'); 
                void card.offsetWidth;
                card.classList.add('blink-active'); 
            }
        };
        window.editGroupPerm = function(appId, startTs, endTs) {
            if (tsControl) { tsControl.setValue([appId]); }
            var validFrom = document.getElementById('g-perm-valid-from');
            if(validFrom) validFrom.value = new Date(startTs * 1000).toISOString().split('T')[0];
            var validTo = document.getElementById('g-perm-valid-to');
            if(validTo) { 
                var isForever = endTs > 2000000000; 
                validTo.value = isForever ? '' : new Date(endTs * 1000).toISOString().split('T')[0]; 
            }
            window.highlightGrantForm();
        };
        window.loadGroupPerms = function(id) {
            fetch('/admin/api/group-details/' + id + '?t=' + new Date().getTime())
                .then(function(r) { return r.json(); })
                .then(function(data) {
                    window.renderGroupPerms(data.permissions);
                    currentGroupPermissions = data.permissions;
                })
                .catch(function(e) { console.error(e); });
        };
        window.renderGroupPerms = function(list) {
            var container = document.getElementById('modal-g-perm-list');
            if(!container) return;
            container.innerHTML = '';
            if (!list || list.length === 0) {
                var empty = document.createElement('div');
                empty.style.textAlign = 'center';
                empty.style.padding = '2rem';
                empty.style.color = '#94a3b8';
                empty.textContent = '(権限なし)';
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
                row.style.alignItems = 'center';
                
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
                meta.innerHTML = '<div style="display:flex; align-items:center; gap:0.5rem;"><span class="material-symbols-outlined" style="font-size:16px; margin-right:4px;">date_range</span> ' + dateStrStart + ' ～ ' + (isForever ? (i18n.termForever || 'Forever') : dateStrEnd) + '</div>';
                left.appendChild(meta);
                
                row.appendChild(left);
                
                var right = document.createElement('div');
                right.style.display = 'flex';
                right.style.gap = '0.5rem';
                right.style.alignItems = 'center';
                
                var btnEdit = document.createElement('button');
                btnEdit.className = 'action-btn';
                btnEdit.innerHTML = '<span class="material-symbols-outlined">edit</span>';
                btnEdit.onclick = function() { window.editGroupPerm(p.app_id, p.valid_from, p.valid_to); };
                right.appendChild(btnEdit);

                var btnRevoke = document.createElement('button');
                btnRevoke.className = 'action-btn delete';
                btnRevoke.innerHTML = '<span class="material-symbols-outlined">delete</span>';
                btnRevoke.onclick = function() { window.revokeGroupPerm(p.id); };
                right.appendChild(btnRevoke);
                
                row.appendChild(right);
                item.appendChild(row);
                container.appendChild(item);
            });
        };
        window.grantGroupPermission = function() {
            var dateVal = document.getElementById('g-perm-valid-to').value;
            var startVal = document.getElementById('g-perm-valid-from').value;
            var dateStrStart = new Date(startVal).toLocaleDateString();
            var dateStrEnd = dateVal ? new Date(dateVal).toLocaleDateString() : (i18n.termForever || 'Forever');
            var appIds = [];
            if (tsControl) { appIds = tsControl.getValue(); if (!Array.isArray(appIds)) appIds = [appIds]; } 
            else { var appSelect = document.getElementById('g-perm-app-id'); if (appSelect.value) appIds = [appSelect.value]; }
            appIds = appIds.filter(function(id) { return id !== ''; });
            if(appIds.length === 0) { alert(i18n.alertSelectApp || 'Select at least one App'); return; }
            var warningMessages = [];
            appIds.forEach(function(id) {
                var existing = currentGroupPermissions.find(function(p) { return p.app_id === id; });
                if (existing) {
                    var exStart = new Date(existing.valid_from * 1000).toLocaleDateString();
                    var isForever = existing.valid_to > 2000000000;
                    var exEnd = isForever ? (i18n.termForever || 'Forever') : new Date(existing.valid_to * 1000).toLocaleDateString();
                    warningMessages.push('・' + existing.app_name + ' (' + exStart + ' ～ ' + exEnd + ')');
                }
            });
            
            var validTo = dateVal ? Math.floor(new Date(dateVal).getTime()/1000) : Math.floor(Date.now()/1000) + 315360000;
            var validFrom = startVal ? Math.floor(new Date(startVal).getTime()/1000) : Math.floor(Date.now()/1000);
            
            var doGrant = function() {
                fetch('/admin/api/group/permission/grant', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ group_id: currentGroupId, app_ids: appIds, valid_from: validFrom, valid_to: validTo }) })
                .then(function() { window.loadGroupPerms(currentGroupId); if(tsControl) tsControl.clear(); })
                .catch(function(e) { console.error(e); alert('Error: ' + e); });
            };

            if (warningMessages.length > 0) {
                var msgTemplate = i18n.msgOverwriteConfirm || 'Overwrite?\\n{list}';
                var listStr = warningMessages.join('\\n');
                var msg = msgTemplate.replace('{start}', dateStrStart).replace('{end}', dateStrEnd).replace('{list}', listStr);
                
                var om = document.getElementById('overwrite-confirm-modal');
                if(om) {
                    document.getElementById('overwrite-msg-text').innerText = msg;
                    window._executeOverwrite = function() {
                        om.close();
                        doGrant();
                    };
                    om.showModal();
                    return;
                }
            }
            doGrant();
        };

        var revokeTargetId = null;
        window.revokeGroupPerm = function(pid) {
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
            
            fetch('/admin/api/group/permission/revoke', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({id: revokeTargetId}) })
            .then(function(r) { 
                if(!r.ok) {
                    return r.json().catch(function(){ return {}; }).then(function(err) { throw new Error(err.error || 'Server error ' + r.status); });
                }
                return r.json(); 
            })
            .then(function() { 
                window.closeRevokeModal();
                window.loadGroupPerms(currentGroupId); 
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

        window.calcGroupDate = function(targetId, offset, unit) {
            var d = new Date();
            if (unit === 'forever') { var el = document.getElementById(targetId); if(el) el.value = ''; return; }
            if (unit === 'year') { d.setFullYear(d.getFullYear() + offset); } else if (unit === 'month') { d.setMonth(d.getMonth() + offset); } else if (unit === 'day') { d.setDate(d.getDate() + offset); }
            var el = document.getElementById(targetId); if(el) el.value = d.toISOString().split('T')[0];
        };
    })();
}.toString() + ')();';
