// @ts-nocheck
// このファイルはクライアントサイドで実行されるJavaScriptです。
// コンパイル時に構文チェックを行うため、関数として定義し文字列化して配信します。

export const RejectReasonModalScript = '(' + function() {
  // バンドラ(esbuild等)が自動挿入するデバッグ用関数への対策
  var __name = function(f) { return f; };

  function openRejectModal(actionUrl, targetId, expectedApps) {
    var form = document.getElementById('reject-form');
    if (form) {
      form.action = actionUrl;
    }
    var idInput = document.getElementById('reject-target-id');
    if (idInput) {
      idInput.value = targetId;
    }
    var expectedAppsInput = document.getElementById('reject-expected-apps');
    if (expectedAppsInput) {
      expectedAppsInput.value = expectedApps || '';
    }
    var reasonInput = document.getElementById('reject-reason');
    if (reasonInput) {
      reasonInput.value = '';
    }
    var modal = document.getElementById('reject-modal');
    if (modal) {
      modal.showModal();
    }
  }

  function closeRejectModal() {
    var modal = document.getElementById('reject-modal');
    if (modal) {
      modal.close();
    }
  }
}.toString() + ')();';
