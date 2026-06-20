import { describe, it, expect } from 'vitest'
import { tokenError, bearerUnauthorized } from '../../src/oidc/helpers'

// OAuth2/OIDC のエラー応答の組み立て。Hono コンテキストは最小限モックする。
function mockCtx() {
  const headers: Record<string, string> = {}
  const captured: { body?: unknown; status?: number } = {}
  const c = {
    header: (k: string, v: string) => {
      headers[k] = v
    },
    json: (body: unknown, status?: number) => {
      captured.body = body
      captured.status = status
      return { body, status } as any
    },
  }
  return { c: c as any, headers, captured }
}

describe('OIDC: tokenError (RFC 6749 §5.2)', () => {
  it('error と error_description を JSON で返し、既定ステータスは 400', () => {
    const { c, captured } = mockCtx()
    tokenError(c, 'invalid_grant', 'code expired')
    expect(captured.body).toEqual({ error: 'invalid_grant', error_description: 'code expired' })
    expect(captured.status).toBe(400)
  })

  it('クライアント認証失敗は 401 を指定できる', () => {
    const { c, captured } = mockCtx()
    tokenError(c, 'invalid_client', 'auth failed', 401)
    expect(captured.status).toBe(401)
  })
})

describe('OIDC: bearerUnauthorized (RFC 6750 §3 WWW-Authenticate)', () => {
  it('認証情報が無いときは error コードを省いた素のチャレンジ', () => {
    const { c, headers, captured } = mockCtx()
    bearerUnauthorized(c)
    expect(headers['WWW-Authenticate']).toBe('Bearer realm="tobira"')
    expect(captured.status).toBe(401)
    // ボディ側は既定で invalid_request 扱い。
    expect((captured.body as any).error).toBe('invalid_request')
  })

  it('無効/失効トークンは error と error_description をチャレンジに含める', () => {
    const { c, headers, captured } = mockCtx()
    bearerUnauthorized(c, 'invalid_token', 'the access token is invalid or expired')
    expect(headers['WWW-Authenticate']).toBe(
      'Bearer realm="tobira", error="invalid_token", error_description="the access token is invalid or expired"',
    )
    expect(captured.body).toEqual({
      error: 'invalid_token',
      error_description: 'the access token is invalid or expired',
    })
    expect(captured.status).toBe(401)
  })

  it('error はあるが description が無ければ error のみ付与', () => {
    const { c, headers } = mockCtx()
    bearerUnauthorized(c, 'invalid_token')
    expect(headers['WWW-Authenticate']).toBe('Bearer realm="tobira", error="invalid_token"')
  })
})
