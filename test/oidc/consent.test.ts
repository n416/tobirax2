import { describe, it, expect } from 'vitest'
import { parseScopeSet, scopesCovered } from '../../src/oidc/consent'

// OIDC 同意(consent)のスコープ網羅判定。記憶済み同意で同意画面をスキップできるかの中核。
describe('OIDC: consent scope coverage', () => {
  describe('parseScopeSet', () => {
    it('空白区切りを集合化し、空要素は除く', () => {
      expect([...parseScopeSet('openid profile  email')].sort()).toEqual(['email', 'openid', 'profile'])
    })
    it('null/空は空集合', () => {
      expect(parseScopeSet(null).size).toBe(0)
      expect(parseScopeSet('').size).toBe(0)
    })
  })

  describe('scopesCovered', () => {
    it('保存済みが要求を完全に含めば true', () => {
      expect(scopesCovered('openid profile email', 'openid profile')).toBe(true)
      expect(scopesCovered('openid profile email offline_access', 'openid email')).toBe(true)
    })
    it('要求が保存済みと同一なら true', () => {
      expect(scopesCovered('openid profile', 'openid profile')).toBe(true)
    })
    it('要求に未同意のスコープが1つでもあれば false(再同意が必要)', () => {
      expect(scopesCovered('openid profile', 'openid profile email')).toBe(false)
      expect(scopesCovered('openid', 'openid offline_access')).toBe(false)
    })
    it('保存済みが無い(null)なら、空要求のみ true', () => {
      expect(scopesCovered(null, 'openid')).toBe(false)
      expect(scopesCovered(null, '')).toBe(true)
    })
    it('順序や余分な空白に依存しない', () => {
      expect(scopesCovered('email   openid  profile', 'profile openid')).toBe(true)
    })
  })
})
