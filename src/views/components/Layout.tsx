import { html } from 'hono/html'
import { Style, css } from 'hono/css'
import { filterSelectGlobalStyles, FilterSelectScript } from './FilterSelect'

interface LayoutProps {
  title: string
  siteName?: string // Added
  lang?: string
  width?: number | string
  // 'center'(既定・ログインカード向け) / 'top'(ダッシュボード等のページ向け)
  align?: 'center' | 'top'
  children: any
}

export const Layout = (props: LayoutProps) => {
  const lang = props.lang || 'ja'
  const maxWidth = props.width ? (typeof props.width === 'number' ? `${props.width}px` : props.width) : '550px'
  const siteName = props.siteName || 'Tobira'
  const alignTop = props.align === 'top'

  const globalStyles = html`
    <style>
      :root {
          --primary: #4f46e5;
          --primary-hover: #4338ca;
          --text-main: #0f172a;
          --text-sub: #64748b;
          --bg-gradient-start: #e0e7ff;
          --bg-gradient-end: #a5b4fc;
          --glass-bg: rgba(255, 255, 255, 0.75);
          --glass-border: rgba(255, 255, 255, 0.6);
          --glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
          --error-bg: #fef2f2;
          --error-text: #b91c1c;
          --error-border: #fecaca;
          --success-bg: #f0fdf4;
          --success-text: #15803d;
          --success-border: #bbf7d0;
      }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
          font-family: 'Inter', 'Noto Sans JP', sans-serif;
          min-height: 100vh;
          display: flex;
          align-items: ${alignTop ? 'flex-start' : 'center'};
          justify-content: center;
          background: linear-gradient(135deg, #f0f4ff 0%, #c7d2fe 50%, #e0e7ff 100%);
          background-size: 200% 200%;
          animation: gradient-animation 15s ease infinite;
          color: var(--text-main);
          padding: ${alignTop ? '2.5rem 1rem' : '1rem'};
      }
      @keyframes gradient-animation {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
      }
      /* Material Symbols の基底スタイル。これが無いとアイコン名(例: security)が文字列のまま表示される。 */
      .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          font-size: 20px;
          vertical-align: text-bottom;
          line-height: 1;
      }
    </style>
  `

  const containerClass = css`
    width: 100%;
    max-width: ${maxWidth};
    perspective: 1000px;
    margin: 0 auto;
  `

  const utils = html`
    <style>
      .w-full { width: 100%; }
      .text-center { text-align: center; }
      .mb-2 { margin-bottom: 0.5rem; }
      .mb-4 { margin-bottom: 1rem; }
      .mb-6 { margin-bottom: 1.5rem; }
      .mt-4 { margin-top: 1rem; }
      .mt-8 { margin-top: 2rem; }
      a { color: var(--text-sub); text-decoration: none; transition: color 0.2s; font-weight: 500; }
      a:hover { color: var(--primary); }
      .error-message {
          background-color: var(--error-bg);
          color: var(--error-text);
          padding: 0.75rem;
          border-radius: 12px;
          font-size: 0.85rem;
          text-align: center;
          margin-bottom: 1.5rem;
          border: 1px solid var(--error-border);
      }
      .success-message {
          background-color: var(--success-bg);
          color: var(--success-text);
          padding: 0.75rem;
          border-radius: 12px;
          font-size: 0.85rem;
          text-align: center;
          margin-bottom: 1.5rem;
          border: 1px solid var(--success-border);
          font-weight: 500;
      }
    </style>
  `

  return html`
    <!DOCTYPE html>
    <html lang="${lang}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${props.title} - ${siteName}</title>
      <link rel="icon" href="data:,">
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
      <link href="https://cdn.jsdelivr.net/npm/tom-select@2.2.2/dist/css/tom-select.default.min.css" rel="stylesheet">
      <script src="https://cdn.jsdelivr.net/npm/tom-select@2.2.2/dist/js/tom-select.complete.min.js"></script>
      ${globalStyles}
      ${utils}
      ${filterSelectGlobalStyles}
      ${FilterSelectScript}
      ${Style()} 
    </head>
    <body>
       <div class="${containerClass}">
         ${props.children}
       </div>
       <script>
         document.addEventListener('DOMContentLoaded', function() {
             document.querySelectorAll('.local-time').forEach(function(el) {
                 var ts = parseInt(el.getAttribute('data-timestamp'));
                 if (!isNaN(ts)) {
                     el.textContent = new Date(ts).toLocaleString();
                 }
             });
         });
       </script>
    </body>
    </html>
  `
}
