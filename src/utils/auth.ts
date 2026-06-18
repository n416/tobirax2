import { compare, hash } from 'bcryptjs'

export const BCRYPT_COST = 12;

export async function hashPassword(password: string): Promise<string> {
  return await hash(password, BCRYPT_COST)
}

export async function verifyPassword(password: string, hashStr: string): Promise<boolean> {
  return await compare(password, hashStr)
}

export function getBcryptCost(hashStr: string): number {
  const parts = hashStr.split('$');
  if (parts.length >= 3) {
    return parseInt(parts[2], 10) || 0;
  }
  return 0;
}

export function generateToken(): string {
  return crypto.randomUUID()
}

export async function hashToken(token: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// ※ bcryptの仕様により、パスワードは最大72バイトで切り詰められる点に注意。DoS防止のため上限を設ける
export function validatePassword(password: string): boolean {
  return password.length >= 8 && password.length <= 72
}

export function getCookieOptions(expiresAt: number) {
  return {
    path: '/',
    secure: true,
    httpOnly: true,
    sameSite: 'Lax' as const,
    expires: new Date(expiresAt * 1000)
  }
}