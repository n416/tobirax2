// @ts-nocheck
// このファイルはクライアントサイドで実行されるJavaScriptです。
// コンパイル時に構文チェックを行うため、関数として定義し文字列化して配信します。

export const accountDevelopersClientScript = '(' + function() {
  // バンドラ(esbuild等)が自動挿入するデバッグ用関数への対策
  var __name = function(f) { return f; };


    var targetId = null;

    function approveRequest(id) {
      fetch('/group-admin/api/roles/approve', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: id })
      }).then(res => {
        if (!res.ok) throw new Error('Error ' + res.status);
        window.location.reload();
      }).catch(err => console.error(err.message));
    }

    function openRejectModal(id) {
      targetId = id;
      document.getElementById('reject-reason').value = '';
      document.getElementById('reject-error').style.display = 'none';
      document.getElementById('reject-modal').showModal();
    }
    function closeRejectModal() { document.getElementById('reject-modal').close(); }
    function executeReject() {
      var reason = document.getElementById('reject-reason').value.trim();
      if (!reason) { document.getElementById('reject-error').style.display = 'block'; return; }
      fetch('/group-admin/api/roles/reject', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: targetId, admin_reason: reason })
      }).then(res => {
        if (!res.ok) throw new Error('Error ' + res.status);
        window.location.reload();
      }).catch(err => console.error(err.message));
    }
  
}.toString() + ')();';
