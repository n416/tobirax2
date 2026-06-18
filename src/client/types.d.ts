/**
 * クライアントサイド共有型定義。
 * 各 src/client/*.ts から参照される。
 */

// プロジェクトのカスタムモーダル（div ベース）は Modal.tsx のポリフィルにより
// showModal() / close() メソッドを持つ。標準の HTMLDialogElement ではないため、
// HTMLElement を拡張して定義する。
interface CustomModalElement extends HTMLElement {
  showModal(): void
  close(): void
  open: boolean
}

// TomSelect はグローバルにスクリプトタグで読み込まれるサードパーティ
declare const TomSelect: any

// HTMLエスケープ関数（複数ファイルで使用）
declare function escapeHtml(v: unknown): string
