import { authenticator } from 'otplib';
import QRCode from 'qrcode';

// otplib の設定
authenticator.options = { 
    window: 1, // 時間のズレを考慮して前後のステップを1つ許容する
    step: 30
};

export function generateSecret() {
    return authenticator.generateSecret();
}

export function generateToken(secret: string) {
    return authenticator.generate(secret);
}

export function verifyToken(token: string, secret: string) {
    try {
        return authenticator.verify({ token, secret });
    } catch (e) {
        return false;
    }
}

/**
 * QRコード用のデータURL（SVG形式）を生成します。
 * Cloudflare Workers では Canvas/ImageMagick が不要な SVG 形式の使用が推奨されます。
 */
export async function generateQRCode(secret: string, accountName: string, issuer: string): Promise<string> {
    const otpauth = authenticator.keyuri(accountName, issuer, secret);
    // SVG文字列を返します。直接埋め込むか、Data URIとしてエンコードできます。
    // <img> の src 属性で使うため、Data URI 形式を採用します。
    const svgString = await QRCode.toString(otpauth, { type: 'svg', margin: 2 });
    
    // SVG文字列を Data URI に変換
    const base64Svg = btoa(svgString);
    return `data:image/svg+xml;base64,${base64Svg}`;
}
