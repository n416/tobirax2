// @ts-nocheck
// このファイルはクライアントサイドで実行されるJavaScriptです。
// コンパイル時に構文チェックを行うため、関数として定義し文字列化して配信します。

export const serviceAppsModalClientScript = '(' + function() {
  // バンドラ(esbuild等)が自動挿入するデバッグ用関数への対策
  var __name = function(f) { return f; };

  (function() {
    // APIプレフィックスはHTMLのhidden inputから取得する
    var apiPrefixEl = document.getElementById('sa-api-prefix');
    var apiPrefix = apiPrefixEl ? apiPrefixEl.value : '';

    window.openServiceAppsModal = function(enc, availableApps, appsDataId) {
      var s = JSON.parse(decodeURIComponent(enc));
      document.getElementById('sa-service-id').value = s.id;
      var titleEl = document.getElementById('sa-service-name');
      if (titleEl) titleEl.textContent = s.name;
      
      var composed = s.apps || [];
      var composedIds = composed.map(function(a){ return a.id; });
      
      var compEl = document.getElementById('sa-composed');
      if (compEl) {
          compEl.innerHTML = composed.length ? composed.map(function(a){
            return '<div style="display:flex;align-items:center;justify-content:space-between;padding:0.45rem 0.6rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:0.4rem;"><span>' + a.name + '</span>'
              + '<a href="javascript:void(0)" onclick="removeServiceApp(\'' + s.id + '\',\'' + a.id + '\')" style="color:#ef4444;text-decoration:none;cursor:pointer;font-size:0.85rem;padding:0.2rem;">' + (window.i18n && window.i18n.btnRemove ? window.i18n.btnRemove : '外す') + '</a></div>';
          }).join('') : '<div style="color:#94a3b8;font-size:0.88rem;">' + (window.i18n && window.i18n.svcNoApps ? window.i18n.svcNoApps : '(まだ組み込まれていません)') + '</div>';
      }

      availableApps = availableApps || [];
      if (availableApps.length === 0 && appsDataId) {
        var appsJson = document.getElementById(appsDataId);
        if (appsJson) {
          try {
            availableApps = JSON.parse(appsJson.textContent);
          } catch(e) {}
        }
      }

      var addable = (availableApps || []).filter(function(a){ return composedIds.indexOf(a.id) === -1; });
      var sel = document.getElementById('sa-app');
      if (sel) {
          var opts = '<option value="">' + (window.i18n && window.i18n.svcSelectApp ? window.i18n.svcSelectApp : 'アプリを選択') + '</option>';
          addable.forEach(function(a){ 
              var label = a.name + (a.group_name ? ' (' + a.group_name + ')' : '');
              opts += '<option value="' + a.id + '">' + label + '</option>'; 
          });
          sel.innerHTML = opts;
          if (window.initFilterSelect) {
              window.initFilterSelect('sa-app');
          }
      }
      
      var warn = document.getElementById('sa-no-approved');
      if (warn) {
        warn.style.display = (availableApps || []).length === 0 ? '' : 'none';
      }
      if (sel) {
        sel.style.display = (availableApps || []).length === 0 ? 'none' : 'block';
      }

      var m = document.getElementById('service-apps-modal');
      if (m) m.showModal();
    };

    window.addServiceApp = function() {
      var serviceId = document.getElementById('sa-service-id').value;
      var appId = document.getElementById('sa-app').value;
      if (!appId) { 
          console.error(window.i18n && window.i18n.svcSelectApp ? window.i18n.svcSelectApp : 'アプリを選択してください'); 
          return; 
      }
      fetch(apiPrefix + '/service/app/add', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ service_id: serviceId, app_id: appId })
      })
      .then(function(r){ if (!r.ok) throw new Error('Error ' + r.status); return r.json(); })
      .then(function(){ window.location.reload(); })
      .catch(function(e){
        console.error('Error: ' + e.message);
      });
    };

    window.removeServiceApp = function(serviceId, appId) {
      if (window.showConfirm) {
        window.showConfirm(window.i18n && window.i18n.svcConfirmRemoveApp ? window.i18n.svcConfirmRemoveApp : '本当にこのアプリをサービスから外しますか？', function() {
          fetch(apiPrefix + '/service/app/remove', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ service_id: serviceId, app_id: appId })
          })
          .then(function(r){ if (!r.ok) throw new Error('Error ' + r.status); return r.json(); })
          .then(function(){ window.location.reload(); })
          .catch(function(e){ console.error('Error: ' + e.message); });
        });
      } else {
        // showConfirmが利用不可の場合のフォールバック
        fetch(apiPrefix + '/service/app/remove', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ service_id: serviceId, app_id: appId })
        })
        .then(function(r){ if (!r.ok) throw new Error('Error ' + r.status); return r.json(); })
        .then(function(){ window.location.reload(); })
        .catch(function(e){ console.error('Error: ' + e.message); });
      }
    };
  })();
}.toString() + ')();';
