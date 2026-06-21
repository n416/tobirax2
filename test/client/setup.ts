import { vi } from 'vitest'

// モック化したい window オブジェクトのプロパティや関数を定義
declare global {
  interface Window {
    escapeHtml: (v: unknown) => string
    i18n: Record<string, string>
    // 必要なグローバル変数を追加
  }
}

// 例として escapeHtml をモック
window.escapeHtml = vi.fn((v: unknown) => {
  if (v == null) return ''
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
})

window.i18n = {}
