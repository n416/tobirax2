import './types';
import type { GroupMember } from './types';

window.renderMembers = function() {
    var el = document.getElementById('members-table-body');
    if (!el) return;
    
    var list = window.membersByGroup && window.currentGroupId ? (window.membersByGroup[window.currentGroupId] || []) : [];
    if (list.length === 0) {
        el.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:2rem;">' + (window.i18n.noMembers || '(メンバーなし)') + '</td></tr>';
        return;
    }
    
    el.innerHTML = list.map(function(m: GroupMember) {
        function badge(color: string, bg: string, label: string) {
            return '<span style="font-size:0.72rem; font-weight:700; padding:2px 8px; border-radius:999px; color:' + color + '; background:' + bg + '; margin-right:4px;">' + label + '</span>';
        }
        
        var badges: string[] = [];
        if (m.is_billing_admin) badges.push(badge('#5b21b6', '#ede9fe', window.i18n.roleBilling || '決裁権者'));
        if (m.is_group_admin) badges.push(badge('#9a3412', '#ffedd5', window.i18n.roleAdmin || 'グループ管理者'));
        if (m.is_developer) badges.push(badge('#0e7490', '#cffafe', window.i18n.roleDeveloper || '開発者'));
        if (badges.length === 0) badges.push(badge('#475569', '#f1f5f9', window.i18n.roleMember || 'メンバー'));
        
        var badgeHtml = badges.join('');
        var displayName = window.escapeHtml(m.name || m.email);
        var subEmail = m.name ? ('<div style="font-size:0.8rem; color:#94a3b8;">' + window.escapeHtml(m.email) + '</div>') : '';
        
        return '<tr>'
            + '<td><div>' + displayName + '</div>' + subEmail + '</td>'
            + '<td>' + badgeHtml + '</td>'
            + '<td style="font-size:0.85rem; color:#64748b;">' + window.fmt(m.valid_from) + ' ～ ' + window.fmt(m.valid_to) + '</td>'
            + '<td style="text-align:right;"><button type="button" data-action="remove-member" data-id="' + m.id + '" style="background:transparent;border:none;color:#94a3b8;cursor:pointer;padding:7px;border-radius:50%;width:34px;height:34px;display:inline-flex;align-items:center;justify-content:center;transition:all 0.2s;"><span class="material-symbols-outlined" style="font-size:18px;">person_remove</span></button></td>'
            + '</tr>';
    }).join('');
};

window.openAddModal = function() {
    var m = document.getElementById('add-member-modal') as CustomModalElement | null;
    if (m && typeof m.showModal === 'function') m.showModal();
    if (window.tsCtrl) window.tsCtrl.clear();
    
    ['chk_group_admin','chk_billing_admin','chk_developer'].forEach(function(id) {
        var e = document.getElementById(id) as HTMLInputElement | null;
        if (e) e.checked = false;
    });
    
    var vf = document.getElementById('m-valid-from') as HTMLInputElement | null;
    if (vf) vf.value = new Date().toISOString().split('T')[0];
    var vt = document.getElementById('m-valid-to') as HTMLInputElement | null;
    if (vt) vt.value = '';
};

