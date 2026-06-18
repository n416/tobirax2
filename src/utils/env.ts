import { Env } from '../types'

/**
 * 開発環境(ENVIRONMENT='dev'等)のときのみ、フォールバック値を許容するヘルパー。
 * 本番環境(ENVIRONMENTが設定されていない、または'dev'以外)で秘密情報が未設定の場合は、
 * 安全のために fail-closed (例外を投げて停止) とします。
 */
export function requireSecret(env: Env, name: keyof Env, fallback: string): string {
    const value = env[name] as string | undefined;
    if (value) return value;
    
    if (env.ENVIRONMENT === 'development' || env.ENVIRONMENT === 'dev') {
        return fallback;
    }
    
    throw new Error(`Missing required secret: ${String(name)}. Cannot fallback to insecure default in production.`);
}
