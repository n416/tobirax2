import { html } from 'hono/html'

export const confirmDialogStyles = html`
  <style>
    #global-confirm-dialog {
      border: none;
      border-radius: 12px;
      padding: 1.5rem;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      background: #ffffff;
      color: #1e293b;
    }
    #global-confirm-dialog::backdrop {
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(2px);
    }
    #global-confirm-dialog p {
      margin-bottom: 1.5rem;
      font-size: 1rem;
      line-height: 1.5;
      white-space: pre-wrap;
    }
    .global-confirm-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
    }
    .global-confirm-actions button {
      padding: 0.6rem 1.2rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
    }
    .global-confirm-btn-cancel {
      background: transparent;
      color: #64748b;
      border: 1px solid #cbd5e1 !important;
    }
    .global-confirm-btn-cancel:hover {
      background: #f1f5f9;
      color: #334155;
    }
    .global-confirm-btn-ok {
      background: #4f46e5;
      color: #ffffff;
    }
    .global-confirm-btn-ok:hover {
      background: #4338ca;
    }
  </style>
`

export const ConfirmDialogScript = html`
  <script>
    (function() {
      var dialogHtml = \`
        <dialog id="global-confirm-dialog">
          <p id="global-confirm-message"></p>
          <div class="global-confirm-actions">
            <button type="button" id="global-confirm-btn-cancel" class="global-confirm-btn-cancel" style="display:none;">キャンセル</button>
            <button type="button" id="global-confirm-btn-ok" class="global-confirm-btn-ok">OK</button>
          </div>
        </dialog>
      \`;

      document.addEventListener('DOMContentLoaded', function() {
        if (!document.getElementById('global-confirm-dialog')) {
          document.body.insertAdjacentHTML('beforeend', dialogHtml);
        }
      });

      var pendingConfirmCallback = null;

      window.showConfirm = function(message, callback) {
        var dialog = document.getElementById('global-confirm-dialog');
        var msgEl = document.getElementById('global-confirm-message');
        var cancelBtn = document.getElementById('global-confirm-btn-cancel');
        var okBtn = document.getElementById('global-confirm-btn-ok');

        if (dialog && msgEl && cancelBtn && okBtn) {
          msgEl.textContent = message;
          cancelBtn.style.display = 'block';
          cancelBtn.textContent = 'キャンセル';
          
          pendingConfirmCallback = callback;

          var closeDialog = function() {
            dialog.close();
            okBtn.onclick = null;
            cancelBtn.onclick = null;
          };

          cancelBtn.onclick = function() {
            pendingConfirmCallback = null;
            closeDialog();
          };

          okBtn.onclick = function() {
            var cb = pendingConfirmCallback;
            pendingConfirmCallback = null;
            closeDialog();
            if (cb) cb();
          };

          dialog.showModal();
        }
      };

      window.showAlert = function(message) {
        var dialog = document.getElementById('global-confirm-dialog');
        var msgEl = document.getElementById('global-confirm-message');
        var cancelBtn = document.getElementById('global-confirm-btn-cancel');
        var okBtn = document.getElementById('global-confirm-btn-ok');

        if (dialog && msgEl && cancelBtn && okBtn) {
          msgEl.textContent = message;
          cancelBtn.style.display = 'none';

          var closeDialog = function() {
            dialog.close();
            okBtn.onclick = null;
          };

          okBtn.onclick = closeDialog;

          dialog.showModal();
        }
      };
    })();
  </script>
`