window.addMember = function() {
    var userIds = window.tsCtrl ? window.tsCtrl.getValue() : [];
    if (!Array.isArray(userIds)) userIds = [userIds];
    userIds = userIds.filter(function(id: any) { return id; });
    
    if (!userIds.length) {
        console.error('ユーザーを選択してください');
        return;
    }
    
    var isGroupAdmin = !!(document.getElementById('chk_group_admin') as HTMLInputElement | null)?.checked;
    var isBillingAdmin = !!(document.getElementById('chk_billing_admin') as HTMLInputElement | null)?.checked;
    var isDeveloper = !!(document.getElementById('chk_developer') as HTMLInputElement | null)?.checked;
    
    var startVal = (document.getElementById('m-valid-from') as HTMLInputElement | null)?.value;
    var endVal = (document.getElementById('m-valid-to') as HTMLInputElement | null)?.value;
    
    var validFrom = startVal ? Math.floor(new Date(startVal).getTime()/1000) : Math.floor(Date.now()/1000);
    var validTo = endVal ? Math.floor(new Date(endVal).getTime()/1000) : Math.floor(Date.now()/1000) + 315360000;
    
    fetch('/group-admin/api/membership/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            group_id: window.currentGroupId,
            user_ids: userIds,
            is_group_admin: isGroupAdmin ? 1 : 0,
            is_billing_admin: isBillingAdmin ? 1 : 0,
            is_developer: isDeveloper ? 1 : 0,
            valid_from: validFrom,
            valid_to: validTo
        })
    })
    .then(function(r) { 
        if (!r.ok) {
            return r.json().catch(function() { return {}; }).then(function(_err: unknown) { var err = _err as { error?: string }; throw new Error(err.error || 'Error ' + r.status);
            });
        }
        return r.json(); 
    })
    .then(function() {
        window.location.reload(); 
    })
    .catch(function(e) {
        console.error('Error: ' + e.message);
        if (window.showAlert) window.showAlert(e.message);
    });
};

var removeMemberTargetId: string | null = null;

window.removeMember = function(mid: string) {
    removeMemberTargetId = mid;
    var m = document.getElementById('remove-confirm-modal') as CustomModalElement | null;
    if (m && typeof m.showModal === 'function') m.showModal();
};

window.closeRemoveModal = function() {
    var m = document.getElementById('remove-confirm-modal') as CustomModalElement | null;
    if (m && typeof m.close === 'function') m.close();
    removeMemberTargetId = null;
};

window.executeRemove = function() {
    if (!removeMemberTargetId) return;
    
    fetch('/group-admin/api/membership/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: removeMemberTargetId })
    })
    .then(function(r) {
        if (!r.ok) throw new Error('Error ' + r.status);
        return r.json();
    })
    .then(function() {
        window.closeRemoveMemberModal();
        if (window.membersByGroup && window.currentGroupId) {
            window.membersByGroup[window.currentGroupId] = (window.membersByGroup[window.currentGroupId] || []).filter(function(m: GroupMember) {
                return m.id !== removeMemberTargetId;
            });
        }
        removeMemberTargetId = null;
        window.renderMembers();
    })
    .catch(function(e: Error) {
        console.error('Error: ' + e.message);
    });
};

window.openCreateChildGroupModal = function() {
    var m = document.getElementById('create-child-group-modal') as CustomModalElement | null;
    if (m && typeof m.showModal === 'function') m.showModal();
    
    var nameEl = document.getElementById('ccg-name') as HTMLInputElement | null;
    if (nameEl) nameEl.value = '';
    
    var adminEl = document.getElementById('ccg-admin-user') as HTMLInputElement | null;
    if (adminEl) adminEl.value = '';
};

window.createChildGroup = function() {
    if (!window.currentGroupId) return;
    
    var name = (document.getElementById('ccg-name') as HTMLInputElement | null)?.value;
    var adminUserId = (document.getElementById('ccg-admin-user') as HTMLInputElement | null)?.value;
    
    if (!name || !name.trim()) {
        console.error('グループ名を入力してください');
        return;
    }
    if (!adminUserId) {
        console.error('管理者を選択してください');
        return;
    }
    
    fetch('/group-admin/api/group/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            parent_group_id: window.currentGroupId,
            name: name.trim(),
            admin_user_id: adminUserId
        })
    })
    .then(function(r) {
        if (!r.ok) throw new Error('Error ' + r.status);
        return r.json();
    })
    .then(function(_data: unknown) { var data = _data as Record<string, string>;
        window.location.reload();
    })
    .catch(function(e: Error) {
        console.error('Error: ' + e.message);
    });
};
