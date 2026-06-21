import { html, raw } from 'hono/html'
import { css } from 'hono/css'
import { Layout } from './Layout'
import { dict } from '../../i18n'
import { Tag, Service, SystemConfig } from '../../types'
import { Modal } from '../components/Modal'
import { Button } from '../components/Button'

export interface PendingServiceTag {
  id: number
  service_id: string
  service_name: string
  tag_name: string
  requesting_group_name: string | null
  created_at: number
}

export interface ServiceTagMap {
  id: number
  tag_id: string
  service_id: string
  service_name: string
  status: string
}

interface Props {
  t: typeof dict.en
  userEmail: string
  tags: (Tag & { owner_group_name: string | null; service_count: number })[]
  pendingServiceTags: PendingServiceTag[]
  allServices: Pick<Service, 'id' | 'name'>[]
  serviceTagsMap: ServiceTagMap[]
  siteName: string
  appConfig: SystemConfig
  nonce?: string
}

export const TagsPage = (props: Props) => {
  const t = props.t

  const listGrid = css`
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  `
  const listCard = css`
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    transition: box-shadow 0.2s, transform 0.2s;
    &:hover {
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
      transform: translateY(-2px);
    }
  `

  return Layout({
    t: t,
    userEmail: props.userEmail,
    activeTab: 'tags',
    siteName: props.siteName,
    appConfig: props.appConfig,
    nonce: props.nonce,
    children: html`
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <h2 style="margin-bottom: 0;">${t.nav_tags || 'タグ管理'}</h2>
        ${Button({
            attr: { 'data-action': 'open-new-tag-modal' },
            style: "width: auto; margin-bottom: 0;",
            children: html`<span class="material-symbols-outlined" style="font-size: 18px;">add</span> ${t.btn_add_tag || 'タグ追加'}`
        })}
      </div>

      ${Modal({
        id: "new-tag-modal",
        title: t.btn_add_tag || 'タグ追加',
        closeAction: "this.closest('.custom-modal').close()",
        nonce: props.nonce,
        children: html`
              <form method="POST" action="/admin/tags/create">
                <div class="grid-vertical" style="display:flex; flex-direction:column; gap:1.5rem;">
                    <label style="width:100%;">
                      <span class="form-label">${t.label_tag_name || 'タグ名'}</span>
                      <input type="text" name="name" required />
                    </label>
                    <div style="margin-top:1rem;">
                        ${Button({ type: "submit", children: t.save || 'Save' })}
                    </div>
                </div>
              </form>
        `
      })}

      <form id="approve-tag-form" method="POST" action="/admin/tags/approve">
        <input type="hidden" name="id" value="" />
      </form>
      <form id="reject-tag-form" method="POST" action="/admin/tags/reject">
        <input type="hidden" name="id" value="" />
      </form>
      <form id="delete-tag-form" method="POST" action="/admin/tags/delete">
        <input type="hidden" name="id" value="" />
      </form>
      <form id="approve-service-tag-form" method="POST" action="/admin/tags/service/approve">
        <input type="hidden" name="id" value="" />
      </form>
      <form id="reject-service-tag-form" method="POST" action="/admin/tags/service/reject">
        <input type="hidden" name="id" value="" />
      </form>
      <form id="add-service-tag-form" method="POST" action="/admin/tags/service/add">
        <input type="hidden" name="tag_id" value="" />
        <input type="hidden" name="service_id" value="" />
      </form>
      <form id="remove-service-tag-form" method="POST" action="/admin/tags/service/remove">
        <input type="hidden" name="service_id" value="" />
        <input type="hidden" name="tag_id"       ${props.pendingServiceTags.length > 0 ? html`
          <h3 style="margin-top: 2rem; margin-bottom: 1rem; font-size: 1.25rem;">サービスへのタグ付け申請 (承認待ち)</h3>
          <div class="${listGrid}" style="margin-bottom: 2rem;">
            ${props.pendingServiceTags.map(at => html`
              <div class="${listCard}">
                <div style="font-weight: 600; color: #1e293b;">タグ: ${at.tag_name}</div>
                <div style="font-size: 0.85rem; color: #475569;">サービス: ${at.service_name}</div>
                <div style="font-size: 0.85rem; color: #475569;">申請元グループ: ${at.requesting_group_name || '-'}</div>
                <div style="display: flex; gap: 0.5rem; align-items: center; margin-top: 0.5rem;">
                    <button type="button" data-action="approve-service-tag" data-id="${at.id}" style="background:#16a34a; color:#fff; border:none; border-radius:8px; padding:0.4rem 0.8rem; font-size:0.85rem; font-weight:600; cursor:pointer;">
                        ${t.btn_approve || 'Approve'}
                    </button>
                    <button type="button" data-action="reject-service-tag" data-id="${at.id}" style="background:#fff; color:#dc2626; border:1px solid #fecaca; border-radius:8px; padding:0.4rem 0.8rem; font-size:0.85rem; font-weight:600; cursor:pointer;">
                        ${t.btn_reject || 'Reject'}
                    </button>
                </div>
              </div>
            `)}
          </div>
      ` : ''}

      <h3 style="margin-top: 2rem; margin-bottom: 1rem; font-size: 1.25rem;">タグ一覧</h3>
      <div class="${listGrid}">
        ${props.tags.map(tag => html`
          <div class="${listCard}">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <div style="font-weight: 600; color: #1e293b; display:flex; align-items:center; gap:0.5rem;">
                        <span class="material-symbols-outlined" style="font-size:16px; color:#64748b;">label</span>
                        ${tag.name}
                    </div>
                    ${tag.owner_group_name ? html`<div style="font-size:0.8rem; color:#64748b; margin-top:0.25rem;">申請元: ${tag.owner_group_name}</div>` : ''}
                    <div style="font-size:0.8rem; color:#64748b; margin-top:0.25rem;">紐付け先サービス数: ${tag.service_count}</div>
                </div>
                <div>
                    ${tag.status === 'pending'
                        ? html`<span style="color:#c2410c; background:#fff7ed; border:1px solid #fdba74; padding:2px 6px; border-radius:4px; font-size:0.75rem; font-weight:bold;">${t.status_pending}</span>`
                        : tag.status === 'rejected'
                        ? html`<span style="color:#b91c1c; background:#fef2f2; border:1px solid #fecaca; padding:2px 6px; border-radius:4px; font-size:0.75rem; font-weight:bold;">${t.status_rejected}</span>`
                        : html`<span style="color:#16a34a; background:#f0fdf4; border:1px solid #bbf7d0; padding:2px 6px; border-radius:4px; font-size:0.75rem; font-weight:bold;">${t.status_active}</span>`}
                </div>
            </div>
            
            <div style="display: flex; gap: 0.5rem; align-items: center; margin-top: 0.5rem; border-top: 1px solid #e2e8f0; padding-top: 0.5rem;">
                ${tag.status === 'pending'
                    ? html`
                        <button type="button" data-action="approve-tag" data-id="${tag.id}" style="background:#16a34a; color:#fff; border:none; border-radius:8px; padding:0.4rem 0.8rem; font-size:0.85rem; font-weight:600; cursor:pointer;">
                            ${t.btn_approve || 'Approve'}
                        </button>
                        <button type="button" data-action="reject-tag" data-id="${tag.id}" style="background:#fff; color:#dc2626; border:1px solid #fecaca; border-radius:8px; padding:0.4rem 0.8rem; font-size:0.85rem; font-weight:600; cursor:pointer;">
                            ${t.btn_reject || 'Reject'}
                        </button>`
                    : ''}

                <button type="button" data-action="delete-tag" data-id="${tag.id}" style="background:transparent; color:#ef4444; border:none; border-radius:8px; padding:0.4rem; font-size:0.85rem; font-weight:600; cursor:pointer; display:inline-flex; align-items:center;" title="${t.delete || 'Delete'}">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            </div>
            
            ${tag.status === 'active' ? html`
            <details style="margin-top: 0.5rem; border-top: 1px dashed #cbd5e1; padding-top: 0.5rem;">
                <summary style="font-size: 0.85rem; color: #4f46e5; cursor: pointer; font-weight: 600;">紐付けサービス管理</summary>
                <div style="margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.5rem;">
                    <!-- 適用済みのサービス一覧 -->
                    <div style="display:flex; flex-wrap:wrap; gap:0.25rem;">
                    ${props.serviceTagsMap.filter(at => at.tag_id === tag.id).length === 0 ? html`<span style="font-size:0.75rem; color:#94a3b8;">紐付けされているサービスはありません</span>` : ''}
                    ${props.serviceTagsMap.filter(at => at.tag_id === tag.id).map(at => html`
                        <span style="display:inline-flex; align-items:center; gap:0.25rem; font-size:0.75rem; padding:2px 6px; border-radius:999px; background:${at.status === 'active' ? '#f1f5f9' : '#fff7ed'}; color:#334155; border:1px solid #cbd5e1;">
                            ${at.service_name} ${at.status === 'pending' ? '(申請中)' : ''}
                            <button type="button" data-action="remove-service-tag" data-service-id="${at.service_id}" data-tag-id="${at.tag_id}" style="background:none; border:none; color:#94a3b8; cursor:pointer; padding:0; font-size:1rem; line-height:1;">×</button>
                        </span>
                    `)}
                    </div>
                    
                    <!-- サービスの追加 -->
                    <div style="display:flex; gap:0.25rem; margin-top: 0.25rem;">
                        <select id="sel-service-${tag.id}" style="flex:1; padding:0.25rem; font-size:0.8rem; border-radius:4px; border:1px solid #cbd5e1;">
                            <option value="">サービスを選択して追加...</option>
                            ${props.allServices.map(a => {
                                const isLinked = props.serviceTagsMap.some(at => at.tag_id === tag.id && at.service_id === a.id);
                                if (isLinked) return '';
                                return html`<option value="${a.id}">${a.name}</option>`
                            })}
                        </select>
                        <button type="button" data-action="add-service-tag" data-tag-id="${tag.id}" style="background:#4f46e5; color:white; border:none; border-radius:4px; padding:0 0.5rem; font-size:0.85rem; cursor:pointer;">追加</button>
                    </div>
                </div>
            </details>
            ` : ''}
          </div>
        `)}
      </div>

      <script nonce="${props.nonce}">
      document.addEventListener('DOMContentLoaded', function() {
        document.addEventListener('click', function(e) {
          var target = e.target;
          if (!target) return;
          var btn = target.closest('[data-action]');
          if (!btn) return;
          var action = btn.getAttribute('data-action');
          var id = btn.getAttribute('data-id');
          
          if (action === 'open-new-tag-modal') {
            var modal = document.getElementById('new-tag-modal');
            if (modal) modal.showModal();
            return;
          }
          if (action === 'approve-service-tag') {
            var form = document.getElementById('approve-service-tag-form');
            if (form) {
              form.querySelector('input[name=id]').value = id;
              form.submit();
            }
            return;
          }
          if (action === 'reject-service-tag') {
            var form = document.getElementById('reject-service-tag-form');
            if (form) {
              form.querySelector('input[name=id]').value = id;
              form.submit();
            }
            return;
          }
          if (action === 'approve-tag') {
            var form = document.getElementById('approve-tag-form');
            if (form) {
              form.querySelector('input[name=id]').value = id;
              form.submit();
            }
            return;
          }
          if (action === 'reject-tag') {
            var form = document.getElementById('reject-tag-form');
            if (form) {
              form.querySelector('input[name=id]').value = id;
              form.submit();
            }
            return;
          }
          if (action === 'delete-tag') {
            window.showConfirm('削除しますか？紐付けも解除されます。', function() {
              var form = document.getElementById('delete-tag-form');
              if (form) {
                form.querySelector('input[name=id]').value = id;
                form.submit();
              }
            });
            return;
          }
          if (action === 'remove-service-tag') {
            var serviceId = btn.getAttribute('data-service-id');
            var tagId = btn.getAttribute('data-tag-id');
            window.showConfirm('このサービスからタグを外しますか？', function() {
              var form = document.getElementById('remove-service-tag-form');
              if (form) {
                form.querySelector('input[name=service_id]').value = serviceId;
                form.querySelector('input[name=tag_id]').value = tagId;
                form.submit();
              }
            });
            return;
          }
          if (action === 'add-service-tag') {
            var tagId = btn.getAttribute('data-tag-id');
            var srvSelect = document.getElementById('sel-service-' + tagId);
            if (srvSelect && srvSelect.value) {
              var form = document.getElementById('add-service-tag-form');
              if (form) {
                form.querySelector('input[name=tag_id]').value = tagId;
                form.querySelector('input[name=service_id]').value = srvSelect.value;
                form.submit();
              }
            }
            return;
          }
        });
      });
      </script>
    `
  })
}
