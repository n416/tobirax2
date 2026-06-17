// @ts-nocheck
// このファイルはクライアントサイドで実行されるJavaScriptです。
// コンパイル時に構文チェックを行うため、関数として定義し文字列化して配信します。

export const accountAssignmentsClientScript = '(' + function() {
  // バンドラ(esbuild等)が自動挿入するデバッグ用関数への対策
  var __name = function(f) { return f; };

  (function() {
    var rolesEl = document.getElementById('roles-json');
    var facUseEl = document.getElementById('facuse-json');
    var i18nEl = document.getElementById('i18n-no-role');
    var ROLES = rolesEl ? JSON.parse(rolesEl.textContent) : [];
    var FAC_USE = facUseEl ? JSON.parse(facUseEl.textContent) : {};
    var i18nNoRole = i18nEl ? JSON.parse(i18nEl.textContent) : 'No role';

    function refreshRoles() {
      var svc = document.getElementById('a-service');
      var fac = document.getElementById('a-facility');
      var role = document.getElementById('a-role');
      if (!svc || !fac || !role) return;
      var use = FAC_USE[fac.value] || null;
      var matched = ROLES.filter(function(r){ return r.service_id === svc.value && (r.facility_type == null || r.facility_type === use); });
      role.innerHTML = '';
      var oNone = document.createElement('option'); oNone.value=''; oNone.textContent = i18nNoRole;
      if (matched.length === 0) {
        oNone.selected = true;
      }
      role.appendChild(oNone);
      matched.forEach(function(r){ var o = document.createElement('option'); o.value = r.id; o.textContent = r.role_name; role.appendChild(o); });
    }
    window.amRefreshRoles = refreshRoles;
    document.addEventListener('DOMContentLoaded', function(){
      var svc = document.getElementById('a-service');
      var fac = document.getElementById('a-facility');
      if (svc) svc.addEventListener('change', refreshRoles);
      if (fac) fac.addEventListener('change', refreshRoles);
      refreshRoles();
    });
  })();
}.toString() + ')();';
