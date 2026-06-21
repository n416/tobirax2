import './types';

// HTMLエスケープ関数: innerHTML連結時にXSSを防止する
window.escapeHtml = function(v: any): string {
    return String(v == null ? '' : v)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
};

// 日付フォーマット
window.fmt = function(unixSec: any): string {
    if (!unixSec) return '—';
    if (unixSec > 2000000000) return '無期限';
    var d = new Date(unixSec * 1000);
    return d.getFullYear() + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + ('0' + d.getDate()).slice(-2);
};

window.fillSelect = function(el: any, items: any[], valueKey: string, textKey: string, placeholder: string) {
    if (!el) return;
    var html = '<option value="">' + placeholder + '</option>';
    items.forEach(function(it: any) { 
        html += '<option value="' + window.escapeHtml(it[valueKey]) + '">' + window.escapeHtml(it[textKey]) + '</option>'; 
    });
    el.innerHTML = html;
};

window.childDistributedSeats = function(groupId: string, serviceId: string) {
    var kids = (window.childrenByGroup && window.childrenByGroup[groupId]) ? window.childrenByGroup[groupId] : [];
    var sum = 0;
    kids.forEach(function(ch: any) {
        var cg = (window.grantsDetailByGroup && window.grantsDetailByGroup[ch.id]) ? window.grantsDetailByGroup[ch.id] : [];
        cg.forEach(function(g: any) { 
            if (g.service_id === serviceId && g.seat_limit != null) sum += g.seat_limit; 
        });
    });
    return sum;
};


window.membersByGroup = null;
window.assignsByGroup = null;
window.permsByGroup = null;
window.grantsByGroup = null;
window.facilities = null;
window.rolesByService = null;
window.grantsDetailByGroup = null;
window.availableContracts = null;
window.childrenByGroup = null;
window.isBillingAdmin = window.__isBillingAdmin === true;
window.servicesByGroup = null;
window.appsByGroup = null;
window.approvedAppsByGroup = null;
window.serviceTagsByGroup = null;
window.customTagsByGroup = null;
window.availableTags = [];
window.currentTab = 'members';
window.currentGroupId = '';

