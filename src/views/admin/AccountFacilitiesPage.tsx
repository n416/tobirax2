import { html } from 'hono/html'
import { Layout } from './Layout'
import { dict } from '../../i18n'
import { Group, Facility, SystemConfig } from '../../types'
import { Modal } from '../components/Modal'
import { Button } from '../components/Button'
import {
  amListGrid, amListCard, amItemTitle, amItemSub, amFormLabel, amBadge,
  amEmpty, amSectionHead, amDeleteForm,
} from './amShared'

interface Props {
  t: typeof dict.en
  userEmail: string
  siteName: string
  appConfig: SystemConfig
  facilities: (Facility & { group_name?: string })[]
  groups: Group[]
}

// アカウントマネージャ: 施設(建物)。施設構造物番号と1:1、管理グループ(支店)に紐づく。
// 建物用途は役割マスタ/割当の絞り込みに使う。
export const AccountFacilitiesPage = (props: Props) => {
  const t = props.t

  return Layout({
    t, userEmail: props.userEmail, activeTab: 'am-facilities',
    siteName: props.siteName, appConfig: props.appConfig,
    children: html`
      ${amSectionHead(t.am_section_facilities, t.am_facilities_subtitle,
        props.groups.length > 0
          ? Button({ onclick: "document.getElementById('new-facility-modal').showModal()", style: "width:auto; margin:0;",
              children: html`<span class="material-symbols-outlined" style="font-size:18px;">add</span> ${t.am_btn_add_facility}` })
          : '')}

      <div class="${amListGrid}">
        ${props.facilities.length === 0 ? amEmpty(t.am_none_facilities) : ''}
        ${props.facilities.map(f => html`
          <div class="${amListCard}">
            <div>
              <div class="${amItemTitle}">${f.structure_no || f.id}</div>
              <div class="${amItemSub}">
                <span class="material-symbols-outlined" style="font-size:16px;">corporate_fare</span>${f.group_name || ''}
                ${f.building_use ? html`<span class="${amBadge}">${f.building_use}</span>` : ''}
              </div>
            </div>
            ${amDeleteForm('/admin/am/facilities/delete', f.id, t.am_confirm_delete_facility, t.delete)}
          </div>`)}
      </div>

      ${Modal({
        id: 'new-facility-modal', title: t.am_btn_add_facility, closeAction: "this.closest('.custom-modal').close()",
        children: html`
          <form method="POST" action="/admin/am/facilities">
            <label class="${amFormLabel}">${t.am_label_managing_group}</label>
            <select name="managing_group_id" required style="margin-bottom:1rem;">
              ${props.groups.map(g => html`<option value="${g.id}">${g.name}</option>`)}
            </select>
            <label class="${amFormLabel}">${t.am_label_structure_no}</label>
            <input type="text" name="structure_no" required style="margin-bottom:1rem;" />
            <label class="${amFormLabel}">${t.am_label_building_use}</label>
            <input type="text" name="building_use" placeholder="${t.am_placeholder_building_use}" />
            <div style="margin-top:1rem;">${Button({ type: 'submit', children: t.save })}</div>
          </form>`,
      })}
    `,
  })
}
