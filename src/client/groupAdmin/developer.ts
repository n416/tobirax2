import './types';

window.renderDeveloperUI = function() {
    var dsd = document.getElementById('ga-dev-status-data');
    var devStatuses = dsd && dsd.textContent ? JSON.parse(dsd.textContent) : null;
    
    var ds = devStatuses && window.currentGroupId ? devStatuses[window.currentGroupId] : null;
    var status = ds ? ds.status : 'none';
    var noDev = document.getElementById('dev-not-approved');
    var devUi = document.getElementById('dev-approved');
    var pendingUi = document.getElementById('dev-pending');

    if (status === 'approved') {
        if (noDev) noDev.style.display = 'none';
        if (pendingUi) pendingUi.style.display = 'none';
        if (devUi) devUi.style.display = 'block';
    } else if (status === 'pending') {
        if (noDev) noDev.style.display = 'none';
        if (pendingUi) pendingUi.style.display = 'block';
        if (devUi) devUi.style.display = 'none';
    } else {
        if (noDev) noDev.style.display = 'block';
        if (pendingUi) pendingUi.style.display = 'none';
        if (devUi) devUi.style.display = 'none';
        
        var rejMsg = document.getElementById('dev-rejected-msg');
        var rejText = document.getElementById('dev-rejected-reason-text');
        var revMsg = document.getElementById('dev-revoked-msg');
        var revText = document.getElementById('dev-revoked-reason-text');
        
        if (rejMsg) rejMsg.style.display = 'none';
        if (revMsg) revMsg.style.display = 'none';
        
        if (status === 'rejected' && ds && ds.reason) {
            if (rejText) rejText.textContent = ds.reason;
            if (rejMsg) rejMsg.style.display = 'flex';
        } else if (status === 'revoked' && ds && ds.reason) {
            if (revText) revText.textContent = ds.reason;
            if (revMsg) revMsg.style.display = 'flex';
        }
    }
};

window.applyDeveloper = function() {
    var reasonEl = document.getElementById('dev-apply-reason') as HTMLTextAreaElement | null;
    var reason = reasonEl ? reasonEl.value : '';
    if (!reason || !reason.trim()) {
        console.error('申請理由を入力してください。');
        return;
    }
    if (!window.currentGroupId) return;
    
    fetch('/group-admin/api/roles/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_id: window.currentGroupId, role_type: 'developer', reason: reason.trim() })
    })
    .then(function(r) {
        if (!r.ok) throw new Error('Error ' + r.status);
        return r.json();
    })
    .then(function() {
        window.location.reload();
    })
    .catch(function(e) {
        console.error('申請に失敗しました: ' + e.message);
    });
};