document.addEventListener('DOMContentLoaded', function() {
    try {
        var savedTab = localStorage.getItem('ga_current_tab');
        if (savedTab) window.currentTab = savedTab;
    } catch(e) {}

    var parseJsonFromEl = (id: string) => {
        var el = document.getElementById(id);
        return el && el.textContent ? JSON.parse(el.textContent) : null;
    };

    window.membersByGroup = parseJsonFromEl('ga-members-data');
    window.assignsByGroup = parseJsonFromEl('ga-assigns-data');
    window.permsByGroup = parseJsonFromEl('ga-perms-data');
    window.grantsByGroup = parseJsonFromEl('ga-grants-data');
    window.facilities = parseJsonFromEl('ga-facilities-data');
    window.rolesByService = parseJsonFromEl('ga-roles-data');
    window.grantsDetailByGroup = parseJsonFromEl('ga-grants-detail-data');
    window.availableContracts = parseJsonFromEl('ga-contracts-data');
    window.childrenByGroup = parseJsonFromEl('ga-children-data');
    window.servicesByGroup = parseJsonFromEl('ga-services-data');
    window.appsByGroup = parseJsonFromEl('ga-apps-data');
    window.approvedAppsByGroup = parseJsonFromEl('ga-approved-apps-data');
    window.serviceTagsByGroup = parseJsonFromEl('ga-service-tags-data');
    window.customTagsByGroup = parseJsonFromEl('ga-custom-tags-data');
    
    var avt = parseJsonFromEl('ga-available-tags-data');
    if (avt) window.availableTags = avt;

    var savedGroupId: string | null = null;
    try { savedGroupId = localStorage.getItem('ga_current_group_id'); } catch(e) {}

    var sel = document.getElementById('group-select') as HTMLSelectElement | null;
    var tsInstance: any = null;

    if (sel && typeof window.TomSelect !== 'undefined' && sel.tagName === 'SELECT') {
        tsInstance = new window.TomSelect('#group-select', {
            controlInput: '<input type="text" autocomplete="off" data-lpignore="true" data-1p-ignore="true" data-bwignore="true" />',
            create: false,
            sortField: { field: '$order' },
            searchField: ['text'],
            placeholder: '検索...',
            onChange: function(val: string) {
                window.currentGroupId = val;
                try { localStorage.setItem('ga_current_group_id', val); } catch(e) {}
                if (window.renderAll) window.renderAll();
            },
            render: {
                option: function(data: any, escape: any) {
                    var depth = parseInt(data.depth || (data.$option && data.$option.getAttribute('data-depth')) || '0', 10);
                    var origName = data.origname || (data.$option && data.$option.getAttribute('data-origname')) || data.text;
                    var pad = depth * 1.5;
                    var icon = depth > 0 ? '<span class="material-symbols-outlined" style="font-size:16px; color:#94a3b8; flex-shrink:0;">subdirectory_arrow_right</span>' : '';
                    return '<div><div style="padding-left:' + pad + 'rem; display:flex; align-items:center; gap:0.4rem;">' + icon + '<span style="font-weight:' + (depth === 0 ? '700' : '500') + '; color:var(--text-main);">' + escape(origName) + '</span></div></div>';
                },
                item: function(data: any, escape: any) {
                    var origName = data.origname || (data.$option && data.$option.getAttribute('data-origname')) || data.text;
                    return '<div><div style="display:flex; align-items:center; gap:0.4rem; padding: 0 0.4rem;">' + escape(origName) + '</div></div>';
                }
            }
        });
    } else if (sel && sel.value) {
        sel.addEventListener('change', function(e: Event) {
            var target = e.target as HTMLSelectElement;
            window.currentGroupId = target.value;
            try { localStorage.setItem('ga_current_group_id', window.currentGroupId); } catch(e) {}
            if (window.renderAll) window.renderAll();
        });
    }

    if (savedGroupId && sel && sel.querySelector('option[value="' + savedGroupId + '"]')) {
        if (tsInstance) {
            tsInstance.setValue(savedGroupId);
        } else {
            sel.value = savedGroupId;
            window.currentGroupId = savedGroupId;
            if (window.renderAll) window.renderAll();
        }
    } else {
        var initialVal = sel ? sel.value : null;
        if (initialVal) {
            window.currentGroupId = initialVal;
            if (window.renderAll) window.renderAll();
        }
    }
    
    if (window.switchTab) {
        window.switchTab(window.currentTab);
    }
    
    if (typeof window.TomSelect !== 'undefined') {
        var el = document.getElementById('m-user-id');
        if (el) {
            window.tsCtrl = new window.TomSelect('#m-user-id', {
                controlInput: '<input type="text" autocomplete="off" data-lpignore="true" data-1p-ignore="true" data-bwignore="true" />',
                plugins: ['remove_button'],
                create: false,
                maxItems: null
            });
        }
    }

    if (window.loadRoleApprovals) window.loadRoleApprovals();

    document.addEventListener('click', function(e) {
        var target = e.target as HTMLElement | null;
        if (!target) return;

        var actionBtn = target.closest('[data-action]') as HTMLElement | null;
        if (!actionBtn) return;

        var action = actionBtn.getAttribute('data-action');
        if (!action) return;

        if (action === 'open-create-child-group-modal') {
            if (window.openCreateChildGroupModal) window.openCreateChildGroupModal();
        } else if (action === 'switch-tab') {
            var tabName = actionBtn.getAttribute('data-tab-name');
            if (tabName && window.switchTab) window.switchTab(tabName);
        } else if (action === 'open-add-member-modal') {
            if (window.openAddModal) window.openAddModal();
        } else if (action === 'add-member') {
            if (window.addMember) window.addMember();
        } else if (action === 'open-assign-modal') {
            if (window.openAssignModal) window.openAssignModal();
        } else if (action === 'add-assignment') {
            if (window.addAssignment) window.addAssignment();
        } else if (action === 'add-facility') {
            if (window.addFacility) window.addFacility();
        } else if (action === 'move-facility') {
            if (window.moveFacility) window.moveFacility();
        } else if (action === 'open-grant-modal') {
            if (window.openGrantModal) window.openGrantModal();
        } else if (action === 'add-grant') {
            if (window.addGrant) window.addGrant();
        } else if (action === 'apply-developer') {
            if (window.applyDeveloper) window.applyDeveloper();
        } else if (action === 'open-service-modal') {
            if (window.openServiceModal) window.openServiceModal();
        } else if (action === 'add-service') {
            if (window.addService) window.addService();
        } else if (action === 'open-app-modal') {
            if (window.openAppModal) window.openAppModal();
        } else if (action === 'add-app') {
            if (window.addApp) window.addApp();
        } else if (action === 'update-app') {
            if (window.updateApp) window.updateApp();
        } else if (action === 'create-child-group') {
            if (window.createChildGroup) window.createChildGroup();
        } else if (action === 'execute-remove-member') {
            if (window.executeRemove) window.executeRemove();
        } else if (action === 'execute-remove-assignment') {
            if (window.executeRemoveAssignment) window.executeRemoveAssignment();
        } else if (action === 'execute-remove-grant') {
            if (window.executeRemoveGrant) window.executeRemoveGrant();
        } else if (action === 'add-role') {
            if (window.addRole) window.addRole();
        } else if (action === 'apply-service-tag') {
            if (window.applyServiceTag) window.applyServiceTag();
        } else if (action === 'request-custom-tag') {
            if (window.requestCustomTag) window.requestCustomTag();
        } else if (action === 'app-secret-action-ga') {
            var actionType = actionBtn.getAttribute('data-action-type');
            if (actionType && window.appSecretActionGa) window.appSecretActionGa(actionType);
        }
        
        else if (action === 'remove-member') {
            var id = actionBtn.getAttribute('data-id');
            if (id && window.removeMember) window.removeMember(id);
        } else if (action === 'remove-assignment') {
            var id = actionBtn.getAttribute('data-id');
            if (id && window.removeAssignment) window.removeAssignment(Number(id));
        } else if (action === 'remove-facility') {
            var id = actionBtn.getAttribute('data-id');
            if (id && window.removeFacility) window.removeFacility(id);
        } else if (action === 'remove-grant') {
            var id = actionBtn.getAttribute('data-id');
            if (id && window.removeGrant) window.removeGrant(Number(id));
        } else if (action === 'remove-service-app') {
            var serviceId = actionBtn.getAttribute('data-service-id');
            var appId = actionBtn.getAttribute('data-app-id');
            if (serviceId && appId && window.removeServiceApp) window.removeServiceApp(serviceId, appId);
        } else if (action === 'open-service-tags-modal') {
            var serviceId = actionBtn.getAttribute('data-service-id');
            var serviceName = actionBtn.getAttribute('data-service-name');
            if (serviceId && serviceName && window.openServiceTagsModal) {
                window.openServiceTagsModal(serviceId, serviceName);
            }
        } else if (action === 'reapply-service') {
            var serviceId = actionBtn.getAttribute('data-service-id');
            if (serviceId && window.reapplyService) window.reapplyService(serviceId);
        } else if (action === 'manage-service-apps') {
            var serviceId = actionBtn.getAttribute('data-service-id');
            var serviceName = actionBtn.getAttribute('data-service-name');
            if (serviceId && serviceName && window.manageServiceApps) {
                window.manageServiceApps(serviceId, serviceName);
            }
        } else if (action === 'manage-roles') {
            var serviceId = actionBtn.getAttribute('data-service-id');
            var serviceName = actionBtn.getAttribute('data-service-name');
            if (serviceId && serviceName && window.manageRoles) {
                window.manageRoles(serviceId, serviceName);
            }
        } else if (action === 'remove-service') {
            var serviceId = actionBtn.getAttribute('data-service-id');
            if (serviceId && window.removeService) window.removeService(serviceId);
        } else if (action === 'remove-role') {
            var roleId = actionBtn.getAttribute('data-role-id');
            if (roleId && window.removeRole) window.removeRole(Number(roleId));
        } else if (action === 'remove-service-tag') {
            var serviceId = actionBtn.getAttribute('data-service-id');
            var tagId = actionBtn.getAttribute('data-tag-id');
            if (serviceId && tagId && window.removeServiceTag) window.removeServiceTag(serviceId, tagId);
        } else if (action === 'open-app-edit-modal') {
            var appData = actionBtn.getAttribute('data-app-data');
            if (appData && window.openAppEditModal) window.openAppEditModal(appData);
        } else if (action === 'remove-app') {
            var appId = actionBtn.getAttribute('data-app-id');
            if (appId && window.removeApp) window.removeApp(appId);
        }
    });

    document.addEventListener('change', function(e) {
        var target = e.target as HTMLElement | null;
        if (!target) return;

        var changeAction = target.getAttribute('data-change');
        if (changeAction === 'refresh-assign-roles') {
            if (window.refreshAssignRoles) window.refreshAssignRoles();
        } else if (changeAction === 'on-grant-target-change') {
            if (window.onGrantTargetChange) window.onGrantTargetChange();
        }
    });
});

