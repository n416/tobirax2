import './types';

window.renderGrants = function() {
    var i18n = window.i18n || {};
    var list = window.grantsDetailByGroup && window.currentGroupId ? (window.grantsDetailByGroup[window.currentGroupId] || []) : [];
    var kids = (window.childrenByGroup && window.currentGroupId && window.childrenByGroup[window.currentGroupId]) ? window.childrenByGroup[window.currentGroupId] : [];

    var summaryEl = document.getElementById('grants-summary');
    if (summaryEl) {
        if (list.length === 0) {
            summaryEl.innerHTML = '';
            summaryEl.style.display = 'none';
        } else {
            summaryEl.style.display = 'flex';
            summaryEl.innerHTML = list.map(function(g: any) {
                var childSeats = window.childDistributedSeats(window.currentGroupId, g.service_id);
                var unlimited = (g.seat_limit == null);
                var totalStr = unlimited ? (i18n.grantUnlimited || '無制限') : g.seat_limit;
                var availNum = unlimited ? null : Math.max(0, g.seat_limit - childSeats);
                var availStr = unlimited ? (i18n.grantUnlimited || '無制限') : availNum;
                var over = (!unlimited && childSeats > g.seat_limit);
                return '<div style="background:white; border:1px solid #e2e8f0; border-radius:8px; padding:1rem; flex:1; min-width:260px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">'
                    + '<div style="font-size:0.9rem; font-weight:700; color:#0f172a; margin-bottom:0.65rem;">' + window.escapeHtml(g.service_name) + '</div>'
                    + '<div style="display:flex; gap:0.75rem;">'
                    +   '<div style="flex:1;"><div style="font-size:0.7rem; color:#64748b; margin-bottom:0.15rem;">' + (i18n.grantTotal || '総枠') + '</div><div style="font-size:1.15rem; font-weight:800; color:#0f172a;">' + totalStr + '</div></div>'
                    +   '<div style="flex:1;"><div style="font-size:0.7rem; color:#64748b; margin-bottom:0.15rem;">' + (i18n.grantDistributed || '子へ配分') + '</div><div style="font-size:1.15rem; font-weight:800; color:#7c3aed;">' + childSeats + '</div></div>'
                    +   '<div style="flex:1;"><div style="font-size:0.7rem; color:#64748b; margin-bottom:0.15rem;">' + (i18n.grantAvailable || '利用可能') + '</div><div style="font-size:1.15rem; font-weight:800; color:' + (over ? '#ef4444' : '#10b981') + ';">' + availStr + '</div></div>'
                    + '</div>'
                    + '</div>';
            }).join('');
        }
    }

    var el = document.getElementById('grants-table-body');
    if (el) {
        if (list.length === 0) {
            el.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:2rem;">' + (i18n.noGrants || '利用枠がありません') + '</td></tr>';
        } else {
            el.innerHTML = list.map(function(g: any) {
                var childSeats = window.childDistributedSeats(window.currentGroupId, g.service_id);
                var seat;
                if (g.seat_limit == null) {
                    seat = (i18n.seatUnlimited || '無制限');
                } else {
                    seat = g.seat_limit + ' <span style="color:#94a3b8; font-size:0.78rem;">(' + (i18n.grantDistributed || '子へ配分') + ' ' + childSeats + ' / ' + (i18n.grantAvailable || '利用可能') + ' ' + Math.max(0, g.seat_limit - childSeats) + ')</span>';
                }
                var isRootGrant = (window.availableContracts || []).some(function(c: any) { return c.id === g.contract_id && c.customer_group_id === window.currentGroupId; });
                var deleteBtn = isRootGrant ? '<button type="button" onclick="removeGrant(' + g.id + ')" style="background:transparent;border:none;color:#94a3b8;cursor:pointer;padding:7px;border-radius:50%;width:34px;height:34px;display:inline-flex;align-items:center;justify-content:center;transition:all 0.2s;" onmouseover="this.style.background=\'#fef2f2\';this.style.color=\'#ef4444\';" onmouseout="this.style.background=\'transparent\';this.style.color=\'#94a3b8\';"><span class="material-symbols-outlined" style="font-size:18px;">delete</span></button>' : '';
                return '<tr>'
                    + '<td><strong>' + window.escapeHtml(g.service_name) + '</strong></td>'
                    + '<td style="font-size:0.85rem; color:#64748b;">' + seat + '</td>'
                    + '<td style="font-size:0.82rem; color:#94a3b8;">' + window.fmt(g.valid_from) + ' ～ ' + window.fmt(g.valid_to) + '</td>'
                    + '<td style="text-align:right;">' + deleteBtn + '</td>'
                    + '</tr>';
            }).join('');
        }
    }

    var openGrantBtnWrap = document.getElementById('btn-open-grant-wrap');
    if (openGrantBtnWrap) {
        var myContractsBtn = (window.availableContracts || []).filter(function(c: any) { return c.customer_group_id === window.currentGroupId; });
        var parentGrantsBtn = (window.grantsDetailByGroup && window.grantsDetailByGroup[window.currentGroupId]) ? window.grantsDetailByGroup[window.currentGroupId] : [];
        if (myContractsBtn.length === 0 && parentGrantsBtn.length === 0) {
            openGrantBtnWrap.style.display = 'none';
        } else {
            openGrantBtnWrap.style.display = 'flex';
        }
    }

    var contractsSec = document.getElementById('contracts-section');
    var contractsBody = document.getElementById('contracts-table-body');
    if (contractsSec && contractsBody) {
        var myContracts = (window.availableContracts || []).filter(function(c: any) { return c.customer_group_id === window.currentGroupId; });
        if (myContracts.length === 0) {
            contractsSec.style.display = 'none';
        } else {
            contractsSec.style.display = '';
            contractsBody.innerHTML = myContracts.map(function(c: any) {
                var seat = (c.seat_limit == null) ? (i18n.seatUnlimited || '無制限') : c.seat_limit;
                return '<tr>'
                    + '<td><strong>' + window.escapeHtml(c.service_name) + (c.group_name ? ' (' + window.escapeHtml(c.group_name) + ')' : '') + '</strong></td>'
                    + '<td style="font-size:0.85rem; color:#64748b;">' + seat + '</td>'
                    + '</tr>';
            }).join('');
        }
    }

    renderChildGrants(kids);
};

