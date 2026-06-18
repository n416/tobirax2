export const te = new TextEncoder();
export const td = new TextDecoder();

export const b64u = (bin: Uint8Array): string => {
  let binStr = ''
  for (let i = 0; i < bin.length; i++) binStr += String.fromCharCode(bin[i])
  return btoa(binStr).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export const fromB64u = (s: string): Uint8Array => {
  s = s.replace(/-/g, '+').replace(/_/g, '/')
  while (s.length % 4) s += '='
  const bin = atob(s)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export async function deriveKek(kek: string | undefined): Promise<CryptoKey> {
  if (!kek) throw new Error('Missing KEK secret material');
  const hash = await crypto.subtle.digest('SHA-256', te.encode(kek));
  return crypto.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

/**
 * AES-GCM と指定された KEK (Key Encryption Key) を使用して平文のシークレットを暗号化します。
 * `v1:{iv_b64u}:{ct_b64u}` の形式の文字列を返します。
 */
export async function encryptSecret(plaintext: string, kekMaterial: string): Promise<string> {
    const key = await deriveKek(kekMaterial);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, te.encode(plaintext));
    return `v1:${b64u(iv)}:${b64u(new Uint8Array(ct))}`;
}

/**
 * 暗号化されたシークレットを復号します。
 * もし `v1:...` の封筒（エンベロープ）形式に一致しない場合は、
 * 平文であるとみなして（後方互換性のため）そのまま返します。
 */
export async function decryptSecret(ciphertext: string, kekMaterial: string): Promise<string> {
    if (!ciphertext.startsWith('v1:')) {
        return ciphertext; // レガシーな平文フォールバック
    }
    const parts = ciphertext.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted secret format');
    }
    const ivStr = parts[1];
    const ctStr = parts[2];
    
    const key = await deriveKek(kekMaterial);
    const iv = fromB64u(ivStr);
    const ct = fromB64u(ctStr);
    
    try {
        const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
        return td.decode(pt);
    } catch (e) {
        throw new Error('Failed to decrypt secret: ' + (e as Error).message);
    }
}
