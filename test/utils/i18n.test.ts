import { describe, it, expect } from 'vitest'
import { dict } from '../../src/i18n'
import { getLang, getLocalizedValue } from '../../src/index'

// 言語判定(Accept-Language)と辞書のローカライズ。
describe('utils/i18n: 言語判定とローカライズ', () => {
  const ctx = (acceptLanguage: string | undefined) =>
    ({ req: { header: (h: string) => (h === 'Accept-Language' ? acceptLanguage : undefined) } }) as any

  describe('getLang', () => {
    it('Accept-Language に ja を含めば日本語辞書', () => {
      expect(getLang(ctx('ja'))).toBe(dict.ja)
      expect(getLang(ctx('ja-JP,ja;q=0.9,en;q=0.8'))).toBe(dict.ja)
    })
    it('ja を含まなければ英語辞書', () => {
      expect(getLang(ctx('en-US,en;q=0.9'))).toBe(dict.en)
    })
    it('ヘッダが無ければ英語辞書(既定)', () => {
      expect(getLang(ctx(undefined))).toBe(dict.en)
    })
  })

  describe('getLocalizedValue', () => {
    const text = { ja: '日本語', en: 'English' }
    it('ja を含めば ja の値', () => {
      expect(getLocalizedValue(ctx('ja'), text)).toBe('日本語')
    })
    it('それ以外は en の値', () => {
      expect(getLocalizedValue(ctx('en'), text)).toBe('English')
      expect(getLocalizedValue(ctx(undefined), text)).toBe('English')
    })
  })

  describe('辞書のキー整合性', () => {
    it('en と ja は同じキー集合を持つ(翻訳漏れ防止)', () => {
      const en = Object.keys(dict.en).sort()
      const ja = Object.keys(dict.ja).sort()
      expect(ja).toEqual(en)
    })
  })
})
