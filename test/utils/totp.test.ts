import { describe, it, expect } from 'vitest'
import { generateSecret, generateToken, verifyToken } from '../../src/utils/totp'

// 2FA(TOTP, RFC 6238)。otplib をラップしている。
describe('utils/totp: 2要素認証(TOTP)', () => {
  it('generateSecret は base32 のシークレットを返す', () => {
    const secret = generateSecret()
    expect(secret.length).toBeGreaterThanOrEqual(16)
    expect(secret).toMatch(/^[A-Z2-7]+$/) // base32 アルファベット
  })

  it('生成した直後のトークンは同じシークレットで検証が通る', () => {
    const secret = generateSecret()
    const token = generateToken(secret)
    expect(token).toMatch(/^\d{6}$/)
    expect(verifyToken(token, secret)).toBe(true)
  })

  it('別のシークレットで生成したトークンは検証に通らない', () => {
    const secretA = generateSecret()
    const secretB = generateSecret()
    const token = generateToken(secretA)
    expect(verifyToken(token, secretB)).toBe(false)
  })

  it('明らかに不正なトークンは false', () => {
    const secret = generateSecret()
    expect(verifyToken('000000', secret) && verifyToken('123456', secret)).toBe(false)
  })
})
