/**
 * サービスアプリモーダル用クライアントスクリプト。
 * サービスに組み込むアプリの追加・削除を管理する。
 */

declare global {
  interface Window {
    i18n: any
    openServiceAppsModal: (enc: any, availableApps: any, appsDataId?: string) => void
    addServiceApp: () => void
    removeServiceApp: (serviceId: any, appId: any) => void
    initFilterSelect?: (id: string) => void
    showConfirm: (msg: string, cb: () => void) => void
  }
}

interface AppItem {
  id: string
  name: string
  group_name?: string
}

// APIプレフィックスはHTMLのhidden inputから取得する
const apiPrefixEl = document.getElementById('sa-api-prefix') as HTMLInputElement | null;
const apiPrefix = apiPrefixEl ? apiPrefixEl.value : '';

window.openServiceAppsModal = (enc: string, availableApps: AppItem[], appsDataId?: string) => {
  const s = JSON.parse(decodeURIComponent(enc));
  (document.getElementById('sa-service-id') as HTMLInputElement).value = s.id;
  const titleEl = document.getElementById('sa-service-name');
  if (titleEl) titleEl.textContent = s.name;

  const composed: AppItem[] = s.apps || [];
  const composedIds = composed.map((a: AppItem) => a.id);

  const compEl = document.getElementById('sa-composed');
  if (compEl) {
    compEl.innerHTML = composed.length ? composed.map((a: AppItem) =>
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:0.45rem 0.6rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:0.4rem;"><span>' + a.name + '</span>'
      + '<a href="#" data-action="sa-remove-app" data-service-id="' + s.id + '" data-app-id="' + a.id + '" style="color:#ef4444;text-decoration:none;cursor:pointer;font-size:0.85rem;padding:0.2rem;">' + (window.i18n && window.i18n.btnRemove ? window.i18n.btnRemove : '外す') + '</a></div>'
    ).join('') : '<div style="color:#94a3b8;font-size:0.88rem;">' + (window.i18n && window.i18n.svcNoApps ? window.i18n.svcNoApps : '(まだ組み込まれていません)') + '</div>';
  }

  let apps = availableApps || [];
  if (apps.length === 0 && appsDataId) {
    const appsJson = document.getElementById(appsDataId);
    if (appsJson) {
      try {
        apps = JSON.parse(appsJson.textContent || '[]');
      } catch (e) { /* ignore */ }
    }
  }

  const addable = (apps || []).filter((a: AppItem) => composedIds.indexOf(a.id) === -1);
  const sel = document.getElementById('sa-app') as HTMLSelectElement | null;
  if (sel) {
    let opts = '<option value="">' + (window.i18n && window.i18n.svcSelectApp ? window.i18n.svcSelectApp : 'アプリを選択') + '</option>';
    addable.forEach((a: AppItem) => {
      const label = a.name + (a.group_name ? ' (' + a.group_name + ')' : '');
      opts += '<option value="' + a.id + '">' + label + '</option>';
    });
    sel.innerHTML = opts;
    if (window.initFilterSelect) {
      window.initFilterSelect('sa-app');
    }
  }

  const warn = document.getElementById('sa-no-approved');
  if (warn) {
    warn.style.display = (apps || []).length === 0 ? '' : 'none';
  }
  if (sel) {
    sel.style.display = (apps || []).length === 0 ? 'none' : 'block';
  }

  const m = document.getElementById('service-apps-modal') as CustomModalElement | null;
  if (m) m.showModal();
};

window.addServiceApp = () => {
  const serviceId = (document.getElementById('sa-service-id') as HTMLInputElement).value;
  const appId = (document.getElementById('sa-app') as HTMLSelectElement).value;
  if (!appId) {
    console.error(window.i18n && window.i18n.svcSelectApp ? window.i18n.svcSelectApp : 'アプリを選択してください');
    return;
  }
  fetch(apiPrefix + '/service/app/add', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ service_id: serviceId, app_id: appId })
  })
    .then((r) => { if (!r.ok) throw new Error('Error ' + r.status); return r.json(); })
    .then(() => { window.location.reload(); })
    .catch((e) => { console.error('Error: ' + e.message); });
};

window.removeServiceApp = (serviceId: string, appId: string) => {
  const doRemove = () => {
    fetch(apiPrefix + '/service/app/remove', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service_id: serviceId, app_id: appId })
    })
      .then((r) => { if (!r.ok) throw new Error('Error ' + r.status); return r.json(); })
      .then(() => { window.location.reload(); })
      .catch((e) => { console.error('Error: ' + e.message); });
  };

  if (window.showConfirm) {
    window.showConfirm(
      window.i18n && window.i18n.svcConfirmRemoveApp ? window.i18n.svcConfirmRemoveApp : '本当にこのアプリをサービスから外しますか？',
      doRemove
    );
  } else {
    doRemove();
  }
};

// CSP 対応: 組込済みアプリの「外す」リンクは innerHTML で動的に再生成されるため、
// インライン onclick / javascript: URI を使えない(script-src の 'unsafe-inline' 撤廃で弾かれる)。
// document へ一度だけ委譲リスナを張り、data-action="sa-remove-app" を拾って処理する。
document.addEventListener('click', (e) => {
  const el = (e.target as HTMLElement | null)?.closest('[data-action="sa-remove-app"]') as HTMLElement | null;
  if (!el) return;
  e.preventDefault();
  const serviceId = el.getAttribute('data-service-id');
  const appId = el.getAttribute('data-app-id');
  if (serviceId && appId) window.removeServiceApp(serviceId, appId);
});

export {}
