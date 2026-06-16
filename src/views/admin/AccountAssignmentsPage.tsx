import { html, raw } from 'hono/html'
import { Layout } from './Layout'
import { dict } from '../../i18n'
import { Group, User, Service, Facility, ServiceRole, ServiceUserAssignment, SystemConfig } from '../../types'
import { Modal } from '../components/Modal'
import { Button } from '../components/Button'
import {
  amListGrid, amListCard, amItemTitle, amItemSub, amFormLabel, amBadge,
  amEmpty, amSectionHead, amDeleteForm, todayStr, plusYearStr,
} from './amShared'

interface Props {
  t: typeof dict.en
  userEmail: string
  siteName: string
  appConfig: SystemConfig
  roles: (ServiceRole & { service_name?: string; provider_name?: string })[]
  assignments: (ServiceUserAssignment & {
    user_email?: string; user_name?: string | null; group_name?: string;
    service_name?: string; structure_no?: string | null; role_name?: string;
  })[]
  services: (Service & { provider_name?: string })[]
  facilities: (Facility & { group_name?: string })[]
  groups: Group[]
  users: User[]
  error?: string   // 'no_grant' | 'seat' など
}

// アカウントマネージャ: 役割マスタ + 利用者割当(ゲート③)。
// 割当は建物ごと。役割はマスタ参照で、サービス×建物用途に応じて選択肢を絞り込む。
// 割当にはゲート②(group_service_grants)の利用枠が前提で、無ければサーバ側で拒否する。
export const AccountAssignmentsPage = (props: Props) => {
  const t = props.t
  const fmt = (ts: number) => new Date(ts * 1000).toLocaleDateString()
  const serviceLabel = (s: { name: string; provider_name?: string }) =>
    t.am_service_of_provider.replace('{service}', s.name).replace('{provider}', s.provider_name || '')

  // クライアント側の絞り込み用データ。
  const rolesJson = JSON.stringify(props.roles.map(r => ({ id: r.id, service_id: r.service_id, facility_type: r.facility_type ?? null, role_name: r.role_name, role_code: r.role_code })))
  const facUseJson = JSON.stringify(Object.fromEntries(props.facilities.map(f => [f.id, f.building_use ?? null])))

  const errorMsg = props.error === 'no_grant' ? t.am_grants_subtitle
    : props.error === 'seat' ? t.am_alert_seat_exceeded
    : props.error === 'no_role' ? t.am_alert_no_role : ''

  const script = raw(`
    (function() {
      var ROLES = ${rolesJson};
      var FAC_USE = ${facUseJson};
      var i18nNoRole = ${JSON.stringify(t.am_alert_no_role)};
      function refreshRoles() {
        var svc = document.getElementById('a-service');
        var fac = document.getElementById('a-facility');
        var role = document.getElementById('a-role');
        if (!svc || !fac || !role) return;
        var use = FAC_USE[fac.value] || null;
        var matched = ROLES.filter(function(r){ return r.service_id === svc.value && (r.facility_type == null || r.facility_type === use); });
        role.innerHTML = '';
        if (matched.length === 0) {
          var o = document.createElement('option'); o.value=''; o.textContent = i18nNoRole; o.disabled = true; o.selected = true;
          role.appendChild(o);
          return;
        }
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
  `)

  return Layout({
    t, userEmail: props.userEmail, activeTab: 'am-assignments',
    siteName: props.siteName, appConfig: props.appConfig,
    children: html`
      ${amSectionHead(t.am_section_assignments, t.am_assignments_subtitle)}

      ${errorMsg ? html`<article style="padding:1rem 1.25rem; margin-bottom:1.5rem; background:#fef2f2 !important; border-color:#fecaca; color:#b91c1c; display:flex; align-items:center; gap:0.5rem;">
        <span class="material-symbols-outlined">error</span>${errorMsg}</article>` : ''}

      <!-- 役割マスタ -->
      <article style="padding:1.5rem; margin-bottom:1.5rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
          <h4 style="margin:0; font-size:1.1rem; color:#334155;">${t.am_roles_header}</h4>
          ${props.services.length > 0 ? Button({ onclick: "document.getElementById('new-role-modal').showModal()", style: "width:auto; margin:0;",
            children: html`<span class="material-symbols-outlined" style="font-size:18px;">add</span> ${t.am_btn_add_role}` }) : ''}
        </div>
        <div class="${amListGrid}">
          ${props.roles.length === 0 ? amEmpty(t.am_none_roles) : ''}
          ${props.roles.map(r => html`
            <div class="${amListCard}">
              <div>
                <div class="${amItemTitle}">
                  ${r.role_name}
                  <span style="font-size:0.85em; color:#64748b; font-family:monospace; margin-left:0.5rem;">[${r.role_code}]</span>
                </div>
                <div class="${amItemSub}">
                  <span class="material-symbols-outlined" style="font-size:16px;">deployed_code</span>
                  ${serviceLabel({ name: r.service_name || '', provider_name: r.provider_name })}
                  <span class="${amBadge}">${r.facility_type ? r.facility_type : t.am_facility_type_all}</span>
                </div>
              </div>
              ${amDeleteForm('/admin/am/roles/delete', String(r.id), t.am_confirm_delete_role, t.delete)}
            </div>`)}
        </div>
      </article>

      <!-- 利用者割当 -->
      <article style="padding:1.5rem; margin-bottom:1.5rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
          <h4 style="margin:0; font-size:1.1rem; color:#334155;">${t.am_assignments_header}</h4>
          ${(props.services.length > 0 && props.facilities.length > 0 && props.roles.length > 0 && props.users.length > 0)
            ? Button({ onclick: "document.getElementById('new-assignment-modal').showModal(); window.amRefreshRoles && window.amRefreshRoles();", style: "width:auto; margin:0;",
                children: html`<span class="material-symbols-outlined" style="font-size:18px;">add</span> ${t.am_btn_add_assignment}` })
            : ''}
        </div>
        <div class="${amListGrid}">
          ${props.assignments.length === 0 ? amEmpty(t.am_none_assignments) : ''}
          ${props.assignments.map(a => html`
            <div class="${amListCard}">
              <div>
                <div class="${amItemTitle}">${a.user_name || a.user_email || ''}</div>
                <div class="${amItemSub}">
                  <span class="material-symbols-outlined" style="font-size:16px;">badge</span>${a.role_name || ''}
                  <span class="${amBadge}">${a.service_name || ''}</span>
                  <span style="color:#94a3b8;"><span class="material-symbols-outlined" style="font-size:14px;">apartment</span> ${a.structure_no || a.facility_id} · ${a.group_name || ''}</span>
                  <span style="color:#94a3b8;">${fmt(a.valid_from)} ～ ${fmt(a.valid_to)}</span>
                </div>
              </div>
              ${amDeleteForm('/admin/am/assignments/delete', String(a.id), t.am_confirm_delete_assignment, t.delete)}
            </div>`)}
        </div>
      </article>

      ${Modal({
        id: 'new-role-modal', title: t.am_btn_add_role, closeAction: "this.closest('.custom-modal').close()",
        children: html`
          <form method="POST" action="/admin/am/roles">
            <label class="${amFormLabel}">${t.am_label_role_service}</label>
            <select name="service_id" required style="margin-bottom:1rem;">
              ${props.services.map(s => html`<option value="${s.id}">${serviceLabel(s)}</option>`)}
            </select>
            <label class="${amFormLabel}">${t.am_label_role_facility_type}</label>
            <input type="text" name="facility_type" placeholder="${t.am_facility_type_all}" style="margin-bottom:1rem;" />
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem;">
              <div>
                <label class="${amFormLabel}">${t.am_label_role_name}</label>
                <input type="text" name="role_name" placeholder="${t.am_placeholder_role_name}" required />
              </div>
              <div>
                <label class="${amFormLabel}">${t.am_label_role_code}</label>
                <input type="text" name="role_code" placeholder="${t.am_placeholder_role_code}" pattern="[a-zA-Z0-9_-]+" required />
              </div>
            </div>
            <div style="margin-top:1rem;">${Button({ type: 'submit', children: t.save })}</div>
          </form>`,
      })}

      ${Modal({
        id: 'new-assignment-modal', title: t.am_btn_add_assignment, closeAction: "this.closest('.custom-modal').close()",
        children: html`
          <form method="POST" action="/admin/am/assignments">
            <label class="${amFormLabel}">${t.am_label_assign_user}</label>
            <select name="user_id" required style="margin-bottom:1rem;">
              ${props.users.map(u => html`<option value="${u.id}">${u.name ? `${u.name} <${u.email}>` : u.email}</option>`)}
            </select>
            <label class="${amFormLabel}">${t.am_label_assign_group}</label>
            <select name="group_id" required style="margin-bottom:1rem;">
              ${props.groups.map(g => html`<option value="${g.id}">${g.name}</option>`)}
            </select>
            <label class="${amFormLabel}">${t.am_label_assign_service}</label>
            <select id="a-service" name="service_id" required style="margin-bottom:1rem;">
              ${props.services.map(s => html`<option value="${s.id}">${serviceLabel(s)}</option>`)}
            </select>
            <label class="${amFormLabel}">${t.am_label_assign_facility}</label>
            <select id="a-facility" name="facility_id" required style="margin-bottom:1rem;">
              ${props.facilities.map(f => html`<option value="${f.id}">${f.structure_no || f.id}${f.building_use ? ` (${f.building_use})` : ''}</option>`)}
            </select>
            <label class="${amFormLabel}">${t.am_label_assign_role}</label>
            <select id="a-role" name="service_role_id" required style="margin-bottom:1rem;"></select>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
              <div><label class="${amFormLabel}">${t.label_valid_from}</label>
                <input type="date" name="valid_from" value="${todayStr()}" required /></div>
              <div><label class="${amFormLabel}">${t.label_valid_to}</label>
                <input type="date" name="valid_to" value="${plusYearStr(1)}" required /></div>
            </div>
            <div style="margin-top:1rem;">${Button({ type: 'submit', children: t.save })}</div>
          </form>`,
      })}

      <script>${script}</script>
    `,
  })
}