function renderChildGrants(kids: any[]) {
    var i18n = window.i18n || {};
    var sec = document.getElementById('child-grants-section');
    var body = document.getElementById('child-grants-table-body');
    if (!body) return;
    
    var rows: { child: any, g: any }[] = [];
    (kids || []).forEach(function(ch: any) {
        var cg = (window.grantsDetailByGroup && window.grantsDetailByGroup[ch.id]) ? window.grantsDetailByGroup[ch.id] : [];
        cg.forEach(function(g: any) { rows.push({ child: ch, g: g }); });
    });
    
    if (sec) sec.style.display = (kids && kids.length > 0) ? '' : 'none';
    
    if (rows.length === 0) {
        body.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:2rem;">' + (i18n.noChildGrants || '子グループへ配分された枠はありません。') + '</td></tr>';
        return;
    }
    
    body.innerHTML = rows.map(function(r: any) {
        var seat = (r.g.seat_limit == null) ? (i18n.seatUnlimited || '無制限') : r.g.seat_limit;
        return '<tr>'
            + '<td><span class="material-symbols-outlined" style="font-size:16px; color:#94a3b8; vertical-align:middle; margin-right:0.3rem;">subdirectory_arrow_right</span>' + window.escapeHtml(r.child.name) + '</td>'
            + '<td style="font-size:0.88rem;">' + window.escapeHtml(r.g.service_name) + '</td>'
            + '<td style="font-size:0.85rem; color:#64748b;">' + seat + '</td>'
            + '<td style="text-align:right;"><button type="button" onclick="removeGrant(' + r.g.id + ')" style="background:transparent;border:none;color:#94a3b8;cursor:pointer;padding:7px;border-radius:50%;width:34px;height:34px;display:inline-flex;align-items:center;justify-content:center;transition:all 0.2s;" onmouseover="this.style.background=\'#fef2f2\';this.style.color=\'#ef4444\';" onmouseout="this.style.background=\'transparent\';this.style.color=\'#94a3b8\';"><span class="material-symbols-outlined" style="font-size:18px;">delete</span></button></td>'
            + '</tr>';
    }).join('');
}

