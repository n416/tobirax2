import './types';

// ステータスバッジの描画用ヘルパー
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

window.renderServices = function() {
    var el = document.getElementById('services-table-body');
    if (!el) return;
    
    var list = window.servicesByGroup && window.currentGroupId ? (window.servicesByGroup[window.currentGroupId] || []) : [];
    if (list.length === 0) {
        el.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:1.5rem;">' + ((window.i18n || {}).svcNone || '(なし)') + '</td></tr>';
        return;
    }
    
    el.innerHTML = list.map(function(s: any) {
        var apps = s.apps || [];
        var chips = apps.length ? apps.map(function(a: any) {
            return '<span style="display:inline-flex;align-items:center;gap:0.25rem;background:#eef2ff;color:#4338ca;border:1px solid #c7d2fe;border-radius:999px;padding:2px 6px 2px 10px;font-size:0.78rem;margin:0 0.25rem 0.25rem 0;">' + window.escapeHtml(a.name)
                + (s.status !== 'active' ? '<button type="button" title="外す" onclick="removeServiceApp(\'' + s.id + '\',\'' + a.id + '\')" style="background:none;border:none;color:#6366f1;cursor:pointer;padding:0 2px;line-height:1;font-size:0.95rem;">×</button>' : '') + '</span>';
        }).join('') : '<span style="color:#cbd5e1;">—</span>';
        
        var reasonInfo = '';
        if (s.status === 'rejected' && s.reason) {
            reasonInfo = '<div style="margin-top:0.5rem; padding:0.5rem; background:#fef2f2; border:1px solid #fecaca; border-radius:6px; font-size:0.8rem; color:#b91c1c;"><strong>却下事由:</strong> ' + s.reason.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\\n/g, '<br/>') + '</div>';
        }
        
        var sTags = window.serviceTagsByGroup && window.serviceTagsByGroup[window.currentGroupId] ? window.serviceTagsByGroup[window.currentGroupId].filter(function(t: any) { return t.service_id === s.id; }) : [];
        var tagsHtml = sTags.map(function(t: any) {
            var color = t.status === 'active' ? '#047857' : (t.status === 'rejected' ? '#b91c1c' : '#c2410c');
            var bg = t.status === 'active' ? '#d1fae5' : (t.status === 'rejected' ? '#fef2f2' : '#fff7ed');
            var label = window.escapeHtml(t.tag_name);
            if (t.status !== 'active') label += ' (' + (t.status === 'pending' ? '申請中' : '却下') + ')';
            return '<span style="display:inline-block; margin-right:0.25rem; font-size:0.75rem; padding:2px 8px; border-radius:999px; background:'+bg+'; color:'+color+'; border:1px solid '+(t.status==='active'?'#a7f3d0':(t.status==='rejected'?'#fecaca':'#fed7aa'))+';">' + label + '</span>';
        }).join('');
        var tagsDisplay = '<div style="margin-top:0.35rem;">' + (tagsHtml || '<span style="font-size:0.75rem; color:#94a3b8;">タグなし</span>') + '</div>';

        return '<tr>'
            + '<td><strong>' + window.escapeHtml(s.name) + '</strong>'
            +   '<div style="font-size:0.75rem; color:#64748b; font-family:monospace; margin-top:2px;">' + window.escapeHtml(s.id) + '</div>'
            +   '<div style="margin-top:0.4rem;">' + chips + '</div>'
            +   tagsDisplay
            +   reasonInfo
            + '</td>'
            + '<td style="text-align:right;">'
            +   '<button type="button" title="タグ管理" onclick="openServiceTagsModal(&quot;' + s.id + '&quot;, &quot;' + encodeURIComponent(s.name) + '&quot;)" style="background:transparent;border:none;color:#94a3b8;cursor:pointer;padding:7px;border-radius:50%;width:34px;height:34px;" onmouseover="this.style.background=&quot;#f1f5f9&quot;;this.style.color=&quot;#4f46e5&quot;;" onmouseout="this.style.background=&quot;transparent&quot;;this.style.color=&quot;#94a3b8&quot;;"><span class="material-symbols-outlined" style="font-size:18px;">local_offer</span></button>'
            +   (s.status === 'rejected' ? '<button type="button" onclick="reapplyService(\'' + s.id + '\')" style="background:#fff;border:1px solid #fecaca;color:#dc2626;cursor:pointer;padding:0.4rem 0.75rem;border-radius:6px;font-size:0.8rem;font-weight:600;margin-right:0.5rem;transition:all 0.2s;" onmouseover="this.style.background=\'#fef2f2\';"><span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;margin-right:2px;">refresh</span>再申請</button>' : '')
            +   (s.status !== 'active' ? '<button type="button" onclick="manageServiceApps(\'' + s.id + '\', \'' + encodeURIComponent(s.name) + '\')" style="background:transparent;border:1px solid #cbd5e1;color:#4f46e5;cursor:pointer;padding:0.4rem 0.75rem;border-radius:6px;font-size:0.8rem;font-weight:600;margin-right:0.5rem;transition:all 0.2s;" onmouseover="this.style.background=\'#eef2ff\';this.style.borderColor=\'#a5b4fc\';"><span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;margin-right:2px;">settings_applications</span>' + ((window.i18n || {}).svcManageApps || 'アプリを組み込む') + '</button>' : '')
            +   '<button type="button" onclick="manageRoles(\'' + s.id + '\', \'' + encodeURIComponent(s.name) + '\')" style="background:transparent;border:1px solid #cbd5e1;color:#047857;cursor:pointer;padding:0.4rem 0.75rem;border-radius:6px;font-size:0.8rem;font-weight:600;margin-right:0.5rem;transition:all 0.2s;" onmouseover="this.style.background=\'#d1fae5\';this.style.borderColor=\'#6ee7b7\';"><span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;margin-right:2px;">manage_accounts</span>役割(ロール)を管理</button>'
            +   (s.status !== 'active' ? '<button type="button" title="削除" onclick="removeService(\'' + s.id + '\')" style="background:transparent;border:none;color:#94a3b8;cursor:pointer;padding:7px;border-radius:50%;width:34px;height:34px;transition:all 0.2s;display:inline-flex;align-items:center;justify-content:center;vertical-align:middle;" onmouseover="this.style.background=\'#fef2f2\';this.style.color=\'#ef4444\';" onmouseout="this.style.background=\'transparent\';this.style.color=\'#94a3b8\';"><span class="material-symbols-outlined" style="font-size:18px;">delete</span></button>' : '')
            + '</td>'
            + '</tr>';
    }).join('');
};

