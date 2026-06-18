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
};

window.renderAll = function() {
    if (window.renderMembers) window.renderMembers();
    if (window.renderAssignments) window.renderAssignments();
    if (window.renderGrants) window.renderGrants();
    // renderPerms is handled in developer UI or other scripts
    if (typeof window.renderPerms === 'function') window.renderPerms();
    if (window.renderServices) window.renderServices();
    if (window.renderApps) window.renderApps();
    if (typeof window.renderFacilities === 'function') window.renderFacilities();
    if (typeof window.renderDeveloperUI === 'function') window.renderDeveloperUI();
};

var pendingConfirmCallback: (() => void) | null = null;

window.showConfirm = function(message: string, callback: () => void) {
    var modal = document.getElementById('custom-confirm-modal') as any;
    var msgEl = document.getElementById('custom-confirm-message');
    var execBtn = document.getElementById('custom-confirm-execute-btn');
    if (modal && msgEl && execBtn) {
        msgEl.innerText = message;
        pendingConfirmCallback = callback;
        execBtn.onclick = function() {
            var cb = pendingConfirmCallback;
            window.closeConfirmModal();
            if (cb) cb();
        };
        modal.showModal();
    }
};

window.closeConfirmModal = function() {
    var modal = document.getElementById('custom-confirm-modal') as any;
    if (modal) modal.close();
    pendingConfirmCallback = null;
};
