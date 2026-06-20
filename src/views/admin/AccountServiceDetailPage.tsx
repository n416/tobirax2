import { html, raw } from 'hono/html'
import { css } from 'hono/css'
import { Layout } from './Layout'
import { dict } from '../../i18n'
import { Service, ServiceRole, SystemConfig } from '../../types'
import { Modal } from '../components/Modal'
import { Button } from '../components/Button'
import {
  amListGrid, amListCard, amItemTitle, amItemSub, amFormLabel, amBadge,
  amEmpty, amSectionHead, amDeleteForm
} from './amShared'

interface Props {
  t: typeof dict.en
  userEmail: string
  siteName: string
  appConfig: SystemConfig
  service: Service & { provider_name?: string }
  roles: ServiceRole[]
  error?: string
}

export const AccountServiceDetailPage = (props: Props) => {
  const t = props.t
  const s = props.service

  return Layout({
    t, userEmail: props.userEmail, activeTab: 'am-services',
    siteName: props.siteName, appConfig: props.appConfig,
    children: html`
      ${props.error ? html`<div style="padding:1rem; margin-bottom:1rem; background:#fee2e2; color:#b91c1c; border-radius:4px;">${props.error}</div>` : ''}

      <div style="margin-bottom:1.5rem;">
        <a href="/admin/am/services" style="color:#2563eb; text-decoration:none;">&larr; ${t.am_section_services}一覧へ戻る</a>
      </div>

      <div style="background:#ffffff; border-radius:12px; padding:1.5rem; margin-bottom:2rem; border:1px solid #e2e8f0; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
        <h2 style="margin:0 0 0.5rem 0; font-size:1.5rem; color:#0f172a;">${s.name}</h2>
        <div style="color:#64748b; font-size:0.9rem; display:flex; align-items:center; gap:0.4rem;">
          <span class="material-symbols-outlined" style="font-size:18px;">business</span>
          ${s.provider_name || ''}
        </div>
      </div>

      <!-- 役割マスタ -->
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
          <h3 class="${amSectionHead}" style="margin:0;">${t.am_label_role}</h3>
          ${Button({ onclick: "document.getElementById('new-role-modal').showModal()", style: "width:auto; margin:0;",
            children: html`<span class="material-symbols-outlined" style="font-size:18px;">add</span> 役割を追加` })}
        </div>
        <div class="${amListGrid}">
          ${props.roles.length === 0 ? amEmpty(t.am_none_roles) : ''}
          ${props.roles.map(r => html`
            <div class="${amListCard}">
              <div>
                <div class="${amItemTitle}">${r.role_name} (${r.role_code})</div>
                <div class="${amItemSub}">
                  <span class="${amBadge}">${r.facility_type ? '施設種別: ' + r.facility_type : '全施設対象'}</span>
                </div>
              </div>
              ${r.role_code === 'general' ? '' : amDeleteForm('/admin/am/roles/delete', String(r.id), t.am_confirm_delete_role, t.delete)}
            </div>`)}
        </div>
      </div>

      <!-- Modals -->
      ${Modal({
        id: 'new-role-modal', title: '役割を追加', closeAction: "this.closest('.custom-modal').close()",
        children: html`
          <form method="POST" action="/admin/am/roles">
            <input type="hidden" name="service_id" value="${s.id}" />
            <label class="${amFormLabel}">${t.am_label_role_code}</label>
            <input type="text" name="role_code" placeholder="manager" required style="margin-bottom:1rem;" />
            <label class="${amFormLabel}">${t.am_label_role_name}</label>
            <input type="text" name="role_name" placeholder="施設管理者" required style="margin-bottom:1rem;" />
            <label class="${amFormLabel}">施設種別</label>
            <input type="text" name="facility_type" placeholder="病院 (任意: 特定用途限定の場合)" style="margin-bottom:1rem;" />
            <div style="margin-top:1rem;">${Button({ type: 'submit', children: t.save })}</div>
          </form>`,
      })}
    `
  })
}
