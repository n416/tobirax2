import { describe, it, expect } from 'vitest'
import { requireSecret } from '../../src/utils/env'

// 秘密情報の取得。本番で未設定なら fail-closed(例外)で停止し、開発環境だけ
// フォールバック値を許す。安全側に倒れることを保証する重要なゲート。
describe('utils/env: requireSecret (fail-closed)', () => {
  const FALLBACK = 'dev-only-insecure-fallback'

  it('値が設定されていれば、環境に関わらずその値を返す', () => {
    const env = { OIDC_KEK: 'real-secret', ENVIRONMENT: 'production' } as any
    expect(requireSecret(env, 'OIDC_KEK', FALLBACK)).toBe('real-secret')
  })

  it('dev / development では未設定時にフォールバックを返す', () => {
    expect(requireSecret({ ENVIRONMENT: 'dev' } as any, 'OIDC_KEK', FALLBACK)).toBe(FALLBACK)
    expect(requireSecret({ ENVIRONMENT: 'development' } as any, 'OIDC_KEK', FALLBACK)).toBe(FALLBACK)
  })

  it('本番(production)で未設定なら例外を投げる', () => {
    expect(() => requireSecret({ ENVIRONMENT: 'production' } as any, 'OIDC_KEK', FALLBACK)).toThrow(
      /Missing required secret/,
    )
  })

  it('ENVIRONMENT 未設定(=本番扱い)で未設定なら例外を投げる', () => {
    // 既定で安全側: dev を明示しない限りフォールバックは許さない。
    expect(() => requireSecret({} as any, 'OIDC_KEK', FALLBACK)).toThrow(/Missing required secret/)
  })

  it('dev 以外の任意の環境(staging 等)でも未設定なら例外', () => {
    expect(() => requireSecret({ ENVIRONMENT: 'staging' } as any, 'OIDC_KEK', FALLBACK)).toThrow()
  })

  it('本番でも値が設定されていれば例外を投げない', () => {
    const env = { JWT_SECRET: 'set', ENVIRONMENT: 'production' } as any
    expect(() => requireSecret(env, 'JWT_SECRET', FALLBACK)).not.toThrow()
  })
})