window.openGrantModal = function() {
    if (!window.currentGroupId) return;
    var m = document.getElementById('add-grant-modal') as any;
    
    var kids = (window.childrenByGroup && window.childrenByGroup[window.currentGroupId]) ? window.childrenByGroup[window.currentGroupId] : [];
    var targetOpts = [{ id: window.currentGroupId, label: ((window.i18n || {}).grantSelf || '自グループ') }];
    kids.forEach(function(ch: any) { targetOpts.push({ id: ch.id, label: ch.name }); });
    
    var tgtEl = document.getElementById('g-target');
    window.fillSelect(tgtEl, targetOpts, 'id', 'label', '');
    
    if (tgtEl) (tgtEl as HTMLSelectElement).value = window.currentGroupId;
    
    var seatEl = document.getElementById('g-seat') as HTMLInputElement | null; 
    if (seatEl) seatEl.value = '';
    var vf = document.getElementById('g-valid-from') as HTMLInputElement | null; 
    if (vf) vf.value = new Date().toISOString().split('T')[0];
    var vt = document.getElementById('g-valid-to') as HTMLInputElement | null; 
    if (vt) vt.value = '';
    
    var errEl = document.getElementById('g-error'); 
    if (errEl) errEl.style.display = 'none';
    
    window.onGrantTargetChange();
    
    if (m && typeof m.showModal === 'function') m.showModal();
};

window.onGrantTargetChange = function() {
    var tgt = (document.getElementById('g-target') as HTMLSelectElement | null)?.value || window.currentGroupId;
    var isSelf = (tgt === window.currentGroupId);
    var contractEl = document.getElementById('g-contract');
    var warn = document.getElementById('g-no-contract');
    var hasData = false;
    var i18n = window.i18n || {};

    if (isSelf) {
        var contracts = (window.availableContracts || []).filter(function(c: any) { return c.customer_group_id === window.currentGroupId; });
        window.fillSelect(
            contractEl, 
            contracts.map(function(ct: any) { 
                return { id: ct.id, label: ct.service_name + (ct.group_name ? ' / ' + ct.group_name : '') + (ct.seat_limit != null ? ' (' + ct.seat_limit + ')' : '') }; 
            }), 
            'id', 
            'label', 
            i18n.selectContract || '契約を選択'
        );
        if (warn) warn.style.display = contracts.length === 0 ? '' : 'none';
        hasData = contracts.length > 0;
    } else {
        var parentGrants = (window.grantsDetailByGroup && window.grantsDetailByGroup[window.currentGroupId]) ? window.grantsDetailByGroup[window.currentGroupId] : [];
        window.fillSelect(
            contractEl, 
            parentGrants.map(function(g: any) {
                var childSeats = window.childDistributedSeats(window.currentGroupId, g.service_id);
                var remain = (g.seat_limit == null) ? (i18n.grantUnlimited || '無制限') : Math.max(0, g.seat_limit - childSeats);
                return { id: g.contract_id, label: g.service_name + ' (' + (i18n.grantAvailable || '利用可能') + ' ' + remain + ')' };
            }), 
            'id', 
            'label', 
            i18n.selectService || 'サービスを選択'
        );
        if (warn) warn.style.display = parentGrants.length === 0 ? '' : 'none';
        hasData = parentGrants.length > 0;
    }

    var contractWrap = document.getElementById('g-contract-wrap');
    var seatWrap = document.getElementById('g-seat-wrap');
    var datesWrap = document.getElementById('g-dates-wrap');
    var submitBtn = document.getElementById('g-submit-btn');

    if (contractWrap) contractWrap.style.display = hasData ? '' : 'none';
    if (seatWrap) seatWrap.style.display = hasData ? '' : 'none';
    if (datesWrap) datesWrap.style.display = hasData ? 'grid' : 'none';
    if (submitBtn) submitBtn.style.display = hasData ? '' : 'none';
    
    var seatInput = document.getElementById('g-seat') as HTMLInputElement | null;
    if (seatInput) { seatInput.required = true; }
};

