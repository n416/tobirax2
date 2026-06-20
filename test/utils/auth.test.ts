import { describe, it, expect } from 'vitest'
import {
  hashToken,
  validatePassword,
  getBcryptCost,
  generateToken,
  hashPassword,
  verifyPassword,
  BCRYPT_COST,
} from '../../src/utils/auth'

// 不透明トークンのハッシュ化・パスワード検証など、認証まわりの素材関数。
describe('utils/auth: トークンとパスワード', () => {
  describe('hashToken (SHA-256 hex)', () => {
    it('同じ入力は同じハッシュ(決定的)', async () => {
      expect(await hashToken('abc')).toBe(await hashToken('abc'))
    })

    it('既知のベクタ: SHA-256("abc")', async () => {
      expect(await hashToken('abc')).toBe(
        'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
      )
    })

    it('64文字の16進文字列を返す', async () => {
      expect(await hashToken('whatever')).toMatch(/^[0-9a-f]{64}$/)
    })
  })

  describe('validatePassword', () => {
    it('8〜72文字を有効とする', () => {
      expect(validatePassword('a'.repeat(7))).toBe(false)
      expect(validatePassword('a'.repeat(8))).toBe(true)
      expect(validatePassword('a'.repeat(72))).toBe(true)
      // bcrypt が 72 バイトで切り詰めるため上限を 72 にしている。
      expect(validatePassword('a'.repeat(73))).toBe(false)
    })
  })

  describe('getBcryptCost', () => {
    it('bcrypt ハッシュからコスト係数を取り出す', () => {
      expect(getBcryptCost('$2b$12$abcdefghijklmnopqrstuv')).toBe(12)
      expect(getBcryptCost('$2a$10$abcdefghijklmnopqrstuv')).toBe(10)
    })
    it('bcrypt 形式でなければ 0', () => {
      expect(getBcryptCost('not-a-hash')).toBe(0)
    })
  })

  describe('generateToken', () => {
    it('UUID 形式のトークンを返し、毎回異なる', () => {
      const a = generateToken()
      const b = generateToken()
      expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
      expect(a).not.toBe(b)
    })
  })

  describe('hashPassword / verifyPassword', () => {
    it('現行コスト係数でハッシュ化し、正しいパスワードのみ検証が通る', async () => {
      const hash = await hashPassword('correct horse battery staple')
      expect(getBcryptCost(hash)).toBe(BCRYPT_COST)
      expect(await verifyPassword('correct horse battery staple', hash)).toBe(true)
      expect(await verifyPassword('wrong password', hash)).toBe(false)
    })
  })
})
