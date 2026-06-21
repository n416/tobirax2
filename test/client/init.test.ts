import { describe, it, expect } from 'vitest'
// init.ts は import 時に top-level で window.escapeHtml / fmt / childDistributedSeats を
// 定義する(重い DOM 処理は DOMContentLoaded リスナ内なので import では走らない)。
// happy-dom 環境で本番のクライアント純粋関数をそのまま検証する。
import '../../src/client/groupAdmin/init'

// 型は test/client が tsconfig 対象外のため any 経由で扱う(vitest は型検査せず実行する)。
const w = window as any

describe('client/init: escapeHtml (innerHTML 連結時の XSS 対策)', () => {
  it('HTML 特殊文字をすべてエスケープする', () => {
    expect(w.escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(w.escapeHtml(`"&'<>`)).toBe('&quot;&amp;&#39;&lt;&gt;')
  })
  it('null / undefined は空文字を返す', () => {
    expect(w.escapeHtml(null)).toBe('')
    expect(w.escapeHtml(undefined)).toBe('')
  })
  it('非文字列は文字列化してからエスケープする', () => {
    expect(w.escapeHtml(123)).toBe('123')
  })
})

describe('client/init: fmt (unix 秒 → 日付表示)', () => {
  it('unix 秒を YYYY/MM/DD 形式に整形する', () => {
    const s = w.fmt(1609545600) // 2021-01-02 00:00 UTC 付近
    expect(s).toMatch(/^\d{4}\/\d{2}\/\d{2}$/)
    expect(s.startsWith('2021/01/0')).toBe(true) // TZ により 01 か 02
  })
  it('falsy(0 / null / undefined)は "-"', () => {
    expect(w.fmt(0)).toBe('-')
    expect(w.fmt(null)).toBe('-')
    expect(w.fmt(undefined)).toBe('-')
  })
  it('遠未来(>2000000000)は "無期限"', () => {
    expect(w.fmt(9999999999)).toBe('無期限')
  })
})

describe('client/init: childDistributedSeats (子グループへ配分済みの席数合計)', () => {
  it('指定サービスについて子グループの seat_limit を合計する', () => {
    w.childrenByGroup = { parent: [{ id: 'c1' }, { id: 'c2' }] }
    w.grantsDetailByGroup = {
      c1: [{ service_id: 'svc-A', seat_limit: 5 }, { service_id: 'svc-B', seat_limit: 99 }],
      c2: [{ service_id: 'svc-A', seat_limit: 3 }],
    }
    expect(w.childDistributedSeats('parent', 'svc-A')).toBe(8) // 5 + 3(svc-B は無視)
  })
  it('seat_limit が null の枠は無視し、子が無ければ 0', () => {
    w.childrenByGroup = { parent: [{ id: 'c1' }] }
    w.grantsDetailByGroup = { c1: [{ service_id: 'svc-A', seat_limit: null }] }
    expect(w.childDistributedSeats('parent', 'svc-A')).toBe(0)
    expect(w.childDistributedSeats('no-such-group', 'svc-A')).toBe(0)
  })
})
