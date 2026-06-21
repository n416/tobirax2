import { html, raw } from 'hono/html'
import { Layout } from './Layout'
import { dict } from '../../i18n'
import { Group, ServiceProvider, Service, ServiceContract, SystemConfig, App } from '../../types'
import { Modal } from '../components/Modal'
import { Button } from '../components/Button'
import { ServiceAppsModal } from '../components/ServiceAppsModal'
import { RejectReasonModal, RejectReasonModalScript } from '../components/RejectReasonModal'
import {
  amListGrid, amListCard, amItemTitle, amItemSub, amFormLabel, amBadge,
  amEmpty, amSectionHead, amDeleteForm, todayStr, plusYearStr,
} from './amShared'
import { safeJsonStringify } from '../../utils/json'

interface Props {
  t: typeof dict.en
  userEmail: string
  siteName: string
  appConfig: SystemConfig
  providers: ServiceProvider[]
  services: (Service & { provider_name?: string; owner_group_name?: string | null; app_names?: string | null; app_ids?: string | null })[]
  groups: Group[]
  apps: (App & { group_name?: string | null })[]
  nonce?: string
}

// アカウントマネージャ: サービスマスタ(ゲート①)。
// 提供企業 → サービス → 契約(席数上限つき) を運営者が登録する。全ゲートの前提データ。
export const AccountServicesPage = (props: Props) => {
  const t = props.t
  const fmt = (ts: number) => new Date(ts * 1000).toLocaleDateString()
  // サービス選択肢の表示(「サービス名（提供企業名）」)。
  const serviceLabel = (s: { name: string; provider_name?: string }) =>
    t.am_service_of_provider.replace('{service}', s.name).replace('{provider}', s.provider_name || '')

  const servicesData = props.services.map(s => {
    const ids = (s.app_ids || '').split(',').filter(Boolean);
    const names = (s.app_names || '').split(',').filter(Boolean).map(n => n.trim());
    const apps = ids.map((id, i) => ({ id, name: names[i] || id }));
    return { id: s.id, name: s.name, apps };
  });
  const allAppsData = props.apps.map(a => ({ id: a.id, name: a.name, group_name: a.group_name }));

  return Layout({
    t, userEmail: props.userEmail, activeTab: 'am-services',
    siteName: props.siteName, appConfig: props.appConfig,
    nonce: props.nonce,
    children: html`
      ${amSectionHead(t.am_section_services, t.am_services_subtitle)}

      <!-- ① 提供企業 -->
      <article style="padding:1.5rem; margin-bottom:1.5rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
          <h4 style="margin:0; font-size:1.1rem; color:#334155;">${t.am_providers_header}</h4>
          ${Button({ attr: { 'data-action': 'open-new-provider-modal' }, style: "width:auto; margin:0;",
            children: html`<span class="material-symbols-outlined" style="font-size:18px;">add</span> ${t.am_btn_add_provider}` })}
        </div>
        <div class="${amListGrid}">
          ${props.providers.length === 0 ? amEmpty(t.am_none_providers) : ''}
          ${props.providers.map(p => html`
            <div class="${amListCard}">
              <div>
                <div class="${amItemTitle}">${p.name}</div>
                <div class="${amItemSub}"><span class="material-symbols-outlined" style="font-size:16px;">apps</span>
                  ${props.services.filter(s => s.provider_id === p.id).length} ${t.am_services_header}</div>
              </div>
              ${amDeleteForm('/admin/am/providers/delete', p.id, t.am_confirm_delete_provider, t.delete)}
            </div>`)}
        </div>
      </article>

      <!-- ② サービス -->
      <article style="padding:1.5rem; margin-bottom:1.5rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
          <h4 style="margin:0; font-size:1.1rem; color:#334155;">${t.am_services_header}</h4>
          ${Button({ attr: { 'data-action': 'open-new-service-modal' }, style: "width:auto; margin:0;",
            children: html`<span class="material-symbols-outlined" style="font-size:18px;">add</span> ${t.am_btn_add_service}` })}
        </div>
        <div class="${amListGrid}">
          ${props.services.length === 0 ? amEmpty(t.am_none_services) : ''}
          ${props.services.map(s => html`
            <div class="${amListCard}">
              <div style="flex-grow:1;">
                <div class="${amItemTitle}" style="display:flex; align-items:center; gap:0.5rem;">
                  <a href="/admin/am/services/${s.id}" style="color:#2563eb; text-decoration:none;">${s.name}</a>
                  ${s.status === 'pending'
                    ? html`<span style="color:#c2410c; background:#fff7ed; border:1px solid #fdba74; padding:1px 7px; border-radius:999px; font-size:0.72rem; font-weight:700;">${t.status_pending}</span>`
                    : s.status === 'rejected'
                    ? html`<span style="color:#b91c1c; background:#fef2f2; border:1px solid #fecaca; padding:1px 7px; border-radius:999px; font-size:0.72rem; font-weight:700;">${t.status_rejected}</span>`
                    : ''}
                  ${s.owner_group_name
                    ? html`<span style="color:#7c3aed; background:#f5f3ff; border:1px solid #ddd6fe; padding:1px 7px; border-radius:999px; font-size:0.72rem; font-weight:700;">${t.app_owner_group}: ${s.owner_group_name}</span>`
                    : ''}
                </div>
                <div class="${amItemSub}"><span class="material-symbols-outlined" style="font-size:16px;">business</span>${s.provider_name || ''}</div>
                ${s.app_names ? html`<div class="${amItemSub}" style="margin-top:0.2rem;"><span class="material-symbols-outlined" style="font-size:16px;">apps</span>${s.app_names}</div>` : ''}
              </div>
              <div style="display:flex; align-items:center; gap:0.5rem;">
                ${s.status === 'pending' ? html`
                  <form method="POST" action="/admin/am/services/approve" style="margin:0;">
                    <input type="hidden" name="id" value="${s.id}" />
                    <input type="hidden" name="expected_apps" value="${s.app_ids || ''}" />
                    <button type="button" data-action="approve-service" data-confirm-msg="${t.confirm_approve_service}" style="background:#16a34a; color:#fff; border:none; border-radius:8px; padding:0.4rem 0.8rem; font-size:0.85rem; font-weight:600; cursor:pointer;">${t.btn_approve}</button>
                  </form>
                  <button type="button" data-action="open-reject-modal" data-id="${s.id}" data-expected-apps="${s.app_ids || ''}" style="background:#fff; color:#dc2626; border:1px solid #fecaca; border-radius:8px; padding:0.4rem 0.8rem; font-size:0.85rem; font-weight:600; cursor:pointer;">${t.btn_reject}</button>
                ` : ''}
                ${(!s.status || s.status === 'active') ? Button({
                  type: 'button',
                  variant: 'outline',
                  style: 'padding:0.4rem 0.8rem; font-size:0.85rem; height:auto; border-radius:8px; margin:0;',
                  attr: { 'data-action': 'manage-service-apps', 'data-id': s.id },
                  children: html`<span class="material-symbols-outlined" style="font-size:16px;">apps</span> アプリ管理`
                }) : ''}
                ${amDeleteForm('/admin/am/services/delete', s.id, t.am_confirm_delete_service, t.delete)}
              </div>
            </div>`)}
        </div>
      </article>


      ${Modal({
        id: 'new-provider-modal', title: t.am_btn_add_provider, closeAction: "this.closest('.custom-modal').close()",
        nonce: props.nonce,
        children: html`
          <form method="POST" action="/admin/am/providers">
            <label class="${amFormLabel}">${t.am_label_provider_name}</label>
            <input type="text" name="name" required style="margin-bottom:1rem;" />
            <div style="margin-top:1rem;">${Button({ type: 'submit', children: t.save })}</div>
          </form>`,
      })}

      ${Modal({
        id: 'new-service-modal', title: t.am_btn_add_service, closeAction: "this.closest('.custom-modal').close()",
        nonce: props.nonce,
        children: html`
          <form method="POST" action="/admin/am/services">
            <label class="${amFormLabel}">${t.am_label_provider}</label>
            <select name="provider_id" required style="margin-bottom:1rem;">
              ${props.providers.map(p => html`<option value="${p.id}">${p.name}</option>`)}
            </select>
            <label class="${amFormLabel}">${t.am_label_service_name}</label>
            <input type="text" name="name" placeholder="${t.am_placeholder_service_name}" required />
            <div style="margin-top:1rem;">${Button({ type: 'submit', children: t.save })}</div>
          </form>`,
      })}


      ${ServiceAppsModal(t, '/admin/api', props.nonce)}
      ${RejectReasonModal({ nonce: props.nonce })}

      <script type="application/json" id="am-services-data">${raw(safeJsonStringify(servicesData))}</script>
      <script type="application/json" id="am-all-apps-data">${raw(safeJsonStringify(allAppsData))}</script>
      <script nonce="${props.nonce}">
        ${raw(RejectReasonModalScript)}
        
        function manageServiceApps(serviceId) {
          var services = JSON.parse(document.getElementById('am-services-data').textContent || '[]');
          var allApps = JSON.parse(document.getElementById('am-all-apps-data').textContent || '[]');
          var s = services.find(function(x) { return x.id === serviceId; });
          if (!s) return;
          if (window.openServiceAppsModal) {
            window.openServiceAppsModal(encodeURIComponent(JSON.stringify(s)), allApps);
          }
        }

        document.addEventListener('DOMContentLoaded', function() {
          document.addEventListener('click', function(e) {
            var target = e.target;
            if (!target) return;

            var actionBtn = target.closest('[data-action]');
            if (actionBtn) {
              var action = actionBtn.getAttribute('data-action');
              var id = actionBtn.getAttribute('data-id');

              if (action === 'open-new-provider-modal') {
                var m = document.getElementById('new-provider-modal');
                if (m) m.showModal();
                return;
              }
              if (action === 'open-new-service-modal') {
                var m = document.getElementById('new-service-modal');
                if (m) m.showModal();
                return;
              }
              if (action === 'approve-service') {
                e.preventDefault();
                var msg = actionBtn.getAttribute('data-confirm-msg') || '承認しますか？';
                window.showConfirm(msg, function() {
                  actionBtn.closest('form').submit();
                });
                return;
              }
              if (action === 'open-reject-modal') {
                var expected = actionBtn.getAttribute('data-expected-apps') || '';
                if (window.openRejectModal) {
                  window.openRejectModal('/admin/am/services/reject', id, expected);
                }
                return;
              }
              if (action === 'manage-service-apps') {
                manageServiceApps(id);
                return;
              }
              if (action === 'delete-confirm') {
                e.preventDefault();
                var msg = actionBtn.getAttribute('data-confirm-msg') || '本当に削除しますか？';
                var form = actionBtn.closest('form');
                if (form && window.showConfirm) {
                  window.showConfirm(msg, function() {
                    form.submit();
                  });
                }
                return;
              }
            }
          });
        });
      </script>
    `
  })
}
