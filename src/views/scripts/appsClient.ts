// @ts-nocheck
// このファイルはクライアントサイドで実行されるJavaScriptです。
// コンパイル時に構文チェックを行うため、関数として定義し文字列化して配信します。

export const getAppsClientScript = (t: any) => `
        (function() {
            // 画像プレビュー機能
            window.handleIconPreview = function(input, previewId) {
                if (input.files && input.files[0]) {
                    var reader = new FileReader();
                    reader.onload = function(e) {
                        var div = document.getElementById(previewId);
                        var img = div ? div.querySelector('img') : null;
                        if(img) {
                            img.src = e.target.result;
                            div.style.display = 'block';
                        }
                    };
                    reader.readAsDataURL(input.files[0]);
                }
            };
    
            var editModal = document.getElementById('edit-app-modal');
            
            // 編集モーダルを開く関数
            window.openEditAppModal = function(btn) {
                if(!editModal) return;
                var form = editModal.querySelector('form');
                
                // 基本データ
                form.querySelector('input[name="id"]').value = btn.dataset.id;
                form.querySelector('input[name="name"]').value = btn.dataset.name;
                form.querySelector('input[name="base_url"]').value = btn.dataset.url;
                
                // 説明文
                var descEl = form.querySelector('textarea[name="description"]');
                if(descEl) descEl.value = btn.dataset.desc || '';

                // Redirect URIs (OIDC)
                var ruEl = form.querySelector('textarea[name="redirect_uris"]');
                if(ruEl) ruEl.value = btn.dataset.redirectUris || '';

                // Back-Channel Logout URI (OIDC)
                var bclEl = form.querySelector('input[name="backchannel_logout_uri"]');
                if(bclEl) bclEl.value = btn.dataset.backchannelLogoutUri || '';

                // Initiate Login URI (OIDC)
                var iniEl = form.querySelector('input[name="initiate_login_uri"]');
                if(iniEl) iniEl.value = btn.dataset.initiateLoginUri || '';

                // アイコン関連
                var iconEl = form.querySelector('input[name="icon_url"]');
                var iconUrl = btn.dataset.icon || '';
                if(iconEl) iconEl.value = iconUrl;
                
                // プレビュー表示制御
                var previewDiv = document.getElementById('edit-icon-preview');
                var previewImg = previewDiv ? previewDiv.querySelector('img') : null;
                if(previewDiv && previewImg) {
                    if(iconUrl && iconUrl !== 'null' && iconUrl !== 'undefined') {
                        previewImg.src = iconUrl;
                        previewDiv.style.display = 'block';
                    } else {
                        previewImg.src = '';
                        previewDiv.style.display = 'none';
                    }
                }
                
                // ファイル入力はリセット
                var fileInput = form.querySelector('input[name="icon_file"]');
                if(fileInput) fileInput.value = '';

                // Client Secret (OIDC)
                var secEl = document.getElementById('edit-secret');
                var noteEl = document.getElementById('edit-secret-note');
                var sec = btn.dataset.secret || '';
                if(secEl) secEl.value = sec || '${t.secret_public_placeholder}';
                if(noteEl) noteEl.innerText = sec
                    ? '${t.note_confidential}'
                    : '${t.note_public}';

                editModal.showModal();
                setTimeout(function() {
                    var closeBtn = document.getElementById('edit-close-btn');
                    if(closeBtn) closeBtn.focus();
                }, 50);
            };
            
            window.closeEditAppModal = function() {
                if(editModal) editModal.close();
            };
            // Toggle App Status
            var toggleTargetId = null;
            var toggleTargetStatus = null;
            window.toggleAppStatus = function(id, nextStatus, name) {
                toggleTargetId = id;
                toggleTargetStatus = nextStatus;
                var tm = document.getElementById('toggle-confirm-modal');
                if(tm) {
                    var msgEl = document.getElementById('toggle-msg-text');
                    var i18nEl = document.getElementById('i18n-data');
                    var tmpl = (i18nEl && i18nEl.dataset.confirmChangeStatus) || 'Change status?';
                    if(msgEl) msgEl.innerText = tmpl.replace('{name}', name);
                    tm.showModal();
                }
            };
            window.closeToggleModal = function() {
                var tm = document.getElementById('toggle-confirm-modal');
                if(tm) tm.close();
                toggleTargetId = null;
                toggleTargetStatus = null;
            };
            window.executeToggle = function() {
                if(!toggleTargetId) return;
                var form = document.getElementById('toggle-app-form');
                if(form) {
                    form.querySelector('input[name="id"]').value = toggleTargetId;
                    form.querySelector('input[name="status"]').value = toggleTargetStatus;
                    form.submit();
                }
            };

            // Delete App
            var deleteTargetId = null;
            window.deleteApp = function(id) {
                deleteTargetId = id;
                var dm = document.getElementById('delete-confirm-modal');
                if(dm) dm.showModal();
            };
            window.closeDeleteModal = function() {
                var dm = document.getElementById('delete-confirm-modal');
                if(dm) dm.close();
                deleteTargetId = null;
            };
            window.executeDelete = function() {
                if(!deleteTargetId) return;
                var form = document.getElementById('delete-app-form');
                if(form) {
                    form.querySelector('input[name="id"]').value = deleteTargetId;
                    form.submit();
                }
            };

            // Approve / Reject app registration request (pending -> active / rejected)
            window.approveApp = function(id) {
                var i18nEl = document.getElementById('i18n-data');
                if (!confirm((i18nEl && i18nEl.dataset.confirmApprove) || 'Approve?')) return;
                var f = document.getElementById('approve-app-form');
                if (f) { f.querySelector('input[name="id"]').value = id; f.submit(); }
            };
            // rejectApp は RejectReasonModal に置き換えました

            // Client secret: regenerate / clear (make public)
            window.appSecretAction = function(action) {
                if(!editModal) return;
                var id = editModal.querySelector('input[name="id"]').value;
                if(!id) return;
                if(action === 'clear' && !confirm('${t.confirm_make_public}')) return;
                var f = document.getElementById('secret-app-form');
                if(f) {
                    f.querySelector('input[name="id"]').value = id;
                    f.querySelector('input[name="action"]').value = action;
                    f.submit();
                }
            };
        })();
`;
