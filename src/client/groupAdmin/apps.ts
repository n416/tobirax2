import './types';
import type { AppInfo } from './types';

// ステータスバッジの描画用ヘルパー (services.tsと同じ。共有するかローカルで定義)
function statusBadge(st: string) {
    var map: Record<string, string[]> = {
        pending:  ['#c2410c', '#fff7ed', (window.i18n || {}).statusPending || 'Pending'],
        rejected: ['#b91c1c', '#fef2f2', (window.i18n || {}).statusRejected || 'Rejected'],
        inactive: ['#d97706', '#fffbeb', (window.i18n || {}).statusInactive || 'Paused'],
        active:   ['#16a34a', '#f0fdf4', (window.i18n || {}).statusActive || 'Active']
    };
    var s = map[st] || map.active;
    return '<span style="font-size:0.72rem;font-weight:700;padding:2px 8px;border-radius:999px;color:' + s[0] + ';background:' + s[1] + ';">' + s[2] + '</span>';
}

window.renderApps = function() {
    var el = document.getElementById('apps-table-body');
    if (!el) return;
    
    var list = window.appsByGroup && window.currentGroupId ? (window.appsByGroup[window.currentGroupId] || []) : [];
    if (list.length === 0) {
        el.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#94a3b8; padding:1.5rem;">' + ((window.i18n || {}).appNone || '(なし)') + '</td></tr>';
        return;
    }
    
    el.innerHTML = list.map(function(a: AppInfo) {
        var dataAttr = encodeURIComponent(JSON.stringify(a));
        var reasonInfo = '';
        if (a.status === 'rejected' && a.reason) {
            reasonInfo = '<div style="margin-top:0.4rem; padding:0.5rem; background:#fef2f2; border:1px solid #fecaca; border-radius:6px; font-size:0.75rem; color:#b91c1c;"><strong>却下事由:</strong> ' + a.reason.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>') + '<br/><span style="color:#ef4444; font-weight:bold;">※ 編集して保存すると自動的に再申請されます。</span></div>';
        }

        return '<tr>'
            + '<td><strong>' + window.escapeHtml(a.name) + '</strong><div style="font-size:0.78rem;color:#94a3b8;font-family:monospace;">' + window.escapeHtml(a.id) + '</div>' + reasonInfo + '</td>'
            + '<td>' + statusBadge(a.status) + '</td>'
            + '<td style="text-align:right; white-space:nowrap;">'
            +   '<button type="button" title="' + (a.status === 'active' ? '詳細' : '編集') + '" data-action="open-app-edit-modal" data-app-data="' + dataAttr + '" style="background:transparent;border:none;color:#94a3b8;cursor:pointer;padding:7px;border-radius:50%;width:34px;height:34px;"><span class="material-symbols-outlined" style="font-size:18px;">' + (a.status === 'active' ? 'visibility' : 'edit') + '</span></button>'
            +   (a.status !== 'active' ? '<button type="button" title="削除" data-action="remove-app" data-app-id="' + a.id + '" style="background:transparent;border:none;color:#94a3b8;cursor:pointer;padding:7px;border-radius:50%;width:34px;height:34px;"><span class="material-symbols-outlined" style="font-size:18px;">delete</span></button>' : '')
            + '</td>'
            + '</tr>';
    }).join('');
};

window.openAppModal = function() {
    if (!window.currentGroupId) return;
    ['ap-id','ap-name','ap-base-url','ap-redirect','ap-desc','ap-initiate-login-uri'].forEach(function(id: string) { 
        var e = document.getElementById(id) as HTMLInputElement | null; 
        if (e) e.value = ''; 
    });
    var m = document.getElementById('add-app-modal') as CustomModalElement | null;
    if (m && typeof m.showModal === 'function') m.showModal();
};

window.addApp = function() {
    var id = (document.getElementById('ap-id') as HTMLInputElement | null)?.value;
    var name = (document.getElementById('ap-name') as HTMLInputElement | null)?.value;
    var baseUrl = (document.getElementById('ap-base-url') as HTMLInputElement | null)?.value;
    var redirect = (document.getElementById('ap-redirect') as HTMLInputElement | null)?.value;
    var desc = (document.getElementById('ap-desc') as HTMLInputElement | null)?.value;
    var initUri = (document.getElementById('ap-initiate-login-uri') as HTMLInputElement | null)?.value;
    
    if (!id || !id.trim() || !name || !name.trim() || !baseUrl || !baseUrl.trim()) { 
        console.error((window.i18n || {}).appFillRequired || 'ID/名前/URLは必須です'); 
        return; 
    }
    
    fetch('/group-admin/api/app/request', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            group_id: window.currentGroupId, 
            id: id.trim(), 
            name: name.trim(), 
            base_url: baseUrl.trim(), 
            redirect_uris: redirect, 
            description: desc,
            initiate_login_uri: initUri
        })
    })
    .then(function(r) { 
        if (!r.ok) return r.json().catch(function() { return {}; }).then(function(e) { throw new Error(e.error || ('Error ' + r.status)); }); 
        return r.json(); 
    })
    .then(function() { window.location.reload(); })
    .catch(function(e) {
        if (e.message === 'id_taken') console.error((window.i18n || {}).appIdTaken || 'そのアプリIDは既に使われています');
        else console.error('Error: ' + e.message);
    });
};

