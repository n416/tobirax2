import { html } from 'hono/html'
import { css } from 'hono/css'
import { Modal } from './Modal'
import { Button } from './Button'

const formLabel = css`display: block; font-weight: 700; font-size: 0.9rem; color: #1e293b; margin-bottom: 0.4rem;`
const selectInput = css`
  width: 100%; padding: 0.6rem 0.75rem; border: 1px solid #cbd5e1;
  border-radius: 8px; font-size: 0.95rem; background: #fff;
  transition: all 0.2s; outline: none;
  &:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
`
const infoBox = css`
  background: #f1f5f9; border-left: 4px solid #3b82f6;
  padding: 1rem; color: #334155; font-size: 0.9rem; line-height: 1.5;
  display: flex; align-items: flex-start; gap: 0.75rem;
`

export const ServiceAppsModal = (t: any, apiPrefix: string) => {
  return html`

    <!-- サービスへのアプリ組み込みモーダル -->
    ${Modal({
    id: 'service-apps-modal',
    title: t.ga_svc_manage_apps || 'アプリを管理',
    closeAction: "this.closest('.custom-modal').close()",
    children: html`
        <div style="display:flex; flex-direction:column; gap:1.25rem;">
          <input type="hidden" id="sa-service-id" />
          <div style="font-weight:700; font-size:1.1rem; color:var(--text-main); border-bottom:1px solid #e2e8f0; padding-bottom:0.5rem; margin-bottom:0.25rem;">
            <span id="sa-service-name"></span>
          </div>
          
          <div>
            <label class="${formLabel}">組み込み済みのアプリ</label>
            <div id="sa-composed" style="margin-top:0.5rem;"></div>
          </div>

          <div style="margin-top:1rem; padding-top:1rem; border-top:1px dashed #cbd5e1;">
            <label class="${formLabel}">承認済みアプリを追加</label>
            <div id="sa-no-approved" style="display:none; margin-bottom:0.5rem;" class="${infoBox}">
              <span class="material-symbols-outlined" style="vertical-align:middle;">info</span>利用可能なアプリがありません。
            </div>
            <div style="display:flex; flex-direction:column; gap:0.5rem;">
              <select id="sa-app" class="${selectInput}"></select>
              ${Button({ onclick: "addServiceApp()", children: html`<span class="material-symbols-outlined">add_link</span> 組み込む` })}
            </div>
          </div>
        </div>
      `
  })}
    <script>
      (function() {
        var apiPrefix = '${apiPrefix}';
        
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
                  + '<a href="javascript:void(0)" onclick="removeServiceApp(\\'' + s.id + '\\',\\'' + a.id + '\\')" style="color:#ef4444;text-decoration:none;cursor:pointer;font-size:0.85rem;padding:0.2rem;">' + (window.i18n && window.i18n.btnRemove ? window.i18n.btnRemove : '外す') + '</a></div>';
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
             if (confirm('本当にこのアプリをサービスから外しますか？')) {
                fetch(apiPrefix + '/service/app/remove', {
                  method:'POST', headers:{'Content-Type':'application/json'},
                  body: JSON.stringify({ service_id: serviceId, app_id: appId })
                })
                .then(function(r){ if (!r.ok) throw new Error('Error ' + r.status); return r.json(); })
                .then(function(){ window.location.reload(); })
                .catch(function(e){ console.error('Error: ' + e.message); });
             }
          }
        };
      })();
    </script>
  `
}
