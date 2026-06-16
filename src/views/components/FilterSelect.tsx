import { html } from 'hono/html'
import { css } from 'hono/css'

export const filterSelectGlobalStyles = html`
  <style>
    /* TomSelectのドロップダウンはモーダル(z-index:1000)より前面に出す必要がある */
    .ts-dropdown {
      z-index: 99999;
      border-radius: 0 0 12px 12px;
      border: 1px solid #cbd5e1;
      border-top: none;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    }
    .ts-wrapper {
      width: 100%;
    }
    /* 他のinput要素のスタイル(border-radius:12px等)とトーンを合わせる */
    .ts-control {
      padding: 0.8rem 1rem;
      border-radius: 12px;
      border: 1px solid #cbd5e1;
      font-size: 1rem;
      background-color: #fff;
      transition: all 0.3s ease;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }
    .ts-wrapper.focus .ts-control {
      border-color: #4f46e5;
      box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
    }
  </style>
`

// グローバルに一度だけ注入するTomSelect初期化ユーティリティ
export const FilterSelectScript = html`
  <script>
    window.initFilterSelect = function(elementOrId) {
        if (!window.TomSelect) return null;
        var sel = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
        if (!sel) return null;
        
        // ネイティブのカスタムスタイル（selectInputクラスなど）をクリアし、二重スタイルを防ぐ
        sel.className = ''; 
        
        if (sel.tomselect) {
            sel.tomselect.destroy();
        }
        
        return new window.TomSelect(sel, {
            create: false,
            sortField: { field: 'text', direction: 'asc' },
            dropdownParent: 'body'
        });
    };
  </script>
`
