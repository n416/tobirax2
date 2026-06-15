import { html } from 'hono/html'
import { Layout } from './Layout'
import { dict } from '../../i18n'
import { Group, GroupServiceGrant, ServiceContract, SystemConfig } from '../../types'
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
  grants: (GroupServiceGrant & { group_name?: string; service_name?: string; provider_name?: string })[]
  groups: Group[]
  // 開放元の契約(選ぶと service_id が決まる)。表示は「サービス（提供企業）/ 契約組織」。
  contracts: (ServiceContract & { service_name?: string; provider_name?: string; group_name?: string })[]
}

// アカウントマネージャ: 利用枠(ゲート②)。契約を各グループノードへ明示開放する(親→子の自動継承なし)。
export const AccountGrantsPage = (props: Props) => {
  const t = props.t
  const fmt = (ts: number) => new Date(ts * 1000).toLocaleDateString()
  const contractLabel = (ct: { service_name?: string; provider_name?: string; group_name?: string }) =>
    `${t.am_service_of_provider.replace('{service}', ct.service_name || '').replace('{provider}', ct.provider_name || '')} / ${ct.group_name || ''}`

  return Layout({
    t, userEmail: props.userEmail, activeTab: 'am-grants',
    siteName: props.siteName, appConfig: props.appConfig,
    children: html`
      ${amSectionHead(t.am_section_grants, t.am_grants_subtitle,
        props.contracts.length > 0
          ? Button({ onclick: "document.getElementById('new-grant-modal').showModal()", style: "width:auto; margin:0;",
              children: html`<span class="material-symbols-outlined" style="font-size:18px;">add</span> ${t.am_btn_add_grant}` })
          : '')}

      ${props.contracts.length === 0 ? html`
        <article style="padding:1.5rem; color:#64748b;">${t.am_none_contracts}</article>` : ''}

      <div class="${amListGrid}">
        ${props.grants.length === 0 ? amEmpty(t.am_none_grants) : ''}
        ${props.grants.map(g => html`
          <div class="${amListCard}">
            <div>
              <div class="${amItemTitle}">${g.group_name || ''}</div>
              <div class="${amItemSub}">
                <span class="material-symbols-outlined" style="font-size:16px;">deployed_code</span>
                ${t.am_service_of_provider.replace('{service}', g.service_name || '').replace('{provider}', g.provider_name || '')}
                <span class="${amBadge}">${g.seat_limit == null ? t.am_seat_unlimited : t.am_label_seat_limit + ': ' + g.seat_limit}</span>
                <span style="color:#94a3b8;">${fmt(g.valid_from)} ～ ${fmt(g.valid_to)}</span>
              </div>
            </div>
            ${amDeleteForm('/admin/am/grants/delete', String(g.id), t.am_confirm_delete_grant, t.delete)}
          </div>`)}
      </div>

      ${Modal({
        id: 'new-grant-modal', title: t.am_btn_add_grant, closeAction: "this.closest('dialog').close()",
        children: html`
          <form method="POST" action="/admin/am/grants">
            <label class="${amFormLabel}">${t.am_label_grant_group}</label>
            <select name="group_id" required style="margin-bottom:1rem;">
              ${props.groups.map(gr => html`<option value="${gr.id}">${gr.name}</option>`)}
            </select>
            <label class="${amFormLabel}">${t.am_label_grant_contract}</label>
            <select name="contract_id" required style="margin-bottom:1rem;">
              ${props.contracts.map(ct => html`<option value="${ct.id}">${contractLabel(ct)}</option>`)}
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
