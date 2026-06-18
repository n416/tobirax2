import './types';

window.renderAssignments = function() {
    var summaryEl = document.getElementById('assigns-summary');
    var list = window.assignsByGroup && window.currentGroupId ? (window.assignsByGroup[window.currentGroupId] || []) : [];
    var grants = window.grantsDetailByGroup && window.currentGroupId ? (window.grantsDetailByGroup[window.currentGroupId] || []) : [];

    var btnWrap = document.getElementById('btn-add-assign-wrap');
    if (btnWrap) {
        btnWrap.style.display = grants.length === 0 ? 'none' : 'flex';
    }

    if (summaryEl) {
        if (grants.length === 0) {
            summaryEl.innerHTML = '';
            summaryEl.style.display = 'none';
        } else {
            summaryEl.style.display = 'grid';
            var htmlStr = '';
            grants.forEach(function(g: any) {
                var usedUsers: Record<string, boolean> = {};
                list.forEach(function(a: any) {
                    if (a.service_id === g.service_id) {
                        usedUsers[a.user_id] = true;
                    }
                });
                var usedCount = Object.keys(usedUsers).length;
                var childSeats = window.childDistributedSeats(window.currentGroupId, g.service_id);
                var effLimit = (g.seat_limit == null) ? null : Math.max(0, g.seat_limit - childSeats);
                var limitStr = (effLimit == null) ? '無制限' : String(effLimit);
                var isFull = (effLimit != null && usedCount >= effLimit);
                var remainingStr = (effLimit == null) ? '上限なし' : ('残り ' + (effLimit - usedCount) + ' 枠');
                var barPercent = (effLimit == null || effLimit === 0) ? 0 : Math.min(100, Math.round((usedCount / effLimit) * 100));
                var barColor = isFull ? '#ef4444' : '#10b981';
                
                htmlStr += '<div style="background:white; border:1px solid #e2e8f0; border-radius:8px; padding:1rem; box-shadow:0 1px 2px rgba(0,0,0,0.05);">'
                    + '<div style="font-size:0.85rem; color:#64748b; font-weight:600; margin-bottom:0.5rem; display:flex; justify-content:space-between;">'
                    + '<span>' + window.escapeHtml(g.service_name) + '</span><span style="color:' + (isFull ? '#ef4444' : '#64748b') + ';">' + remainingStr + '</span>'
                    + '</div>'
                    + '<div style="font-size:1.25rem; font-weight:800; color:#0f172a; margin-bottom:0.5rem;">' + usedCount + ' <span style="font-size:0.85rem; font-weight:500; color:#64748b;">/ ' + limitStr + ' 消費</span></div>'
                    + '<div style="width:100%; background:#f1f5f9; border-radius:999px; height:6px; overflow:hidden;">'
                    + '<div style="height:100%; background:' + barColor + '; width:' + barPercent + '%;"></div>'
                    + '</div>'
                    + '</div>';
            });
            summaryEl.innerHTML = htmlStr;
        }
    }

    var el = document.getElementById('assigns-table-body');
    if (!el) return;
    if (list.length === 0) {
        el.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#94a3b8; padding:2rem;">' + (window.i18n.noAssignments || '割当がありません') + '</td></tr>';
        return;
    }
    el.innerHTML = list.map(function(a: any) {
        var facility = window.escapeHtml(a.structure_no || a.facility_id || '-');
        if (a.building_use) facility += ' (' + window.escapeHtml(a.building_use) + ')';
        var roleName = window.escapeHtml(a.role_name || '-');
        var user = window.escapeHtml(a.user_name || a.user_email);
        return '<tr>'
            + '<td>' + user + (a.user_name ? '<div style="font-size:0.8rem;color:#94a3b8;">' + window.escapeHtml(a.user_email) + '</div>' : '') + '</td>'
            + '<td style="font-size:0.88rem;">' + window.escapeHtml(a.service_name) + '</td>'
            + '<td style="font-size:0.85rem; color:#64748b;">' + facility + '</td>'
            + '<td style="font-size:0.85rem;">' + roleName + '</td>'
            + '<td style="font-size:0.82rem; color:#94a3b8;">' + window.fmt(a.valid_from) + ' ～ ' + window.fmt(a.valid_to) + '</td>'
            + '<td style="text-align:right;"><button type="button" onclick="removeAssignment(' + a.id + ')" style="background:transparent;border:none;color:#94a3b8;cursor:pointer;padding:7px;border-radius:50%;width:34px;height:34px;display:inline-flex;align-items:center;justify-content:center;transition:all 0.2s;" onmouseover="this.style.background=\'#fef2f2\';this.style.color=\'#ef4444\';" onmouseout="this.style.background=\'transparent\';this.style.color=\'#94a3b8\';"><span class="material-symbols-outlined" style="font-size:18px;">delete</span></button></td>'
            + '</tr>';
    }).join('');
};

window.refreshAssignRoles = function() {
    var svcEl = document.getElementById('a-service') as HTMLSelectElement | null;
    var facEl = document.getElementById('a-facility') as HTMLSelectElement | null;
    var roleEl = document.getElementById('a-role') as HTMLSelectElement | null;
    if (!svcEl || !facEl || !roleEl) return;
    
    var serviceId = svcEl.value;
    var facId = facEl.value;
    var buildingUse: string | null = null;
    
    if (facId && window.facilities) {
        for (var i = 0; i < window.facilities.length; i++) { 
            if (window.facilities[i].id === facId) { 
                buildingUse = window.facilities[i].building_use || null; 
                break; 
            } 
        }
    }
    
    var roles = (serviceId && window.rolesByService) ? (window.rolesByService[serviceId] || []) : [];
    var filtered = roles.filter(function(r: any) { 
        return r.facility_type == null || r.facility_type === buildingUse; 
    });
    
    window.fillSelect(roleEl, filtered.map(function(r: any) { return { id: r.id, role_name: r.role_name }; }), 'id', 'role_name', '役割なし (None)');
};

