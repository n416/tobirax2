import { html } from 'hono/html'
import { Layout } from './Layout'
import { dict } from '../../i18n'
import { Group, ServiceProvider, Service, ServiceContract, SystemConfig } from '../../types'
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
  providers: ServiceProvider[]
  services: (Service & { provider_name?: string })[]
  contracts: (ServiceContract & { service_name?: string; provider_name?: string; group_name?: string })[]
  groups: Group[]
}

// アカウントマネージャ: サービスマスタ(ゲート①)。
// 提供企業 → サービス → 契約(席数上限つき) を運営者が登録する。全ゲートの前提データ。
export const AccountServicesPage = (props: Props) => {
  const t = props.t
  const fmt = (ts: number) => new Date(ts * 1000).toLocaleDateString()
  // サービス選択肢の表示(「サービス名（提供企業名）」)。
  const serviceLabel = (s: { name: string; provider_name?: string }) =>
    t.am_service_of_provider.replace('{service}', s.name).replace('{provider}', s.provider_name || '')

  return Layout({
    t, userEmail: props.userEmail, activeTab: 'am-services',
    siteName: props.siteName, appConfig: props.appConfig,
    children: html`
      ${amSectionHead(t.am_section_services, t.am_services_subtitle)}

      <!-- ① 提供企業 -->
      <article style="padding:1.5rem; margin-bottom:1.5rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
          <h4 style="margin:0; font-size:1.1rem; color:#334155;">${t.am_providers_header}</h4>
          ${Button({ onclick: "document.getElementById('new-provider-modal').showModal()", style: "width:auto; margin:0;",
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
          ${Button({ onclick: "document.getElementById('new-service-modal').showModal()", style: "width:auto; margin:0;",
            children: html`<span class="material-symbols-outlined" style="font-size:18px;">add</span> ${t.am_btn_add_service}` })}
        </div>
        <div class="${amListGrid}">
          ${props.services.length === 0 ? amEmpty(t.am_none_services) : ''}
          ${props.services.map(s => html`
            <div class="${amListCard}">
              <div>
                <div class="${amItemTitle}">${s.name}</div>
                <div class="${amItemSub}"><span class="material-symbols-outlined" style="font-size:16px;">business</span>${s.provider_name || ''}</div>
              </div>
              ${amDeleteForm('/admin/am/services/delete', s.id, t.am_confirm_delete_service, t.delete)}
            </div>`)}
        </div>
      </article>

      <!-- ③ 契約 -->
      <article style="padding:1.5rem; margin-bottom:1.5rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
          <h4 style="margin:0; font-size:1.1rem; color:#334155;">${t.am_contracts_header}</h4>
          ${Button({ onclick: "document.getElementById('new-contract-modal').showModal()", style: "width:auto; margin:0;",
            children: html`<span class="material-symbols-outlined" style="font-size:18px;">add</span> ${t.am_btn_add_contract}` })}
        </div>
        <div class="${amListGrid}">
          ${props.contracts.length === 0 ? amEmpty(t.am_none_contracts) : ''}
          ${props.contracts.map(ct => html`
            <div class="${amListCard}">
              <div>
                <div class="${amItemTitle}">${serviceLabel({ name: ct.service_name || '', provider_name: ct.provider_name })}</div>
                <div class="${amItemSub}">
                  <span class="material-symbols-outlined" style="font-size:16px;">corporate_fare</span>${ct.group_name || ''}
                  <span class="${amBadge}">${ct.seat_limit == null ? t.am_seat_unlimited : t.am_label_seat_limit + ': ' + ct.seat_limit}</span>
                  <span style="color:#94a3b8;">${fmt(ct.valid_from)} ～ ${fmt(ct.valid_to)}</span>
                </div>
              </div>
              ${amDeleteForm('/admin/am/contracts/delete', ct.id, t.am_confirm_delete_contract, t.delete)}
            </div>`)}
        </div>
      </article>

      ${Modal({
        id: 'new-provider-modal', title: t.am_btn_add_provider, closeAction: "this.closest('dialog').close()",
        children: html`
          <form method="POST" action="/admin/am/providers">
            <label class="${amFormLabel}">${t.am_label_provider_name}</label>
            <input type="text" name="name" placeholder="${t.am_placeholder_provider_name}" required />
            <div style="margin-top:1rem;">${Button({ type: 'submit', children: t.save })}</div>
          </form>`,
      })}

      ${Modal({
        id: 'new-service-modal', title: t.am_btn_add_service, closeAction: "this.closest('dialog').close()",
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

      ${Modal({
        id: 'new-contract-modal', title: t.am_btn_add_contract, closeAction: "this.closest('dialog').close()",
        children: html`
          <form method="POST" action="/admin/am/contracts">
            <label class="${amFormLabel}">${t.am_label_contract_service}</label>
            <select name="service_id" required style="margin-bottom:1rem;">
              ${props.services.map(s => html`<option value="${s.id}">${serviceLabel(s)}</option>`)}
            </select>
            <label class="${amFormLabel}">${t.am_label_customer_group}</label>
            <select name="customer_group_id" required style="margin-bottom:1rem;">
              ${props.groups.map(g => html`<option value="${g.id}">${g.name}</option>`)}
            </select>
            <label class="${amFormLabel}">${t.am_label_seat_limit}</label>
            <input type="number" name="seat_limit" min="0" placeholder="${t.am_placeholder_seat}" style="margin-bottom:1rem;" />
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
              <div><label class="${amFormLabel}">${t.label_valid_from}</label>
                <input type="date" name="valid_from" value="${todayStr()}" required /></div>
              <div><label class="${amFormLabel}">${t.label_valid_to}</label>
                <input type="date" name="valid_to" value="${plusYearStr(1)}" required /></div>
            </div>
            <div style="margin-top:1rem;">${Button({ type: 'submit', children: t.save })}</div>
          </form>`,
      })}
    `,
  })
}
