import { html, raw } from 'hono/html'
import { css } from 'hono/css'
import { dict } from '../i18n'
import { Layout } from './components/Layout'
import { UserTopbar } from './components/UserTopbar'
import { Group, App } from '../types'
import { Button } from './components/Button'
import { Modal } from './components/Modal'
import { MultiSelect } from './components/MultiSelect'
import { ServiceAppsModal } from './components/ServiceAppsModal'

interface ManagedGroup extends Group {
  member_count: number
}

interface GroupMember {
  id: number
  user_id: string
  email: string
  name: string | null
  role: 'group_admin' | 'billing_admin' | 'member'
  valid_from: number
  valid_to: number
}

interface Assignment {
  id: number
  user_email: string
  user_name: string | null
  service_name: string
  facility_id: string
  structure_no: string | null
  building_use: string | null
  role_name: string
  valid_from: number
  valid_to: number
}

interface AppPermission {
  app_id: string
  app_name: string
  source: 'user' | 'group'
  valid_from: number
  valid_to: number
  user_email: string
}

interface Props {
  t: typeof dict.en
  userEmail: string
  siteName: string
  profileName?: string | null
  profilePicture?: string | null
  managedGroups: ManagedGroup[]
  allUsers: { id: string; email: string; name: string | null }[]
  // グループIDをキーとした各種データ
  membersByGroup: Record<string, GroupMember[]>
  assignmentsByGroup: Record<string, Assignment[]>
  permissionsByGroup: Record<string, AppPermission[]>
  // 割当作成(ゲート③)用
  grantsByGroup: Record<string, { service_id: string; service_name: string }[]>
  facilities: { id: string; structure_no: string | null; building_use: string | null; managing_group_id: string }[]
  rolesByService: Record<string, { id: number; service_id: string; facility_type: string | null; role_name: string }[]>
  // 利用枠(ゲート②)用
  grantsDetailByGroup: Record<string, { id: number; service_id: string; service_name: string; contract_id: string; seat_limit: number | null; valid_from: number; valid_to: number }[]>
  availableContracts: { id: string; service_id: string; customer_group_id: string; seat_limit: number | null; service_name: string; group_name: string | null }[]
  // 決済権者(billing_admin)か。利用枠タブの表示可否を制御する。
  isBillingAdmin: boolean
  // 各グループの直接の子グループ(管理サブツリー内)。子枠の分配先・配分済み一覧に使う。
  childrenByGroup: Record<string, { id: string; name: string }[]>
  // セルフサービス(アプリ申請 / 自グループのサービス作成)用
  servicesByGroup: Record<string, { id: string; name: string; status: string; apps: { id: string; name: string }[] }[]>
  appsByGroup: Record<string, { id: string; name: string; base_url: string; status: string }[]>
  // サービスに組み込める = 自グループの承認済み(active)アプリ
  approvedAppsByGroup: Record<string, { id: string; name: string }[]>
  devStatuses?: Record<string, { status: string; reason: string | null }>
  apps: App[]
}

