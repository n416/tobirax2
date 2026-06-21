import './types';
import type { GroupAdminPermission } from './types';

// アクセス権タブ(#tab-access)の描画。
// サーバは permissionsByGroup を渡し、init.ts が ga-perms-data から
// window.permsByGroup へパース済み。ここで perms-table-body を埋める。
// (従来このポータルでは renderPerms が未実装で、タブが「読込中...」のままだった)
window.renderPerms = function() {
    var el = document.getElementById('perms-table-body');
    if (!el) return;

    var list = window.permsByGroup && window.currentGroupId
        ? (window.permsByGroup[window.currentGroupId] || [])
        : [];

    if (list.length === 0) {
        el.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:2rem;">'
            + (window.i18n.noPerms || '(アクセス権なし)') + '</td></tr>';
        return;
    }

    el.innerHTML = list.map(function(p: GroupAdminPermission) {
        // 適用元バッジ: グループ共通権限か、ユーザー個別権限か。
        var isGroup = p.source === 'group';
        var srcColor = isGroup ? '#5b21b6' : '#475569';
        var srcBg = isGroup ? '#ede9fe' : '#f1f5f9';
        var srcLabel = isGroup
            ? (window.i18n.permSourceGroup || 'グループ共通')
            : (window.i18n.permSourceUser || '個別');
        var srcBadge = '<span style="font-size:0.72rem; font-weight:700; padding:2px 8px; border-radius:999px; color:'
            + srcColor + '; background:' + srcBg + ';">' + srcLabel + '</span>';

        return '<tr>'
            + '<td>' + window.escapeHtml(p.user_email || '') + '</td>'
            + '<td>' + window.escapeHtml(p.app_name || 'Unknown') + '</td>'
            + '<td>' + srcBadge + '</td>'
            + '<td style="font-size:0.85rem; color:#64748b;">' + window.fmt(p.valid_from) + ' ～ ' + window.fmt(p.valid_to) + '</td>'
            + '</tr>';
    }).join('');
};