window.openServiceModal = function() {
    if (!window.currentGroupId) return;
    var nameEl = document.getElementById('s-name') as HTMLInputElement | null; 
    if (nameEl) nameEl.value = '';
    var m = document.getElementById('add-service-modal') as any;
    if (m && typeof m.showModal === 'function') m.showModal();
};

window.addService = function() {
    var name = (document.getElementById('s-name') as HTMLInputElement | null)?.value;
    if (!name || !name.trim()) { 
        console.error((window.i18n || {}).svcName || 'name'); 
        return; 
    }
    
    fetch('/group-admin/api/service/create', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_id: window.currentGroupId, name: name.trim() })
    })
    .then(function(r) { 
        if (!r.ok) throw new Error('Error ' + r.status); 
        return r.json(); 
    })
    .then(function() { window.location.reload(); })
    .catch(function(e) { console.error('Error: ' + e.message); });
};

window.removeService = function(id: string) {
    if (window.showConfirm) {
        window.showConfirm((window.i18n || {}).svcConfirmRemove || 'このサービスを削除しますか？', function() {
            fetch('/group-admin/api/service/delete', { 
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

window.reapplyService = function(id: string) {
    if (window.showConfirm) {
        window.showConfirm('このサービスを再度申請してよろしいですか？', function() {
            fetch('/group-admin/api/service/reapply', { 
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

window.manageServiceApps = function(serviceId: string, serviceNameEnc: string) {
    var services = (window.servicesByGroup && window.currentGroupId && window.servicesByGroup[window.currentGroupId]) ? window.servicesByGroup[window.currentGroupId] : [];
    var s = services.find(function(x: any) { return x.id === serviceId; });
    if (!s) return;
    
    var availableApps = (window.approvedAppsByGroup && window.currentGroupId && window.approvedAppsByGroup[window.currentGroupId]) ? window.approvedAppsByGroup[window.currentGroupId] : [];
    if (window.openServiceAppsModal) {
        window.openServiceAppsModal(encodeURIComponent(JSON.stringify(s)), availableApps);
    }
};

// roles
let currentManageRolesServiceId: string | null = null;

window.manageRoles = function(serviceId: string, serviceNameEnc: string) {
    currentManageRolesServiceId = serviceId;
    var m = document.getElementById('manage-roles-modal') as any;
    var titleEl = document.getElementById('mr-service-name');
    if (titleEl) titleEl.innerText = decodeURIComponent(serviceNameEnc);
    
    var roleListEl = document.getElementById('mr-role-list');
    var roles = (window.rolesByService && window.rolesByService[serviceId]) ? window.rolesByService[serviceId] : [];
    
    if (roleListEl) {
        if (roles.length === 0) {
            roleListEl.innerHTML = '<div style="color:#94a3b8; font-size:0.9rem;">登録されている役割はありません。</div>';
        } else {
            roleListEl.innerHTML = roles.map(function(r: any) {
                return '<div style="display:flex; justify-content:space-between; align-items:center; padding:0.5rem; border-bottom:1px solid #f1f5f9;">'
                    + '<div><strong>' + window.escapeHtml(r.role_name) + '</strong> <span style="color:#64748b; font-size:0.8rem;">[' + window.escapeHtml(r.role_code) + ']</span>'
                    + (r.facility_type ? ' <span style="font-size:0.75rem; color:#0f172a; background:#e2e8f0; padding:2px 6px; border-radius:4px;">' + window.escapeHtml(r.facility_type) + '</span>' : '')
                    + '</div>'
                    + '<button type="button" onclick="removeRole(' + r.id + ')" class="material-symbols-outlined" style="color:#ef4444; background:none; border:none; cursor:pointer; font-size:18px;">delete</button>'
                    + '</div>';
            }).join('');
        }
    }
    
    ['mr-role-name','mr-role-code'].forEach(function(id) { 
        var e = document.getElementById(id) as HTMLInputElement | null; 
        if (e) e.value = ''; 
    });
    
    var facEl = document.getElementById('mr-facility-type') as HTMLInputElement | null;
    if (facEl) facEl.value = '';
    
    if (m && typeof m.showModal === 'function') m.showModal();
};

window.addRole = function() {
    var rn = (document.getElementById('mr-role-name') as HTMLInputElement | null)?.value;
    var rc = (document.getElementById('mr-role-code') as HTMLInputElement | null)?.value;
    var ft = (document.getElementById('mr-facility-type') as HTMLInputElement | null)?.value;
    
    if (!rn || !rc) { 
        console.error('役割名とロールコードは必須です'); 
        return; 
    }
    
    fetch('/group-admin/api/roles/add', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            service_id: currentManageRolesServiceId, 
            role_name: rn.trim(), 
            role_code: rc.trim(), 
            facility_type: ft || null 
        })
    })
    .then(function(r) { 
        if (!r.ok) throw new Error('Error ' + r.status); 
        return r.json(); 
    })
    .then(function() { window.location.reload(); })
    .catch(function(e) { console.error('Error: ' + e.message); });
};

window.removeRole = function(id: number) {
    if (window.showConfirm) {
        window.showConfirm('この役割を削除しますか？', function() {
            fetch('/group-admin/api/roles/remove', {
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

// tags
let currentTagsServiceId: string | null = null;

window.openServiceTagsModal = function(serviceId: string, serviceName: string) {
    currentTagsServiceId = serviceId;
    var m = document.getElementById('manage-tags-modal') as any;
    var nameEl = document.getElementById('mt-service-name');
    if (nameEl) nameEl.textContent = decodeURIComponent(serviceName);

    var appliedTagsEl = document.getElementById('mt-applied-tags');
    var availableTagsEl = document.getElementById('mt-available-tags');

    var sTags = window.serviceTagsByGroup && window.currentGroupId && window.serviceTagsByGroup[window.currentGroupId] 
        ? window.serviceTagsByGroup[window.currentGroupId].filter(function(t: any) { return t.service_id === serviceId; }) 
        : [];
        
    if (appliedTagsEl) {
        if (sTags.length === 0) {
            appliedTagsEl.innerHTML = '<span style="color:#94a3b8; font-size:0.85rem; width:100%; text-align:center; padding: 0.5rem 0;">適用されているタグはありません</span>';
        } else {
            appliedTagsEl.innerHTML = sTags.map(function(t: any) {
                var color = t.status === 'active' ? '#047857' : (t.status === 'rejected' ? '#b91c1c' : '#c2410c');
                var bg = t.status === 'active' ? '#d1fae5' : (t.status === 'rejected' ? '#fef2f2' : '#fff7ed');
                var label = window.escapeHtml(t.tag_name);
                if (t.status !== 'active') label += ' (' + (t.status === 'pending' ? '申請中' : '却下') + ')';
                return '<span style="display:inline-flex; align-items:center; gap:0.25rem; font-size:0.8rem; padding:4px 8px 4px 10px; border-radius:999px; background:'+bg+'; color:'+color+'; border:1px solid '+(t.status==='active'?'#a7f3d0':(t.status==='rejected'?'#fecaca':'#fed7aa'))+';">' + label
                    + '<button type="button" title="外す" onclick="removeServiceTag(&quot;' + serviceId + '&quot;, &quot;' + t.tag_id + '&quot;)" style="background:none;border:none;color:'+color+';cursor:pointer;padding:0 2px;line-height:1;font-size:1.1rem;opacity:0.7;" onmouseover="this.style.opacity=1;" onmouseout="this.style.opacity=0.7;">×</button>'
                    + '</span>';
            }).join('');
        }
    }

    if (availableTagsEl) {
        var optionsHtml = '<option value="">追加するタグを選択...</option>';
        var avail = window.availableTags || [];
        avail.forEach(function(t: any) {
            var applied = sTags.some(function(at: any) { return at.tag_id === t.id; });
            if (!applied) {
                optionsHtml += '<option value="' + window.escapeHtml(t.id) + '">' + window.escapeHtml(t.name) + '</option>';
            }
        });
        availableTagsEl.innerHTML = optionsHtml;
    }

    var customNameEl = document.getElementById('mt-custom-tag-name') as HTMLInputElement | null;
    if (customNameEl) customNameEl.value = '';

    if (m && typeof m.showModal === 'function') m.showModal();
};

window.applyServiceTag = function() {
    if (!currentTagsServiceId) return;
    var tagId = (document.getElementById('mt-available-tags') as HTMLSelectElement | null)?.value;
    if (!tagId) return;
    
    fetch('/group-admin/api/service_tags/apply', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_id: currentTagsServiceId, tag_id: tagId })
    })
    .then(function(r) { 
        if (!r.ok) throw new Error('Error ' + r.status); 
        return r.json(); 
    })
    .then(function() { window.location.reload(); })
    .catch(function(e) { console.error('Error:', e.message); });
};

window.removeServiceTag = function(serviceId: string, tagId: string) {
    if (!confirm('このタグをサービスから外しますか？')) return;
    fetch('/group-admin/api/service_tags/remove', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_id: serviceId, tag_id: tagId })
    })
    .then(function(r) { 
        if (!r.ok) throw new Error('Error ' + r.status); 
        return r.json(); 
    })
    .then(function() { window.location.reload(); })
    .catch(function(e) { console.error('Error:', e.message); });
};

window.requestCustomTag = function() {
    if (!currentTagsServiceId) return;
    var nameEl = document.getElementById('mt-custom-tag-name') as HTMLInputElement | null;
    var name = nameEl ? nameEl.value.trim() : '';
    if (!name) return;
    
    fetch('/group-admin/api/service_tags/request_custom', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_id: currentTagsServiceId, tag_name: name })
    })
    .then(function(r) { 
        if (!r.ok) throw new Error('Error ' + r.status); 
        return r.json(); 
    })
    .then(function() { window.location.reload(); })
    .catch(function(e) { console.error('Error:', e.message); });
};
