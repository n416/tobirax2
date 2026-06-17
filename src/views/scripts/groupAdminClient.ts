// @ts-nocheck
// このファイルはクライアントサイドで実行されるJavaScriptです。
// コンパイル時に構文チェックを行うため、関数として定義し文字列化して配信します。

export const groupAdminClientScript = '(' + function() {
  // バンドラ(esbuild等)が自動挿入するデバッグ用関数への対策
  var __name = function(f) { return f; };



    (function() {
      var tab = 'members';
      try {
        var savedTab = localStorage.getItem('ga_current_tab');
        if (savedTab) tab = savedTab;
      } catch(e){}
      document.documentElement.setAttribute('data-active-tab', tab);
    })();
    (function() {
      var membersByGroup = null;
      var assignsByGroup = null;
      var permsByGroup = null;
      var grantsByGroup = null;
      var facilities = null;
      var rolesByService = null;
      var grantsDetailByGroup = null;
      var availableContracts = null;
      var childrenByGroup = null;
      var isBillingAdmin = window.__isBillingAdmin === true;
      var servicesByGroup = null;
      var appsByGroup = null;
      var approvedAppsByGroup = null;
      var appTagsByGroup = null;
      var customTagsByGroup = null;
      var availableTags = [];
      var currentTab = 'members';
      var currentGroupId = '';

      document.addEventListener('DOMContentLoaded', function() {
        try {
          var savedTab = localStorage.getItem('ga_current_tab');
          if (savedTab) currentTab = savedTab;
        } catch(e){}

        var md = document.getElementById('ga-members-data');
        var ad = document.getElementById('ga-assigns-data');
        var pd = document.getElementById('ga-perms-data');
        var gd = document.getElementById('ga-grants-data');
        var fd = document.getElementById('ga-facilities-data');
        var rd = document.getElementById('ga-roles-data');
        if (md) membersByGroup = JSON.parse(md.textContent);
        if (ad) assignsByGroup = JSON.parse(ad.textContent);
        if (pd) permsByGroup = JSON.parse(pd.textContent);
        if (gd) grantsByGroup = JSON.parse(gd.textContent);
        if (fd) facilities = JSON.parse(fd.textContent);
        if (rd) rolesByService = JSON.parse(rd.textContent);
        var grd = document.getElementById('ga-grants-detail-data');
        var ctd = document.getElementById('ga-contracts-data');
        if (grd) grantsDetailByGroup = JSON.parse(grd.textContent);
        if (ctd) availableContracts = JSON.parse(ctd.textContent);
        var chd = document.getElementById('ga-children-data');
        if (chd) childrenByGroup = JSON.parse(chd.textContent);
        var svd = document.getElementById('ga-services-data');
        var apd = document.getElementById('ga-apps-data');
        var aapd = document.getElementById('ga-approved-apps-data');
        if (svd) servicesByGroup = JSON.parse(svd.textContent);
        if (apd) appsByGroup = JSON.parse(apd.textContent);
        if (aapd) approvedAppsByGroup = JSON.parse(aapd.textContent);

        var atd = document.getElementById('ga-app-tags-data');
        var ctd2 = document.getElementById('ga-custom-tags-data');
        var avt = document.getElementById('ga-available-tags-data');
        if (atd) appTagsByGroup = JSON.parse(atd.textContent);
        if (ctd2) customTagsByGroup = JSON.parse(ctd2.textContent);
        if (avt) availableTags = JSON.parse(avt.textContent);

        var savedGroupId = null;
        try { savedGroupId = localStorage.getItem('ga_current_group_id'); } catch(e){}

        var sel = document.getElementById('group-select');
        var tsInstance = null;
        if (sel && typeof TomSelect !== 'undefined' && sel.tagName === 'SELECT') {
          tsInstance = new TomSelect('#group-select', {
            controlInput: '<input type="text" autocomplete="off" data-lpignore="true" data-1p-ignore="true" data-bwignore="true" />',
            create: false,
            sortField: { field: '$order' },
            searchField: ['text'],
            placeholder: '検索...',
            onChange: function(val) {
               currentGroupId = val;
               try { localStorage.setItem('ga_current_group_id', val); } catch(e){}
               renderAll();
            },
            render: {
              option: function(data, escape) {
                var depth = parseInt(data.depth || (data.$option && data.$option.getAttribute('data-depth')) || '0', 10);
                var origName = data.origname || (data.$option && data.$option.getAttribute('data-origname')) || data.text;
                var pad = depth * 1.5;
                var icon = depth > 0 ? '<span class="material-symbols-outlined" style="font-size:16px; color:#94a3b8; flex-shrink:0;">subdirectory_arrow_right</span>' : '';
                return '<div><div style="padding-left:' + pad + 'rem; display:flex; align-items:center; gap:0.4rem;">' + icon + '<span style="font-weight:' + (depth===0?'700':'500') + '; color:var(--text-main);">' + escape(origName) + '</span></div></div>';
              },
              item: function(data, escape) {
                var origName = data.origname || (data.$option && data.$option.getAttribute('data-origname')) || data.text;
                return '<div><div style="display:flex; align-items:center; gap:0.4rem; padding: 0 0.4rem;">' + escape(origName) + '</div></div>';
              }
            }
          });
        } else if (sel && sel.value) {
          // TomSelectが使えない環境用フォールバック
          sel.addEventListener('change', function(e) {
            currentGroupId = e.target.value;
            try { localStorage.setItem('ga_current_group_id', currentGroupId); } catch(e){}
            renderAll();
          });
        }
        
        // 初期描画用
        if (savedGroupId && sel && sel.querySelector('option[value="' + savedGroupId + '"]')) {
          if (tsInstance) {
            tsInstance.setValue(savedGroupId); // onChangeが発火してcurrentGroupIdがセットされる
          } else {
            sel.value = savedGroupId;
            currentGroupId = savedGroupId;
            renderAll();
          }
        } else {
          var initialVal = sel ? sel.value : null;
          if (initialVal) {
            currentGroupId = initialVal;
            renderAll();
          }
        }
        window.switchTab(currentTab);
        
        if (typeof TomSelect !== 'undefined') {
          var el = document.getElementById('m-user-id');
          if (el) {
            window.tsCtrl = new TomSelect('#m-user-id', { controlInput: '<input type="text" autocomplete="off" data-lpignore="true" data-1p-ignore="true" data-bwignore="true" />', plugins: ['remove_button'], create: false, maxItems: null });
          }
        }

        // 承認待ちの権限申請(自分が決裁権者/運営として処理できるもの)を読み込む。
        if (window.loadRoleApprovals) window.loadRoleApprovals();
      });

      window.switchGroup = function() {
        // (TomSelectのonChangeに委譲したため、HTMLのonchange属性から呼ばれる場合のフォールバック)
        var sel = document.getElementById('group-select');
        if(sel) {
           currentGroupId = sel.value;
           try { localStorage.setItem('ga_current_group_id', currentGroupId); } catch(e){}
           renderAll();
        }
      };

      window.switchTab = function(tab) {
        // 利用枠タブは決済権者のみ。非表示時に保存タブが 'grants' でもメンバータブへ退避する。
        if (tab === 'grants' && !isBillingAdmin) tab = 'members';
        currentTab = tab;
        try { localStorage.setItem('ga_current_tab', tab); } catch(e){}
        document.documentElement.setAttribute('data-active-tab', tab);
      };

      function renderAll() {
        renderMembers();
        renderAssignments();
        renderGrants();
        renderPerms();
        renderServices();
        renderApps();
        if (typeof renderFacilities === 'function') renderFacilities();
        if (typeof renderDeveloperUI === 'function') renderDeveloperUI();
      }

      var pendingConfirmCallback = null;
      window.showConfirm = function(message, callback) {
        var modal = document.getElementById('custom-confirm-modal');
        var msgEl = document.getElementById('custom-confirm-message');
        var execBtn = document.getElementById('custom-confirm-execute-btn');
        if (modal && msgEl && execBtn) {
          msgEl.innerText = message;
          pendingConfirmCallback = callback;
          execBtn.onclick = function() {
            var cb = pendingConfirmCallback;
            closeConfirmModal();
            if (cb) cb();
          };
          modal.showModal();
        }
      };
      window.closeConfirmModal = function() {
        var modal = document.getElementById('custom-confirm-modal');
        if (modal) modal.close();
        pendingConfirmCallback = null;
      };

      var devStatuses = null;
      window.renderDeveloperUI = function() {
        var dsd = document.getElementById('ga-dev-status-data');
        if (!devStatuses && dsd) devStatuses = JSON.parse(dsd.textContent);
        
        var ds = devStatuses && currentGroupId ? devStatuses[currentGroupId] : null;
        var status = ds ? ds.status : 'none';
        var noDev = document.getElementById('dev-not-approved');
        var devUi = document.getElementById('dev-approved');
        var pendingUi = document.getElementById('dev-pending');

        if (status === 'approved') {
          if(noDev) noDev.style.display = 'none';
          if(pendingUi) pendingUi.style.display = 'none';
          if(devUi) devUi.style.display = 'block';
        } else if (status === 'pending') {
          if(noDev) noDev.style.display = 'none';
          if(pendingUi) pendingUi.style.display = 'block';
          if(devUi) devUi.style.display = 'none';
        } else {
          if(noDev) noDev.style.display = 'block';
          if(pendingUi) pendingUi.style.display = 'none';
          if(devUi) devUi.style.display = 'none';
          var rejectMsg = document.getElementById('dev-rejected-msg');
          if (rejectMsg) {
            rejectMsg.style.display = status === 'rejected' ? 'flex' : 'none';
            if (status === 'rejected') {
              var el = document.getElementById('dev-rejected-reason-text');
              if (el) el.innerText = ds.admin_reason || '事由なし';
            }
          }
          var revokedMsg = document.getElementById('dev-revoked-msg');
          if (revokedMsg) {
            revokedMsg.style.display = status === 'revoked' ? 'flex' : 'none';
            if (status === 'revoked') {
              var el2 = document.getElementById('dev-revoked-reason-text');
              if (el2) el2.innerText = ds.admin_reason || '事由なし';
            }
          }
        }
      };

      window.applyDeveloper = function() {
        var reason = (document.getElementById('dev-apply-reason') || {}).value;
        if (!reason || !reason.trim()) { console.error('申請理由を入力してください'); return; }
        fetch('/group-admin/api/roles/apply', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ group_id: currentGroupId, role_type: 'developer', reason: reason.trim() })
        }).then(function(r){ if (!r.ok) throw new Error('Error ' + r.status); return r.json(); })
          .then(function(){ window.location.reload(); })
          .catch(function(e){ console.error('Error: ' + e.message); });
      };

      // ===== 権限申請の承認/却下(決裁権者・運営) =====
      function roleTypeLabel(rt) {
        if (rt === 'billing_admin') return window.i18n.roleBilling || '決裁権者';
        if (rt === 'group_admin') return window.i18n.roleAdmin || 'グループ管理者';
        if (rt === 'developer') return window.i18n.roleDeveloper || '開発者';
        return rt;
      }
      window.loadRoleApprovals = function() {
        var card = document.getElementById('role-approvals-card');
        var body = document.getElementById('role-approvals-body');
        if (!card || !body) return;
        fetch('/group-admin/api/roles/applications', { headers: { 'Accept': 'application/json' } })
          .then(function(r){ return r.ok ? r.json() : { applications: [] }; })
          .then(function(d){
            var apps = (d && d.applications) ? d.applications : [];
            if (apps.length === 0) { card.style.display = 'none'; return; }
            card.style.display = '';
            body.innerHTML = apps.map(function(a){
              var who = a.user_name ? (a.user_name + ' <' + a.user_email + '>') : a.user_email;
              var reason = a.reason ? a.reason : '(理由なし)';
              return '<div style="border:1px solid #e2e8f0; border-radius:10px; padding:0.85rem 1rem; margin-bottom:0.75rem; background:white;">'
                + '<div style="display:flex; justify-content:space-between; gap:0.75rem; flex-wrap:wrap; align-items:flex-start;">'
                +   '<div style="min-width:0;">'
                +     '<div style="font-weight:700; color:#0f172a;">' + who + '</div>'
                +     '<div style="font-size:0.82rem; color:#64748b; margin-top:0.15rem;">' + (a.group_name || a.group_id) + ' ・ <span style="font-weight:700; color:#5b21b6;">' + roleTypeLabel(a.role_type) + '</span></div>'
                +     '<div style="font-size:0.88rem; color:#334155; margin-top:0.5rem; white-space:pre-wrap;">' + reason + '</div>'
                +   '</div>'
                +   '<div style="display:flex; gap:0.5rem; flex-shrink:0;">'
                +     '<button type="button" onclick="approveRole(' + a.id + ')" style="background:#10b981; color:white; border:none; border-radius:8px; padding:0.45rem 0.85rem; font-weight:700; cursor:pointer;">' + (window.i18n.raApprove || '承認') + '</button>'
                +     '<button type="button" onclick="openRejectRole(' + a.id + ')" style="background:transparent; color:#b91c1c; border:1px solid #fecaca; border-radius:8px; padding:0.45rem 0.85rem; font-weight:700; cursor:pointer;">' + (window.i18n.raReject || '却下') + '</button>'
                +   '</div>'
                + '</div>'
                + '</div>';
            }).join('');
          })
          .catch(function(){ card.style.display = 'none'; });
      };
      window.approveRole = function(id) {
        fetch('/group-admin/api/roles/approve', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ application_id: id })
        }).then(function(r){ if (!r.ok) throw new Error('Error ' + r.status); return r.json(); })
          .then(function(){ window.location.reload(); })
          .catch(function(e){ console.error('Error: ' + e.message); });
      };
      var rejectRoleTargetId = null;
      window.openRejectRole = function(id) {
        rejectRoleTargetId = id;
        var ta = document.getElementById('ra-reject-reason'); if (ta) ta.value = '';
        var m = document.getElementById('ra-reject-modal'); if (m) m.showModal();
      };
      window.executeRejectRole = function() {
        if (!rejectRoleTargetId) return;
        var reason = (document.getElementById('ra-reject-reason') || {}).value || '';
        fetch('/group-admin/api/roles/reject', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ application_id: rejectRoleTargetId, admin_reason: reason })
        }).then(function(r){ if (!r.ok) throw new Error('Error ' + r.status); return r.json(); })
          .then(function(){ window.location.reload(); })
          .catch(function(e){ console.error('Error: ' + e.message); });
      };

      window.manageServiceApps = function(serviceId, serviceNameEnc) {
          var services = (servicesByGroup && servicesByGroup[currentGroupId]) ? servicesByGroup[currentGroupId] : [];
          var s = services.find(function(x){ return x.id === serviceId; });
          if (!s) return;
          var availableApps = (approvedAppsByGroup && approvedAppsByGroup[currentGroupId]) ? approvedAppsByGroup[currentGroupId] : [];
          if (window.openServiceAppsModal) {
            window.openServiceAppsModal(encodeURIComponent(JSON.stringify(s)), availableApps);
          }
        };

      var currentManageRolesServiceId = null;
      window.manageRoles = function(serviceId, serviceNameEnc) {
        currentManageRolesServiceId = serviceId;
        var m = document.getElementById('manage-roles-modal');
        var titleEl = document.getElementById('mr-service-name');
        if (titleEl) titleEl.innerText = decodeURIComponent(serviceNameEnc);
        
        var roleListEl = document.getElementById('mr-role-list');
        var roles = (rolesByService && rolesByService[serviceId]) ? rolesByService[serviceId] : [];
        if (roles.length === 0) {
          roleListEl.innerHTML = '<div style="color:#94a3b8; font-size:0.9rem;">登録されている役割はありません。</div>';
        } else {
          roleListEl.innerHTML = roles.map(function(r) {
            return '<div style="display:flex; justify-content:space-between; align-items:center; padding:0.5rem; border-bottom:1px solid #f1f5f9;">'
                 + '<div><strong>' + r.role_name + '</strong> <span style="color:#64748b; font-size:0.8rem;">[' + r.role_code + ']</span>'
                 + (r.facility_type ? ' <span style="font-size:0.75rem; color:#0f172a; background:#e2e8f0; padding:2px 6px; border-radius:4px;">' + r.facility_type + '</span>' : '')
                 + '</div>'
                 + '<button type="button" onclick="removeRole(' + r.id + ')" class="material-symbols-outlined" style="color:#ef4444; background:none; border:none; cursor:pointer; font-size:18px;">delete</button>'
                 + '</div>';
          }).join('');
        }
        ['mr-role-name','mr-role-code'].forEach(function(id){ var e=document.getElementById(id); if(e) e.value=''; });
        var facEl = document.getElementById('mr-facility-type');
        if(facEl) facEl.value = '';
        if (m) m.showModal();
      };
      
      window.addRole = function() {
        var rn = document.getElementById('mr-role-name').value;
        var rc = document.getElementById('mr-role-code').value;
        var ft = (document.getElementById('mr-facility-type') || {}).value;
        if (!rn || !rc) { console.error('役割名とロールコードは必須です'); return; }
        fetch('/group-admin/api/roles/add', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ service_id: currentManageRolesServiceId, role_name: rn.trim(), role_code: rc.trim(), facility_type: ft || null })
        }).then(function(r){ if (!r.ok) throw new Error('Error ' + r.status); return r.json(); })
          .then(function(){ window.location.reload(); })
          .catch(function(e){ console.error('Error: ' + e.message); });
      };

      window.removeRole = function(id) {
        showConfirm('この役割を削除しますか？', function() {
          fetch('/group-admin/api/roles/remove', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
          }).then(function(r){ if (!r.ok) throw new Error('Error ' + r.status); return r.json(); })
            .then(function(){ window.location.reload(); })
            .catch(function(e){ console.error('Error: ' + e.message); });
        });
      };

      function fmt(ts) {
        if (!ts) return '—';
        if (ts > 2000000000) return '無期限';
        return new Date(ts * 1000).toLocaleDateString();
      }

      function renderMembers() {
        var el = document.getElementById('members-table-body');
        if (!el) return;
        var list = membersByGroup && currentGroupId ? (membersByGroup[currentGroupId] || []) : [];
        if (list.length === 0) {
          el.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:2rem;">' + (window.i18n.noMembers || '(メンバーなし)') + '</td></tr>';
          return;
        }
        el.innerHTML = list.map(function(m) {
          // 兼任可能なので、保持しているフラグごとにバッジを並べる。すべて 0 ならメンバー。
          function badge(color, bg, label) {
            return '<span style="font-size:0.72rem; font-weight:700; padding:2px 8px; border-radius:999px; color:' + color + '; background:' + bg + '; margin-right:4px;">' + label + '</span>';
          }
          var badges = [];
          if (m.is_billing_admin) badges.push(badge('#5b21b6', '#ede9fe', window.i18n.roleBilling || '決裁権者'));
          if (m.is_group_admin) badges.push(badge('#9a3412', '#ffedd5', window.i18n.roleAdmin || 'グループ管理者'));
          if (m.is_developer) badges.push(badge('#0e7490', '#cffafe', window.i18n.roleDeveloper || '開発者'));
          if (badges.length === 0) badges.push(badge('#475569', '#f1f5f9', window.i18n.roleMember || 'メンバー'));
          var badgeHtml = badges.join('');
          var displayName = m.name || m.email;
          var subEmail = m.name ? ('<div style="font-size:0.8rem; color:#94a3b8;">' + m.email + '</div>') : '';
          return '<tr>'
            + '<td><div>' + displayName + '</div>' + subEmail + '</td>'
            + '<td>' + badgeHtml + '</td>'
            + '<td style="font-size:0.85rem; color:#64748b;">' + fmt(m.valid_from) + ' ～ ' + fmt(m.valid_to) + '</td>'
            + '<td style="text-align:right;"><button type="button" onclick="removeMember(' + m.id + ')" style="background:transparent;border:none;color:#94a3b8;cursor:pointer;padding:7px;border-radius:50%;width:34px;height:34px;display:inline-flex;align-items:center;justify-content:center;transition:all 0.2s;" onmouseover="this.style.background=\'#fef2f2\';this.style.color=\'#ef4444\';" onmouseout="this.style.background=\'transparent\';this.style.color=\'#94a3b8\';"><span class="material-symbols-outlined" style="font-size:18px;">person_remove</span></button></td>'
            + '</tr>';
        }).join('');
      }

      // 指定グループが「直接の子グループ」へ配分した同一サービスの席数合計。
      //   実効上限(自グループで使える枠)= 親の枠 - この合計、の計算に使う(createAssignment と一致)。
      function childDistributedSeats(groupId, serviceId) {
        var kids = (childrenByGroup && childrenByGroup[groupId]) ? childrenByGroup[groupId] : [];
        var sum = 0;
        kids.forEach(function(ch) {
          var cg = (grantsDetailByGroup && grantsDetailByGroup[ch.id]) ? grantsDetailByGroup[ch.id] : [];
          cg.forEach(function(g) { if (g.service_id === serviceId && g.seat_limit != null) sum += g.seat_limit; });
        });
        return sum;
      }

      function renderAssignments() {
        var summaryEl = document.getElementById('assigns-summary');
        var list = assignsByGroup && currentGroupId ? (assignsByGroup[currentGroupId] || []) : [];
        var grants = grantsDetailByGroup && currentGroupId ? (grantsDetailByGroup[currentGroupId] || []) : [];

        var btnWrap = document.getElementById('btn-add-assign-wrap');
        if (btnWrap) {
          btnWrap.style.display = grants.length === 0 ? 'none' : 'flex';
        }

        if (summaryEl) {
          if (grants.length === 0) {
            summaryEl.innerHTML = '';
            summaryEl.style.display = 'none';
          } else {
            summaryEl.style.display = 'grid';
            var htmlStr = '';
            grants.forEach(function(g) {
              var usedUsers = {};
              list.forEach(function(a) {
                if (a.service_id === g.service_id) {
                  usedUsers[a.user_id] = true;
                }
              });
              var usedCount = Object.keys(usedUsers).length;
              // 実効上限 = 自グループの枠 - 子グループへ配分した同一サービスの枠。
              var childSeats = childDistributedSeats(currentGroupId, g.service_id);
              var effLimit = (g.seat_limit == null) ? null : Math.max(0, g.seat_limit - childSeats);
              var limitStr = (effLimit == null) ? '無制限' : effLimit;
              var isFull = (effLimit != null && usedCount >= effLimit);
              var remainingStr = (effLimit == null) ? '上限なし' : ('残り ' + (effLimit - usedCount) + ' 枠');
              var barPercent = (effLimit == null || effLimit === 0) ? 0 : Math.min(100, Math.round((usedCount / effLimit) * 100));
              var barColor = isFull ? '#ef4444' : '#10b981';
              htmlStr += '<div style="background:white; border:1px solid #e2e8f0; border-radius:8px; padding:1rem; box-shadow:0 1px 2px rgba(0,0,0,0.05);">'
                + '<div style="font-size:0.85rem; color:#64748b; font-weight:600; margin-bottom:0.5rem; display:flex; justify-content:space-between;">'
                + '<span>' + g.service_name + '</span><span style="color:' + (isFull ? '#ef4444' : '#64748b') + ';">' + remainingStr + '</span>'
                + '</div>'
                + '<div style="font-size:1.25rem; font-weight:800; color:#0f172a; margin-bottom:0.5rem;">' + usedCount + ' <span style="font-size:0.85rem; font-weight:500; color:#64748b;">/ ' + limitStr + ' 消費</span></div>'
                + '<div style="width:100%; background:#f1f5f9; border-radius:999px; height:6px; overflow:hidden;">'
                + '<div style="height:100%; background:' + barColor + '; width:' + barPercent + '%;"></div>'
                + '</div>'
                + '</div>';
            });
            summaryEl.innerHTML = htmlStr;
          }
        }

        var el = document.getElementById('assigns-table-body');
        if (!el) return;
        if (list.length === 0) {
          el.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#94a3b8; padding:2rem;">' + (window.i18n.noAssignments || '割当がありません') + '</td></tr>';
          return;
        }
        el.innerHTML = list.map(function(a) {
          var facility = a.structure_no || a.facility_id || '-';
          if (a.building_use) facility += ' (' + a.building_use + ')';
          var roleName = a.role_name || '-';
          var user = a.user_name || a.user_email;
          return '<tr>'
            + '<td>' + user + (a.user_name ? '<div style="font-size:0.8rem;color:#94a3b8;">' + a.user_email + '</div>' : '') + '</td>'
            + '<td style="font-size:0.88rem;">' + a.service_name + '</td>'
            + '<td style="font-size:0.85rem; color:#64748b;">' + facility + '</td>'
            + '<td style="font-size:0.85rem;">' + roleName + '</td>'
            + '<td style="font-size:0.82rem; color:#94a3b8;">' + fmt(a.valid_from) + ' ～ ' + fmt(a.valid_to) + '</td>'
            + '<td style="text-align:right;"><button type="button" onclick="removeAssignment(' + a.id + ')" style="background:transparent;border:none;color:#94a3b8;cursor:pointer;padding:7px;border-radius:50%;width:34px;height:34px;display:inline-flex;align-items:center;justify-content:center;transition:all 0.2s;" onmouseover="this.style.background=\'#fef2f2\';this.style.color=\'#ef4444\';" onmouseout="this.style.background=\'transparent\';this.style.color=\'#94a3b8\';"><span class="material-symbols-outlined" style="font-size:18px;">delete</span></button></td>'
            + '</tr>';
        }).join('');
      }

      function renderPerms() {
        var el = document.getElementById('perms-table-body');
        if (!el) return;
        var list = permsByGroup && currentGroupId ? (permsByGroup[currentGroupId] || []) : [];
        if (list.length === 0) {
          el.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:2rem;">' + (window.i18n.noAccess || 'アクセス権がありません') + '</td></tr>';
          return;
        }
        el.innerHTML = list.map(function(p) {
          var srcLabel = p.source === 'user' ? (window.i18n.srcUser || 'ユーザー個別') : (window.i18n.srcGroup || 'グループ');
          var srcColor = p.source === 'user' ? '#1d4ed8' : '#047857';
          var srcBg = p.source === 'user' ? '#dbeafe' : '#d1fae5';
          return '<tr>'
            + '<td style="font-size:0.88rem;">' + p.user_email + '</td>'
            + '<td><strong>' + p.app_name + '</strong></td>'
            + '<td><span style="font-size:0.75rem; font-weight:700; padding:2px 8px; border-radius:999px; color:' + srcColor + '; background:' + srcBg + ';">' + srcLabel + '</span></td>'
            + '<td style="font-size:0.82rem; color:#94a3b8;">' + fmt(p.valid_from) + ' ～ ' + fmt(p.valid_to) + '</td>'
            + '</tr>';
        }).join('');
      }

      var removeTargetId = null;
      window.removeMember = function(mid) {
        showConfirm(window.i18n.amConfirmRemove || 'このメンバーを削除しますか？', function() {
          fetch('/group-admin/api/member/remove', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: id }) })
            .then(function(r){ if (!r.ok) throw new Error('Error ' + r.status); return r.json(); })
            .then(function(){ window.location.reload(); })
            .catch(function(e){ console.error('Error: ' + e.message); });
        });
      };
      window.closeRemoveModal = function() {
        var m = document.getElementById('remove-confirm-modal');
        if (m) m.close();
        removeTargetId = null;
      };
      window.executeRemove = function() {
        if (!removeTargetId) return;
        fetch('/group-admin/api/membership/remove', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: removeTargetId }) })
          .then(function(r) { if (!r.ok) throw new Error('Error ' + r.status); return r.json(); })
          .then(function() {
            window.closeRemoveModal();
            // ローカルデータからも削除してリレンダー
            if (membersByGroup && currentGroupId) {
              membersByGroup[currentGroupId] = (membersByGroup[currentGroupId] || []).filter(function(m) { return m.id !== removeTargetId; });
            }
            removeTargetId = null;
            renderMembers();
          })
          .catch(function(e) { console.error('Error: ' + e.message); });
      };

      // ==========================
      // 施設の管理 (Facilities)
      // ==========================

      var tsControlMoveFacility = null;

      window.loadAllFacilitiesForMove = function(groupIdToExclude) {
          fetch('/group-admin/api/facilities/all')
              .then(function(r) { return r.json(); })
              .then(function(facs) {
                  var selEl = document.getElementById('f-move-id');
                  if (!selEl) return;
                  var filtered = facs.filter(function(f) { return f.managing_group_id !== groupIdToExclude; });
                  
                  if (!tsControlMoveFacility && typeof TomSelect !== 'undefined') {
                      tsControlMoveFacility = new TomSelect('#f-move-id', {
                          valueField: 'id',
                          labelField: 'label',
                          searchField: ['label'],
                          options: filtered.map(function(f) {
                              var gName = f.group_name || 'Unknown Group';
                              var lbl = (f.structure_no || f.id) + (f.building_use ? ' (' + f.building_use + ')' : '') + ' - [' + gName + ']';
                              return { id: f.id, label: lbl };
                          }),
                          create: false,
                          placeholder: '施設を選択...'
                      });
                  } else if (tsControlMoveFacility) {
                      tsControlMoveFacility.clearOptions();
                      tsControlMoveFacility.addOptions(filtered.map(function(f) {
                          var gName = f.group_name || 'Unknown Group';
                          var lbl = (f.structure_no || f.id) + (f.building_use ? ' (' + f.building_use + ')' : '') + ' - [' + gName + ']';
                          return { id: f.id, label: lbl };
                      }));
                      tsControlMoveFacility.refreshOptions(false);
                  }
              })
              .catch(function(e) { console.error('Failed to load facilities for move', e); });
      };

      window.renderFacilities = function() {
        if (!currentGroupId) return;
        
        // 移動用プルダウンの更新
        if (window.loadAllFacilitiesForMove) {
            window.loadAllFacilitiesForMove(currentGroupId);
        }

        var el = document.getElementById('facilities-table-body');
        if (!el) return;
        
        var list = (facilities || []).filter(function(f) { return f.managing_group_id === currentGroupId; });
        
        if (list.length === 0) {
          el.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#94a3b8; padding:2rem;">登録されている施設はありません</td></tr>';
          return;
        }
        
        el.innerHTML = list.map(function(f) {
          var fNo = f.structure_no || f.id;
          var fUse = f.building_use || '—';
          return '<tr>'
            + '<td>' + fNo + '</td>'
            + '<td>' + fUse + '</td>'
            + '<td style="text-align:right;">'
            + '<button type="button" onclick="removeFacility(' + "'" + f.id + "'" + ')" style="background:transparent;border:none;color:#94a3b8;cursor:pointer;padding:7px;border-radius:50%;width:34px;height:34px;display:inline-flex;align-items:center;justify-content:center;transition:all 0.2s;" onmouseover="this.style.background=' + "'#fef2f2'" + ';this.style.color=' + "'#ef4444'" + ';" onmouseout="this.style.background=' + "'transparent'" + ';this.style.color=' + "'#94a3b8'" + ';"><span class="material-symbols-outlined" style="font-size:18px;">delete</span></button>'
            + '</td>'
            + '</tr>';
        }).join('');
      };

      window.addFacility = function() {
          if (!currentGroupId) return;
          var sno = document.getElementById('f-structure-no').value;
          var use = document.getElementById('f-building-use').value;
          fetch('/group-admin/api/facility/add', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ managing_group_id: currentGroupId, structure_no: sno, building_use: use })
          })
          .then(function(r) { if (!r.ok) throw new Error('Error ' + r.status); return r.json(); })
          .then(function(data) {
              if (data.error) throw new Error(data.error);
              window.location.reload();
          })
          .catch(function(e) { console.error('Error:', e.message); });
      };

      window.moveFacility = function() {
          if (!currentGroupId) return;
          var fid = tsControlMoveFacility ? tsControlMoveFacility.getValue() : document.getElementById('f-move-id').value;
          if (!fid) return;
          fetch('/group-admin/api/facility/move', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ facility_id: fid, managing_group_id: currentGroupId })
          })
          .then(function(r) { if (!r.ok) throw new Error('Error ' + r.status); return r.json(); })
          .then(function(data) {
              if (data.error) throw new Error(data.error);
              window.location.reload();
          })
          .catch(function(e) { console.error('Error:', e.message); });
      };

      window.removeFacility = function(fid) {
          showConfirm('この施設を削除しますか？\n※すでに割当等で利用されている場合は削除できません。', function() {
              fetch('/group-admin/api/facility/remove', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id: fid })
              })
              .then(function(r) { return r.json(); })
              .then(function(data) {
                  if (data.error) {
                      alert('エラー: ' + data.error);
                  } else {
                      window.location.reload();
                  }
              })
              .catch(function(e) { console.error('Error:', e.message); });
          });
      };

      window.addMember = function() {
        var userIds = window.tsCtrl ? window.tsCtrl.getValue() : [];
        if (!Array.isArray(userIds)) userIds = [userIds];
        userIds = userIds.filter(function(id) { return id; });
        if (!userIds.length) { console.error('ユーザーを選択してください'); return; }
        var isGroupAdmin = !!(document.getElementById('chk_group_admin') || {}).checked;
        var isBillingAdmin = !!(document.getElementById('chk_billing_admin') || {}).checked;
        var isDeveloper = !!(document.getElementById('chk_developer') || {}).checked;
        var startVal = document.getElementById('m-valid-from').value;
        var endVal = document.getElementById('m-valid-to').value;
        var validFrom = startVal ? Math.floor(new Date(startVal).getTime()/1000) : Math.floor(Date.now()/1000);
        var validTo = endVal ? Math.floor(new Date(endVal).getTime()/1000) : Math.floor(Date.now()/1000) + 315360000;
        fetch('/group-admin/api/membership/add', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            group_id: currentGroupId,
            user_ids: userIds,
            is_group_admin: isGroupAdmin ? 1 : 0,
            is_billing_admin: isBillingAdmin ? 1 : 0,
            is_developer: isDeveloper ? 1 : 0,
            valid_from: validFrom,
            valid_to: validTo
          })
        })
        .then(function(r) { 
           if(!r.ok) {
              return r.json().catch(function(){ return {}; }).then(function(err) { throw new Error(err.error || 'Error ' + r.status); });
           }
           return r.json(); 
        })
        .then(function() {
          window.location.reload(); 
        })
        .catch(function(e) { console.error('Error: ' + e.message); alert(e.message); });
      };

      window.openCreateChildGroupModal = function() {
        var m = document.getElementById('create-child-group-modal');
        if (m) m.showModal();
        var nameEl = document.getElementById('ccg-name'); if (nameEl) nameEl.value = '';
        var adminEl = document.getElementById('ccg-admin-user'); if (adminEl) adminEl.value = '';
      };

      window.createChildGroup = function() {
        if (!currentGroupId) return;
        var name = (document.getElementById('ccg-name') || {}).value;
        var adminUserId = (document.getElementById('ccg-admin-user') || {}).value;
        if (!name || !name.trim()) { console.error('グループ名を入力してください'); return; }
        if (!adminUserId) { console.error('管理者を選択してください'); return; }
        fetch('/group-admin/api/group/create', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parent_group_id: currentGroupId, name: name.trim(), admin_user_id: adminUserId })
        })
        .then(function(r) { if (!r.ok) throw new Error('Error ' + r.status); return r.json(); })
        .then(function() { window.location.reload(); })
        .catch(function(e) { console.error('Error: ' + e.message); });
      };

      window.openAddModal = function() {
        var m = document.getElementById('add-member-modal');
        if (m) m.showModal();
        if (window.tsCtrl) window.tsCtrl.clear();
        ['chk_group_admin','chk_billing_admin','chk_developer'].forEach(function(id){ var e=document.getElementById(id); if(e) e.checked=false; });
        var vf = document.getElementById('m-valid-from'); if(vf) vf.value = new Date().toISOString().split('T')[0];
        var vt = document.getElementById('m-valid-to'); if(vt) vt.value = '';
      };

      // ===== ゲート③ 割当の作成/解除(委任) =====
      function fillSelect(el, items, valueKey, textKey, placeholder) {
        if (!el) return;
        var html = '<option value="">' + placeholder + '</option>';
        items.forEach(function(it) { html += '<option value="' + it[valueKey] + '">' + it[textKey] + '</option>'; });
        el.innerHTML = html;
      }

      window.refreshAssignRoles = function() {
        var svcEl = document.getElementById('a-service');
        var facEl = document.getElementById('a-facility');
        var roleEl = document.getElementById('a-role');
        if (!svcEl || !facEl || !roleEl) return;
        var serviceId = svcEl.value;
        var facId = facEl.value;
        var buildingUse = null;
        if (facId && facilities) {
          for (var i = 0; i < facilities.length; i++) { if (facilities[i].id === facId) { buildingUse = facilities[i].building_use; break; } }
        }
        var roles = (serviceId && rolesByService) ? (rolesByService[serviceId] || []) : [];
        // 役割マスタは facility_type=NULL(全種別) か、選択建物の用途に一致するものだけ出す。
        var filtered = roles.filter(function(r) { return r.facility_type == null || r.facility_type === buildingUse; });
        fillSelect(roleEl, filtered.map(function(r){ return { id: r.id, role_name: r.role_name }; }), 'id', 'role_name', '役割なし (None)');
      };

      window.openAssignModal = function() {
        if (!currentGroupId) return;
        var m = document.getElementById('add-assign-modal');
        // ユーザー= 現グループのメンバー、サービス= 現グループの利用枠、施設= 管理サブツリー配下。
        var members = (membersByGroup && membersByGroup[currentGroupId]) ? membersByGroup[currentGroupId] : [];
        var grants = (grantsByGroup && grantsByGroup[currentGroupId]) ? grantsByGroup[currentGroupId] : [];
        fillSelect(document.getElementById('a-user'), members.map(function(x){ return { user_id: x.user_id, label: (x.name ? x.name + ' <' + x.email + '>' : x.email) }; }), 'user_id', 'label', window.i18n.selectUser || '利用者を選択');
        fillSelect(document.getElementById('a-service'), grants, 'service_id', 'service_name', window.i18n.selectService || 'サービスを選択');
        var facList = (facilities || []).map(function(f){ var lbl = (f.structure_no || f.id) + (f.building_use ? ' (' + f.building_use + ')' : ''); return { id: f.id, label: lbl }; });
        fillSelect(document.getElementById('a-facility'), facList, 'id', 'label', '施設指定なし (No facility)');
        var roleEl = document.getElementById('a-role');
        if (roleEl) roleEl.innerHTML = '<option value="">役割なし (None)</option>';
        var vf = document.getElementById('a-valid-from'); if (vf) vf.value = new Date().toISOString().split('T')[0];
        var vt = document.getElementById('a-valid-to'); if (vt) vt.value = '';
        var warn = document.getElementById('a-no-grant'); if (warn) warn.style.display = grants.length === 0 ? '' : 'none';
        if (m) m.showModal();
      };

      window.addAssignment = function() {
        var userId = (document.getElementById('a-user') || {}).value;
        var serviceId = (document.getElementById('a-service') || {}).value;
        var facilityId = (document.getElementById('a-facility') || {}).value;
        var roleId = (document.getElementById('a-role') || {}).value;
        var sv = document.getElementById('a-valid-from').value;
        var ev = document.getElementById('a-valid-to').value;
        if (!userId || !serviceId) { console.error(window.i18n.selectAll || '全項目を選択してください'); return; }
        var validFrom = sv ? Math.floor(new Date(sv).getTime()/1000) : Math.floor(Date.now()/1000);
        var validTo = ev ? Math.floor(new Date(ev).getTime()/1000) : Math.floor(Date.now()/1000) + 315360000;
        fetch('/group-admin/api/assignment/add', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ group_id: currentGroupId, user_id: userId, service_id: serviceId, facility_id: facilityId, service_role_id: roleId ? Number(roleId) : null, valid_from: validFrom, valid_to: validTo })
        })
        .then(function(r){ if (!r.ok) return r.json().catch(function(){return{};}).then(function(e){ throw new Error(e.error || ('Error ' + r.status)); }); return r.json(); })
        .then(function(){ window.location.reload(); })
        .catch(function(e){
          if (e.message === 'no_grant') console.error(window.i18n.errNoGrant || '利用枠がありません');
          else if (e.message === 'seat') console.error(window.i18n.errSeat || '席数上限に達しています');
          else console.error('Error: ' + e.message);
        });
      };

      var removeAssignTargetId = null;
      window.removeAssignment = function(aid) {
        removeAssignTargetId = aid;
        var m = document.getElementById('remove-assign-modal');
        if (m) m.showModal();
      };
      window.closeRemoveAssignModal = function() {
        var m = document.getElementById('remove-assign-modal');
        if (m) m.close();
        removeAssignTargetId = null;
      };
      window.executeRemoveAssignment = function() {
        if (!removeAssignTargetId) return;
        fetch('/group-admin/api/assignment/remove', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: removeAssignTargetId }) })
          .then(function(r){ if (!r.ok) throw new Error('Error ' + r.status); return r.json(); })
          .then(function(){
            if (assignsByGroup && currentGroupId) {
              assignsByGroup[currentGroupId] = (assignsByGroup[currentGroupId] || []).filter(function(a){ return a.id !== removeAssignTargetId; });
            }
            window.closeRemoveAssignModal();
            renderAssignments();
          })
          .catch(function(e){ console.error('Error: ' + e.message); });
      };

      // ===== ゲート② 利用枠の開放/取消 + 子枠の分配(決済権者のみ) =====
      function renderGrants() {
        var i18n = window.i18n;
        var list = grantsDetailByGroup && currentGroupId ? (grantsDetailByGroup[currentGroupId] || []) : [];
        var kids = (childrenByGroup && currentGroupId && childrenByGroup[currentGroupId]) ? childrenByGroup[currentGroupId] : [];

        // ---- サマリー: 各親枠について [総枠] [子へ配分] [自グループで利用可能] ----
        var summaryEl = document.getElementById('grants-summary');
        if (summaryEl) {
          if (list.length === 0) {
            summaryEl.innerHTML = '';
            summaryEl.style.display = 'none';
          } else {
            summaryEl.style.display = 'flex';
            summaryEl.innerHTML = list.map(function(g) {
              var childSeats = childDistributedSeats(currentGroupId, g.service_id);
              var unlimited = (g.seat_limit == null);
              var totalStr = unlimited ? (i18n.grantUnlimited || '無制限') : g.seat_limit;
              var availNum = unlimited ? null : Math.max(0, g.seat_limit - childSeats);
              var availStr = unlimited ? (i18n.grantUnlimited || '無制限') : availNum;
              var over = (!unlimited && childSeats > g.seat_limit);
              return '<div style="background:white; border:1px solid #e2e8f0; border-radius:8px; padding:1rem; flex:1; min-width:260px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">'
                + '<div style="font-size:0.9rem; font-weight:700; color:#0f172a; margin-bottom:0.65rem;">' + g.service_name + '</div>'
                + '<div style="display:flex; gap:0.75rem;">'
                +   '<div style="flex:1;"><div style="font-size:0.7rem; color:#64748b; margin-bottom:0.15rem;">' + (i18n.grantTotal || '総枠') + '</div><div style="font-size:1.15rem; font-weight:800; color:#0f172a;">' + totalStr + '</div></div>'
                +   '<div style="flex:1;"><div style="font-size:0.7rem; color:#64748b; margin-bottom:0.15rem;">' + (i18n.grantDistributed || '子へ配分') + '</div><div style="font-size:1.15rem; font-weight:800; color:#7c3aed;">' + childSeats + '</div></div>'
                +   '<div style="flex:1;"><div style="font-size:0.7rem; color:#64748b; margin-bottom:0.15rem;">' + (i18n.grantAvailable || '利用可能') + '</div><div style="font-size:1.15rem; font-weight:800; color:' + (over ? '#ef4444' : '#10b981') + ';">' + availStr + '</div></div>'
                + '</div>'
                + '</div>';
            }).join('');
          }
        }

        // ---- 親から受け取った自グループの枠(親枠)一覧 ----
        var el = document.getElementById('grants-table-body');
        if (el) {
          if (list.length === 0) {
            el.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:2rem;">' + (i18n.noGrants || '利用枠がありません') + '</td></tr>';
          } else {
            el.innerHTML = list.map(function(g) {
              var childSeats = childDistributedSeats(currentGroupId, g.service_id);
              var seat;
              if (g.seat_limit == null) {
                seat = (i18n.seatUnlimited || '無制限');
              } else {
                seat = g.seat_limit + ' <span style="color:#94a3b8; font-size:0.78rem;">(' + (i18n.grantDistributed || '子へ配分') + ' ' + childSeats + ' / ' + (i18n.grantAvailable || '利用可能') + ' ' + Math.max(0, g.seat_limit - childSeats) + ')</span>';
              }
              var isRootGrant = (availableContracts || []).some(function(c) { return c.id === g.contract_id && c.customer_group_id === currentGroupId; });
              var deleteBtn = isRootGrant ? '<button type="button" onclick="removeGrant(' + g.id + ')" style="background:transparent;border:none;color:#94a3b8;cursor:pointer;padding:7px;border-radius:50%;width:34px;height:34px;display:inline-flex;align-items:center;justify-content:center;transition:all 0.2s;" onmouseover="this.style.background=\'#fef2f2\';this.style.color=\'#ef4444\';" onmouseout="this.style.background=\'transparent\';this.style.color=\'#94a3b8\';"><span class="material-symbols-outlined" style="font-size:18px;">delete</span></button>' : '';
              return '<tr>'
                + '<td><strong>' + g.service_name + '</strong></td>'
                + '<td style="font-size:0.85rem; color:#64748b;">' + seat + '</td>'
                + '<td style="font-size:0.82rem; color:#94a3b8;">' + fmt(g.valid_from) + ' ～ ' + fmt(g.valid_to) + '</td>'
                + '<td style="text-align:right;">' + deleteBtn + '</td>'
                + '</tr>';
            }).join('');
          }
        }

        // ---- 「利用枠を開放」ボタンの表示制御 ----
        var openGrantBtnWrap = document.getElementById('btn-open-grant-wrap');
        if (openGrantBtnWrap) {
          var myContractsBtn = (availableContracts || []).filter(function(c) { return c.customer_group_id === currentGroupId; });
          var parentGrantsBtn = (grantsDetailByGroup && grantsDetailByGroup[currentGroupId]) ? grantsDetailByGroup[currentGroupId] : [];
          if (myContractsBtn.length === 0 && parentGrantsBtn.length === 0) {
            openGrantBtnWrap.style.display = 'none';
          } else {
            openGrantBtnWrap.style.display = 'flex';
          }
        }

        // ---- 所有している契約（箱） ----
        var contractsSec = document.getElementById('contracts-section');
        var contractsBody = document.getElementById('contracts-table-body');
        if (contractsSec && contractsBody) {
          var myContracts = (availableContracts || []).filter(function(c) { return c.customer_group_id === currentGroupId; });
          if (myContracts.length === 0) {
            contractsSec.style.display = 'none';
          } else {
            contractsSec.style.display = '';
            contractsBody.innerHTML = myContracts.map(function(c) {
              var seat = (c.seat_limit == null) ? (i18n.seatUnlimited || '無制限') : c.seat_limit;
              return '<tr>'
                + '<td><strong>' + c.service_name + (c.group_name ? ' (' + c.group_name + ')' : '') + '</strong></td>'
                + '<td style="font-size:0.85rem; color:#64748b;">' + seat + '</td>'
                + '</tr>';
            }).join('');
          }
        }

        // ---- 子グループへ配分済みの枠 ----
        renderChildGrants(kids);
      }

      // 直接の子グループへ配分した枠の一覧(グループ / サービス / 席数)。
      function renderChildGrants(kids) {
        var i18n = window.i18n;
        var sec = document.getElementById('child-grants-section');
        var body = document.getElementById('child-grants-table-body');
        if (!body) return;
        var rows = [];
        (kids || []).forEach(function(ch) {
          var cg = (grantsDetailByGroup && grantsDetailByGroup[ch.id]) ? grantsDetailByGroup[ch.id] : [];
          cg.forEach(function(g) { rows.push({ child: ch, g: g }); });
        });
        if (sec) sec.style.display = (kids && kids.length > 0) ? '' : 'none';
        if (rows.length === 0) {
          body.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:2rem;">' + (i18n.noChildGrants || '子グループへ配分された枠はありません。') + '</td></tr>';
          return;
        }
        body.innerHTML = rows.map(function(r) {
          var seat = (r.g.seat_limit == null) ? (i18n.seatUnlimited || '無制限') : r.g.seat_limit;
          return '<tr>'
            + '<td><span class="material-symbols-outlined" style="font-size:16px; color:#94a3b8; vertical-align:middle; margin-right:0.3rem;">subdirectory_arrow_right</span>' + r.child.name + '</td>'
            + '<td style="font-size:0.88rem;">' + r.g.service_name + '</td>'
            + '<td style="font-size:0.85rem; color:#64748b;">' + seat + '</td>'
            + '<td style="text-align:right;"><button type="button" onclick="removeGrant(' + r.g.id + ')" style="background:transparent;border:none;color:#94a3b8;cursor:pointer;padding:7px;border-radius:50%;width:34px;height:34px;display:inline-flex;align-items:center;justify-content:center;transition:all 0.2s;" onmouseover="this.style.background=\'#fef2f2\';this.style.color=\'#ef4444\';" onmouseout="this.style.background=\'transparent\';this.style.color=\'#94a3b8\';"><span class="material-symbols-outlined" style="font-size:18px;">delete</span></button></td>'
            + '</tr>';
        }).join('');
      }

      window.openGrantModal = function() {
        if (!currentGroupId) return;
        var m = document.getElementById('add-grant-modal');
        // 対象グループ = 自グループ + 直接の子グループ。
        var kids = (childrenByGroup && childrenByGroup[currentGroupId]) ? childrenByGroup[currentGroupId] : [];
        var targetOpts = [{ id: currentGroupId, label: (window.i18n.grantSelf || '自グループ') }];
        kids.forEach(function(ch){ targetOpts.push({ id: ch.id, label: ch.name }); });
        var tgtEl = document.getElementById('g-target');
        fillSelect(tgtEl, targetOpts, 'id', 'label', '');
        if (tgtEl) tgtEl.value = currentGroupId;
        var seatEl = document.getElementById('g-seat'); if (seatEl) seatEl.value = '';
        var vf = document.getElementById('g-valid-from'); if (vf) vf.value = new Date().toISOString().split('T')[0];
        var vt = document.getElementById('g-valid-to'); if (vt) vt.value = '';
        var errEl = document.getElementById('g-error'); if (errEl) errEl.style.display = 'none';
        onGrantTargetChange();
        if (m) m.showModal();
      };

      // 対象グループの切替で「契約/サービス」選択肢と席数フィールドの要否を切り替える。
      window.onGrantTargetChange = function() {
        var tgt = (document.getElementById('g-target') || {}).value || currentGroupId;
        var isSelf = (tgt === currentGroupId);
        var contractEl = document.getElementById('g-contract');
        var warn = document.getElementById('g-no-contract');
        var hasData = false;

        if (isSelf) {
          // 自グループ: システム管理者から配布された、自グループが顧客となっている契約のみを開放(ルート枠)。
          var contracts = (availableContracts || []).filter(function(c) { return c.customer_group_id === currentGroupId; });
          fillSelect(contractEl, contracts.map(function(ct){ return { id: ct.id, label: ct.service_name + (ct.group_name ? ' / ' + ct.group_name : '') + (ct.seat_limit != null ? ' (' + ct.seat_limit + ')' : '') }; }), 'id', 'label', window.i18n.selectContract || '契約を選択');
          if (warn) warn.style.display = contracts.length === 0 ? '' : 'none';
          hasData = contracts.length > 0;
        } else {
          // 子グループ: 親(自グループ)が保有する枠をサービス単位で分割。契約は親の枠を継承(value=契約ID)。
          var parentGrants = (grantsDetailByGroup && grantsDetailByGroup[currentGroupId]) ? grantsDetailByGroup[currentGroupId] : [];
          fillSelect(contractEl, parentGrants.map(function(g){
            var childSeats = childDistributedSeats(currentGroupId, g.service_id);
            var remain = (g.seat_limit == null) ? (window.i18n.grantUnlimited || '無制限') : Math.max(0, g.seat_limit - childSeats);
            return { id: g.contract_id, label: g.service_name + ' (' + (window.i18n.grantAvailable || '利用可能') + ' ' + remain + ')' };
          }), 'id', 'label', window.i18n.selectService || 'サービスを選択');
          if (warn) warn.style.display = parentGrants.length === 0 ? '' : 'none';
          hasData = parentGrants.length > 0;
        }

        var contractWrap = document.getElementById('g-contract-wrap');
        var seatWrap = document.getElementById('g-seat-wrap');
        var datesWrap = document.getElementById('g-dates-wrap');
        var submitBtn = document.getElementById('g-submit-btn');

        if (contractWrap) contractWrap.style.display = hasData ? '' : 'none';
        if (seatWrap) seatWrap.style.display = hasData ? '' : 'none';
        if (datesWrap) datesWrap.style.display = hasData ? 'grid' : 'none';
        if (submitBtn) submitBtn.style.display = hasData ? '' : 'none';
        
        var seatInput = document.getElementById('g-seat');
        if (seatInput) { seatInput.required = true; }
      };

      function showGrantError(msg) {
        var errEl = document.getElementById('g-error');
        if (errEl) { errEl.textContent = msg; errEl.style.display = ''; }
        else console.error(msg);
      }

      window.addGrant = function() {
        var target = (document.getElementById('g-target') || {}).value || currentGroupId;
        var isSelf = (target === currentGroupId);
        var contractId = (document.getElementById('g-contract') || {}).value;
        var seatVal = (((document.getElementById('g-seat') || {}).value || '') + '').trim();
        var sv = document.getElementById('g-valid-from').value;
        var ev = document.getElementById('g-valid-to').value;
        if (!contractId) { showGrantError(window.i18n.selectContract || '契約を選択してください'); return; }
        if (seatVal === '') { showGrantError(window.i18n.errSeatRequired || '上限枠数を入力してください'); return; }
        var validFrom = sv ? Math.floor(new Date(sv).getTime()/1000) : Math.floor(Date.now()/1000);
        var validTo = ev ? Math.floor(new Date(ev).getTime()/1000) : Math.floor(Date.now()/1000) + 315360000;
        fetch('/group-admin/api/grant/add', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ group_id: target, contract_id: contractId, seat_limit: seatVal, valid_from: validFrom, valid_to: validTo, context_group_id: currentGroupId })
        })
        .then(function(r){ if (!r.ok) return r.json().catch(function(){return{};}).then(function(e){ throw new Error(e.error || ('Error ' + r.status)); }); return r.json(); })
        .then(function(){ window.location.reload(); })
        .catch(function(e){
          if (e.message === 'over_budget') showGrantError(window.i18n.errOverBudget || '親の残り枠を超えています');
          else if (e.message === 'seat_required') showGrantError(window.i18n.errSeatRequired || '上限枠数を入力してください');
          else showGrantError('Error: ' + e.message);
        });
      };

      var removeGrantTargetId = null;
      window.removeGrant = function(gid) {
        removeGrantTargetId = gid;
        var m = document.getElementById('remove-grant-modal');
        if (m) m.showModal();
      };
      window.closeRemoveGrantModal = function() {
        var m = document.getElementById('remove-grant-modal');
        if (m) m.close();
        removeGrantTargetId = null;
      };
      window.executeRemoveGrant = function() {
        if (!removeGrantTargetId) return;
        fetch('/group-admin/api/grant/remove', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: removeGrantTargetId, context_group_id: currentGroupId }) })
          .then(function(r){ if (!r.ok) return r.json().catch(function(){return{};}).then(function(e){ throw new Error(e.error || ('Error ' + r.status)); }); return r.json(); })
          .then(function(){
            // 親枠・子枠どちらの取消でも整合するよう、全グループのローカルデータから除去する。
            if (grantsDetailByGroup) {
              Object.keys(grantsDetailByGroup).forEach(function(gid){
                grantsDetailByGroup[gid] = (grantsDetailByGroup[gid] || []).filter(function(g){ return g.id !== removeGrantTargetId; });
              });
            }
            window.closeRemoveGrantModal();
            renderGrants();
            renderAssignments();
          })
          .catch(function(e){
            console.error('Error: ' + e.message);
          });
      };

      function statusBadge(st) {
        var map = {
          pending:  ['#c2410c', '#fff7ed', window.i18n.statusPending || 'Pending'],
          rejected: ['#b91c1c', '#fef2f2', window.i18n.statusRejected || 'Rejected'],
          inactive: ['#d97706', '#fffbeb', window.i18n.statusInactive || 'Paused'],
          active:   ['#16a34a', '#f0fdf4', window.i18n.statusActive || 'Active']
        };
        var s = map[st] || map.active;
        return '<span style="font-size:0.72rem;font-weight:700;padding:2px 8px;border-radius:999px;color:' + s[0] + ';background:' + s[1] + ';">' + s[2] + '</span>';
      }

      // ===== セルフサービス: 自グループのサービス(=承認済みアプリの束ね) =====
            function renderServices() {
        var el = document.getElementById('services-table-body');
        if (!el) return;
        var list = servicesByGroup && currentGroupId ? (servicesByGroup[currentGroupId] || []) : [];
        if (list.length === 0) {
          el.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:1.5rem;">' + (window.i18n.svcNone || '(なし)') + '</td></tr>';
          return;
        }
        el.innerHTML = list.map(function(s) {
          var apps = s.apps || [];
          var chips = apps.length ? apps.map(function(a){
            return '<span style="display:inline-flex;align-items:center;gap:0.25rem;background:#eef2ff;color:#4338ca;border:1px solid #c7d2fe;border-radius:999px;padding:2px 6px 2px 10px;font-size:0.78rem;margin:0 0.25rem 0.25rem 0;">' + a.name
              + (s.status !== 'active' ? '<button type="button" title="外す" onclick="removeServiceApp(\'' + s.id + '\',\'' + a.id + '\')" style="background:none;border:none;color:#6366f1;cursor:pointer;padding:0 2px;line-height:1;font-size:0.95rem;">×</button>' : '') + '</span>';
          }).join('') : '<span style="color:#cbd5e1;">—</span>';
          
          var reasonInfo = '';
          if (s.status === 'rejected' && s.reason) {
            reasonInfo = '<div style="margin-top:0.5rem; padding:0.5rem; background:#fef2f2; border:1px solid #fecaca; border-radius:6px; font-size:0.8rem; color:#b91c1c;"><strong>却下事由:</strong> ' + s.reason.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\\n/g, '<br/>') + '</div>';
          }
          
          var encS = encodeURIComponent(JSON.stringify(s));
          return '<tr>'
            + '<td><strong>' + s.name + '</strong>'
            +   '<div style="font-size:0.75rem; color:#64748b; font-family:monospace; margin-top:2px;">' + s.id + '</div>'
            +   '<div style="margin-top:0.4rem;">' + chips + '</div>'
            +   reasonInfo
            + '</td>'
            + '<td style="text-align:right;">'
            +   (s.status === 'rejected' ? '<button type="button" onclick="reapplyService(\'' + s.id + '\')" style="background:#fff;border:1px solid #fecaca;color:#dc2626;cursor:pointer;padding:0.4rem 0.75rem;border-radius:6px;font-size:0.8rem;font-weight:600;margin-right:0.5rem;transition:all 0.2s;" onmouseover="this.style.background=\'#fef2f2\';"><span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;margin-right:2px;">refresh</span>再申請</button>' : '')
            +   (s.status !== 'active' ? '<button type="button" onclick="manageServiceApps(\'' + s.id + '\', \'' + encodeURIComponent(s.name) + '\')" style="background:transparent;border:1px solid #cbd5e1;color:#4f46e5;cursor:pointer;padding:0.4rem 0.75rem;border-radius:6px;font-size:0.8rem;font-weight:600;margin-right:0.5rem;transition:all 0.2s;" onmouseover="this.style.background=\'#eef2ff\';this.style.borderColor=\'#a5b4fc\';"><span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;margin-right:2px;">settings_applications</span>' + (window.i18n.svcManageApps || 'アプリを組み込む') + '</button>' : '')
            +   '<button type="button" onclick="manageRoles(\'' + s.id + '\', \'' + encodeURIComponent(s.name) + '\')" style="background:transparent;border:1px solid #cbd5e1;color:#047857;cursor:pointer;padding:0.4rem 0.75rem;border-radius:6px;font-size:0.8rem;font-weight:600;margin-right:0.5rem;transition:all 0.2s;" onmouseover="this.style.background=\'#d1fae5\';this.style.borderColor=\'#6ee7b7\';"><span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;margin-right:2px;">manage_accounts</span>役割(ロール)を管理</button>'
            +   (s.status !== 'active' ? '<button type="button" title="削除" onclick="removeService(\'' + s.id + '\')" style="background:transparent;border:none;color:#94a3b8;cursor:pointer;padding:7px;border-radius:50%;width:34px;height:34px;transition:all 0.2s;display:inline-flex;align-items:center;justify-content:center;vertical-align:middle;" onmouseover="this.style.background=\'#fef2f2\';this.style.color=\'#ef4444\';" onmouseout="this.style.background=\'transparent\';this.style.color=\'#94a3b8\';"><span class="material-symbols-outlined" style="font-size:18px;">delete</span></button>' : '')
            + '</td>'
            + '</tr>';
        }).join('');
      }

      window.openServiceModal = function() {
        if (!currentGroupId) return;
        var nameEl = document.getElementById('s-name'); if (nameEl) nameEl.value = '';
        var m = document.getElementById('add-service-modal');
        if (m) m.showModal();
      };
      window.addService = function() {
        var name = (document.getElementById('s-name') || {}).value;
        if (!name || !name.trim()) { console.error(window.i18n.svcName || 'name'); return; }
        fetch('/group-admin/api/service/create', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ group_id: currentGroupId, name: name.trim() })
        })
        .then(function(r){ if (!r.ok) throw new Error('Error ' + r.status); return r.json(); })
        .then(function(){ window.location.reload(); })
        .catch(function(e){ console.error('Error: ' + e.message); });
      };
      window.removeService = function(id) {
        showConfirm(window.i18n.svcConfirmRemove || 'このサービスを削除しますか？', function() {
          fetch('/group-admin/api/service/delete', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: id }) })
            .then(function(r){ if (!r.ok) throw new Error('Error ' + r.status); return r.json(); })
            .then(function(){ window.location.reload(); })
            .catch(function(e){ console.error('Error: ' + e.message); });
        });
      };
      window.reapplyService = function(id) {
        showConfirm('このサービスを再度申請してよろしいですか？', function() {
          fetch('/group-admin/api/service/reapply', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: id }) })
            .then(function(r){ if (!r.ok) throw new Error('Error ' + r.status); return r.json(); })
            .then(function(){ window.location.reload(); })
            .catch(function(e){ console.error('Error: ' + e.message); });
        });
      };

      // ===== セルフサービス: アプリ登録の申請(サービス紐づけは扱わない) =====
      function renderApps() {
        var el = document.getElementById('apps-table-body');
        if (!el) return;
        var list = appsByGroup && currentGroupId ? (appsByGroup[currentGroupId] || []) : [];
        if (list.length === 0) {
          el.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#94a3b8; padding:1.5rem;">' + (window.i18n.appNone || '(なし)') + '</td></tr>';
          return;
        }
        el.innerHTML = list.map(function(a) {
          var dataAttr = encodeURIComponent(JSON.stringify(a));
          var reasonInfo = '';
          if (a.status === 'rejected' && a.reason) {
             reasonInfo = '<div style="margin-top:0.4rem; padding:0.5rem; background:#fef2f2; border:1px solid #fecaca; border-radius:6px; font-size:0.75rem; color:#b91c1c;"><strong>却下事由:</strong> ' + a.reason.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\\n/g, '<br/>') + '<br/><span style="color:#ef4444; font-weight:bold;">※ 編集して保存すると自動的に再申請されます。</span></div>';
          }

          var aTags = appTagsByGroup && appTagsByGroup[currentGroupId] ? appTagsByGroup[currentGroupId].filter(function(t){ return t.app_id === a.id; }) : [];
          var tagsHtml = aTags.map(function(t) {
            var color = t.status === 'active' ? '#047857' : (t.status === 'rejected' ? '#b91c1c' : '#c2410c');
            var bg = t.status === 'active' ? '#d1fae5' : (t.status === 'rejected' ? '#fef2f2' : '#fff7ed');
            var label = t.tag_name;
            if (t.status !== 'active') label += ' (' + (t.status === 'pending' ? '申請中' : '却下') + ')';
            return '<span style="display:inline-block; margin-right:0.25rem; font-size:0.75rem; padding:2px 8px; border-radius:999px; background:'+bg+'; color:'+color+'; border:1px solid '+(t.status==='active'?'#a7f3d0':(t.status==='rejected'?'#fecaca':'#fed7aa'))+';">' + label + '</span>';
          }).join('');
          var tagsDisplay = '<div style="margin-top:0.35rem;">' + (tagsHtml || '<span style="font-size:0.75rem; color:#94a3b8;">タグなし</span>') + '</div>';

          return '<tr>'
            + '<td><strong>' + a.name + '</strong><div style="font-size:0.78rem;color:#94a3b8;font-family:monospace;">' + a.id + '</div>' + tagsDisplay + reasonInfo + '</td>'
            + '<td>' + statusBadge(a.status) + '</td>'
            + '<td style="text-align:right; white-space:nowrap;">'
            +   '<button type="button" title="タグ管理" onclick="openAppTagsModal(&quot;' + a.id + '&quot;, &quot;' + encodeURIComponent(a.name) + '&quot;)" style="background:transparent;border:none;color:#94a3b8;cursor:pointer;padding:7px;border-radius:50%;width:34px;height:34px;" onmouseover="this.style.background=&quot;#f1f5f9&quot;;this.style.color=&quot;#4f46e5&quot;;" onmouseout="this.style.background=&quot;transparent&quot;;this.style.color=&quot;#94a3b8&quot;;"><span class="material-symbols-outlined" style="font-size:18px;">local_offer</span></button>'
            +   '<button type="button" title="' + (a.status === 'active' ? '詳細' : '編集') + '" onclick="openAppEditModal(&quot;' + dataAttr + '&quot;)" style="background:transparent;border:none;color:#94a3b8;cursor:pointer;padding:7px;border-radius:50%;width:34px;height:34px;" onmouseover="this.style.background=&quot;#f1f5f9&quot;;this.style.color=&quot;#4f46e5&quot;;" onmouseout="this.style.background=&quot;transparent&quot;;this.style.color=&quot;#94a3b8&quot;;"><span class="material-symbols-outlined" style="font-size:18px;">' + (a.status === 'active' ? 'visibility' : 'edit') + '</span></button>'
            +   (a.status !== 'active' ? '<button type="button" title="削除" onclick="removeApp(&quot;' + a.id + '&quot;)" style="background:transparent;border:none;color:#94a3b8;cursor:pointer;padding:7px;border-radius:50%;width:34px;height:34px;" onmouseover="this.style.background=&quot;#fef2f2&quot;;this.style.color=&quot;#ef4444&quot;;" onmouseout="this.style.background=&quot;transparent&quot;;this.style.color=&quot;#94a3b8&quot;;"><span class="material-symbols-outlined" style="font-size:18px;">delete</span></button>' : '')
            + '</td>'
            + '</tr>';
        }).join('');
      }

      window.openAppModal = function() {
        if (!currentGroupId) return;
        ['ap-id','ap-name','ap-base-url','ap-redirect','ap-desc'].forEach(function(id){ var e = document.getElementById(id); if (e) e.value = ''; });
        var m = document.getElementById('add-app-modal');
        if (m) m.showModal();
      };
      window.addApp = function() {
        var id = (document.getElementById('ap-id')||{}).value;
        var name = (document.getElementById('ap-name')||{}).value;
        var baseUrl = (document.getElementById('ap-base-url')||{}).value;
        var redirect = (document.getElementById('ap-redirect')||{}).value;
        var desc = (document.getElementById('ap-desc')||{}).value;
        if (!id || !id.trim() || !name || !name.trim() || !baseUrl || !baseUrl.trim()) { console.error(window.i18n.appFillRequired || 'ID/名前/URLは必須です'); return; }
        fetch('/group-admin/api/app/request', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ group_id: currentGroupId, id: id.trim(), name: name.trim(), base_url: baseUrl.trim(), redirect_uris: redirect, description: desc })
        })
        .then(function(r){ if (!r.ok) return r.json().catch(function(){return{};}).then(function(e){ throw new Error(e.error || ('Error ' + r.status)); }); return r.json(); })
        .then(function(){ window.location.reload(); })
        .catch(function(e){
          if (e.message === 'id_taken') console.error(window.i18n.appIdTaken || 'そのアプリIDは既に使われています');
          else console.error('Error: ' + e.message);
        });
      };
      window.openAppEditModal = function(enc) {
        var a = JSON.parse(decodeURIComponent(enc));
        document.getElementById('ape-id').value = a.id;
        document.getElementById('ape-name').value = a.name;
        document.getElementById('ape-base-url').value = a.base_url;
        document.getElementById('ape-redirect').value = a.redirect_uris || '';
        var isReadOnly = a.status === 'active';
        ['ape-name', 'ape-base-url', 'ape-redirect'].forEach(function(id) {
          var el = document.getElementById(id);
          if (el) el.disabled = isReadOnly;
        });
        var saveBtn = document.getElementById('ape-save-btn');
        if (saveBtn) saveBtn.style.display = isReadOnly ? 'none' : 'flex';
        var m = document.getElementById('edit-app-modal-ga');
        if (m) {
          var titleEl = m.querySelector('h3');
          if (titleEl) titleEl.innerText = isReadOnly ? 'アプリ詳細' : (window.i18n.edit || '編集');
          m.showModal();
        }
      };
      window.updateApp = function() {
        var id = (document.getElementById('ape-id')||{}).value;
        var name = (document.getElementById('ape-name')||{}).value;
        var baseUrl = (document.getElementById('ape-base-url')||{}).value;
        var redirect = (document.getElementById('ape-redirect')||{}).value;
        if (!name || !name.trim() || !baseUrl || !baseUrl.trim()) { console.error(window.i18n.appFillRequired || '名前/URLは必須です'); return; }
        fetch('/group-admin/api/app/update', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ id: id, name: name.trim(), base_url: baseUrl.trim(), redirect_uris: redirect })
        })
        .then(function(r){ if (!r.ok) throw new Error('Error ' + r.status); return r.json(); })
        .then(function(){ window.location.reload(); })
        .catch(function(e){ console.error('Error: ' + e.message); });
      };
      window.removeApp = function(id) {
        showConfirm(window.i18n.appConfirmRemove || 'このアプリを削除しますか？', function() {
          fetch('/group-admin/api/app/delete', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: id }) })
            .then(function(r){ if (!r.ok) throw new Error('Error ' + r.status); return r.json(); })
            .then(function(){ window.location.reload(); })
            .catch(function(e){ console.error('Error: ' + e.message); });
        });
      };

      var currentAppTagsAppId = null;

      window.openAppTagsModal = function(appId, appName) {
        currentAppTagsAppId = appId;
        var m = document.getElementById('manage-app-tags-modal');
        var nameEl = document.getElementById('mat-app-name');
        if (nameEl) nameEl.textContent = decodeURIComponent(appName);

        var appliedTagsEl = document.getElementById('mat-applied-tags');
        var availableTagsEl = document.getElementById('mat-available-tags');

        var aTags = appTagsByGroup && appTagsByGroup[currentGroupId] ? appTagsByGroup[currentGroupId].filter(function(t){ return t.app_id === appId; }) : [];
        if (appliedTagsEl) {
          if (aTags.length === 0) {
            appliedTagsEl.innerHTML = '<span style="color:#94a3b8; font-size:0.85rem; width:100%; text-align:center; padding: 0.5rem 0;">適用されているタグはありません</span>';
          } else {
            appliedTagsEl.innerHTML = aTags.map(function(t) {
              var color = t.status === 'active' ? '#047857' : (t.status === 'rejected' ? '#b91c1c' : '#c2410c');
              var bg = t.status === 'active' ? '#d1fae5' : (t.status === 'rejected' ? '#fef2f2' : '#fff7ed');
              var label = t.tag_name;
              if (t.status !== 'active') label += ' (' + (t.status === 'pending' ? '申請中' : '却下') + ')';
              return '<span style="display:inline-flex; align-items:center; gap:0.25rem; font-size:0.8rem; padding:4px 8px 4px 10px; border-radius:999px; background:'+bg+'; color:'+color+'; border:1px solid '+(t.status==='active'?'#a7f3d0':(t.status==='rejected'?'#fecaca':'#fed7aa'))+';">' + label
                + '<button type="button" title="外す" onclick="removeAppTag(&quot;' + appId + '&quot;, &quot;' + t.tag_id + '&quot;)" style="background:none;border:none;color:'+color+';cursor:pointer;padding:0 2px;line-height:1;font-size:1.1rem;opacity:0.7;" onmouseover="this.style.opacity=1;" onmouseout="this.style.opacity=0.7;">×</button>'
                + '</span>';
            }).join('');
          }
        }

        if (availableTagsEl) {
          var optionsHtml = '<option value="">追加するタグを選択...</option>';
          var avail = availableTags || [];
          // 既に適用中のものは除外
          avail.forEach(function(t) {
            var applied = aTags.some(function(at) { return at.tag_id === t.id; });
            if (!applied) {
              optionsHtml += '<option value="' + t.id + '">' + t.name + '</option>';
            }
          });
          availableTagsEl.innerHTML = optionsHtml;
        }

        var customNameEl = document.getElementById('mat-custom-tag-name');
        if (customNameEl) customNameEl.value = '';

        if (m) m.showModal();
      };

      window.applyAppTag = function() {
        if (!currentAppTagsAppId) return;
        var tagId = document.getElementById('mat-available-tags').value;
        if (!tagId) return;
        fetch('/group-admin/api/app_tags/apply', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ app_id: currentAppTagsAppId, tag_id: tagId })
        })
        .then(function(r) { if (!r.ok) throw new Error('Error ' + r.status); return r.json(); })
        .then(function() { window.location.reload(); })
        .catch(function(e) { console.error('Error:', e.message); });
      };

      window.removeAppTag = function(appId, tagId) {
        if (!confirm('このタグをアプリから外しますか？')) return;
        fetch('/group-admin/api/app_tags/remove', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ app_id: appId, tag_id: tagId })
        })
        .then(function(r) { if (!r.ok) throw new Error('Error ' + r.status); return r.json(); })
        .then(function() { window.location.reload(); })
        .catch(function(e) { console.error('Error:', e.message); });
      };

      window.requestCustomTag = function() {
        if (!currentAppTagsAppId) return;
        var nameEl = document.getElementById('mat-custom-tag-name');
        var name = nameEl ? nameEl.value.trim() : '';
        if (!name) return;
        fetch('/group-admin/api/app_tags/request_custom', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ app_id: currentAppTagsAppId, tag_name: name })
        })
        .then(function(r) { if (!r.ok) throw new Error('Error ' + r.status); return r.json(); })
        .then(function() { window.location.reload(); })
        .catch(function(e) { console.error('Error:', e.message); });
      };


    })();

  

}.toString() + ')();';
