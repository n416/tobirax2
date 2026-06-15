import { html, raw } from 'hono/html'
import { css } from 'hono/css'
import { dict } from '../i18n'
import { Layout } from './components/Layout'
import { UserTopbar } from './components/UserTopbar'
import { Group, App } from '../types'
import { Button } from './components/Button'
import { Modal } from './components/Modal'
import { MultiSelect } from './components/MultiSelect'

interface ManagedGroup extends Group {
  member_count: number
}

interface GroupMember {
  id: number
  user_id: string
  email: string
  name: string | null
  role: 'group_admin' | 'member'
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
  // セルフサービス(アプリ申請 / 自グループのサービス作成)用
  servicesByGroup: Record<string, { id: string; name: string }[]>
  appsByGroup: Record<string, { id: string; name: string; base_url: string; status: string; service_id: string | null; service_name: string | null }[]>
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
  const servicesByGroupJson = JSON.stringify(props.servicesByGroup)
  const appsByGroupJson = JSON.stringify(props.appsByGroup)

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
      var servicesByGroup = null;
      var appsByGroup = null;
      var currentTab = 'members';
      var currentGroupId = '';

      document.addEventListener('DOMContentLoaded', function() {
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
        var svd = document.getElementById('ga-services-data');
        var apd = document.getElementById('ga-apps-data');
        if (svd) servicesByGroup = JSON.parse(svd.textContent);
        if (apd) appsByGroup = JSON.parse(apd.textContent);

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
        currentTab = tab;
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
      }

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
          var badgeHtml = '<span style="font-size:0.72rem; font-weight:700; padding:2px 8px; border-radius:999px; color:' + (isAdmin ? '#9a3412' : '#475569') + '; background:' + (isAdmin ? '#ffedd5' : '#f1f5f9') + ';">' + (isAdmin ? (window.i18n.roleAdmin || 'グループ管理者') : (window.i18n.roleMember || 'メンバー')) + '</span>';
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

      function renderAssignments() {
        var el = document.getElementById('assigns-table-body');
        if (!el) return;
        var list = assignsByGroup && currentGroupId ? (assignsByGroup[currentGroupId] || []) : [];
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
        removeTargetId = mid;
        var m = document.getElementById('remove-confirm-modal');
        if (m) m.showModal();
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
          .catch(function(e) { alert('Error: ' + e.message); });
      };

      window.addMember = function() {
        var userIds = window.tsCtrl ? window.tsCtrl.getValue() : [];
        if (!Array.isArray(userIds)) userIds = [userIds];
        userIds = userIds.filter(function(id) { return id; });
        if (!userIds.length) { alert('ユーザーを選択してください'); return; }
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
        .catch(function(e) { alert('Error: ' + e.message); });
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
        if (!userId || !serviceId || !facilityId || !roleId) { alert(window.i18n.selectAll || '全項目を選択してください'); return; }
        var validFrom = sv ? Math.floor(new Date(sv).getTime()/1000) : Math.floor(Date.now()/1000);
        var validTo = ev ? Math.floor(new Date(ev).getTime()/1000) : Math.floor(Date.now()/1000) + 315360000;
        fetch('/group-admin/api/assignment/add', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ group_id: currentGroupId, user_id: userId, service_id: serviceId, facility_id: facilityId, service_role_id: Number(roleId), valid_from: validFrom, valid_to: validTo })
        })
        .then(function(r){ if (!r.ok) return r.json().catch(function(){return{};}).then(function(e){ throw new Error(e.error || ('Error ' + r.status)); }); return r.json(); })
        .then(function(){ window.location.reload(); })
        .catch(function(e){
          if (e.message === 'no_grant') alert(window.i18n.errNoGrant || '利用枠がありません');
          else if (e.message === 'seat') alert(window.i18n.errSeat || '席数上限に達しています');
          else alert('Error: ' + e.message);
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
          .catch(function(e){ alert('Error: ' + e.message); });
      };

      // ===== ゲート② 利用枠の開放/取消(委任) =====
      function renderGrants() {
        var el = document.getElementById('grants-table-body');
        if (!el) return;
        var list = grantsDetailByGroup && currentGroupId ? (grantsDetailByGroup[currentGroupId] || []) : [];
        if (list.length === 0) {
          el.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:2rem;">' + (window.i18n.noGrants || '利用枠がありません') + '</td></tr>';
          return;
        }
        el.innerHTML = list.map(function(g) {
          var seat = (g.seat_limit == null) ? (window.i18n.seatUnlimited || '無制限') : g.seat_limit;
          return '<tr>'
            + '<td><strong>' + g.service_name + '</strong></td>'
            + '<td style="font-size:0.85rem; color:#64748b;">' + seat + '</td>'
            + '<td style="font-size:0.82rem; color:#94a3b8;">' + fmt(g.valid_from) + ' ～ ' + fmt(g.valid_to) + '</td>'
            + '<td style="text-align:right;"><button type="button" onclick="removeGrant(' + g.id + ')" style="background:transparent;border:none;color:#94a3b8;cursor:pointer;padding:7px;border-radius:50%;width:34px;height:34px;display:inline-flex;align-items:center;justify-content:center;transition:all 0.2s;" onmouseover="this.style.background=\\'#fef2f2\\';this.style.color=\\'#ef4444\\';" onmouseout="this.style.background=\\'transparent\\';this.style.color=\\'#94a3b8\\';"><span class="material-symbols-outlined" style="font-size:18px;">delete</span></button></td>'
            + '</tr>';
        }).join('');
      }

      window.openGrantModal = function() {
        if (!currentGroupId) return;
        var m = document.getElementById('add-grant-modal');
        var contracts = availableContracts || [];
        fillSelect(document.getElementById('g-contract'), contracts.map(function(ct){ return { id: ct.id, label: ct.service_name + (ct.group_name ? ' / ' + ct.group_name : '') + (ct.seat_limit != null ? ' (' + ct.seat_limit + ')' : '') }; }), 'id', 'label', window.i18n.selectContract || '契約を選択');
        var seatEl = document.getElementById('g-seat'); if (seatEl) seatEl.value = '';
        var vf = document.getElementById('g-valid-from'); if (vf) vf.value = new Date().toISOString().split('T')[0];
        var vt = document.getElementById('g-valid-to'); if (vt) vt.value = '';
        var warn = document.getElementById('g-no-contract'); if (warn) warn.style.display = contracts.length === 0 ? '' : 'none';
        if (m) m.showModal();
      };

      window.addGrant = function() {
        var contractId = (document.getElementById('g-contract') || {}).value;
        var seatVal = (document.getElementById('g-seat') || {}).value;
        var sv = document.getElementById('g-valid-from').value;
        var ev = document.getElementById('g-valid-to').value;
        if (!contractId) { alert(window.i18n.selectContract || '契約を選択してください'); return; }
        var validFrom = sv ? Math.floor(new Date(sv).getTime()/1000) : Math.floor(Date.now()/1000);
        var validTo = ev ? Math.floor(new Date(ev).getTime()/1000) : Math.floor(Date.now()/1000) + 315360000;
        fetch('/group-admin/api/grant/add', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ group_id: currentGroupId, contract_id: contractId, seat_limit: seatVal, valid_from: validFrom, valid_to: validTo })
        })
        .then(function(r){ if (!r.ok) return r.json().catch(function(){return{};}).then(function(e){ throw new Error(e.error || ('Error ' + r.status)); }); return r.json(); })
        .then(function(){ window.location.reload(); })
        .catch(function(e){ alert('Error: ' + e.message); });
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
        fetch('/group-admin/api/grant/remove', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: removeGrantTargetId }) })
          .then(function(r){ if (!r.ok) throw new Error('Error ' + r.status); return r.json(); })
          .then(function(){
            if (grantsDetailByGroup && currentGroupId) {
              grantsDetailByGroup[currentGroupId] = (grantsDetailByGroup[currentGroupId] || []).filter(function(g){ return g.id !== removeGrantTargetId; });
            }
            window.closeRemoveGrantModal();
            renderGrants();
          })
          .catch(function(e){ alert('Error: ' + e.message); });
      };

      // ===== セルフサービス: 自グループのサービス =====
      function renderServices() {
        var el = document.getElementById('services-table-body');
        if (!el) return;
        var list = servicesByGroup && currentGroupId ? (servicesByGroup[currentGroupId] || []) : [];
        if (list.length === 0) {
          el.innerHTML = '<tr><td colspan="2" style="text-align:center; color:#94a3b8; padding:1.5rem;">' + (window.i18n.svcNone || '(なし)') + '</td></tr>';
          return;
        }
        el.innerHTML = list.map(function(s) {
          return '<tr>'
            + '<td><strong>' + s.name + '</strong><div style="font-size:0.78rem;color:#94a3b8;font-family:monospace;">' + s.id + '</div></td>'
            + '<td style="text-align:right;"><button type="button" onclick="removeService(\\'' + s.id + '\\')" style="background:transparent;border:none;color:#94a3b8;cursor:pointer;padding:7px;border-radius:50%;width:34px;height:34px;display:inline-flex;align-items:center;justify-content:center;" onmouseover="this.style.background=\\'#fef2f2\\';this.style.color=\\'#ef4444\\';" onmouseout="this.style.background=\\'transparent\\';this.style.color=\\'#94a3b8\\';"><span class="material-symbols-outlined" style="font-size:18px;">delete</span></button></td>'
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
        if (!name || !name.trim()) { alert(window.i18n.svcName || 'name'); return; }
        fetch('/group-admin/api/service/create', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ group_id: currentGroupId, name: name.trim() })
        })
        .then(function(r){ if (!r.ok) throw new Error('Error ' + r.status); return r.json(); })
        .then(function(){ window.location.reload(); })
        .catch(function(e){ alert('Error: ' + e.message); });
      };
      window.removeService = function(id) {
        if (!confirm(window.i18n.svcConfirmRemove || 'Delete?')) return;
        fetch('/group-admin/api/service/delete', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: id }) })
          .then(function(r){ if (!r.ok) throw new Error('Error ' + r.status); return r.json(); })
          .then(function(){ window.location.reload(); })
          .catch(function(e){ alert('Error: ' + e.message); });
      };

      // ===== セルフサービス: アプリ登録の申請 =====
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
      function renderApps() {
        var el = document.getElementById('apps-table-body');
        if (!el) return;
        var list = appsByGroup && currentGroupId ? (appsByGroup[currentGroupId] || []) : [];
        if (list.length === 0) {
          el.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:1.5rem;">' + (window.i18n.appNone || '(なし)') + '</td></tr>';
          return;
        }
        el.innerHTML = list.map(function(a) {
          var svc = a.service_name ? a.service_name : '—';
          var dataAttr = encodeURIComponent(JSON.stringify(a));
          return '<tr>'
            + '<td><strong>' + a.name + '</strong><div style="font-size:0.78rem;color:#94a3b8;font-family:monospace;">' + a.id + '</div></td>'
            + '<td>' + statusBadge(a.status) + '</td>'
            + '<td style="font-size:0.85rem;color:#64748b;">' + svc + '</td>'
            + '<td style="text-align:right; white-space:nowrap;">'
            +   '<button type="button" title="編集" onclick="openAppEditModal(\\'' + dataAttr + '\\')" style="background:transparent;border:none;color:#94a3b8;cursor:pointer;padding:7px;border-radius:50%;width:34px;height:34px;" onmouseover="this.style.background=\\'#f1f5f9\\';this.style.color=\\'#4f46e5\\';" onmouseout="this.style.background=\\'transparent\\';this.style.color=\\'#94a3b8\\';"><span class="material-symbols-outlined" style="font-size:18px;">edit</span></button>'
            +   '<button type="button" title="削除" onclick="removeApp(\\'' + a.id + '\\')" style="background:transparent;border:none;color:#94a3b8;cursor:pointer;padding:7px;border-radius:50%;width:34px;height:34px;" onmouseover="this.style.background=\\'#fef2f2\\';this.style.color=\\'#ef4444\\';" onmouseout="this.style.background=\\'transparent\\';this.style.color=\\'#94a3b8\\';"><span class="material-symbols-outlined" style="font-size:18px;">delete</span></button>'
            + '</td>'
            + '</tr>';
        }).join('');
      }

      function fillServiceOptions(el, selected) {
        if (!el) return;
        var svcs = (servicesByGroup && servicesByGroup[currentGroupId]) ? servicesByGroup[currentGroupId] : [];
        var html = '<option value="">' + (window.i18n.appBindNone || '-- none --') + '</option>';
        svcs.forEach(function(s){ html += '<option value="' + s.id + '"' + (s.id === selected ? ' selected' : '') + '>' + s.name + '</option>'; });
        el.innerHTML = html;
      }

      window.openAppModal = function() {
        if (!currentGroupId) return;
        ['ap-id','ap-name','ap-base-url','ap-redirect','ap-desc'].forEach(function(id){ var e = document.getElementById(id); if (e) e.value = ''; });
        fillServiceOptions(document.getElementById('ap-service'), '');
        var warn = document.getElementById('ap-no-service');
        var svcs = (servicesByGroup && servicesByGroup[currentGroupId]) ? servicesByGroup[currentGroupId] : [];
        if (warn) warn.style.display = svcs.length === 0 ? '' : 'none';
        var m = document.getElementById('add-app-modal');
        if (m) m.showModal();
      };
      window.addApp = function() {
        var id = (document.getElementById('ap-id')||{}).value;
        var name = (document.getElementById('ap-name')||{}).value;
        var baseUrl = (document.getElementById('ap-base-url')||{}).value;
        var redirect = (document.getElementById('ap-redirect')||{}).value;
        var desc = (document.getElementById('ap-desc')||{}).value;
        var serviceId = (document.getElementById('ap-service')||{}).value;
        if (!id || !id.trim() || !name || !name.trim() || !baseUrl || !baseUrl.trim()) { alert(window.i18n.appFillRequired || 'ID/名前/URLは必須です'); return; }
        fetch('/group-admin/api/app/request', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ group_id: currentGroupId, id: id.trim(), name: name.trim(), base_url: baseUrl.trim(), redirect_uris: redirect, description: desc, service_id: serviceId })
        })
        .then(function(r){ if (!r.ok) return r.json().catch(function(){return{};}).then(function(e){ throw new Error(e.error || ('Error ' + r.status)); }); return r.json(); })
        .then(function(){ window.location.reload(); })
        .catch(function(e){
          if (e.message === 'id_taken') alert(window.i18n.appIdTaken || 'そのアプリIDは既に使われています');
          else alert('Error: ' + e.message);
        });
      };
      window.openAppEditModal = function(enc) {
        var a = JSON.parse(decodeURIComponent(enc));
        document.getElementById('ape-id').value = a.id;
        document.getElementById('ape-name').value = a.name;
        document.getElementById('ape-base-url').value = a.base_url;
        document.getElementById('ape-redirect').value = '';
        fillServiceOptions(document.getElementById('ape-service'), a.service_id || '');
        var m = document.getElementById('edit-app-modal-ga');
        if (m) m.showModal();
      };
      window.updateApp = function() {
        var id = (document.getElementById('ape-id')||{}).value;
        var name = (document.getElementById('ape-name')||{}).value;
        var baseUrl = (document.getElementById('ape-base-url')||{}).value;
        var redirect = (document.getElementById('ape-redirect')||{}).value;
        var serviceId = (document.getElementById('ape-service')||{}).value;
        if (!name || !name.trim() || !baseUrl || !baseUrl.trim()) { alert(window.i18n.appFillRequired || '名前/URLは必須です'); return; }
        fetch('/group-admin/api/app/update', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ id: id, name: name.trim(), base_url: baseUrl.trim(), redirect_uris: redirect, service_id: serviceId })
        })
        .then(function(r){ if (!r.ok) throw new Error('Error ' + r.status); return r.json(); })
        .then(function(){ window.location.reload(); })
        .catch(function(e){ alert('Error: ' + e.message); });
      };
      window.removeApp = function(id) {
        if (!confirm(window.i18n.appConfirmRemove || 'Delete?')) return;
        fetch('/group-admin/api/app/delete', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: id }) })
          .then(function(r){ if (!r.ok) throw new Error('Error ' + r.status); return r.json(); })
          .then(function(){ window.location.reload(); })
          .catch(function(e){ alert('Error: ' + e.message); });
      };

    })();
  `)

  if (groups.length === 0) {
    return Layout({
      title: t.ga_title,
      siteName: props.siteName,
      lang: t.lang,
      width: 800,
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
        <button id="tab-btn-grants" onclick="switchTab('grants')">
          <span class="material-symbols-outlined">card_membership</span>${t.ga_tab_grants}
        </button>
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
        <div style="display:flex; justify-content:flex-end; margin-bottom:1rem;">
          ${Button({ onclick: "openAssignModal()", style: "width:auto;", children: html`<span class="material-symbols-outlined" style="font-size:18px;">assignment_add</span> ${t.ga_add_assignment}` })}
        </div>
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

      <!-- 利用枠タブ(ゲート②) -->
      <div id="tab-grants" style="display:none;">
        <div style="display:flex; justify-content:flex-end; margin-bottom:1rem;">
          ${Button({ onclick: "openGrantModal()", style: "width:auto;", children: html`<span class="material-symbols-outlined" style="font-size:18px;">add_card</span> ${t.ga_open_grant}` })}
        </div>
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
      </div>

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
              <thead><tr><th>${t.ga_app_name}</th><th>${t.status}</th><th>${t.ga_app_bind}</th><th></th></tr></thead>
              <tbody id="apps-table-body">
                <tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:1.5rem;">読込中...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- サービス作成モーダル -->
      ${Modal({
        id: 'add-service-modal',
        title: t.ga_svc_create,
        closeAction: "this.closest('dialog').close()",
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
        closeAction: "this.closest('dialog').close()",
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
            <div>
              <label class="${formLabel}">${t.ga_app_bind}</label>
              <select id="ap-service" class="${selectInput}"></select>
              <div id="ap-no-service" style="display:none; margin-top:0.5rem;" class="${infoBox}"><span class="material-symbols-outlined">info</span>${t.ga_no_own_services}</div>
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
        closeAction: "this.closest('dialog').close()",
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
            <div>
              <label class="${formLabel}">${t.ga_app_bind}</label>
              <select id="ape-service" class="${selectInput}"></select>
            </div>
            <div style="margin-top:0.25rem;">
              ${Button({ onclick: "updateApp()", children: html`<span class="material-symbols-outlined">save</span> ${t.save}` })}
            </div>
          </div>
        `
      })}

      <!-- メンバー追加モーダル -->
      ${Modal({
        id: 'add-member-modal',
        title: t.am_add_member,
        closeAction: "this.closest('dialog').close()",
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

      <!-- 割当追加モーダル(ゲート③) -->
      ${Modal({
        id: 'add-assign-modal',
        title: t.ga_add_assignment,
        closeAction: "this.closest('dialog').close()",
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
        closeAction: "this.closest('dialog').close()",
        children: html`
          <div style="display:flex; flex-direction:column; gap:1.1rem;">
            <div id="g-no-contract" style="display:none;" class="${infoBox}">
              <span class="material-symbols-outlined">info</span>${t.ga_no_contracts}
            </div>
            <div>
              <label class="${formLabel}">${t.ga_grant_contract}</label>
              <select id="g-contract" class="${selectInput}"></select>
            </div>
            <div>
              <label class="${formLabel}">${t.ga_grant_seat}</label>
              <input type="number" id="g-seat" min="0" class="${dateInput}" placeholder="${t.am_placeholder_seat}" />
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

      <script type="application/json" id="ga-members-data">${raw(membersByGroupJson)}</script>
      <script type="application/json" id="ga-assigns-data">${raw(assignmentsByGroupJson)}</script>
      <script type="application/json" id="ga-perms-data">${raw(permsByGroupJson)}</script>
      <script type="application/json" id="ga-users-data">${raw(allUsersJson)}</script>
      <script type="application/json" id="ga-grants-data">${raw(grantsByGroupJson)}</script>
      <script type="application/json" id="ga-facilities-data">${raw(facilitiesJson)}</script>
      <script type="application/json" id="ga-roles-data">${raw(rolesByServiceJson)}</script>
      <script type="application/json" id="ga-grants-detail-data">${raw(grantsDetailByGroupJson)}</script>
      <script type="application/json" id="ga-contracts-data">${raw(availableContractsJson)}</script>
      <script type="application/json" id="ga-services-data">${raw(servicesByGroupJson)}</script>
      <script type="application/json" id="ga-apps-data">${raw(appsByGroupJson)}</script>
      <script>
        window.i18n = {
          noMembers: '${t.am_no_members}',
          roleAdmin: '${t.am_role_group_admin}',
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
        };
      </script>
      <script>
      ${scriptContent}
      </script>
    `
  })
}