function showGrantError(msg: string) {
    var errEl = document.getElementById('g-error');
    if (errEl) { errEl.textContent = msg; errEl.style.display = ''; }
    else console.error(msg);
}

window.addGrant = function() {
    var target = (document.getElementById('g-target') as HTMLSelectElement | null)?.value || window.currentGroupId;
    var contractId = (document.getElementById('g-contract') as HTMLSelectElement | null)?.value;
    var seatVal = (((document.getElementById('g-seat') as HTMLInputElement | null)?.value || '') + '').trim();
    var sv = (document.getElementById('g-valid-from') as HTMLInputElement | null)?.value;
    var ev = (document.getElementById('g-valid-to') as HTMLInputElement | null)?.value;
    var i18n = window.i18n || {};
    
    if (!contractId) { showGrantError(i18n.selectContract || '契約を選択してください'); return; }
    if (seatVal === '') { showGrantError(i18n.errSeatRequired || '上限枠数を入力してください'); return; }
    
    var validFrom = sv ? Math.floor(new Date(sv).getTime()/1000) : Math.floor(Date.now()/1000);
    var validTo = ev ? Math.floor(new Date(ev).getTime()/1000) : Math.floor(Date.now()/1000) + 315360000;
    
    fetch('/group-admin/api/grant/add', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            group_id: target, 
            contract_id: contractId, 
            seat_limit: seatVal, 
            valid_from: validFrom, 
            valid_to: validTo, 
            context_group_id: window.currentGroupId 
        })
    })
    .then(function(r) { 
        if (!r.ok) return r.json().catch(function() { return {}; }).then(function(e) { throw new Error(e.error || ('Error ' + r.status)); }); 
        return r.json(); 
    })
    .then(function() { window.location.reload(); })
    .catch(function(e) {
        if (e.message === 'over_budget') showGrantError(i18n.errOverBudget || '親の残り枠を超えています');
        else if (e.message === 'seat_required') showGrantError(i18n.errSeatRequired || '上限枠数を入力してください');
        else showGrantError('Error: ' + e.message);
    });
};

var removeGrantTargetId: number | null = null;

window.removeGrant = function(gid: number) {
    removeGrantTargetId = gid;
    var m = document.getElementById('remove-grant-modal') as any;
    if (m && typeof m.showModal === 'function') m.showModal();
};

window.closeRemoveGrantModal = function() {
    var m = document.getElementById('remove-grant-modal') as any;
    if (m && typeof m.close === 'function') m.close();
    removeGrantTargetId = null;
};

window.executeRemoveGrant = function() {
    if (!removeGrantTargetId) return;
    
    fetch('/group-admin/api/grant/remove', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ id: removeGrantTargetId, context_group_id: window.currentGroupId }) 
    })
    .then(function(r) { 
        if (!r.ok) return r.json().catch(function() { return {}; }).then(function(e) { throw new Error(e.error || ('Error ' + r.status)); }); 
        return r.json(); 
    })
    .then(function() {
        if (window.grantsDetailByGroup) {
            Object.keys(window.grantsDetailByGroup).forEach(function(gid: string) {
                if (window.grantsDetailByGroup) {
                    window.grantsDetailByGroup[gid] = (window.grantsDetailByGroup[gid] || []).filter(function(g: any) { 
                        return g.id !== removeGrantTargetId; 
                    });
                }
            });
        }
        window.closeRemoveGrantModal();
        window.renderGrants();
        if (window.renderAssignments) window.renderAssignments();
    })
    .catch(function(e) {
        console.error('Error: ' + e.message);
    });
};
