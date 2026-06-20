import { describe, it, expect } from 'vitest'
import { verifyPkce } from '../../src/oidc/jwt'

// OIDC / OAuth 2.1 の PKCE (RFC 7636) 検証ロジック。
// 本システムは S256 のみ受理し、plain は廃止済み。
describe('OIDC: PKCE (RFC 7636)', () => {
  // RFC 7636 Appendix B の公式テストベクタ。
  const VERIFIER = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'
  const CHALLENGE = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM'

  it('challenge が無ければ PKCE 未要求として常に true', async () => {
    expect(await verifyPkce('anything', null, null)).toBe(true)
    expect(await verifyPkce('', undefined, undefined)).toBe(true)
  })

  it('challenge があるのに verifier が空なら false', async () => {
    expect(await verifyPkce('', CHALLENGE, 'S256')).toBe(false)
  })

  it('S256 で正しい verifier なら true (RFC 7636 公式ベクタ)', async () => {
    expect(await verifyPkce(VERIFIER, CHALLENGE, 'S256')).toBe(true)
  })

  it('S256 で verifier が一致しなければ false', async () => {
    expect(await verifyPkce('wrong-verifier', CHALLENGE, 'S256')).toBe(false)
  })

  it('メソッドが S256 以外(plain 等)なら false', async () => {
    // /authorize で既に拒否しているが、トークン側の多層防御として false を返す。
    expect(await verifyPkce(VERIFIER, CHALLENGE, 'plain')).toBe(false)
    expect(await verifyPkce(VERIFIER, CHALLENGE, undefined)).toBe(false)
  })

  it('メソッドの大文字小文字は無視される', async () => {
    expect(await verifyPkce(VERIFIER, CHALLENGE, 's256')).toBe(true)
  })
})
