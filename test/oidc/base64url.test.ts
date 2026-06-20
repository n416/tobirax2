import { describe, it, expect } from 'vitest'
import { bytesToBase64Url, strToBase64Url, base64UrlToBytes } from '../../src/oidc/jwt'

// JWT 署名/検証の土台となる base64url コーデック(RFC 4648 §5)。
// パディング除去・URL安全文字・バイナリ往復のエッジを直接突く。
describe('OIDC: base64url コーデック', () => {
  describe('bytesToBase64Url', () => {
    it('空配列は空文字', () => {
      expect(bytesToBase64Url(new Uint8Array([]))).toBe('')
    })

    it('末尾パディング(=)は除去される', () => {
      // "f" → "Zg==" (標準base64) だが url-safe ではパディングを落とす
      expect(bytesToBase64Url(new Uint8Array([0x66]))).toBe('Zg')
      // "fo" → "Zm8="
      expect(bytesToBase64Url(new Uint8Array([0x66, 0x6f]))).toBe('Zm8')
      // "foo" → "Zm9v" (パディング無し)
      expect(bytesToBase64Url(new Uint8Array([0x66, 0x6f, 0x6f]))).toBe('Zm9v')
    })

    it('+ と / は - と _ に置換される(URL安全)', () => {
      // 0xff 0xff 0xff は標準base64で "////"、0xfb 0xff は "+/8" を含む並び
      expect(bytesToBase64Url(new Uint8Array([0xff, 0xff, 0xff]))).toBe('____')
      const out = bytesToBase64Url(new Uint8Array([0xfb, 0xff, 0xbf]))
      expect(out).not.toMatch(/[+/=]/)
    })
  })

  describe('strToBase64Url', () => {
    it('ASCII 文字列を符号化', () => {
      expect(strToBase64Url('foobar')).toBe('Zm9vYmFy')
    })

    it('マルチバイト(UTF-8)を符号化', () => {
      // "あ" = U+3042 → UTF-8 E3 81 82
      expect(strToBase64Url('あ')).toBe(bytesToBase64Url(new Uint8Array([0xe3, 0x81, 0x82])))
    })
  })

  describe('base64UrlToBytes', () => {
    it('パディング無し入力を復元できる', () => {
      expect(Array.from(base64UrlToBytes('Zg'))).toEqual([0x66])
      expect(Array.from(base64UrlToBytes('Zm8'))).toEqual([0x66, 0x6f])
      expect(Array.from(base64UrlToBytes('Zm9v'))).toEqual([0x66, 0x6f, 0x6f])
    })

    it('- と _ を + と / として解釈する', () => {
      expect(Array.from(base64UrlToBytes('____'))).toEqual([0xff, 0xff, 0xff])
    })
  })

  describe('往復(round-trip)', () => {
    it('任意バイト列が bytes→str→bytes で一致する', () => {
      const samples: number[][] = [
        [],
        [0x00],
        [0x00, 0xff],
        [0x01, 0x02, 0x03, 0x04, 0x05],
        Array.from({ length: 256 }, (_, i) => i), // 全バイト値
      ]
      for (const s of samples) {
        const bytes = new Uint8Array(s)
        expect(Array.from(base64UrlToBytes(bytesToBase64Url(bytes)))).toEqual(s)
      }
    })

    it('文字列が str→base64url→bytes→decode で一致する', () => {
      const dec = new TextDecoder()
      for (const text of ['', 'a', 'hello world', 'あいうえお', '🚪 tobira']) {
        expect(dec.decode(base64UrlToBytes(strToBase64Url(text)))).toBe(text)
      }
    })
  })
})
