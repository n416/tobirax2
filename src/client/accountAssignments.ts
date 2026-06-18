/**
 * アカウント割当ページ用クライアントスクリプト。
 * サービス・施設・ロールの連動選択制御。
 */

declare global {
  interface Window {
    amRefreshRoles: () => void
  }
}

interface RoleOption {
  id: number
  service_id: string
  facility_type: string | null
  role_name: string
}

// HTMLエスケープ関数: innerHTML連結時にXSSを防止する
function escapeHtml(v: unknown): string {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const rolesEl = document.getElementById('roles-json');
const facUseEl = document.getElementById('facuse-json');
const i18nEl = document.getElementById('i18n-no-role');
const ROLES: RoleOption[] = rolesEl ? JSON.parse(rolesEl.textContent || '[]') : [];
const FAC_USE: Record<string, string> = facUseEl ? JSON.parse(facUseEl.textContent || '{}') : {};
const i18nNoRole: string = i18nEl ? JSON.parse(i18nEl.textContent || '""') : 'No role';

function refreshRoles(): void {
  const svc = document.getElementById('a-service') as HTMLSelectElement | null;
  const fac = document.getElementById('a-facility') as HTMLSelectElement | null;
  const role = document.getElementById('a-role') as HTMLSelectElement | null;
  if (!svc || !fac || !role) return;
  const use = FAC_USE[fac.value] || null;
  const matched = ROLES.filter((r) => r.service_id === svc.value && (r.facility_type == null || r.facility_type === use));
  role.innerHTML = '';
  const oNone = document.createElement('option');
  oNone.value = '';
  oNone.textContent = i18nNoRole;
  if (matched.length === 0) {
    oNone.selected = true;
  }
  role.appendChild(oNone);
  matched.forEach((r) => {
    const o = document.createElement('option');
    o.value = String(r.id);
    o.textContent = r.role_name;
    role.appendChild(o);
  });
}

window.amRefreshRoles = refreshRoles;

document.addEventListener('DOMContentLoaded', () => {
  const svc = document.getElementById('a-service');
  const fac = document.getElementById('a-facility');
  if (svc) svc.addEventListener('change', refreshRoles);
  if (fac) fac.addEventListener('change', refreshRoles);
  refreshRoles();
});

export {}
