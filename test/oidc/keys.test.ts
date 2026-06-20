import { describe, it, expect } from 'vitest'
import { parseStored } from '../../src/oidc/keys'

// 保存済み oidc_keys 行のパース。v3 セット / レガシー v2 単体 / 不明形式 を見分け、
// caller が v3 で再永続化すべきか(wasV3=false)を判定する純粋な分岐ロジック。
describe('OIDC: parseStored (鍵エンベロープのパース)', () => {
  const NOW = 1_700_000_000

  it('空/未設定の行は空・wasV3=false', () => {
    expect(parseStored(undefined, NOW)).toEqual({ envs: [], wasV3: false })
    expect(parseStored('', NOW)).toEqual({ envs: [], wasV3: false })
  })

  it('壊れた JSON は空・wasV3=false(=要再永続化)', () => {
    expect(parseStored('{not json', NOW)).toEqual({ envs: [], wasV3: false })
    expect(parseStored('}{', NOW)).toEqual({ envs: [], wasV3: false })
  })

  it('v3 セットはそのまま envs を返し wasV3=true', () => {
    const keys = [
      { kid: 'a', publicJwk: { kty: 'RSA', n: 'n1', e: 'AQAB' }, iv: 'iv1', ct: 'ct1', createdAt: 100 },
      { kid: 'b', publicJwk: { kty: 'RSA', n: 'n2', e: 'AQAB' }, iv: 'iv2', ct: 'ct2', createdAt: 200 },
    ]
    const r = parseStored(JSON.stringify({ v: 3, keys }), NOW)
    expect(r.wasV3).toBe(true)
    expect(r.envs).toEqual(keys)
  })

  it('v3 だが keys が配列でなければ不明扱い(空・wasV3=false)', () => {
    expect(parseStored(JSON.stringify({ v: 3, keys: 'oops' }), NOW)).toEqual({ envs: [], wasV3: false })
  })

  it('レガシー v2 単体は1エンベロープへ移行し createdAt=now・wasV3=false', () => {
    const v2 = { v: 2, kid: 'legacy', publicJwk: { kty: 'RSA', n: 'nL', e: 'AQAB' }, iv: 'ivL', ct: 'ctL' }
    const r = parseStored(JSON.stringify(v2), NOW)
    expect(r.wasV3).toBe(false)
    expect(r.envs).toEqual([
      { kid: 'legacy', publicJwk: { kty: 'RSA', n: 'nL', e: 'AQAB' }, iv: 'ivL', ct: 'ctL', createdAt: NOW },
    ])
  })

  it('v2 でも必須フィールド欠落は不明扱い(空・wasV3=false)', () => {
    // ct 欠落
    expect(parseStored(JSON.stringify({ v: 2, kid: 'x', publicJwk: {}, iv: 'iv' }), NOW))
      .toEqual({ envs: [], wasV3: false })
  })

  it('未知バージョン/レガシー平文は不明扱い(空・wasV3=false)', () => {
    expect(parseStored(JSON.stringify({ v: 1, foo: 'bar' }), NOW)).toEqual({ envs: [], wasV3: false })
    expect(parseStored(JSON.stringify('just-a-string'), NOW)).toEqual({ envs: [], wasV3: false })
    expect(parseStored(JSON.stringify(null), NOW)).toEqual({ envs: [], wasV3: false })
  })
})