export const GroupAdminPage = (props: Props) => {
  const t = props.t
  const groups = props.managedGroups

  const userOptions = props.allUsers.map(u => ({
    value: u.id,
    text: u.name ? `${u.name} <${u.email}>` : u.email,
  }))
  const allUsersJson = JSON.stringify(userOptions)

  // タブ切替 + グループ切替はすべてクライアントJS で処理する。
  // グループ×タブのデータは JSON として埋め込み、再フェッチ不要にする。
  const membersByGroupJson = JSON.stringify(props.membersByGroup)
  const assignmentsByGroupJson = JSON.stringify(props.assignmentsByGroup)
  const permsByGroupJson = JSON.stringify(props.permissionsByGroup)
  const grantsByGroupJson = JSON.stringify(props.grantsByGroup)
  const facilitiesJson = JSON.stringify(props.facilities)
  const rolesByServiceJson = JSON.stringify(props.rolesByService)
  const grantsDetailByGroupJson = JSON.stringify(props.grantsDetailByGroup)
  const availableContractsJson = JSON.stringify(props.availableContracts)
  const childrenByGroupJson = JSON.stringify(props.childrenByGroup)
  const isBillingAdmin = props.isBillingAdmin
  const servicesByGroupJson = JSON.stringify(props.servicesByGroup)
  const appsByGroupJson = JSON.stringify(props.appsByGroup)
  const approvedAppsByGroupJson = JSON.stringify(props.approvedAppsByGroup)
  const devStatusesJson = JSON.stringify(props.devStatuses || {})

  const sectionTitle = css`
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--text-main);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1.25rem;
    & .material-symbols-outlined { color: var(--primary); }
  `

  const card = css`
    background: rgba(255,255,255,0.72);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.6);
    border-radius: 16px;
    box-shadow: 0 4px 16px -6px rgba(31,38,135,0.18);
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  `

  const tabBar = css`
    display: flex;
    gap: 0.35rem;
    margin-bottom: 1.75rem;
    background: rgba(255,255,255,0.5);
    border-radius: 12px;
    padding: 0.35rem;
    & button {
      flex: 1;
      padding: 0.65rem 1rem;
      border: none !important;
      border-radius: 9px;
      font-size: 0.92rem;
      font-weight: 600;
      color: var(--text-sub);
      background: transparent !important;
      box-shadow: none !important;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      & .material-symbols-outlined { font-size: 19px; }
    }
    & button:hover { background: rgba(255,255,255,0.7) !important; color: var(--primary); }
    & button.active { background: #fff !important; color: var(--primary); box-shadow: 0 2px 6px -2px rgba(0,0,0,0.1) !important; }
    input:not([type="checkbox"]):not([type="radio"]):not([role="combobox"]), select:not(.tomselected) { width: 100%; padding: 0.6rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem; background: #fff; transition: all 0.2s; outline: none; }
    input:not([type="checkbox"]):not([type="radio"]):not([role="combobox"]):focus, select:not(.tomselected):focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }
  `

  const groupSelectWrapper = css`
    min-width: 280px;
    & .ts-control {
      font-size: 1rem !important;
      font-weight: 600 !important;
      color: var(--text-main) !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 12px !important;
      background: rgba(255,255,255,0.9) !important;
      padding: 0.7rem 1rem !important;
      cursor: text !important;
      box-shadow: none !important;
      min-height: auto !important;
      display: flex !important;
      align-items: center !important;
    }
    & .ts-control > input {
      border: none !important;
      background: transparent !important;
      box-shadow: none !important;
      margin: 0 !important;
      padding: 0 !important;
      width: auto !important;
      flex: 1 1 auto !important;
      min-width: 2rem !important;
      display: inline-block !important;
      height: auto !important;
      line-height: inherit !important;
    }
    & .ts-control::before {
      content: '\\e8b6'; /* Material Symbol search */
      font-family: 'Material Symbols Outlined';
      font-weight: normal;
      font-size: 20px;
      color: #94a3b8;
      margin-right: 4px;
    }
    & .ts-wrapper.focus .ts-control {
      border-color: var(--primary) !important;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1) !important;
    }
    & .ts-dropdown {
      border-radius: 12px !important;
      border: 1px solid #e2e8f0 !important;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1) !important;
      font-size: 0.95rem !important;
    }
    & .ts-dropdown .option {
      padding: 0.5rem 0.8rem !important;
    }
    & .ts-dropdown .option.active {
      background-color: #f1f5f9 !important;
      color: var(--primary) !important;
    }
  `

  const badge = css`
    display: inline-flex;
    align-items: center;
    font-size: 0.72rem;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 999px;
  `

  const tableWrap = css`
    overflow-x: auto;
    & table { width: 100%; border-collapse: separate; border-spacing: 0 0.4rem; }
    & th { font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-sub); padding: 0.4rem 0.75rem; border-bottom: none; }
    & td { background: rgba(255,255,255,0.5); padding: 0.8rem 0.75rem; font-size: 0.92rem; vertical-align: middle; border: none; }
    & td:first-child { border-radius: 10px 0 0 10px; }
    & td:last-child { border-radius: 0 10px 10px 0; }
  `

  const formLabel = css`display: block; font-weight: 700; font-size: 0.9rem; color: #1e293b; margin-bottom: 0.4rem;`

  const dateInput = css`
    width: 100%; padding: 0.7rem 1rem; background: #fff; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem; color: #334155;
    &:focus { border-color: var(--primary); outline: none; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }
  `

  // 素の <select> はユーザー向け Layout だと無装飾で小さく潰れるため、入力欄と統一する。
  // ネイティブの矢印を消し、右側にシェブロンを描画する。
  const selectInput = css`
    width: 100%; padding: 0.7rem 2.2rem 0.7rem 1rem; background-color: #fff;
    border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem; color: #334155; cursor: pointer;
    appearance: none; -webkit-appearance: none; -moz-appearance: none;
    background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 0.75rem center; background-size: 1rem;
    &:focus { border-color: var(--primary); outline: none; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }
  `

  const infoBox = css`
    display: flex;
    align-items: flex-start;
    gap: 0.6rem;
    padding: 0.85rem 1rem;
    background: rgba(79,70,229,0.06);
    border: 1px solid rgba(79,70,229,0.15);
    border-radius: 10px;
    font-size: 0.88rem;
    color: var(--text-sub);
    margin-bottom: 1rem;
    & .material-symbols-outlined { color: var(--primary); font-size: 18px; flex-shrink: 0; margin-top: 1px; }
  `

  const actionBtn = css`
    background: transparent !important; border: none !important; color: #94a3b8 !important; cursor: pointer !important;
    padding: 7px !important; border-radius: 50% !important; transition: all 0.2s !important; box-shadow: none !important;
    display: inline-flex !important; align-items: center !important; justify-content: center !important;
    width: 34px !important; height: 34px !important; flex-shrink: 0 !important;
    &:hover { background: #fef2f2 !important; color: #ef4444 !important; }
  `

  const scriptContent = raw(`
    (function() {
      var membersByGroup = null;
      var assignsByGroup = null;
      var permsByGroup = null;
      var grantsByGroup = null;
      var facilities = null;
      var rolesByService = null;
      var grantsDetailByGroup = null;
      var availableContracts = null;
      var childrenByGroup = null;
      var isBillingAdmin = ${isBillingAdmin ? 'true' : 'false'};
      var servicesByGroup = null;
      var appsByGroup = null;
      var approvedAppsByGroup = null;
      var currentTab = 'members';
      var currentGroupId = '';

      document.addEventListener('DOMContentLoaded', function() {
        try {
          var savedTab = localStorage.getItem('ga_current_tab');
          if (savedTab) currentTab = savedTab;
        } catch(e){}

        var md = document.getElementById('ga-members-data');
        var ad = document.getElementById('ga-assigns-data');
        var pd = document.getElementById('ga-perms-data');
        var gd = document.getElementById('ga-grants-data');
        var fd = document.getElementById('ga-facilities-data');
        var rd = document.getElementById('ga-roles-data');
        if (md) membersByGroup = JSON.parse(md.textContent);
        if (ad) assignsByGroup = JSON.parse(ad.textContent);
        if (pd) permsByGroup = JSON.parse(pd.textContent);
        if (gd) grantsByGroup = JSON.parse(gd.textContent);
        if (fd) facilities = JSON.parse(fd.textContent);
        if (rd) rolesByService = JSON.parse(rd.textContent);
        var grd = document.getElementById('ga-grants-detail-data');
        var ctd = document.getElementById('ga-contracts-data');
        if (grd) grantsDetailByGroup = JSON.parse(grd.textContent);
        if (ctd) availableContracts = JSON.parse(ctd.textContent);
        var chd = document.getElementById('ga-children-data');
        if (chd) childrenByGroup = JSON.parse(chd.textContent);
        var svd = document.getElementById('ga-services-data');
        var apd = document.getElementById('ga-apps-data');
        var aapd = document.getElementById('ga-approved-apps-data');
        if (svd) servicesByGroup = JSON.parse(svd.textContent);
        if (apd) appsByGroup = JSON.parse(apd.textContent);
        if (aapd) approvedAppsByGroup = JSON.parse(aapd.textContent);

        var sel = document.getElementById('group-select');
        if (sel && typeof TomSelect !== 'undefined' && sel.tagName === 'SELECT') {
          new TomSelect('#group-select', {
            create: false,
            sortField: { field: '$order' },
            searchField: ['text'],
            placeholder: '検索...',
            onChange: function(val) {
               currentGroupId = val;
               renderAll();
            },
            render: {
              option: function(data, escape) {
                var depth = parseInt(data.$option.getAttribute('data-depth') || '0', 10);
                var origName = data.$option.getAttribute('data-origname') || data.text;
                var pad = depth * 1.5;
                var icon = depth > 0 ? '<span class="material-symbols-outlined" style="font-size:16px; color:#94a3b8; flex-shrink:0;">subdirectory_arrow_right</span>' : '';
                return '<div style="padding-left:' + pad + 'rem; display:flex; align-items:center; gap:0.4rem;">' + icon + '<span style="font-weight:' + (depth===0?'700':'500') + '; color:var(--text-main);">' + escape(origName) + '</span></div>';
              },
              item: function(data, escape) {
                return '<div style="display:flex; align-items:center; gap:0.4rem; padding: 0 0.4rem;">' + escape(data.text) + '</div>';
              }
            }
          });
        } else if (sel && sel.value) {
          // TomSelectが使えない環境用フォールバック
          sel.addEventListener('change', function(e) {
            currentGroupId = e.target.value;
            renderAll();
          });
        }
        
        // 初期描画用
        var initialVal = sel ? sel.value : null;
        if (initialVal) {
          currentGroupId = initialVal;
          renderAll();
        }
        window.switchTab(currentTab);
        
        if (typeof TomSelect !== 'undefined') {
          var el = document.getElementById('m-user-id');
          if (el) {
            window.tsCtrl = new TomSelect('#m-user-id', { plugins: ['remove_button'], create: false, maxItems: null });
          }
        }
      });

      window.switchGroup = function() {
        // (TomSelectのonChangeに委譲したため、HTMLのonchange属性から呼ばれる場合のフォールバック)
        var sel = document.getElementById('group-select');
        if(sel) {
           currentGroupId = sel.value;
           renderAll();
        }
      };

      window.switchTab = function(tab) {
        // 利用枠タブは決済権者のみ。非表示時に保存タブが 'grants' でもメンバータブへ退避する。
        if (tab === 'grants' && !isBillingAdmin) tab = 'members';
        currentTab = tab;
        try { localStorage.setItem('ga_current_tab', tab); } catch(e){}
        ['members', 'assignments', 'grants', 'access', 'apps'].forEach(function(t) {
          var btn = document.getElementById('tab-btn-' + t);
          var pane = document.getElementById('tab-' + t);
          if (btn) {
            if (t === tab) {
              btn.classList.add('active');
            } else {
              btn.classList.remove('active');
            }
          }
          if (pane) pane.style.display = t === tab ? '' : 'none';
        });
      };

      function renderAll() {
        renderMembers();
        renderAssignments();
        renderGrants();
        renderPerms();
        renderServices();
        renderApps();
        if (typeof renderDeveloperUI === 'function') renderDeveloperUI();
      }

      var pendingConfirmCallback = null;
      window.showConfirm = function(message, callback) {
        var modal = document.getElementById('custom-confirm-modal');
        var msgEl = document.getElementById('custom-confirm-message');
        var execBtn = document.getElementById('custom-confirm-execute-btn');
        if (modal && msgEl && execBtn) {
          msgEl.innerText = message;
          pendingConfirmCallback = callback;
          execBtn.onclick = function() {
            var cb = pendingConfirmCallback;
            closeConfirmModal();
            if (cb) cb();
          };
          modal.showModal();
        }
      };
      window.closeConfirmModal = function() {
        var modal = document.getElementById('custom-confirm-modal');
        if (modal) modal.close();
        pendingConfirmCallback = null;
      };

      var devStatuses = null;
      window.renderDeveloperUI = function() {
        var dsd = document.getElementById('ga-dev-status-data');
        if (!devStatuses && dsd) devStatuses = JSON.parse(dsd.textContent);
        
        var ds = devStatuses && currentGroupId ? devStatuses[currentGroupId] : null;
        var status = ds ? ds.status : 'none';
        var noDev = document.getElementById('dev-not-approved');
        var devUi = document.getElementById('dev-approved');
        var pendingUi = document.getElementById('dev-pending');

        if (status === 'approved') {
          if(noDev) noDev.style.display = 'none';
          if(pendingUi) pendingUi.style.display = 'none';
          if(devUi) devUi.style.display = 'block';
        } else if (status === 'pending') {
          if(noDev) noDev.style.display = 'none';
          if(pendingUi) pendingUi.style.display = 'block';
          if(devUi) devUi.style.display = 'none';
        } else {
          if(noDev) noDev.style.display = 'block';
          if(pendingUi) pendingUi.style.display = 'none';
          if(devUi) devUi.style.display = 'none';
          var rejectMsg = document.getElementById('dev-rejected-msg');
          if (rejectMsg) {
            rejectMsg.style.display = status === 'rejected' ? 'flex' : 'none';
            if (status === 'rejected') {
              var el = document.getElementById('dev-rejected-reason-text');
              if (el) el.innerText = ds.admin_reason || '事由なし';
            }
          }
          var revokedMsg = document.getElementById('dev-revoked-msg');
          if (revokedMsg) {
            revokedMsg.style.display = status === 'revoked' ? 'flex' : 'none';
            if (status === 'revoked') {
              var el2 = document.getElementById('dev-revoked-reason-text');
              if (el2) el2.innerText = ds.admin_reason || '事由なし';
            }
          }
        }
      };

      window.applyDeveloper = function() {
        var reason = (document.getElementById('dev-apply-reason') || {}).value;
        if (!reason || !reason.trim()) { console.error('申請理由を入力してください'); return; }
        fetch('/group-admin/api/developer/apply', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ group_id: currentGroupId, reason: reason.trim() })
        }).then(function(r){ if (!r.ok) throw new Error('Error ' + r.status); return r.json(); })
          .then(function(){ window.location.reload(); })
          .catch(function(e){ console.error('Error: ' + e.message); });
      };

      window.manageServiceApps = function(serviceId, serviceNameEnc) {
          var services = (servicesByGroup && servicesByGroup[currentGroupId]) ? servicesByGroup[currentGroupId] : [];
          var s = services.find(function(x){ return x.id === serviceId; });
          if (!s) return;
          var availableApps = (approvedAppsByGroup && approvedAppsByGroup[currentGroupId]) ? approvedAppsByGroup[currentGroupId] : [];
          if (window.openServiceAppsModal) {
            window.openServiceAppsModal(encodeURIComponent(JSON.stringify(s)), availableApps);
          }
        };

      var currentManageRolesServiceId = null;
      window.manageRoles = function(serviceId, serviceNameEnc) {
        currentManageRolesServiceId = serviceId;
        var m = document.getElementById('manage-roles-modal');
        var titleEl = document.getElementById('mr-service-name');
        if (titleEl) titleEl.innerText = decodeURIComponent(serviceNameEnc);
        
        var roleListEl = document.getElementById('mr-role-list');
        var roles = (rolesByService && rolesByService[serviceId]) ? rolesByService[serviceId] : [];
        if (roles.length === 0) {
          roleListEl.innerHTML = '<div style="color:#94a3b8; font-size:0.9rem;">登録されている役割はありません。</div>';
        } else {
          roleListEl.innerHTML = roles.map(function(r) {
            return '<div style="display:flex; justify-content:space-between; align-items:center; padding:0.5rem; border-bottom:1px solid #f1f5f9;">'
                 + '<div><strong>' + r.role_name + '</strong> <span style="color:#64748b; font-size:0.8rem;">[' + r.role_code + ']</span>'
                 + (r.facility_type ? ' <span style="font-size:0.75rem; color:#0f172a; background:#e2e8f0; padding:2px 6px; border-radius:4px;">' + r.facility_type + '</span>' : '')
                 + '</div>'
                 + '<button type="button" onclick="removeRole(' + r.id + ')" class="material-symbols-outlined" style="color:#ef4444; background:none; border:none; cursor:pointer; font-size:18px;">delete</button>'
                 + '</div>';
          }).join('');
        }
        ['mr-role-name','mr-role-code'].forEach(function(id){ var e=document.getElementById(id); if(e) e.value=''; });
        var facEl = document.getElementById('mr-facility-type');
        if(facEl) facEl.value = '';
        if (m) m.showModal();
      };
      
      window.addRole = function() {
        var rn = document.getElementById('mr-role-name').value;
        var rc = document.getElementById('mr-role-code').value;
        var ft = (document.getElementById('mr-facility-type') || {}).value;
        if (!rn || !rc) { console.error('役割名とロールコードは必須です'); return; }
        fetch('/group-admin/api/roles/add', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ service_id: currentManageRolesServiceId, role_name: rn.trim(), role_code: rc.trim(), facility_type: ft || null })
        }).then(function(r){ if (!r.ok) throw new Error('Error ' + r.status); return r.json(); })
          .then(function(){ window.location.reload(); })
          .catch(function(e){ console.error('Error: ' + e.message); });
      };

      window.removeRole = function(id) {
        showConfirm('この役割を削除しますか？', function() {
          fetch('/group-admin/api/roles/remove', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
          }).then(function(r){ if (!r.ok) throw new Error('Error ' + r.status); return r.json(); })
            .then(function(){ window.location.reload(); })
            .catch(function(e){ console.error('Error: ' + e.message); });
        });
      };

      function fmt(ts) {
        if (!ts) return '—';
        if (ts > 2000000000) return '無期限';
        return new Date(ts * 1000).toLocaleDateString();
      }

      function renderMembers() {
        var el = document.getElementById('members-table-body');
        if (!el) return;
        var list = membersByGroup && currentGroupId ? (membersByGroup[currentGroupId] || []) : [];
        if (list.length === 0) {
          el.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:2rem;">' + (window.i18n.noMembers || '(メンバーなし)') + '</td></tr>';
          return;
        }
        el.innerHTML = list.map(function(m) {
          var isAdmin = m.role === 'group_admin';
          var isBilling = m.role === 'billing_admin';
          var badgeColor = isBilling ? '#5b21b6' : (isAdmin ? '#9a3412' : '#475569');
          var badgeBg = isBilling ? '#ede9fe' : (isAdmin ? '#ffedd5' : '#f1f5f9');
          var badgeLabel = isBilling ? (window.i18n.roleBilling || '決済権者') : (isAdmin ? (window.i18n.roleAdmin || 'グループ管理者') : (window.i18n.roleMember || 'メンバー'));
          var badgeHtml = '<span style="font-size:0.72rem; font-weight:700; padding:2px 8px; border-radius:999px; color:' + badgeColor + '; background:' + badgeBg + ';">' + badgeLabel + '</span>';
          var displayName = m.name || m.email;
          var subEmail = m.name ? ('<div style="font-size:0.8rem; color:#94a3b8;">' + m.email + '</div>') : '';
          return '<tr>'
            + '<td><div>' + displayName + '</div>' + subEmail + '</td>'
            + '<td>' + badgeHtml + '</td>'
            + '<td style="font-size:0.85rem; color:#64748b;">' + fmt(m.valid_from) + ' ～ ' + fmt(m.valid_to) + '</td>'
            + '<td style="text-align:right;"><button type="button" onclick="removeMember(' + m.id + ')" style="background:transparent;border:none;color:#94a3b8;cursor:pointer;padding:7px;border-radius:50%;width:34px;height:34px;display:inline-flex;align-items:center;justify-content:center;transition:all 0.2s;" onmouseover="this.style.background=\\'#fef2f2\\';this.style.color=\\'#ef4444\\';" onmouseout="this.style.background=\\'transparent\\';this.style.color=\\'#94a3b8\\';"><span class="material-symbols-outlined" style="font-size:18px;">person_remove</span></button></td>'
            + '</tr>';
        }).join('');
      }

      // 指定グループが「直接の子グループ」へ配分した同一サービスの席数合計。
      //   実効上限(自グループで使える枠)= 親の枠 - この合計、の計算に使う(createAssignment と一致)。
      function childDistributedSeats(groupId, serviceId) {
        var kids = (childrenByGroup && childrenByGroup[groupId]) ? childrenByGroup[groupId] : [];
        var sum = 0;
        kids.forEach(function(ch) {
          var cg = (grantsDetailByGroup && grantsDetailByGroup[ch.id]) ? grantsDetailByGroup[ch.id] : [];
          cg.forEach(function(g) { if (g.service_id === serviceId && g.seat_limit != null) sum += g.seat_limit; });
        });
        return sum;
      }

      function renderAssignments() {
        var summaryEl = document.getElementById('assigns-summary');
        var list = assignsByGroup && currentGroupId ? (assignsByGroup[currentGroupId] || []) : [];
        var grants = grantsDetailByGroup && currentGroupId ? (grantsDetailByGroup[currentGroupId] || []) : [];

        if (summaryEl) {
          if (grants.length === 0) {
            summaryEl.innerHTML = '';
            summaryEl.style.display = 'none';
          } else {
            summaryEl.style.display = 'grid';
            var htmlStr = '';
            grants.forEach(function(g) {
              var usedUsers = {};
              list.forEach(function(a) {
                if (a.service_id === g.service_id) {
                  usedUsers[a.user_id] = true;
                }
              });
              var usedCount = Object.keys(usedUsers).length;
              // 実効上限 = 自グループの枠 - 子グループへ配分した同一サービスの枠。
              var childSeats = childDistributedSeats(currentGroupId, g.service_id);
              var effLimit = (g.seat_limit == null) ? null : Math.max(0, g.seat_limit - childSeats);
              var limitStr = (effLimit == null) ? '無制限' : effLimit;
              var isFull = (effLimit != null && usedCount >= effLimit);
              var remainingStr = (effLimit == null) ? '上限なし' : ('残り ' + (effLimit - usedCount) + ' 枠');
              var barPercent = (effLimit == null || effLimit === 0) ? 0 : Math.min(100, Math.round((usedCount / effLimit) * 100));
              var barColor = isFull ? '#ef4444' : '#10b981';
              htmlStr += '<div style="background:white; border:1px solid #e2e8f0; border-radius:8px; padding:1rem; box-shadow:0 1px 2px rgba(0,0,0,0.05);">'
                + '<div style="font-size:0.85rem; color:#64748b; font-weight:600; margin-bottom:0.5rem; display:flex; justify-content:space-between;">'
                + '<span>' + g.service_name + '</span><span style="color:' + (isFull ? '#ef4444' : '#64748b') + ';">' + remainingStr + '</span>'
                + '</div>'
                + '<div style="font-size:1.25rem; font-weight:800; color:#0f172a; margin-bottom:0.5rem;">' + usedCount + ' <span style="font-size:0.85rem; font-weight:500; color:#64748b;">/ ' + limitStr + ' 消費</span></div>'
                + '<div style="width:100%; background:#f1f5f9; border-radius:999px; height:6px; overflow:hidden;">'
                + '<div style="height:100%; background:' + barColor + '; width:' + barPercent + '%;"></div>'
                + '</div>'
                + '</div>';
            });
            summaryEl.innerHTML = htmlStr;
          }
        }

        var el = document.getElementById('assigns-table-body');
        if (!el) return;
        if (list.length === 0) {
          el.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#94a3b8; padding:2rem;">' + (window.i18n.noAssignments || '割当がありません') + '</td></tr>';
          return;
        }
        el.innerHTML = list.map(function(a) {
          var facility = a.structure_no || a.facility_id;
          if (a.building_use) facility += ' (' + a.building_use + ')';
          var user = a.user_name || a.user_email;
          return '<tr>'
            + '<td>' + user + (a.user_name ? '<div style="font-size:0.8rem;color:#94a3b8;">' + a.user_email + '</div>' : '') + '</td>'
            + '<td style="font-size:0.88rem;">' + a.service_name + '</td>'
            + '<td style="font-size:0.85rem; color:#64748b;">' + facility + '</td>'
            + '<td style="font-size:0.85rem;">' + a.role_name + '</td>'
            + '<td style="font-size:0.82rem; color:#94a3b8;">' + fmt(a.valid_from) + ' ～ ' + fmt(a.valid_to) + '</td>'
            + '<td style="text-align:right;"><button type="button" onclick="removeAssignment(' + a.id + ')" style="background:transparent;border:none;color:#94a3b8;cursor:pointer;padding:7px;border-radius:50%;width:34px;height:34px;display:inline-flex;align-items:center;justify-content:center;transition:all 0.2s;" onmouseover="this.style.background=\\'#fef2f2\\';this.style.color=\\'#ef4444\\';" onmouseout="this.style.background=\\'transparent\\';this.style.color=\\'#94a3b8\\';"><span class="material-symbols-outlined" style="font-size:18px;">delete</span></button></td>'
            + '</tr>';
        }).join('');
      }

      function renderPerms() {
        var el = document.getElementById('perms-table-body');
        if (!el) return;
        var list = permsByGroup && currentGroupId ? (permsByGroup[currentGroupId] || []) : [];
        if (list.length === 0) {
          el.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:2rem;">' + (window.i18n.noAccess || 'アクセス権がありません') + '</td></tr>';
          return;
        }
        el.innerHTML = list.map(function(p) {
          var srcLabel = p.source === 'user' ? (window.i18n.srcUser || 'ユーザー個別') : (window.i18n.srcGroup || 'グループ');
          var srcColor = p.source === 'user' ? '#1d4ed8' : '#047857';
          var srcBg = p.source === 'user' ? '#dbeafe' : '#d1fae5';
          return '<tr>'
            + '<td style="font-size:0.88rem;">' + p.user_email + '</td>'
            + '<td><strong>' + p.app_name + '</strong></td>'
            + '<td><span style="font-size:0.75rem; font-weight:700; padding:2px 8px; border-radius:999px; color:' + srcColor + '; background:' + srcBg + ';">' + srcLabel + '</span></td>'
            + '<td style="font-size:0.82rem; color:#94a3b8;">' + fmt(p.valid_from) + ' ～ ' + fmt(p.valid_to) + '</td>'
            + '</tr>';
        }).join('');
      }

      var removeTargetId = null;
      window.removeMember = function(mid) {
        showConfirm(window.i18n.amConfirmRemove || 'このメンバーを削除しますか？', function() {
          fetch('/group-admin/api/member/remove', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: id }) })
            .then(function(r){ if (!r.ok) throw new Error('Error ' + r.status); return r.json(); })
            .then(function(){ window.location.reload(); })
            .catch(function(e){ console.error('Error: ' + e.message); });
        });
      };
      window.closeRemoveModal = function() {
        var m = document.getElementById('remove-confirm-modal');
        if (m) m.close();
        removeTargetId = null;
      };
      window.executeRemove = function() {
        if (!removeTargetId) return;
        fetch('/group-admin/api/membership/remove', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: removeTargetId }) })
          .then(function(r) { if (!r.ok) throw new Error('Error ' + r.status); return r.json(); })
          .then(function() {
            window.closeRemoveModal();
            // ローカルデータからも削除してリレンダー
            if (membersByGroup && currentGroupId) {
              membersByGroup[currentGroupId] = (membersByGroup[currentGroupId] || []).filter(function(m) { return m.id !== removeTargetId; });
            }
            removeTargetId = null;
            renderMembers();
          })
          .catch(function(e) { console.error('Error: ' + e.message); });
      };

      window.addMember = function() {
        var userIds = window.tsCtrl ? window.tsCtrl.getValue() : [];
        if (!Array.isArray(userIds)) userIds = [userIds];
        userIds = userIds.filter(function(id) { return id; });
        if (!userIds.length) { console.error('ユーザーを選択してください'); return; }
        var role = document.getElementById('m-role').value || 'member';
        var startVal = document.getElementById('m-valid-from').value;
        var endVal = document.getElementById('m-valid-to').value;
        var validFrom = startVal ? Math.floor(new Date(startVal).getTime()/1000) : Math.floor(Date.now()/1000);
        var validTo = endVal ? Math.floor(new Date(endVal).getTime()/1000) : Math.floor(Date.now()/1000) + 315360000;
        fetch('/group-admin/api/membership/add', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ group_id: currentGroupId, user_ids: userIds, role: role, valid_from: validFrom, valid_to: validTo })
        })
        .then(function(r) { if (!r.ok) throw new Error('Error ' + r.status); return r.json(); })
        .then(function() { window.location.reload(); })
        .catch(function(e) { console.error('Error: ' + e.message); });
      };

      window.openAddModal = function() {
        var m = document.getElementById('add-member-modal');
        if (m) m.showModal();
        if (window.tsCtrl) window.tsCtrl.clear();
        var vf = document.getElementById('m-valid-from'); if(vf) vf.value = new Date().toISOString().split('T')[0];
        var vt = document.getElementById('m-valid-to'); if(vt) vt.value = '';
      };

      // ===== ゲート③ 割当の作成/解除(委任) =====
      function fillSelect(el, items, valueKey, textKey, placeholder) {
        if (!el) return;
        var html = '<option value="">' + placeholder + '</option>';
        items.forEach(function(it) { html += '<option value="' + it[valueKey] + '">' + it[textKey] + '</option>'; });
        el.innerHTML = html;
      }

      window.refreshAssignRoles = function() {
        var svcEl = document.getElementById('a-service');
        var facEl = document.getElementById('a-facility');
        var roleEl = document.getElementById('a-role');
        if (!svcEl || !facEl || !roleEl) return;
        var serviceId = svcEl.value;
        var facId = facEl.value;
        var buildingUse = null;
        if (facId && facilities) {
          for (var i = 0; i < facilities.length; i++) { if (facilities[i].id === facId) { buildingUse = facilities[i].building_use; break; } }
        }
        var roles = (serviceId && rolesByService) ? (rolesByService[serviceId] || []) : [];
        // 役割マスタは facility_type=NULL(全種別) か、選択建物の用途に一致するものだけ出す。
        var filtered = roles.filter(function(r) { return r.facility_type == null || r.facility_type === buildingUse; });
        fillSelect(roleEl, filtered.map(function(r){ return { id: r.id, role_name: r.role_name }; }), 'id', 'role_name', window.i18n.selectRole || '役割を選択');
      };

      window.openAssignModal = function() {
        if (!currentGroupId) return;
        var m = document.getElementById('add-assign-modal');
        // ユーザー= 現グループのメンバー、サービス= 現グループの利用枠、施設= 管理サブツリー配下。
        var members = (membersByGroup && membersByGroup[currentGroupId]) ? membersByGroup[currentGroupId] : [];
        var grants = (grantsByGroup && grantsByGroup[currentGroupId]) ? grantsByGroup[currentGroupId] : [];
        fillSelect(document.getElementById('a-user'), members.map(function(x){ return { user_id: x.user_id, label: (x.name ? x.name + ' <' + x.email + '>' : x.email) }; }), 'user_id', 'label', window.i18n.selectUser || '利用者を選択');
        fillSelect(document.getElementById('a-service'), grants, 'service_id', 'service_name', window.i18n.selectService || 'サービスを選択');
        var facList = (facilities || []).map(function(f){ var lbl = (f.structure_no || f.id) + (f.building_use ? ' (' + f.building_use + ')' : ''); return { id: f.id, label: lbl }; });
        fillSelect(document.getElementById('a-facility'), facList, 'id', 'label', window.i18n.selectFacility || '施設を選択');
        var roleEl = document.getElementById('a-role');
        if (roleEl) roleEl.innerHTML = '<option value="">' + (window.i18n.selectRole || '役割を選択') + '</option>';
        var vf = document.getElementById('a-valid-from'); if (vf) vf.value = new Date().toISOString().split('T')[0];
        var vt = document.getElementById('a-valid-to'); if (vt) vt.value = '';
        var warn = document.getElementById('a-no-grant'); if (warn) warn.style.display = grants.length === 0 ? '' : 'none';
        if (m) m.showModal();
      };

      window.addAssignment = function() {
        var userId = (document.getElementById('a-user') || {}).value;
        var serviceId = (document.getElementById('a-service') || {}).value;
        var facilityId = (document.getElementById('a-facility') || {}).value;
        var roleId = (document.getElementById('a-role') || {}).value;
        var sv = document.getElementById('a-valid-from').value;
        var ev = document.getElementById('a-valid-to').value;
        if (!userId || !serviceId || !facilityId || !roleId) { console.error(window.i18n.selectAll || '全項目を選択してください'); return; }
        var validFrom = sv ? Math.floor(new Date(sv).getTime()/1000) : Math.floor(Date.now()/1000);
        var validTo = ev ? Math.floor(new Date(ev).getTime()/1000) : Math.floor(Date.now()/1000) + 315360000;
        fetch('/group-admin/api/assignment/add', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ group_id: currentGroupId, user_id: userId, service_id: serviceId, facility_id: facilityId, service_role_id: Number(roleId), valid_from: validFrom, valid_to: validTo })
        })
        .then(function(r){ if (!r.ok) return r.json().catch(function(){return{};}).then(function(e){ throw new Error(e.error || ('Error ' + r.status)); }); return r.json(); })
        .then(function(){ window.location.reload(); })
        .catch(function(e){
          if (e.message === 'no_grant') console.error(window.i18n.errNoGrant || '利用枠がありません');
          else if (e.message === 'seat') console.error(window.i18n.errSeat || '席数上限に達しています');
          else console.error('Error: ' + e.message);
        });
      };

      var removeAssignTargetId = null;
      window.removeAssignment = function(aid) {
        removeAssignTargetId = aid;
        var m = document.getElementById('remove-assign-modal');
        if (m) m.showModal();
      };
      window.closeRemoveAssignModal = function() {
        var m = document.getElementById('remove-assign-modal');
        if (m) m.close();
        removeAssignTargetId = null;
      };
      window.executeRemoveAssignment = function() {
        if (!removeAssignTargetId) return;
        fetch('/group-admin/api/assignment/remove', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: removeAssignTargetId }) })
          .then(function(r){ if (!r.ok) throw new Error('Error ' + r.status); return r.json(); })
          .then(function(){
            if (assignsByGroup && currentGroupId) {
              assignsByGroup[currentGroupId] = (assignsByGroup[currentGroupId] || []).filter(function(a){ return a.id !== removeAssignTargetId; });
            }
            window.closeRemoveAssignModal();
            renderAssignments();
          })
          .catch(function(e){ console.error('Error: ' + e.message); });
      };

      // ===== ゲート② 利用枠の開放/取消 + 子枠の分配(決済権者のみ) =====
      function renderGrants() {
        var i18n = window.i18n;
        var list = grantsDetailByGroup && currentGroupId ? (grantsDetailByGroup[currentGroupId] || []) : [];
        var kids = (childrenByGroup && currentGroupId && childrenByGroup[currentGroupId]) ? childrenByGroup[currentGroupId] : [];

        // ---- サマリー: 各親枠について [総枠] [子へ配分] [自グループで利用可能] ----
        var summaryEl = document.getElementById('grants-summary');
        if (summaryEl) {
          if (list.length === 0) {
            summaryEl.innerHTML = '';
            summaryEl.style.display = 'none';
          } else {
            summaryEl.style.display = 'flex';
            summaryEl.innerHTML = list.map(function(g) {
              var childSeats = childDistributedSeats(currentGroupId, g.service_id);
              var unlimited = (g.seat_limit == null);
              var totalStr = unlimited ? (i18n.grantUnlimited || '無制限') : g.seat_limit;
              var availNum = unlimited ? null : Math.max(0, g.seat_limit - childSeats);
              var availStr = unlimited ? (i18n.grantUnlimited || '無制限') : availNum;
              var over = (!unlimited && childSeats > g.seat_limit);
              return '<div style="background:white; border:1px solid #e2e8f0; border-radius:8px; padding:1rem; flex:1; min-width:260px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">'
                + '<div style="font-size:0.9rem; font-weight:700; color:#0f172a; margin-bottom:0.65rem;">' + g.service_name + '</div>'
                + '<div style="display:flex; gap:0.75rem;">'
                +   '<div style="flex:1;"><div style="font-size:0.7rem; color:#64748b; margin-bottom:0.15rem;">' + (i18n.grantTotal || '総枠') + '</div><div style="font-size:1.15rem; font-weight:800; color:#0f172a;">' + totalStr + '</div></div>'
                +   '<div style="flex:1;"><div style="font-size:0.7rem; color:#64748b; margin-bottom:0.15rem;">' + (i18n.grantDistributed || '子へ配分') + '</div><div style="font-size:1.15rem; font-weight:800; color:#7c3aed;">' + childSeats + '</div></div>'
                +   '<div style="flex:1;"><div style="font-size:0.7rem; color:#64748b; margin-bottom:0.15rem;">' + (i18n.grantAvailable || '利用可能') + '</div><div style="font-size:1.15rem; font-weight:800; color:' + (over ? '#ef4444' : '#10b981') + ';">' + availStr + '</div></div>'
                + '</div>'
                + '</div>';
            }).join('');
          }
        }

        // ---- 親から受け取った自グループの枠(親枠)一覧 ----
        var el = document.getElementById('grants-table-body');
        if (el) {
          if (list.length === 0) {
            el.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:2rem;">' + (i18n.noGrants || '利用枠がありません') + '</td></tr>';
          } else {
            el.innerHTML = list.map(function(g) {
              var childSeats = childDistributedSeats(currentGroupId, g.service_id);
              var seat;
              if (g.seat_limit == null) {
                seat = (i18n.seatUnlimited || '無制限');
              } else {
                seat = g.seat_limit + ' <span style="color:#94a3b8; font-size:0.78rem;">(' + (i18n.grantDistributed || '子へ配分') + ' ' + childSeats + ' / ' + (i18n.grantAvailable || '利用可能') + ' ' + Math.max(0, g.seat_limit - childSeats) + ')</span>';
              }
              return '<tr>'
                + '<td><strong>' + g.service_name + '</strong></td>'
                + '<td style="font-size:0.85rem; color:#64748b;">' + seat + '</td>'
                + '<td style="font-size:0.82rem; color:#94a3b8;">' + fmt(g.valid_from) + ' ～ ' + fmt(g.valid_to) + '</td>'
                + '<td style="text-align:right;"><button type="button" onclick="removeGrant(' + g.id + ')" style="background:transparent;border:none;color:#94a3b8;cursor:pointer;padding:7px;border-radius:50%;width:34px;height:34px;display:inline-flex;align-items:center;justify-content:center;transition:all 0.2s;" onmouseover="this.style.background=\\'#fef2f2\\';this.style.color=\\'#ef4444\\';" onmouseout="this.style.background=\\'transparent\\';this.style.color=\\'#94a3b8\\';"><span class="material-symbols-outlined" style="font-size:18px;">delete</span></button></td>'
                + '</tr>';
            }).join('');
          }
        }

        // ---- 子グループへ配分済みの枠 ----
        renderChildGrants(kids);
      }

      // 直接の子グループへ配分した枠の一覧(グループ / サービス / 席数)。
      function renderChildGrants(kids) {
        var i18n = window.i18n;
        var sec = document.getElementById('child-grants-section');
        var body = document.getElementById('child-grants-table-body');
        if (!body) return;
        var rows = [];
        (kids || []).forEach(function(ch) {
          var cg = (grantsDetailByGroup && grantsDetailByGroup[ch.id]) ? grantsDetailByGroup[ch.id] : [];
          cg.forEach(function(g) { rows.push({ child: ch, g: g }); });
        });
        if (sec) sec.style.display = (kids && kids.length > 0) ? '' : 'none';
        if (rows.length === 0) {
          body.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:2rem;">' + (i18n.noChildGrants || '子グループへ配分された枠はありません。') + '</td></tr>';
          return;
        }
        body.innerHTML = rows.map(function(r) {
          var seat = (r.g.seat_limit == null) ? (i18n.seatUnlimited || '無制限') : r.g.seat_limit;
          return '<tr>'
            + '<td><span class="material-symbols-outlined" style="font-size:16px; color:#94a3b8; vertical-align:middle; margin-right:0.3rem;">subdirectory_arrow_right</span>' + r.child.name + '</td>'
            + '<td style="font-size:0.88rem;">' + r.g.service_name + '</td>'
            + '<td style="font-size:0.85rem; color:#64748b;">' + seat + '</td>'
            + '<td style="text-align:right;"><button type="button" onclick="removeGrant(' + r.g.id + ')" style="background:transparent;border:none;color:#94a3b8;cursor:pointer;padding:7px;border-radius:50%;width:34px;height:34px;display:inline-flex;align-items:center;justify-content:center;transition:all 0.2s;" onmouseover="this.style.background=\\'#fef2f2\\';this.style.color=\\'#ef4444\\';" onmouseout="this.style.background=\\'transparent\\';this.style.color=\\'#94a3b8\\';"><span class="material-symbols-outlined" style="font-size:18px;">delete</span></button></td>'
            + '</tr>';
        }).join('');
      }

      window.openGrantModal = function() {
        if (!currentGroupId) return;
        var m = document.getElementById('add-grant-modal');
        // 対象グループ = 自グループ + 直接の子グループ。
        var kids = (childrenByGroup && childrenByGroup[currentGroupId]) ? childrenByGroup[currentGroupId] : [];
        var targetOpts = [{ id: currentGroupId, label: (window.i18n.grantSelf || '自グループ') }];
        kids.forEach(function(ch){ targetOpts.push({ id: ch.id, label: ch.name }); });
        var tgtEl = document.getElementById('g-target');
        fillSelect(tgtEl, targetOpts, 'id', 'label', '');
        if (tgtEl) tgtEl.value = currentGroupId;
        var seatEl = document.getElementById('g-seat'); if (seatEl) seatEl.value = '';
        var vf = document.getElementById('g-valid-from'); if (vf) vf.value = new Date().toISOString().split('T')[0];
        var vt = document.getElementById('g-valid-to'); if (vt) vt.value = '';
        var errEl = document.getElementById('g-error'); if (errEl) errEl.style.display = 'none';
        onGrantTargetChange();
        if (m) m.showModal();
      };

      // 対象グループの切替で「契約/サービス」選択肢と席数フィールドの要否を切り替える。
      window.onGrantTargetChange = function() {
        var tgt = (document.getElementById('g-target') || {}).value || currentGroupId;
        var isSelf = (tgt === currentGroupId);
        var contractEl = document.getElementById('g-contract');
        var warn = document.getElementById('g-no-contract');
        if (isSelf) {
          // 自グループ: システム管理者から配布可能な契約を開放(ルート枠)。
          var contracts = availableContracts || [];
          fillSelect(contractEl, contracts.map(function(ct){ return { id: ct.id, label: ct.service_name + (ct.group_name ? ' / ' + ct.group_name : '') + (ct.seat_limit != null ? ' (' + ct.seat_limit + ')' : '') }; }), 'id', 'label', window.i18n.selectContract || '契約を選択');
          if (warn) warn.style.display = contracts.length === 0 ? '' : 'none';
        } else {
          // 子グループ: 親(自グループ)が保有する枠をサービス単位で分割。契約は親の枠を継承(value=契約ID)。
          var parentGrants = (grantsDetailByGroup && grantsDetailByGroup[currentGroupId]) ? grantsDetailByGroup[currentGroupId] : [];
          fillSelect(contractEl, parentGrants.map(function(g){
            var childSeats = childDistributedSeats(currentGroupId, g.service_id);
            var remain = (g.seat_limit == null) ? (window.i18n.grantUnlimited || '無制限') : Math.max(0, g.seat_limit - childSeats);
            return { id: g.contract_id, label: g.service_name + ' (' + (window.i18n.grantAvailable || '利用可能') + ' ' + remain + ')' };
          }), 'id', 'label', window.i18n.selectService || 'サービスを選択');
          if (warn) warn.style.display = parentGrants.length === 0 ? '' : 'none';
        }
        // 席数フィールド: 子グループへ配るときのみ表示&必須。
        var seatWrap = document.getElementById('g-seat-wrap');
        if (seatWrap) seatWrap.style.display = isSelf ? 'none' : '';
        var seatInput = document.getElementById('g-seat');
        if (seatInput) { seatInput.required = !isSelf; if (isSelf) seatInput.value = ''; }
      };

      function showGrantError(msg) {
        var errEl = document.getElementById('g-error');
        if (errEl) { errEl.textContent = msg; errEl.style.display = ''; }
        else console.error(msg);
      }

      window.addGrant = function() {
        var target = (document.getElementById('g-target') || {}).value || currentGroupId;
        var isSelf = (target === currentGroupId);
        var contractId = (document.getElementById('g-contract') || {}).value;
        var seatVal = isSelf ? '' : (((document.getElementById('g-seat') || {}).value || '') + '').trim();
        var sv = document.getElementById('g-valid-from').value;
        var ev = document.getElementById('g-valid-to').value;
        if (!contractId) { showGrantError(window.i18n.selectContract || '契約を選択してください'); return; }
        if (!isSelf && seatVal === '') { showGrantError(window.i18n.errSeatRequired || '上限枠数を入力してください'); return; }
        var validFrom = sv ? Math.floor(new Date(sv).getTime()/1000) : Math.floor(Date.now()/1000);
        var validTo = ev ? Math.floor(new Date(ev).getTime()/1000) : Math.floor(Date.now()/1000) + 315360000;
        fetch('/group-admin/api/grant/add', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ group_id: target, contract_id: contractId, seat_limit: seatVal, valid_from: validFrom, valid_to: validTo, context_group_id: currentGroupId })
        })
        .then(function(r){ if (!r.ok) return r.json().catch(function(){return{};}).then(function(e){ throw new Error(e.error || ('Error ' + r.status)); }); return r.json(); })
        .then(function(){ window.location.reload(); })
        .catch(function(e){
          if (e.message === 'needs_elevation') { showBillingElevation('addGrant'); return; }
          if (e.message === 'over_budget') showGrantError(window.i18n.errOverBudget || '親の残り枠を超えています');
          else if (e.message === 'seat_required') showGrantError(window.i18n.errSeatRequired || '上限枠数を入力してください');
          else showGrantError('Error: ' + e.message);
        });
      };

      var pendingBillingAction = null;
      window.showBillingElevation = function(action) {
        pendingBillingAction = action;
        var p = document.getElementById('billing-elevate-pwd');
        if (p) p.value = '';
        var err = document.getElementById('billing-elevate-err');
        if (err) err.style.display = 'none';
        var m = document.getElementById('billing-elevation-modal');
        if (m) m.showModal();
      };
      window.executeBillingElevation = function() {
        var pwd = document.getElementById('billing-elevate-pwd').value;
        var err = document.getElementById('billing-elevate-err');
        fetch('/group-admin/api/billing/elevate', {
          method: 'POST', headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ group_id: currentGroupId, password: pwd })
        })
        .then(function(r){ if(!r.ok) return r.json().catch(function(){return{};}).then(function(e){ throw new Error(e.error||'Error'); }); return r.json(); })
        .then(function(res){
           document.getElementById('billing-elevation-modal').close();
           if (pendingBillingAction === 'addGrant') window.addGrant();
           else if (pendingBillingAction === 'executeRemoveGrant') window.executeRemoveGrant();
           pendingBillingAction = null;
        })
        .catch(function(e){
           if (err) {
             err.style.display = '';
             if (e.message === 'bad_password') err.textContent = 'パスワードが間違っています。';
             else if (e.message === 'no_password') err.textContent = '決裁権者パスワードが未設定です。システム管理者に依頼してください。';
             else err.textContent = 'エラーが発生しました: ' + e.message;
           }
        });
      };

      // 決裁権者パスワードのローテーション(本人が現パスワードで変更)。
      window.openBillingRotate = function() {
        if (!currentGroupId) return;
        var cur = document.getElementById('billing-rotate-cur'); if (cur) cur.value = '';
        var nw = document.getElementById('billing-rotate-new'); if (nw) nw.value = '';
        var err = document.getElementById('billing-rotate-err'); if (err) err.style.display = 'none';
        var m = document.getElementById('billing-rotate-modal');
        if (m) m.showModal();
      };
      window.executeBillingRotate = function() {
        var cur = (document.getElementById('billing-rotate-cur') || {}).value || '';
        var nw = (document.getElementById('billing-rotate-new') || {}).value || '';
        var err = document.getElementById('billing-rotate-err');
        if (!nw) { if (err) { err.style.display=''; err.textContent = window.i18n.billingNewRequired || '新しいパスワードを入力してください。'; } return; }
        fetch('/group-admin/api/billing/rotate', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ group_id: currentGroupId, current_password: cur, new_password: nw })
        })
        .then(function(r){ if(!r.ok) return r.json().catch(function(){return{};}).then(function(e){ throw new Error(e.error||'Error'); }); return r.json(); })
        .then(function(){ var m = document.getElementById('billing-rotate-modal'); if (m) m.close(); })
        .catch(function(e){
          if (!err) return;
          err.style.display = '';
          if (e.message === 'bad_password') err.textContent = window.i18n.billingBadPassword || '現在のパスワードが違います。';
          else if (e.message === 'no_password') err.textContent = window.i18n.billingNoPassword || '決裁権者パスワードが未設定です。システム管理者に初期設定を依頼してください。';
          else err.textContent = 'Error: ' + e.message;
        });
      };
      // パスワードを解除してノーゲートに戻す(現パスワードが必要)。new_password を空で送る。
      window.executeBillingClear = function() {
        var cur = (document.getElementById('billing-rotate-cur') || {}).value || '';
        var err = document.getElementById('billing-rotate-err');
        if (!cur) { if (err) { err.style.display=''; err.textContent = window.i18n.billingCurRequired || '現在のパスワードを入力してください。'; } return; }
        if (!confirm(window.i18n.billingClearConfirm || 'パスワードを解除して、このグループの予算操作をパスワード無し（ノーゲート）に戻しますか？')) return;
        fetch('/group-admin/api/billing/rotate', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ group_id: currentGroupId, current_password: cur, new_password: '' })
        })
        .then(function(r){ if(!r.ok) return r.json().catch(function(){return{};}).then(function(e){ throw new Error(e.error||'Error'); }); return r.json(); })
        .then(function(){ var m = document.getElementById('billing-rotate-modal'); if (m) m.close(); })
        .catch(function(e){
          if (!err) return;
          err.style.display = '';
          if (e.message === 'bad_password') err.textContent = window.i18n.billingBadPassword || '現在のパスワードが違います。';
          else if (e.message === 'no_password') err.textContent = window.i18n.billingNoPassword || '決裁権者パスワードが未設定です。システム管理者に初期設定を依頼してください。';
          else err.textContent = 'Error: ' + e.message;
        });
      };

      var removeGrantTargetId = null;
      window.removeGrant = function(gid) {
        removeGrantTargetId = gid;
        var m = document.getElementById('remove-grant-modal');
        if (m) m.showModal();
      };
      window.closeRemoveGrantModal = function() {
        var m = document.getElementById('remove-grant-modal');
        if (m) m.close();
        removeGrantTargetId = null;
      };
      window.executeRemoveGrant = function() {
        if (!removeGrantTargetId) return;
        fetch('/group-admin/api/grant/remove', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: removeGrantTargetId, context_group_id: currentGroupId }) })
          .then(function(r){ if (!r.ok) return r.json().catch(function(){return{};}).then(function(e){ throw new Error(e.error || ('Error ' + r.status)); }); return r.json(); })
          .then(function(){
            // 親枠・子枠どちらの取消でも整合するよう、全グループのローカルデータから除去する。
            if (grantsDetailByGroup) {
              Object.keys(grantsDetailByGroup).forEach(function(gid){
                grantsDetailByGroup[gid] = (grantsDetailByGroup[gid] || []).filter(function(g){ return g.id !== removeGrantTargetId; });
              });
            }
            window.closeRemoveGrantModal();
            renderGrants();
            renderAssignments();
          })
          .catch(function(e){
            if (e.message === 'needs_elevation') { window.closeRemoveGrantModal(); showBillingElevation('executeRemoveGrant'); return; }
            console.error('Error: ' + e.message);
          });
      };

      function statusBadge(st) {
        var map = {
          pending:  ['#c2410c', '#fff7ed', window.i18n.statusPending || 'Pending'],
          rejected: ['#b91c1c', '#fef2f2', window.i18n.statusRejected || 'Rejected'],
          inactive: ['#d97706', '#fffbeb', window.i18n.statusInactive || 'Paused'],
          active:   ['#16a34a', '#f0fdf4', window.i18n.statusActive || 'Active']
        };
        var s = map[st] || map.active;
        return '<span style="font-size:0.72rem;font-weight:700;padding:2px 8px;border-radius:999px;color:' + s[0] + ';background:' + s[1] + ';">' + s[2] + '</span>';
      }

      // ===== セルフサービス: 自グループのサービス(=承認済みアプリの束ね) =====
            function renderServices() {
        var el = document.getElementById('services-table-body');
        if (!el) return;
        var list = servicesByGroup && currentGroupId ? (servicesByGroup[currentGroupId] || []) : [];
        if (list.length === 0) {
          el.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:1.5rem;">' + (window.i18n.svcNone || '(なし)') + '</td></tr>';
          return;
        }
        el.innerHTML = list.map(function(s) {
          var apps = s.apps || [];
          var chips = apps.length ? apps.map(function(a){
            return '<span style="display:inline-flex;align-items:center;gap:0.25rem;background:#eef2ff;color:#4338ca;border:1px solid #c7d2fe;border-radius:999px;padding:2px 6px 2px 10px;font-size:0.78rem;margin:0 0.25rem 0.25rem 0;">' + a.name
              + (s.status !== 'active' ? '<button type="button" title="外す" onclick="removeServiceApp(\\'' + s.id + '\\',\\'' + a.id + '\\')" style="background:none;border:none;color:#6366f1;cursor:pointer;padding:0 2px;line-height:1;font-size:0.95rem;">×</button>' : '') + '</span>';
          }).join('') : '<span style="color:#cbd5e1;">—</span>';
          
          var reasonInfo = '';
          if (s.status === 'rejected' && s.reason) {
            reasonInfo = '<div style="margin-top:0.5rem; padding:0.5rem; background:#fef2f2; border:1px solid #fecaca; border-radius:6px; font-size:0.8rem; color:#b91c1c;"><strong>却下事由:</strong> ' + s.reason.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\\n/g, '<br/>') + '</div>';
          }
          
          var encS = encodeURIComponent(JSON.stringify(s));
          return '<tr>'
            + '<td><strong>' + s.name + '</strong>'
            +   '<div style="font-size:0.75rem; color:#64748b; font-family:monospace; margin-top:2px;">' + s.id + '</div>'
            +   '<div style="margin-top:0.4rem;">' + chips + '</div>'
            +   reasonInfo
            + '</td>'
            + '<td style="text-align:right;">'
            +   (s.status === 'rejected' ? '<button type="button" onclick="reapplyService(\\'' + s.id + '\\')" style="background:#fff;border:1px solid #fecaca;color:#dc2626;cursor:pointer;padding:0.4rem 0.75rem;border-radius:6px;font-size:0.8rem;font-weight:600;margin-right:0.5rem;transition:all 0.2s;" onmouseover="this.style.background=\\'#fef2f2\\';"><span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;margin-right:2px;">refresh</span>再申請</button>' : '')
            +   (s.status !== 'active' ? '<button type="button" onclick="manageServiceApps(\\'' + s.id + '\\', \\'' + encodeURIComponent(s.name) + '\\')" style="background:transparent;border:1px solid #cbd5e1;color:#4f46e5;cursor:pointer;padding:0.4rem 0.75rem;border-radius:6px;font-size:0.8rem;font-weight:600;margin-right:0.5rem;transition:all 0.2s;" onmouseover="this.style.background=\\'#eef2ff\\';this.style.borderColor=\\'#a5b4fc\\';"><span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;margin-right:2px;">settings_applications</span>' + (window.i18n.svcManageApps || 'アプリを組み込む') + '</button>' : '')
            +   '<button type="button" onclick="manageRoles(\\'' + s.id + '\\', \\'' + encodeURIComponent(s.name) + '\\')" style="background:transparent;border:1px solid #cbd5e1;color:#047857;cursor:pointer;padding:0.4rem 0.75rem;border-radius:6px;font-size:0.8rem;font-weight:600;margin-right:0.5rem;transition:all 0.2s;" onmouseover="this.style.background=\\'#d1fae5\\';this.style.borderColor=\\'#6ee7b7\\';"><span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;margin-right:2px;">manage_accounts</span>役割(ロール)を管理</button>'
            +   (s.status !== 'active' ? '<button type="button" title="削除" onclick="removeService(\\'' + s.id + '\\')" style="background:transparent;border:none;color:#94a3b8;cursor:pointer;padding:7px;border-radius:50%;width:34px;height:34px;transition:all 0.2s;display:inline-flex;align-items:center;justify-content:center;vertical-align:middle;" onmouseover="this.style.background=\\'#fef2f2\\';this.style.color=\\'#ef4444\\';" onmouseout="this.style.background=\\'transparent\\';this.style.color=\\'#94a3b8\\';"><span class="material-symbols-outlined" style="font-size:18px;">delete</span></button>' : '')
            + '</td>'
            + '</tr>';
        }).join('');
      }

      window.openServiceModal = function() {
        if (!currentGroupId) return;
        var nameEl = document.getElementById('s-name'); if (nameEl) nameEl.value = '';
        var m = document.getElementById('add-service-modal');
        if (m) m.showModal();
      };
      window.addService = function() {
        var name = (document.getElementById('s-name') || {}).value;
        if (!name || !name.trim()) { console.error(window.i18n.svcName || 'name'); return; }
        fetch('/group-admin/api/service/create', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ group_id: currentGroupId, name: name.trim() })
        })
        .then(function(r){ if (!r.ok) throw new Error('Error ' + r.status); return r.json(); })
        .then(function(){ window.location.reload(); })
        .catch(function(e){ console.error('Error: ' + e.message); });
      };
      window.removeService = function(id) {
        showConfirm(window.i18n.svcConfirmRemove || 'このサービスを削除しますか？', function() {
          fetch('/group-admin/api/service/delete', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: id }) })
            .then(function(r){ if (!r.ok) throw new Error('Error ' + r.status); return r.json(); })
            .then(function(){ window.location.reload(); })
            .catch(function(e){ console.error('Error: ' + e.message); });
        });
      };
      window.reapplyService = function(id) {
        showConfirm('このサービスを再度申請してよろしいですか？', function() {
          fetch('/group-admin/api/service/reapply', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: id }) })
            .then(function(r){ if (!r.ok) throw new Error('Error ' + r.status); return r.json(); })
            .then(function(){ window.location.reload(); })
            .catch(function(e){ console.error('Error: ' + e.message); });
        });
      };

      // ===== セルフサービス: アプリ登録の申請(サービス紐づけは扱わない) =====
      function renderApps() {
        var el = document.getElementById('apps-table-body');
        if (!el) return;
        var list = appsByGroup && currentGroupId ? (appsByGroup[currentGroupId] || []) : [];
        if (list.length === 0) {
          el.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#94a3b8; padding:1.5rem;">' + (window.i18n.appNone || '(なし)') + '</td></tr>';
          return;
        }
        el.innerHTML = list.map(function(a) {
          var dataAttr = encodeURIComponent(JSON.stringify(a));
          var reasonInfo = '';
          if (a.status === 'rejected' && a.reason) {
             reasonInfo = '<div style="margin-top:0.4rem; padding:0.5rem; background:#fef2f2; border:1px solid #fecaca; border-radius:6px; font-size:0.75rem; color:#b91c1c;"><strong>却下事由:</strong> ' + a.reason.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\\n/g, '<br/>') + '<br/><span style="color:#ef4444; font-weight:bold;">※ 編集して保存すると自動的に再申請されます。</span></div>';
          }
          return '<tr>'
            + '<td><strong>' + a.name + '</strong><div style="font-size:0.78rem;color:#94a3b8;font-family:monospace;">' + a.id + '</div>' + reasonInfo + '</td>'
            + '<td>' + statusBadge(a.status) + '</td>'
            + '<td style="text-align:right; white-space:nowrap;">'
            +   '<button type="button" title="' + (a.status === 'active' ? '詳細' : '編集') + '" onclick="openAppEditModal(\\'' + dataAttr + '\\')" style="background:transparent;border:none;color:#94a3b8;cursor:pointer;padding:7px;border-radius:50%;width:34px;height:34px;" onmouseover="this.style.background=\\'#f1f5f9\\';this.style.color=\\'#4f46e5\\';" onmouseout="this.style.background=\\'transparent\\';this.style.color=\\'#94a3b8\\';"><span class="material-symbols-outlined" style="font-size:18px;">' + (a.status === 'active' ? 'visibility' : 'edit') + '</span></button>'
            +   (a.status !== 'active' ? '<button type="button" title="削除" onclick="removeApp(\\'' + a.id + '\\')" style="background:transparent;border:none;color:#94a3b8;cursor:pointer;padding:7px;border-radius:50%;width:34px;height:34px;" onmouseover="this.style.background=\\'#fef2f2\\';this.style.color=\\'#ef4444\\';" onmouseout="this.style.background=\\'transparent\\';this.style.color=\\'#94a3b8\\';"><span class="material-symbols-outlined" style="font-size:18px;">delete</span></button>' : '')
            + '</td>'
            + '</tr>';
        }).join('');
      }

      window.openAppModal = function() {
        if (!currentGroupId) return;
        ['ap-id','ap-name','ap-base-url','ap-redirect','ap-desc'].forEach(function(id){ var e = document.getElementById(id); if (e) e.value = ''; });
        var m = document.getElementById('add-app-modal');
        if (m) m.showModal();
      };
      window.addApp = function() {
        var id = (document.getElementById('ap-id')||{}).value;
        var name = (document.getElementById('ap-name')||{}).value;
        var baseUrl = (document.getElementById('ap-base-url')||{}).value;
        var redirect = (document.getElementById('ap-redirect')||{}).value;
        var desc = (document.getElementById('ap-desc')||{}).value;
        if (!id || !id.trim() || !name || !name.trim() || !baseUrl || !baseUrl.trim()) { console.error(window.i18n.appFillRequired || 'ID/名前/URLは必須です'); return; }
        fetch('/group-admin/api/app/request', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ group_id: currentGroupId, id: id.trim(), name: name.trim(), base_url: baseUrl.trim(), redirect_uris: redirect, description: desc })
        })
        .then(function(r){ if (!r.ok) return r.json().catch(function(){return{};}).then(function(e){ throw new Error(e.error || ('Error ' + r.status)); }); return r.json(); })
        .then(function(){ window.location.reload(); })
        .catch(function(e){
          if (e.message === 'id_taken') console.error(window.i18n.appIdTaken || 'そのアプリIDは既に使われています');
          else console.error('Error: ' + e.message);
        });
      };
      window.openAppEditModal = function(enc) {
        var a = JSON.parse(decodeURIComponent(enc));
        document.getElementById('ape-id').value = a.id;
        document.getElementById('ape-name').value = a.name;
        document.getElementById('ape-base-url').value = a.base_url;
        document.getElementById('ape-redirect').value = a.redirect_uris || '';
        var isReadOnly = a.status === 'active';
        ['ape-name', 'ape-base-url', 'ape-redirect'].forEach(function(id) {
          var el = document.getElementById(id);
          if (el) el.disabled = isReadOnly;
        });
        var saveBtn = document.getElementById('ape-save-btn');
        if (saveBtn) saveBtn.style.display = isReadOnly ? 'none' : 'flex';
        var m = document.getElementById('edit-app-modal-ga');
        if (m) {
          var titleEl = m.querySelector('h3');
          if (titleEl) titleEl.innerText = isReadOnly ? 'アプリ詳細' : (window.i18n.edit || '編集');
          m.showModal();
        }
      };
      window.updateApp = function() {
        var id = (document.getElementById('ape-id')||{}).value;
        var name = (document.getElementById('ape-name')||{}).value;
        var baseUrl = (document.getElementById('ape-base-url')||{}).value;
        var redirect = (document.getElementById('ape-redirect')||{}).value;
        if (!name || !name.trim() || !baseUrl || !baseUrl.trim()) { console.error(window.i18n.appFillRequired || '名前/URLは必須です'); return; }
        fetch('/group-admin/api/app/update', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ id: id, name: name.trim(), base_url: baseUrl.trim(), redirect_uris: redirect })
        })
        .then(function(r){ if (!r.ok) throw new Error('Error ' + r.status); return r.json(); })
        .then(function(){ window.location.reload(); })
        .catch(function(e){ console.error('Error: ' + e.message); });
      };
      window.removeApp = function(id) {
        showConfirm(window.i18n.appConfirmRemove || 'このアプリを削除しますか？', function() {
          fetch('/group-admin/api/app/delete', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: id }) })
            .then(function(r){ if (!r.ok) throw new Error('Error ' + r.status); return r.json(); })
            .then(function(){ window.location.reload(); })
            .catch(function(e){ console.error('Error: ' + e.message); });
        });
      };

    })();
  `)

  if (groups.length === 0) {
    return Layout({
      title: t.ga_title,
      siteName: props.siteName,
      lang: t.lang,
      width: 1000,
      align: 'top',
      children: html`
        ${UserTopbar({ t, siteName: props.siteName, userEmail: props.userEmail, active: 'group-admin', profileName: props.profileName, profilePicture: props.profilePicture, isGroupAdmin: true })}
        <div style="text-align:center; padding:4rem 2rem; color:var(--text-sub);">
          <span class="material-symbols-outlined" style="font-size:48px; color:#c7d2fe; display:block; margin-bottom:1rem;">group_off</span>
          <p>${t.ga_no_groups}</p>
          <a href="/" style="color:var(--primary); font-weight:600; text-decoration:none;">&larr; ${t.nav_dashboard}</a>
        </div>
      `
    })
  }

  const firstGroupId = groups[0].id

  return Layout({
    title: t.ga_title,
    siteName: props.siteName,
    lang: t.lang,
    width: 1000,
    align: 'top',
    children: html`
      ${UserTopbar({ t, siteName: props.siteName, userEmail: props.userEmail, active: 'group-admin', profileName: props.profileName, profilePicture: props.profilePicture, isGroupAdmin: true })}

      <div style="margin-bottom:1.75rem;">
        <h1 style="font-size:1.5rem; font-weight:800; color:var(--text-main); letter-spacing:-0.02em; margin-bottom:0.25rem;">
          <span class="material-symbols-outlined" style="color:var(--primary); vertical-align:middle; margin-right:0.4rem;">admin_panel_settings</span>${t.ga_title}
        </h1>
        <p style="font-size:0.95rem; color:var(--text-sub);">${t.ga_subtitle}</p>
      </div>

      ${groups.length > 1 ? html`
        <div style="margin-bottom:1.5rem; display:flex; align-items:center; gap:0.75rem;">
          <span class="material-symbols-outlined" style="color:var(--primary);">group</span>
          <div class="${groupSelectWrapper}">
            <select id="group-select" style="display:none;">
              ${groups.map(g => html`<option value="${g.id}" data-depth="${(g as any).depth || 0}" data-origname="${(g as any).original_name || g.name}">${g.name}</option>`)}
            </select>
          </div>
        </div>
      ` : html`
        <div style="margin-bottom:1.5rem; display:flex; align-items:center; gap:0.75rem;">
          <span class="material-symbols-outlined" style="color:var(--primary);">group</span>
          <strong style="font-size:1.1rem;">${groups[0].name}</strong>
          <input type="hidden" id="group-select" value="${firstGroupId}" />
        </div>
      `}

      <div class="${tabBar}">
        <button id="tab-btn-members" class="active" onclick="switchTab('members')">
          <span class="material-symbols-outlined">group</span>${t.ga_tab_members}
        </button>
        <button id="tab-btn-assignments" onclick="switchTab('assignments')">
          <span class="material-symbols-outlined">assignment_ind</span>${t.ga_tab_assignments}
        </button>
        ${isBillingAdmin ? html`
        <button id="tab-btn-grants" onclick="switchTab('grants')">
          <span class="material-symbols-outlined">card_membership</span>${t.ga_tab_grants}
        </button>
        ` : ''}
        <button id="tab-btn-access" onclick="switchTab('access')">
          <span class="material-symbols-outlined">lock_open</span>${t.ga_tab_access}
        </button>
        <button id="tab-btn-apps" onclick="switchTab('apps')">
          <span class="material-symbols-outlined">apps</span>${t.ga_tab_apps}
        </button>
      </div>

      <!-- メンバータブ -->
      <div id="tab-members">
        <div style="display:flex; justify-content:flex-end; margin-bottom:1rem;">
          ${Button({ onclick: "openAddModal()", style: "width:auto;", children: html`<span class="material-symbols-outlined" style="font-size:18px;">person_add</span> ${t.am_add_member}` })}
        </div>
        <div class="${card}">
          <div class="${tableWrap}">
            <table>
              <thead>
                <tr>
                  <th>${t.ga_assign_user}</th>
                  <th>${t.am_label_role}</th>
                  <th>${t.ga_assign_valid}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody id="members-table-body">
                <tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:2rem;">読込中...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 割当タブ -->
      <div id="tab-assignments" style="display:none;">
        <div class="${infoBox}">
          <span class="material-symbols-outlined">info</span>${t.ga_desc_assignments}
        </div>
        <div style="display:flex; justify-content:flex-end; margin-bottom:1rem;">
          ${Button({ onclick: "openAssignModal()", style: "width:auto;", children: html`<span class="material-symbols-outlined" style="font-size:18px;">assignment_add</span> ${t.ga_add_assignment}` })}
        </div>
        <div id="assigns-summary" style="margin-bottom:1rem; display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:1rem;"></div>
        <div class="${card}">
          <div class="${tableWrap}">
            <table>
              <thead>
                <tr>
                  <th>${t.ga_assign_user}</th>
                  <th>${t.ga_assign_service}</th>
                  <th>${t.ga_assign_facility}</th>
                  <th>${t.ga_assign_role}</th>
                  <th>${t.ga_assign_valid}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody id="assigns-table-body">
                <tr><td colspan="6" style="text-align:center; color:#94a3b8; padding:2rem;">読込中...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 利用枠タブ(ゲート②) — 決済権者のみ -->
      ${isBillingAdmin ? html`
      <div id="tab-grants" style="display:none;">
        <div class="${infoBox}">
          <span class="material-symbols-outlined">info</span>${t.ga_desc_grants}
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.75rem; margin-bottom:1rem;">
          <button type="button" onclick="openBillingRotate()" style="width:auto; background:transparent; border:1px solid #cbd5e1; color:#64748b; border-radius:8px; padding:0.5rem 0.85rem; cursor:pointer; font-weight:600; display:inline-flex; align-items:center; gap:0.4rem;">
            <span class="material-symbols-outlined" style="font-size:18px;">key</span>${t.ga_billing_rotate}
          </button>
          ${Button({ onclick: "openGrantModal()", style: "width:auto;", children: html`<span class="material-symbols-outlined" style="font-size:18px;">add_card</span> ${t.ga_open_grant}` })}
        </div>
        <div id="grants-summary" style="margin-bottom:1rem; display:flex; gap:1rem; flex-wrap:wrap;"></div>
        <div class="${card}">
          <div class="${tableWrap}">
            <table>
              <thead>
                <tr>
                  <th>${t.ga_grant_service}</th>
                  <th>${t.ga_grant_seat}</th>
                  <th>${t.ga_grant_valid}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody id="grants-table-body">
                <tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:2rem;">読込中...</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 子グループへ配分済みの枠 -->
        <div id="child-grants-section" style="display:none; margin-top:1.5rem;">
          <div class="${sectionTitle}" style="margin-bottom:0.75rem;">
            <span class="material-symbols-outlined">account_tree</span>${t.ga_child_grants_title}
          </div>
          <div class="${card}">
            <div class="${tableWrap}">
              <table>
                <thead>
                  <tr>
                    <th>${t.ga_grant_group}</th>
                    <th>${t.ga_grant_service}</th>
                    <th>${t.ga_grant_seat}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody id="child-grants-table-body">
                  <tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:2rem;">読込中...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      ` : ''}

      <!-- アクセス権タブ -->
      <div id="tab-access" style="display:none;">
        <div class="${infoBox}">
          <span class="material-symbols-outlined">info</span>
          ${t.ga_access_readonly}
        </div>
        <div class="${card}">
          <div class="${tableWrap}">
            <table>
              <thead>
                <tr>
                  <th>${t.ga_assign_user}</th>
                  <th>${t.ga_permission_app}</th>
                  <th>${t.ga_permission_source}</th>
                  <th>${t.ga_permission_valid}</th>
                </tr>
              </thead>
              <tbody id="perms-table-body">
                <tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:2rem;">読込中...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- アプリ／サービス タブ(セルフサービス) -->
      <div id="tab-apps" style="display:none;">

        <!-- 開発者申請前の表示 -->
        <div id="dev-not-approved" style="display:none; margin-bottom:1.5rem;">
          <div class="${sectionTitle}"><span class="material-symbols-outlined">developer_board</span>開発者機能の利用申請</div>
          <div class="${infoBox}"><span class="material-symbols-outlined">info</span>OIDCアプリの登録やサービスの作成を行うには、システム管理者の承認が必要です。</div>
          <div class="${card}" style="max-width:600px;">
            <label class="${formLabel}">申請理由 (必須)</label>
            <textarea id="dev-apply-reason" class="${dateInput}" style="min-height:80px; margin-bottom:1rem;" placeholder="アプリの利用目的などを入力してください"></textarea>
            ${Button({ onclick: "applyDeveloper()", style: "width:auto;", children: html`<span class="material-symbols-outlined">send</span> 承認を申請する` })}
            <div id="dev-rejected-msg" style="display:none; margin-top:1.5rem; color:#b91c1c; background:#fef2f2; padding:1rem; border-radius:8px; align-items:flex-start; gap:0.5rem; flex-direction:column;">
              <div style="display:flex; align-items:center; gap:0.5rem; font-weight:600;"><span class="material-symbols-outlined">error</span><span>前回の申請は以下の事由により却下されました。理由を修正して再度申請してください。</span></div>
              <div style="padding:0.75rem; background:rgba(0,0,0,0.03); border-radius:6px; width:100%; box-sizing:border-box; white-space:pre-wrap; margin-top:0.5rem;" id="dev-rejected-reason-text"></div>
            </div>
            <div id="dev-revoked-msg" style="display:none; margin-top:1.5rem; color:#b45309; background:#fffbeb; padding:1rem; border-radius:8px; align-items:flex-start; gap:0.5rem; flex-direction:column;">
              <div style="display:flex; align-items:center; gap:0.5rem; font-weight:600;"><span class="material-symbols-outlined">warning</span><span>開発者権限は以下の事由によりはく奪されました。再度権限が必要な場合は改めて申請してください。</span></div>
              <div style="padding:0.75rem; background:rgba(0,0,0,0.03); border-radius:6px; width:100%; box-sizing:border-box; white-space:pre-wrap; margin-top:0.5rem;" id="dev-revoked-reason-text"></div>
            </div>
          </div>
        </div>

        <!-- 申請中(Pending)の表示 -->
        <div id="dev-pending" style="display:none; margin-bottom:1.5rem;">
          <div class="${sectionTitle}"><span class="material-symbols-outlined">developer_board</span>開発者機能の利用申請</div>
          <div class="${infoBox}" style="background:#fffbeb; color:#b45309; border-color:#fcd34d;">
            <span class="material-symbols-outlined" style="color:#f59e0b;">hourglass_empty</span>
            システム管理者の承認をお待ちください。承認されるまでアプリやサービスの作成はできません。
          </div>
        </div>

        <!-- 承認済み(Approved)の表示 -->
        <div id="dev-approved" style="display:none;">
          <!-- 自グループのサービス -->
          <div class="${sectionTitle}"><span class="material-symbols-outlined">category</span>${t.ga_svc_section}</div>
          <div class="${infoBox}"><span class="material-symbols-outlined">info</span>${t.ga_svc_desc}</div>
          <div style="display:flex; justify-content:flex-end; margin-bottom:1rem;">
            ${Button({ onclick: "openServiceModal()", style: "width:auto;", children: html`<span class="material-symbols-outlined" style="font-size:18px;">add</span> ${t.ga_svc_create}` })}
          </div>
          <div class="${card}">
            <div class="${tableWrap}">
              <table>
                <thead><tr><th>${t.ga_svc_name}</th><th></th></tr></thead>
                <tbody id="services-table-body">
                  <tr><td colspan="2" style="text-align:center; color:#94a3b8; padding:1.5rem;">読込中...</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- アプリ登録の申請 -->
          <div class="${sectionTitle}" style="margin-top:1rem;"><span class="material-symbols-outlined">apps</span>${t.ga_app_section}</div>
          <div class="${infoBox}"><span class="material-symbols-outlined">info</span>${t.ga_app_desc}</div>
          <div style="display:flex; justify-content:flex-end; margin-bottom:1rem;">
            ${Button({ onclick: "openAppModal()", style: "width:auto;", children: html`<span class="material-symbols-outlined" style="font-size:18px;">note_add</span> ${t.ga_app_request}` })}
          </div>
          <div class="${card}">
            <div class="${tableWrap}">
              <table>
                <thead><tr><th>${t.ga_app_name}</th><th>${t.status}</th><th></th></tr></thead>
                <tbody id="apps-table-body">
                  <tr><td colspan="3" style="text-align:center; color:#94a3b8; padding:1.5rem;">読込中...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- サービス作成モーダル -->
      ${Modal({
        id: "custom-confirm-modal",
        title: "確認",
        closeAction: "closeConfirmModal()",
        children: html`
          <div id="custom-confirm-message" style="margin-bottom: 1.5rem; font-size: 1rem; color: #334155; line-height: 1.5;"></div>
          <div style="display: flex; justify-content: flex-end; gap: 1rem;">
            <button type="button" onclick="closeConfirmModal()" style="padding: 0.6rem 1rem; border: 1px solid #cbd5e1; border-radius: 8px; background: transparent; cursor: pointer; color: #475569; font-weight: 600;">キャンセル</button>
            <button type="button" id="custom-confirm-execute-btn" style="padding: 0.6rem 1.5rem; border: none; border-radius: 8px; background: #ef4444; color: white; cursor: pointer; font-weight: 600;">実行する</button>
          </div>
        `
      })}



      ${Modal({
        id: 'add-service-modal',
        title: t.ga_svc_create,
        closeAction: "this.closest('.custom-modal').close()",
        children: html`
          <div style="display:flex; flex-direction:column; gap:1.25rem;">
            <div>
              <label class="${formLabel}">${t.ga_svc_name}</label>
              <input type="text" id="s-name" class="${dateInput}" />
            </div>
            <div style="margin-top:0.5rem;">
              ${Button({ onclick: "addService()", children: html`<span class="material-symbols-outlined">add</span> ${t.ga_svc_create}` })}
            </div>
          </div>
        `
      })}

      <!-- アプリ申請モーダル -->
      ${Modal({
        id: 'add-app-modal',
        title: t.ga_app_request,
        closeAction: "this.closest('.custom-modal').close()",
        children: html`
          <div style="display:flex; flex-direction:column; gap:1.1rem;">
            <div>
              <label class="${formLabel}">${t.ga_app_id}</label>
              <input type="text" id="ap-id" class="${dateInput}" placeholder="my-app" />
            </div>
            <div>
              <label class="${formLabel}">${t.ga_app_name}</label>
              <input type="text" id="ap-name" class="${dateInput}" />
            </div>
            <div>
              <label class="${formLabel}">${t.ga_app_base_url}</label>
              <input type="url" id="ap-base-url" class="${dateInput}" placeholder="https://..." />
            </div>
            <div>
              <label class="${formLabel}">${t.ga_app_redirect}</label>
              <textarea id="ap-redirect" class="${dateInput}" style="min-height:64px; font-family:monospace; font-size:0.85rem;" placeholder="https://.../callback"></textarea>
            </div>

            <div class="${infoBox}"><span class="material-symbols-outlined">key</span>${t.ga_app_secret_note}</div>
            <div style="margin-top:0.25rem;">
              ${Button({ onclick: "addApp()", children: html`<span class="material-symbols-outlined">send</span> ${t.ga_app_request}` })}
            </div>
          </div>
        `
      })}

      <!-- アプリ編集モーダル(自グループ・申請含む) -->
      ${Modal({
        id: 'edit-app-modal-ga',
        title: t.edit,
        closeAction: "this.closest('.custom-modal').close()",
        children: html`
          <div style="display:flex; flex-direction:column; gap:1.1rem;">
            <input type="hidden" id="ape-id" />
            <div>
              <label class="${formLabel}">${t.ga_app_name}</label>
              <input type="text" id="ape-name" class="${dateInput}" />
            </div>
            <div>
              <label class="${formLabel}">${t.ga_app_base_url}</label>
              <input type="url" id="ape-base-url" class="${dateInput}" />
            </div>
            <div>
              <label class="${formLabel}">${t.ga_app_redirect}</label>
              <textarea id="ape-redirect" class="${dateInput}" style="min-height:64px; font-family:monospace; font-size:0.85rem;" placeholder="(空欄なら変更なし)"></textarea>
            </div>

            <div style="margin-top:0.25rem;">
              <span id="ape-save-btn" style="display:flex;">
                ${Button({ onclick: "updateApp()", children: html`<span class="material-symbols-outlined">save</span> ${t.save}` })}
              </span>
            </div>
          </div>
        `
      })}

      <!-- メンバー追加モーダル -->
      ${Modal({
        id: 'add-member-modal',
        title: t.am_add_member,
        closeAction: "this.closest('.custom-modal').close()",
        children: html`
          <div style="display:flex; flex-direction:column; gap:1.25rem;">
            <div>
              <label class="${formLabel}">${t.am_label_member}</label>
              ${MultiSelect({ id: 'm-user-id', placeholder: t.placeholder_select, options: userOptions })}
            </div>
            <div>
              <label class="${formLabel}">${t.am_label_role}</label>
              <select id="m-role" class="${selectInput}">
                <option value="member">${t.am_role_member}</option>
                <option value="group_admin">${t.am_role_group_admin}</option>
                <option value="billing_admin">${t.am_role_billing_admin}</option>
              </select>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
              <div>
                <label class="${formLabel}">${t.label_valid_from}</label>
                <input type="date" id="m-valid-from" class="${dateInput}" />
              </div>
              <div>
                <label class="${formLabel}">${t.label_valid_to}</label>
                <input type="date" id="m-valid-to" class="${dateInput}" />
              </div>
            </div>
            <div style="margin-top:0.5rem;">
              ${Button({ onclick: "addMember()", children: html`<span class="material-symbols-outlined">person_add</span> ${t.am_add_member}` })}
            </div>
          </div>
        `
      })}

      <!-- メンバー削除確認モーダル -->
      ${Modal({
        id: 'remove-confirm-modal',
        title: html`<span style="color:#ef4444; display:flex; align-items:center; gap:0.5rem;"><span class="material-symbols-outlined">warning</span> ${t.am_btn_remove}</span>`,
        closeAction: 'closeRemoveModal()',
        children: html`
          <p style="color:#475569; font-size:1rem; line-height:1.5; margin-bottom:2rem;">${t.am_confirm_remove_member}</p>
          <div style="display:flex; justify-content:flex-end; gap:1rem;">
            <button type="button" onclick="closeRemoveModal()" style="background:transparent;color:#64748b;border:1px solid #cbd5e1;border-radius:8px;padding:0.5rem 1rem;font-weight:600;cursor:pointer;">${t.cancel}</button>
            <button type="button" onclick="executeRemove()" style="background:#ef4444;color:white;border:none;border-radius:8px;padding:0.5rem 1rem;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:0.5rem;"><span class="material-symbols-outlined" style="font-size:18px;">person_remove</span>${t.am_btn_remove}</button>
          </div>
        `
      })}

      <!-- 決裁権者 昇格モーダル -->
      ${Modal({
        id: 'billing-elevation-modal',
        title: html`<span style="display:flex; align-items:center; gap:0.5rem;"><span class="material-symbols-outlined" style="color:#f59e0b;">admin_panel_settings</span>予算操作の承認</span>`,
        closeAction: "this.closest('.custom-modal').close()",
        children: html`
          <div style="display:flex; flex-direction:column; gap:1.25rem;">
            <div class="${infoBox}">
              <span class="material-symbols-outlined">info</span>
              利用枠（予算）の操作を実行するため、決裁権者パスワードを入力してください。
            </div>
            <div>
              <label class="${formLabel}">決裁権者パスワード</label>
              <input type="password" id="billing-elevate-pwd" class="${dateInput}" />
            </div>
            <div id="billing-elevate-err" style="display:none; color:#ef4444; font-size:0.85rem; font-weight:600;"></div>
            <div style="margin-top:0.5rem;">
              ${Button({ onclick: "executeBillingElevation()", children: html`<span class="material-symbols-outlined">lock_open</span> 認証して実行` })}
            </div>
          </div>
        `
      })}

      <!-- 決裁権者パスワードのローテーション モーダル -->
      ${Modal({
        id: 'billing-rotate-modal',
        title: html`<span style="display:flex; align-items:center; gap:0.5rem;"><span class="material-symbols-outlined" style="color:#7c3aed;">key</span>${t.ga_billing_rotate}</span>`,
        closeAction: "this.closest('.custom-modal').close()",
        children: html`
          <div style="display:flex; flex-direction:column; gap:1.25rem;">
            <div class="${infoBox}">
              <span class="material-symbols-outlined">info</span>${t.ga_billing_rotate_hint}
            </div>
            <div>
              <label class="${formLabel}">${t.ga_billing_current_pw}</label>
              <input type="password" id="billing-rotate-cur" class="${dateInput}" autocomplete="current-password" />
            </div>
            <div>
              <label class="${formLabel}">${t.ga_billing_new_pw}</label>
              <input type="password" id="billing-rotate-new" class="${dateInput}" autocomplete="new-password" />
            </div>
            <div id="billing-rotate-err" style="display:none; color:#ef4444; font-size:0.85rem; font-weight:600;"></div>
            <div style="display:flex; align-items:center; gap:0.75rem; margin-top:0.5rem;">
              ${Button({ onclick: "executeBillingRotate()", style: "width:auto;", children: html`<span class="material-symbols-outlined">key</span> ${t.ga_billing_rotate}` })}
              <button type="button" onclick="executeBillingClear()" style="width:auto; background:transparent; border:1px solid #fecaca; color:#b91c1c; border-radius:8px; padding:0.5rem 0.85rem; cursor:pointer; font-weight:600;">${t.ga_billing_clear}</button>
            </div>
            <div style="font-size:0.78rem; color:#94a3b8;">${t.ga_billing_clear_hint}</div>
          </div>
        `
      })}

      <!-- 割当追加モーダル(ゲート③) -->
      ${Modal({
        id: 'add-assign-modal',
        title: t.ga_add_assignment,
        closeAction: "this.closest('.custom-modal').close()",
        children: html`
          <div style="display:flex; flex-direction:column; gap:1.1rem;">
            <div id="a-no-grant" style="display:none;" class="${infoBox}">
              <span class="material-symbols-outlined">info</span>${t.ga_no_services_granted}
            </div>
            <div>
              <label class="${formLabel}">${t.ga_assign_user}</label>
              <select id="a-user" class="${selectInput}"></select>
            </div>
            <div>
              <label class="${formLabel}">${t.ga_assign_service}</label>
              <select id="a-service" class="${selectInput}" onchange="refreshAssignRoles()"></select>
            </div>
            <div>
              <label class="${formLabel}">${t.ga_assign_facility}</label>
              <select id="a-facility" class="${selectInput}" onchange="refreshAssignRoles()"></select>
            </div>
            <div>
              <label class="${formLabel}">${t.ga_assign_role}</label>
              <select id="a-role" class="${selectInput}"></select>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
              <div>
                <label class="${formLabel}">${t.label_valid_from}</label>
                <input type="date" id="a-valid-from" class="${dateInput}" />
              </div>
              <div>
                <label class="${formLabel}">${t.label_valid_to}</label>
                <input type="date" id="a-valid-to" class="${dateInput}" />
              </div>
            </div>
            <div style="margin-top:0.5rem;">
              ${Button({ onclick: "addAssignment()", children: html`<span class="material-symbols-outlined">assignment_add</span> ${t.ga_add_assignment}` })}
            </div>
          </div>
        `
      })}

      <!-- 割当解除確認モーダル -->
      ${Modal({
        id: 'remove-assign-modal',
        title: html`<span style="color:#ef4444; display:flex; align-items:center; gap:0.5rem;"><span class="material-symbols-outlined">warning</span> ${t.am_btn_remove}</span>`,
        closeAction: 'closeRemoveAssignModal()',
        children: html`
          <p style="color:#475569; font-size:1rem; line-height:1.5; margin-bottom:2rem;">${t.ga_confirm_remove_assignment}</p>
          <div style="display:flex; justify-content:flex-end; gap:1rem;">
            <button type="button" onclick="closeRemoveAssignModal()" style="background:transparent;color:#64748b;border:1px solid #cbd5e1;border-radius:8px;padding:0.5rem 1rem;font-weight:600;cursor:pointer;">${t.cancel}</button>
            <button type="button" onclick="executeRemoveAssignment()" style="background:#ef4444;color:white;border:none;border-radius:8px;padding:0.5rem 1rem;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:0.5rem;"><span class="material-symbols-outlined" style="font-size:18px;">delete</span>${t.am_btn_remove}</button>
          </div>
        `
      })}

      <!-- 利用枠開放モーダル(ゲート②) -->
      ${Modal({
        id: 'add-grant-modal',
        title: t.ga_open_grant,
        closeAction: "this.closest('.custom-modal').close()",
        children: html`
          <div style="display:flex; flex-direction:column; gap:1.1rem;">
            <div id="g-no-contract" style="display:none;" class="${infoBox}">
              <span class="material-symbols-outlined">info</span>${t.ga_no_contracts}
            </div>
            <div>
              <label class="${formLabel}">${t.ga_grant_target}</label>
              <select id="g-target" class="${selectInput}" onchange="onGrantTargetChange()"></select>
            </div>
            <div>
              <label class="${formLabel}">${t.ga_grant_contract}</label>
              <select id="g-contract" class="${selectInput}"></select>
            </div>
            <!-- 席数上限: 自グループ(ルート枠)は無制限。子グループへ配分する場合のみ表示&必須。 -->
            <div id="g-seat-wrap" style="display:none;">
              <label class="${formLabel}">${t.ga_grant_seat}</label>
              <input type="number" id="g-seat" class="${dateInput}" min="0" step="1" value="" />
              <div style="font-size:0.78rem; color:#94a3b8; margin-top:0.35rem;">${t.ga_grant_seat_hint}</div>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
              <div>
                <label class="${formLabel}">${t.label_valid_from}</label>
                <input type="date" id="g-valid-from" class="${dateInput}" />
              </div>
              <div>
                <label class="${formLabel}">${t.label_valid_to}</label>
                <input type="date" id="g-valid-to" class="${dateInput}" />
              </div>
            </div>
            <div id="g-error" style="display:none; color:#b91c1c; background:#fef2f2; border-radius:8px; padding:0.65rem 0.85rem; font-size:0.85rem;"></div>
            <div style="margin-top:0.5rem;">
              ${Button({ onclick: "addGrant()", children: html`<span class="material-symbols-outlined">add_card</span> ${t.ga_open_grant}` })}
            </div>
          </div>
        `
      })}

      <!-- 利用枠取消確認モーダル -->
      ${Modal({
        id: 'remove-grant-modal',
        title: html`<span style="color:#ef4444; display:flex; align-items:center; gap:0.5rem;"><span class="material-symbols-outlined">warning</span> ${t.am_btn_remove}</span>`,
        closeAction: 'closeRemoveGrantModal()',
        children: html`
          <p style="color:#475569; font-size:1rem; line-height:1.5; margin-bottom:2rem;">${t.ga_confirm_remove_grant}</p>
          <div style="display:flex; justify-content:flex-end; gap:1rem;">
            <button type="button" onclick="closeRemoveGrantModal()" style="background:transparent;color:#64748b;border:1px solid #cbd5e1;border-radius:8px;padding:0.5rem 1rem;font-weight:600;cursor:pointer;">${t.cancel}</button>
            <button type="button" onclick="executeRemoveGrant()" style="background:#ef4444;color:white;border:none;border-radius:8px;padding:0.5rem 1rem;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:0.5rem;"><span class="material-symbols-outlined" style="font-size:18px;">delete</span>${t.am_btn_remove}</button>
          </div>
        `
      })}

      ${ServiceAppsModal(t, '/group-admin/api')}

      <!-- 役割管理モーダル -->
      ${Modal({
        id: 'manage-roles-modal',
        title: html`<span style="display:flex; align-items:center; gap:0.5rem;"><span class="material-symbols-outlined">manage_accounts</span> 役割の管理 - <span id="mr-service-name"></span></span>`,
        closeAction: "this.closest('.custom-modal').close()",
        children: html`
          <div style="display:flex; flex-direction:column; gap:1.25rem;">
            <!-- 現在の役割リスト -->
            <div id="mr-role-list" style="display:flex; flex-direction:column; gap:0.5rem; max-height: 250px; overflow-y: auto; padding: 0.5rem; background: rgba(255,255,255,0.5); border: 1px solid #cbd5e1; border-radius: 8px;">
            </div>

            <hr style="border:none; border-top:1px solid #cbd5e1; margin: 0.5rem 0;" />

            <!-- 新規追加フォーム -->
            <div style="font-weight: 600; color: var(--text-main); font-size: 0.95rem;">新しい役割を追加</div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
              <div>
                <label class="${formLabel}">役割名 (例: 担当者)</label>
                <input type="text" id="mr-role-name" class="${dateInput}" />
              </div>
              <div>
                <label class="${formLabel}">ロールコード (例: staff)</label>
                <input type="text" id="mr-role-code" class="${dateInput}" />
              </div>
            </div>
            <div>
              <label class="${formLabel}">施設区分 (任意・指定する場合のみ)</label>
              <input type="text" id="mr-facility-type" class="${dateInput}" placeholder="例: 倉庫" />
            </div>
            <div style="margin-top:0.5rem; text-align: right;">
              ${Button({ onclick: "addRole()", children: html`<span class="material-symbols-outlined">add</span> 役割を追加`, style: "width:auto;" })}
            </div>
          </div>
        `
      })}

      <script type="application/json" id="ga-members-data">${raw(membersByGroupJson)}</script>
      <script type="application/json" id="ga-assigns-data">${raw(assignmentsByGroupJson)}</script>
      <script type="application/json" id="ga-perms-data">${raw(permsByGroupJson)}</script>
      <script type="application/json" id="ga-users-data">${raw(allUsersJson)}</script>
      <script type="application/json" id="ga-grants-data">${raw(grantsByGroupJson)}</script>
      <script type="application/json" id="ga-facilities-data">${raw(facilitiesJson)}</script>
      <script type="application/json" id="ga-roles-data">${raw(rolesByServiceJson)}</script>
      <script type="application/json" id="ga-grants-detail-data">${raw(grantsDetailByGroupJson)}</script>
      <script type="application/json" id="ga-contracts-data">${raw(availableContractsJson)}</script>
      <script type="application/json" id="ga-children-data">${raw(childrenByGroupJson)}</script>
      <script type="application/json" id="ga-services-data">${raw(servicesByGroupJson)}</script>
      <script type="application/json" id="ga-apps-data">${raw(appsByGroupJson)}</script>
      <script type="application/json" id="ga-approved-apps-data">${raw(approvedAppsByGroupJson)}</script>
      <script type="application/json" id="ga-dev-status-data">${raw(devStatusesJson)}</script>
      <script>
        window.i18n = {
          noMembers: '${t.am_no_members}',
          roleAdmin: '${t.am_role_group_admin}',
          roleBilling: '${t.am_role_billing_admin}',
          roleMember: '${t.am_role_member}',
          noAssignments: '${t.ga_no_assignments}',
          noAccess: '${t.ga_no_access}',
          srcUser: '${t.ga_source_user}',
          srcGroup: '${t.ga_source_group}',
          selectUser: '${t.placeholder_select}',
          selectService: '${t.ga_select_service}',
          selectFacility: '${t.ga_select_facility}',
          selectRole: '${t.ga_select_role}',
          selectAll: '${t.ga_select_role}',
          errNoGrant: '${t.ga_err_no_grant}',
          errSeat: '${t.ga_err_seat}',
          noGrants: '${t.ga_no_grants}',
          selectContract: '${t.ga_select_contract}',
          seatUnlimited: '${t.am_seat_unlimited}',
          grantSelf: '${t.ga_grant_self}',
          grantUnlimited: '${t.ga_grant_unlimited}',
          grantTotal: '${t.ga_grant_total}',
          grantDistributed: '${t.ga_grant_distributed}',
          grantAvailable: '${t.ga_grant_available}',
          noChildGrants: '${t.ga_no_child_grants}',
          errOverBudget: '${t.ga_err_over_budget}',
          errSeatRequired: '${t.ga_err_seat_required}',
          billingNewRequired: '${t.ga_billing_new_required}',
          billingBadPassword: '${t.ga_billing_bad_password}',
          billingNoPassword: '${t.ga_billing_no_password}',
          billingCurRequired: '${t.ga_billing_cur_required}',
          billingClearConfirm: '${t.ga_billing_clear_confirm}',
          svcNone: '${t.ga_svc_none}',
          svcName: '${t.ga_svc_name}',
          svcConfirmRemove: '${t.ga_svc_confirm_remove}',
          appNone: '${t.ga_app_none}',
          appConfirmRemove: '${t.ga_app_confirm_remove}',
          appBindNone: '${t.ga_app_bind_none}',
          noOwnServices: '${t.ga_no_own_services}',
          statusPending: '${t.ga_status_pending}',
          statusRejected: '${t.ga_status_rejected}',
          statusActive: '${t.ga_status_active}',
          statusInactive: '${t.ga_status_inactive}',
          appFillRequired: 'ID / 名前 / URL は必須です',
          appIdTaken: 'そのアプリIDは既に使われています',
          svcManageApps: '${t.ga_svc_manage_apps}',
          btnRemove: '${t.ga_btn_remove}',
          svcNoApps: '${t.ga_svc_no_apps}',
          svcSelectApp: '${t.ga_svc_select_app}',
          appNotApproved: '${t.ga_app_not_approved}',
          svcConfirmRemoveApp: '${t.ga_svc_confirm_remove_app}',
        };
      </script>
      <script>
      ${scriptContent}
      </script>
    `
  })
}
