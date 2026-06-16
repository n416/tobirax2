import { html } from 'hono/html'
import { Layout } from './Layout'
import { dict } from '../../i18n'
import { Group, Service, ServiceContract, SystemConfig } from '../../types'
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
  services: (Service & { provider_name?: string })[]
  contracts: (ServiceContract & { service_name?: string; provider_name?: string; group_name?: string })[]
  groups: Group[]
}

// アカウントマネージャ: 契約マスタ(ゲート②の前提)。
export const AccountContractsPage = (props: Props) => {
  const t = props.t
  const fmt = (ts: number) => new Date(ts * 1000).toLocaleDateString()
  // サービス選択肢の表示(「サービス名（提供企業名）」)。
  const serviceLabel = (s: { name: string; provider_name?: string }) =>
    t.am_service_of_provider.replace('{service}', s.name).replace('{provider}', s.provider_name || '')

  return Layout({
    t, userEmail: props.userEmail, activeTab: 'am-contracts',
    siteName: props.siteName, appConfig: props.appConfig,
    children: html`
      ${amSectionHead(t.am_contracts_header, '')}

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
        id: 'new-contract-modal', title: t.am_btn_add_contract, closeAction: "this.closest('dialog').close()",
        children: html`
          <form method="POST" action="/admin/am/contracts">
            <label class="${amFormLabel}">${t.am_label_contract_service}</label>
            <select name="service_id" required style="margin-bottom:1rem;">
              ${props.services.filter(s => !s.status || s.status === 'active').map(s => html`<option value="${s.id}">${serviceLabel(s)}</option>`)}
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