window.switchGroup = function() {
    var sel = document.getElementById('group-select') as HTMLSelectElement | null;
    if (sel) {
        window.currentGroupId = sel.value;
        try { localStorage.setItem('ga_current_group_id', window.currentGroupId); } catch(e) {}
        if (window.renderAll) window.renderAll();
    }
};

window.switchTab = function(tab: string) {
    if (tab === 'grants' && !window.isBillingAdmin) tab = 'members';
    window.currentTab = tab;
    try { localStorage.setItem('ga_current_tab', tab); } catch(e) {}
    document.documentElement.setAttribute('data-active-tab', tab);
    if (window.renderAll) window.renderAll();
};

window.renderAll = function() {
    try { if (window.renderMembers) window.renderMembers(); } catch(e) { console.error('renderMembers', e); }
    try { if (window.renderAssignments) window.renderAssignments(); } catch(e) { console.error('renderAssignments', e); }
    try { if (window.renderGrants) window.renderGrants(); } catch(e) { console.error('renderGrants', e); }
    try { if (typeof window.renderPerms === 'function') window.renderPerms(); } catch(e) { console.error('renderPerms', e); }
    try { if (window.renderServices) window.renderServices(); } catch(e) { console.error('renderServices', e); }
    try { if (window.renderApps) window.renderApps(); } catch(e) { console.error('renderApps', e); }
    try { if (typeof window.renderFacilities === 'function') window.renderFacilities(); } catch(e) { console.error('renderFacilities', e); }
    try { if (typeof window.renderDeveloperUI === 'function') window.renderDeveloperUI(); } catch(e) { console.error('renderDeveloperUI', e); }
};