window.openAppEditModal = function(enc: string) {
    var a = JSON.parse(decodeURIComponent(enc));
    
    var idEl = document.getElementById('ape-id') as HTMLInputElement | null;
    if (idEl) idEl.value = a.id;
    var nameEl = document.getElementById('ape-name') as HTMLInputElement | null;
    if (nameEl) nameEl.value = a.name;
    var baseUrlEl = document.getElementById('ape-base-url') as HTMLInputElement | null;
    if (baseUrlEl) baseUrlEl.value = a.base_url;
    var redirectEl = document.getElementById('ape-redirect') as HTMLInputElement | null;
    if (redirectEl) redirectEl.value = a.redirect_uris || '';
    var initUriEl = document.getElementById('ape-initiate-login-uri') as HTMLInputElement | null;
    if (initUriEl) initUriEl.value = a.initiate_login_uri || '';
    
    var isReadOnly = a.status === 'active';
    
    ['ape-name', 'ape-base-url', 'ape-redirect', 'ape-initiate-login-uri'].forEach(function(id: string) {
        var el = document.getElementById(id) as HTMLInputElement | null;
        if (el) el.disabled = isReadOnly;
    });

    var hasSecretEl = document.getElementById('ape-has-secret') as HTMLInputElement | null;
    if (hasSecretEl) hasSecretEl.value = a.has_secret ? '1' : '0';
    
    var secretStatus = document.getElementById('ape-secret-status');
    if (secretStatus) {
        secretStatus.innerText = a.has_secret ? 'Secret is set (Hashed)' : 'Public Client (No Secret)';
        secretStatus.style.color = a.has_secret ? '#16a34a' : '#64748b';
    }

    var saveBtn = document.getElementById('ape-save-btn');
    if (saveBtn) saveBtn.style.display = isReadOnly ? 'none' : 'flex';
    
    var m = document.getElementById('edit-app-modal-ga') as any;
    if (m && typeof m.showModal === 'function') {
        var titleEl = m.querySelector('h3');
        if (titleEl) titleEl.innerText = isReadOnly ? 'アプリ詳細' : ((window.i18n || {}).edit || '編集');
        m.showModal();
    }
};

window.updateApp = function() {
    var id = (document.getElementById('ape-id') as HTMLInputElement | null)?.value;
    var name = (document.getElementById('ape-name') as HTMLInputElement | null)?.value;
    var baseUrl = (document.getElementById('ape-base-url') as HTMLInputElement | null)?.value;
    var redirect = (document.getElementById('ape-redirect') as HTMLInputElement | null)?.value;
    var initUri = (document.getElementById('ape-initiate-login-uri') as HTMLInputElement | null)?.value;
    
    if (!name || !name.trim() || !baseUrl || !baseUrl.trim()) { 
        console.error((window.i18n || {}).appFillRequired || '名前/URLは必須です'); 
        return; 
    }
    
    fetch('/group-admin/api/app/update', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, name: name.trim(), base_url: baseUrl.trim(), redirect_uris: redirect, initiate_login_uri: initUri })
    })
    .then(function(r) { 
        if (!r.ok) throw new Error('Error ' + r.status); 
        return r.json(); 
    })
    .then(function() { window.location.reload(); })
    .catch(function(e) { console.error('Error: ' + e.message); });
};

window.removeApp = function(id: string) {
    if (window.showConfirm) {
        window.showConfirm((window.i18n || {}).appConfirmRemove || 'このアプリを削除しますか？', function() {
            fetch('/group-admin/api/app/delete', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ id: id }) 
            })
            .then(function(r) { 
                if (!r.ok) throw new Error('Error ' + r.status); 
                return r.json(); 
            })
            .then(function() { window.location.reload(); })
            .catch(function(e) { console.error('Error: ' + e.message); });
        });
    }
};

window.appSecretActionGa = function(action: string) {
    var id = (document.getElementById('ape-id') as HTMLInputElement | null)?.value;
    if (!id) return;
    
    fetch('/group-admin/api/app/secret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, action: action })
    })
    .then(function(r) { return r.json(); })
    .then(function(data: Record<string, string>) {
        if (data.error) {
            if (window.showAlert) window.showAlert('Error: ' + data.error);
            return;
        }
        if (action === 'clear') {
            var hasSecretEl = document.getElementById('ape-has-secret') as HTMLInputElement | null;
            if (hasSecretEl) hasSecretEl.value = '0';
            var s = document.getElementById('ape-secret-status');
            if (s) { s.innerText = 'Public Client (No Secret)'; s.style.color = '#64748b'; }
            var banner = document.getElementById('new-secret-banner-ga');
            if(banner) banner.style.display = 'none';
        } else if (action === 'regenerate') {
            var hasSecretEl = document.getElementById('ape-has-secret') as HTMLInputElement | null;
            if (hasSecretEl) hasSecretEl.value = '1';
            var s = document.getElementById('ape-secret-status');
            if (s) { s.innerText = 'Secret is set (Hashed)'; s.style.color = '#16a34a'; }
            var banner = document.getElementById('new-secret-banner-ga');
            var codeVal = document.getElementById('new-secret-value-ga');
            if (banner && codeVal) {
                codeVal.innerText = data.new_secret;
                banner.style.display = 'block';
            }
        }
        
        if (window.appsByGroup && window.currentGroupId) {
            var list = window.appsByGroup[window.currentGroupId] || [];
            var app = list.find(function(x: AppInfo) { return x.id === id; });
            if (app) app.has_secret = action === 'regenerate' ? 1 : 0;
        }
    })
    .catch(function(err: unknown) { 
        console.error('Error:', err); 
        if (window.showAlert) window.showAlert('Failed to update secret'); 
    });
};