window.openAssignModal = function() {
    if (!window.currentGroupId) return;
    var m = document.getElementById('add-assign-modal') as any;
    
    var members = (window.membersByGroup && window.membersByGroup[window.currentGroupId]) ? window.membersByGroup[window.currentGroupId] : [];
    var grants = (window.grantsByGroup && window.grantsByGroup[window.currentGroupId]) ? window.grantsByGroup[window.currentGroupId] : [];
    
    window.fillSelect(
        document.getElementById('a-user'), 
        members.map(function(x: any) { return { user_id: x.user_id, label: (x.name ? x.name + ' <' + x.email + '>' : x.email) }; }), 
        'user_id', 
        'label', 
        window.i18n.selectUser || '利用者を選択'
    );
    window.fillSelect(
        document.getElementById('a-service'), 
        grants, 
        'service_id', 
        'service_name', 
        window.i18n.selectService || 'サービスを選択'
    );
    
    var facList = (window.facilities || []).map(function(f: any) { 
        var lbl = (f.structure_no || f.id) + (f.building_use ? ' (' + f.building_use + ')' : ''); 
        return { id: f.id, label: lbl }; 
    });
    window.fillSelect(document.getElementById('a-facility'), facList, 'id', 'label', '施設指定なし (No facility)');
    
    var roleEl = document.getElementById('a-role');
    if (roleEl) roleEl.innerHTML = '<option value="">役割なし (None)</option>';
    
    var vf = document.getElementById('a-valid-from') as HTMLInputElement | null; 
    if (vf) vf.value = new Date().toISOString().split('T')[0];
    var vt = document.getElementById('a-valid-to') as HTMLInputElement | null; 
    if (vt) vt.value = '';
    
    var warn = document.getElementById('a-no-grant'); 
    if (warn) warn.style.display = grants.length === 0 ? '' : 'none';
    
    if (m && typeof m.showModal === 'function') m.showModal();
};

window.addAssignment = function() {
    var userId = (document.getElementById('a-user') as HTMLSelectElement | null)?.value;
    var serviceId = (document.getElementById('a-service') as HTMLSelectElement | null)?.value;
    var facilityId = (document.getElementById('a-facility') as HTMLSelectElement | null)?.value;
    var roleId = (document.getElementById('a-role') as HTMLSelectElement | null)?.value;
    var sv = (document.getElementById('a-valid-from') as HTMLInputElement | null)?.value;
    var ev = (document.getElementById('a-valid-to') as HTMLInputElement | null)?.value;
    
    if (!userId || !serviceId) { 
        console.error(window.i18n.selectAll || '全項目を選択してください'); 
        return; 
    }
    
    var validFrom = sv ? Math.floor(new Date(sv).getTime()/1000) : Math.floor(Date.now()/1000);
    var validTo = ev ? Math.floor(new Date(ev).getTime()/1000) : Math.floor(Date.now()/1000) + 315360000;
    
    fetch('/group-admin/api/assignment/add', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            group_id: window.currentGroupId, 
            user_id: userId, 
            service_id: serviceId, 
            facility_id: facilityId, 
            service_role_id: roleId ? Number(roleId) : null, 
            valid_from: validFrom, 
            valid_to: validTo 
        })
    })
    .then(function(r) { 
        if (!r.ok) {
            return r.json().catch(function() { return {}; }).then(function(e) { throw new Error(e.error || ('Error ' + r.status)); }); 
        }
        return r.json(); 
    })
    .then(function() { window.location.reload(); })
    .catch(function(e) {
        if (e.message === 'no_grant') console.error(window.i18n.errNoGrant || '利用枠がありません');
        else if (e.message === 'seat') console.error(window.i18n.errSeat || '席数上限に達しています');
        else console.error('Error: ' + e.message);
    });
};

var removeAssignTargetId: number | null = null;

window.removeAssignment = function(aid: number) {
    removeAssignTargetId = aid;
    var m = document.getElementById('remove-assign-modal') as any;
    if (m && typeof m.showModal === 'function') m.showModal();
};

window.closeRemoveAssignModal = function() {
    var m = document.getElementById('remove-assign-modal') as any;
    if (m && typeof m.close === 'function') m.close();
    removeAssignTargetId = null;
};

window.executeRemoveAssignment = function() {
    if (!removeAssignTargetId) return;
    
    fetch('/group-admin/api/assignment/remove', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ id: removeAssignTargetId }) 
    })
    .then(function(r) { 
        if (!r.ok) throw new Error('Error ' + r.status); 
        return r.json(); 
    })
    .then(function() {
        if (window.assignsByGroup && window.currentGroupId) {
            window.assignsByGroup[window.currentGroupId] = (window.assignsByGroup[window.currentGroupId] || []).filter(function(a: any) { 
                return a.id !== removeAssignTargetId; 
            });
        }
        window.closeRemoveAssignModal();
        window.renderAssignments();
    })
    .catch(function(e) { console.error('Error: ' + e.message); });
};
