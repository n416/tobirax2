// @ts-nocheck
// このファイルはクライアントサイドで実行されるJavaScriptです。
// コンパイル時に構文チェックを行うため、関数として定義し文字列化して配信します。

export const accountClientScript = '(' + function() {
  // バンドラ(esbuild等)が自動挿入するデバッグ用関数への対策
  var __name = function(f) { return f; };


    var applyGroupId = null, applyRoleType = null;
    function openApplyModal(gid, rt, label) {
      applyGroupId = gid; applyRoleType = rt;
      var lblEl = document.getElementById('apply-role-label'); if (lblEl) lblEl.textContent = label;
      var ta = document.getElementById('apply-reason'); if (ta) ta.value = '';
      var err = document.getElementById('apply-error'); if (err) err.style.display = 'none';
      var m = document.getElementById('apply-modal'); if (m) m.showModal();
    }
    function closeApplyModal() { var m = document.getElementById('apply-modal'); if (m) m.close(); }
    function submitApply() {
      var reason = (document.getElementById('apply-reason').value || '').trim();
      var err = document.getElementById('apply-error');
      if (!reason) { if (err) { err.style.display='block'; } return; }
      fetch('/group-admin/api/roles/apply', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ group_id: applyGroupId, role_type: applyRoleType, reason: reason })
      }).then(function(r){ if(!r.ok) return r.json().catch(function(){return{};}).then(function(e){ throw new Error(e.error||('Error '+r.status)); }); return r.json(); })
        .then(function(){ window.location.reload(); })
        .catch(function(e){ if (err) { err.style.display='block'; err.textContent = e.message; } });
    }
  
}.toString() + ')();';
