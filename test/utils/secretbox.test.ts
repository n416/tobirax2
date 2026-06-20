import { describe, it, expect } from 'vitest'
import { encryptSecret, decryptSecret, b64u, fromB64u } from '../../src/utils/secretbox'

// アプリのクライアントシークレット等を保存時暗号化する AES-GCM エンベロープ。
describe('utils/secretbox: シークレットの保存時暗号化', () => {
  const KEK = 'test-kek-material-do-not-use-in-prod'

  it('暗号化→復号でラウンドトリップする', async () => {
    const plaintext = 'super-secret-client-credential'
    const ct = await encryptSecret(plaintext, KEK)
    expect(ct).not.toBe(plaintext)
    expect(await decryptSecret(ct, KEK)).toBe(plaintext)
  })

  it('暗号文は v1 エンベロープ形式 (v1:iv:ct)', async () => {
    const ct = await encryptSecret('x', KEK)
    expect(ct).toMatch(/^v1:[A-Za-z0-9_-]+:[A-Za-z0-9_-]+$/)
  })

  it('同じ平文でも IV が異なるため毎回違う暗号文になる', async () => {
    const a = await encryptSecret('same', KEK)
    const b = await encryptSecret('same', KEK)
    expect(a).not.toBe(b)
    expect(await decryptSecret(a, KEK)).toBe('same')
    expect(await decryptSecret(b, KEK)).toBe('same')
  })

  it('v1: プレフィックスが無ければ平文とみなしてそのまま返す(後方互換)', async () => {
    expect(await decryptSecret('legacy-plaintext-secret', KEK)).toBe('legacy-plaintext-secret')
  })

  it('別の KEK では復号に失敗して例外を投げる', async () => {
    const ct = await encryptSecret('secret', KEK)
    await expect(decryptSecret(ct, 'a-different-kek')).rejects.toThrow()
  })

  it('壊れた v1 形式(セグメント数不正)は例外を投げる', async () => {
    await expect(decryptSecret('v1:onlyonepart', KEK)).rejects.toThrow('Invalid encrypted secret format')
  })
})

describe('utils/secretbox: base64url ヘルパ', () => {
  it('任意のバイト列を b64u→fromB64u でラウンドトリップする', () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 251, 255, 127, 128])
    expect(Array.from(fromB64u(b64u(bytes)))).toEqual(Array.from(bytes))
  })

  it('空のバイト列は空文字列にエンコードされる', () => {
    expect(b64u(new Uint8Array([]))).toBe('')
    expect(fromB64u('').length).toBe(0)
  })

  it('パディング(=)を含まない URL セーフな文字のみ', () => {
    // 1〜32 バイトのどの長さでも = や +/ が出ないこと。
    for (let n = 1; n <= 32; n++) {
      const s = b64u(new Uint8Array(n).fill(255))
      expect(s).not.toMatch(/[+/=]/)
    }
  })

  it('既知ベクタ: "M" (0x4d) は "TQ"', () => {
    expect(b64u(new Uint8Array([0x4d]))).toBe('TQ')
  })
})
