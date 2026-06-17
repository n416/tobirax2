import { html } from 'hono/html'
import { Modal } from './Modal'
import { Button } from './Button'
import { MultiSelect } from './MultiSelect'
import { ServiceAppsModal } from './ServiceAppsModal'
import { formLabel, dateInput, selectInput, infoBox } from '../styles/groupAdminStyles'

export const GroupAdminModals = (props: any, t: any, userOptions: any) => html`
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
              <div style="display:flex; flex-direction:column; gap:0.6rem; padding:0.25rem 0;">
                <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer; font-size:0.92rem; color:var(--text-main);">
                  <input type="checkbox" id="chk_group_admin" style="width:18px; height:18px; cursor:pointer;" /> ${t.am_role_group_admin}
                </label>
                <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer; font-size:0.92rem; color:var(--text-main);">
                  <input type="checkbox" id="chk_billing_admin" style="width:18px; height:18px; cursor:pointer;" /> ${t.am_role_billing_admin}
                </label>
                <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer; font-size:0.92rem; color:var(--text-main);">
                  <input type="checkbox" id="chk_developer" style="width:18px; height:18px; cursor:pointer;" /> ${t.am_role_developer}
                </label>
                <div style="font-size:0.78rem; color:#94a3b8;">${t.am_role_hint}</div>
              </div>
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

      <!-- 子グループ作成モーダル -->
      ${Modal({
        id: 'create-child-group-modal',
        title: '子グループを作成',
        closeAction: "this.closest('.custom-modal').close()",
        children: html`
          <div style="display:flex; flex-direction:column; gap:1.25rem;">
            <div>
              <label class="${formLabel}">子グループ名</label>
              <input type="text" id="ccg-name" class="${dateInput}" placeholder="例: 営業第一課" />
            </div>
            <div>
              <label class="${formLabel}">グループ管理者</label>
              <div style="font-size:0.8rem; color:var(--text-sub); margin-bottom:0.4rem;">任命するユーザーを選択してください。</div>
              <select id="ccg-admin-user" class="${selectInput}">
                <option value="">ユーザーを選択</option>
                ${props.allUsers.map((u: any) => html`<option value="${u.id}">${u.name ? `${u.name} <${u.email}>` : u.email}</option>`)}
              </select>
            </div>
            <div style="margin-top:0.5rem;">
              ${Button({ onclick: "createChildGroup()", children: html`<span class="material-symbols-outlined">domain_add</span> 作成する` })}
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

      <!-- 権限申請の却下理由モーダル -->
      ${Modal({
        id: 'ra-reject-modal',
        title: html`<span style="color:#b91c1c; display:flex; align-items:center; gap:0.5rem;"><span class="material-symbols-outlined">block</span>${t.ra_reject_title}</span>`,
        closeAction: "this.closest('.custom-modal').close()",
        children: html`
          <div style="display:flex; flex-direction:column; gap:1rem;">
            <p style="color:#475569; font-size:0.92rem; line-height:1.5;">${t.ra_reject_desc}</p>
            <textarea id="ra-reject-reason" class="${dateInput}" style="min-height:90px;" placeholder="${t.ra_reject_placeholder}"></textarea>
            <div style="display:flex; justify-content:flex-end; gap:0.75rem;">
              <button type="button" onclick="this.closest('.custom-modal').close()" style="background:transparent;color:#64748b;border:1px solid #cbd5e1;border-radius:8px;padding:0.5rem 1rem;font-weight:600;cursor:pointer;">${t.cancel}</button>
              <button type="button" onclick="executeRejectRole()" style="background:#ef4444;color:white;border:none;border-radius:8px;padding:0.5rem 1rem;font-weight:700;cursor:pointer;">${t.ra_reject_submit}</button>
            </div>
          </div>
        `
      })}

      <!-- サービスタグ管理モーダル -->
      ${Modal({
        id: 'manage-tags-modal',
        title: html`<span style="display:flex; align-items:center; gap:0.5rem;"><span class="material-symbols-outlined">local_offer</span> タグ管理 - <span id="mt-service-name"></span></span>`,
        closeAction: "this.closest('.custom-modal').close()",
        children: html`
          <div style="display:flex; flex-direction:column; gap:1.25rem;">
            <!-- 現在適用されているタグ -->
            <div id="mt-applied-tags" style="display:flex; flex-wrap:wrap; gap:0.5rem; padding: 0.75rem; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; min-height: 50px;">
            </div>

            <hr style="border:none; border-top:1px solid #cbd5e1; margin: 0.5rem 0;" />

            <!-- システム管理者定義タグの適用 -->
            <div style="font-weight: 600; color: var(--text-main); font-size: 0.95rem;">利用可能なタグ</div>
            <div style="display:flex; gap:0.5rem;">
              <select id="mt-available-tags" class="${selectInput}" style="flex:1;">
              </select>
              ${Button({ onclick: "applyServiceTag()", children: html`<span class="material-symbols-outlined">add</span> 適用`, style: "width:auto;" })}
            </div>

            <div style="margin: 0.5rem 0; font-size:0.85rem; color:#64748b; text-align:center;">または</div>

            <!-- 独自タグの申請 -->
            <div style="font-weight: 600; color: var(--text-main); font-size: 0.95rem;">独自タグの申請</div>
            <div style="display:flex; gap:0.5rem;">
              <input type="text" id="mt-custom-tag-name" class="${dateInput}" placeholder="タグ名" style="flex:1;" />
              ${Button({ onclick: "requestCustomTag()", children: html`<span class="material-symbols-outlined">send</span> 申請`, style: "width:auto;" })}
            </div>
            <div style="font-size:0.78rem; color:#94a3b8; margin-top:-0.5rem;">※独自タグはシステム管理者の承認が必要です。</div>
          </div>
        `
      })}
`
