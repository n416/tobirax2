import './types';
import type { Facility } from './types';

let tsControlMoveFacility: any = null;

window.loadAllFacilitiesForMove = function(groupIdToExclude?: string) {
    fetch('/group-admin/api/facilities/all')
        .then(function(r) { return r.json(); })
        .then(function(_facs: unknown) { var facs = _facs as Facility[];
            var selEl = document.getElementById('f-move-id');
            if (!selEl) return;
            var filtered = facs.filter(function(f: Facility) { return f.managing_group_id !== groupIdToExclude; });
            
            if (!tsControlMoveFacility && typeof window.TomSelect !== 'undefined') {
                tsControlMoveFacility = new window.TomSelect('#f-move-id', {
                    valueField: 'id',
                    labelField: 'label',
                    searchField: ['label'],
                    options: filtered.map(function(f: Facility) {
                        var gName = f.group_name || 'Unknown Group';
                        var lbl = (f.structure_no || f.id) + (f.building_use ? ' (' + f.building_use + ')' : '') + ' - [' + gName + ']';
                        return { id: f.id, label: lbl };
                    }),
                    create: false,
                    placeholder: '施設を選択...'
                });
            } else if (tsControlMoveFacility) {
                tsControlMoveFacility.clearOptions();
                tsControlMoveFacility.addOptions(filtered.map(function(f: Facility) {
                    var gName = window.escapeHtml(f.group_name || 'Unknown Group');
                    var lbl = window.escapeHtml(f.structure_no || f.id) + (f.building_use ? ' (' + window.escapeHtml(f.building_use) + ')' : '') + ' - [' + gName + ']';
                    return { id: f.id, label: lbl };
                }));
                tsControlMoveFacility.refreshOptions(false);
            }
        })
        .catch(function(e: unknown) { console.error('Failed to load facilities for move', e); });
};

window.renderFacilities = function() {
    if (!window.currentGroupId) return;
    
    if (window.loadAllFacilitiesForMove) {
        window.loadAllFacilitiesForMove(window.currentGroupId);
    }

    var el = document.getElementById('facilities-table-body');
    if (!el) return;
    
    var list = (window.facilities || []).filter(function(f: Facility) { return f.managing_group_id === window.currentGroupId; });
    
    if (list.length === 0) {
        el.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#94a3b8; padding:2rem;">登録されている施設はありません</td></tr>';
        return;
    }
    
    el.innerHTML = list.map(function(f: Facility) {
        var fNo = window.escapeHtml(f.structure_no || f.id);
        var fUse = window.escapeHtml(f.building_use || '—');
        return '<tr>'
            + '<td>' + fNo + '</td>'
            + '<td>' + fUse + '</td>'
            + '<td style="text-align:right;">'
            + '<button type="button" data-action="remove-facility" data-id="' + f.id + '" style="background:transparent;border:none;color:#94a3b8;cursor:pointer;padding:7px;border-radius:50%;width:34px;height:34px;display:inline-flex;align-items:center;justify-content:center;transition:all 0.2s;"><span class="material-symbols-outlined" style="font-size:18px;">delete</span></button>'
            + '</td>'
            + '</tr>';
    }).join('');
};

window.addFacility = function() {
    if (!window.currentGroupId) return;
    var sno = (document.getElementById('f-structure-no') as HTMLInputElement | null)?.value;
    var use = (document.getElementById('f-building-use') as HTMLInputElement | null)?.value;
    
    fetch('/group-admin/api/facility/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ managing_group_id: window.currentGroupId, structure_no: sno, building_use: use })
    })
    .then(function(r) { 
        if (!r.ok) throw new Error('Error ' + r.status); 
        return r.json(); 
    })
    .then(function(_data: unknown) { var data = _data as Record<string, string>;
        if (data.error) throw new Error(data.error);
        window.location.reload();
    })
    .catch(function(e: Error) { console.error('Error:', e.message); });
};

window.moveFacility = function() {
    if (!window.currentGroupId) return;
    var fid = tsControlMoveFacility ? tsControlMoveFacility.getValue() : (document.getElementById('f-move-id') as unknown as HTMLSelectElement | null)?.value;
    if (!fid) return;
    
    fetch('/group-admin/api/facility/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facility_id: fid, managing_group_id: window.currentGroupId })
    })
    .then(function(r) { 
        if (!r.ok) throw new Error('Error ' + r.status); 
        return r.json(); 
    })
    .then(function(_data: unknown) { var data = _data as Record<string, string>;
        if (data.error) throw new Error(data.error);
        window.location.reload();
    })
    .catch(function(e: Error) { console.error('Error:', e.message); });
};

window.removeFacility = function(fid: string) {
    if (window.showConfirm) {
        window.showConfirm('この施設を削除しますか？\n※すでに割当等で利用されている場合は削除できません。', function() {
            fetch('/group-admin/api/facility/remove', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: fid })
            })
            .then(function(r) { return r.json(); })
            .then(function(_data: unknown) { var data = _data as Record<string, string>;
                if (data.error) {
                    if (window.showAlert) window.showAlert('エラー: ' + data.error);
                } else {
                    window.location.reload();
                }
            })
            .catch(function(e: Error) { console.error('Error:', e.message); });
        });
    }
};
