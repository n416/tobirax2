# セキュリティ監査（認証 / OIDC 表面）

実施日: 2026-06-21。対象: 認証・セッション・OIDC/OAuth2・2FA・パスワード・委任管理の認可。
手法: コード読了による手動レビュー（差分スコープの `/security-review` ではなく、本体ロジックを対象）。

## 総合結論

**認証 / OIDC のコアは実運用品質。HIGH / MEDIUM の具体的かつ悪用可能な脆弱性は検出されなかった。**
もはや「モック」ではなく、セキュリティ面では製品級に到達している。残るのは CSP 等の hardening と、
admin 変更系ルートの網羅監査程度（下記スコープ留保）。

## 精査した範囲（実コード読了）

- **認証**: `/login`（IP＋アカウント別レート制限、汎用エラー、bcrypt cost12＋ログイン時コスト昇格）、
  `/signup`（列挙対策で成功/既存とも同一応答）、`/logout`、`/change-password`（現パス確認→新パス検証→
  全セッション＋app_sessions 失効）
- **2FA (TOTP)**: setup（`verifyToken` 成功後に KEK で `encryptSecret` 保存）/ disable（現パス必須）/
  verify `/login/2fa`（HS256 固定検証、IP＋ユーザー別レート制限、TOTP 必須、秘密は復号して照合）
- **セッション**: 乱数 UUID → SHA-256 ハッシュで保存（`sessions.id`）、`expires_at` 照合、
  `__Host-` プレフィックス＋Secure/HttpOnly/SameSite=Lax cookie
- **OIDC/OAuth2**（`routes/oidc.tsx`）:
  - `/authorize`: redirect_uri 厳格検証、PKCE は S256 のみ（plain 拒否）、prompt/max_age 対応、
    code は単回・5分・auth_time 持ち込み
  - `/oauth/token`: code 単回消費（条件付き UPDATE の `changes` 判定）、redirect_uri 一致必須、
    PKCE 検証、クライアント認証、refresh は回転＋再利用拒否、scope/auth_time 保持
  - `/userinfo`・`/oauth/revoke`(7009)・`/oauth/introspect`(7662)・`/oidc/logout`(RP-Initiated)・
    `/entitlements/me`
  - トークン発行 `issueOidcTokens`: access/refresh は不透明乱数を SHA-256 ハッシュ保存、
    id_token は RS256（鍵ローテーション）、at_hash/nonce/auth_time 適切、refresh は offline_access 時のみ返却
  - 鍵管理 `oidc/keys.ts`: 秘密鍵は AES-256-GCM で保存時暗号化（KEK 由来）、重複期間つきローテーション
- **委任管理の認可（IDOR）**: `routes/group-admin.tsx` の変更系は軒並み
  `getManagedGroupIds(c, user.id)` → `managed.has(対象グループ)` でなければ 403。
  施設・契約も `managedIds` でフィルタ。管理ツリー外への操作経路は塞がれている
- **管理者ルート**: `routes/admin.tsx` は 73 ルート中 68 で `getAdmin(c)` を呼ぶ。`getAdmin` 非依存の 6 は
  `/invite`・`/forgot-password`・`/reset-password`（GET+POST）＝**正当に公開**のトークンベース・フロー
- **公開フロー**（パスワード設定/リセット）: トークンは SHA-256 ハッシュ保存・期限付き・
  `/reset-password` は `DELETE … RETURNING` で**原子的消費**（同時2回不可）、forgot は列挙対策＋IP レート制限、
  リセット成功時に全セッション＋app_sessions 失効。**アカウント乗っ取り経路なし**
- **暗号/シークレット**: AES-GCM（`secretbox`）、bcrypt、`safeEqual` 定数時間比較、`requireSecret` は
  本番で未設定なら例外（fail-closed）、シークレットの保存時暗号化
- **XSS/入力**: プロフィールは `<>` 除去＋`picture` は http(s) URL 限定、描画は `hono/html` の自動エスケープ。
  SQL は全て prepared statement（バインド）
- **CSRF**: HTML フォーム系を `hono/csrf` で保護（OIDC マシン向けエンドポイントは設計どおり除外）
- **セキュリティヘッダ**: `secureHeaders()` で X-Frame-Options / nosniff / HSTS / Referrer-Policy 等を付与
  （commit b27fc67）

## 軽微な指摘（いずれも非 HIGH・即時対応不要）

1. **`pre_2fa_token` の `role` 未検証** — `/login/2fa` は JWT を `verify` するが `role === 'pre_2fa'` を
   確認していない。ただし JWT_SECRET で署名されるトークンはこの pre_2fa_token が**唯一**であり、
   かつ 2FA 突破には TOTP コードが依然必須なため**悪用不可**（防御の厚みとして role 検証を足すと尚良）。
2. **CSP 未設定** — 生成クライアント JS を HTML にインライン埋め込みする構成のため、nonce/hash 整備を
   伴う別タスク（既知・保留）。
3. **CORP / COOP 無効** — クロスオリジンで叩かれる OIDC メタデータ/RP フローの阻害回避のため意図的。
   将来、エンドポイント別に厳格化する余地あり。
4. **HSTS max-age が約180日** — 1 年＋preload も検討余地（微）。

## スコープ留保（未カバー / 次の監査候補）

- `routes/admin.tsx` の**変更系73ルートの認可ロジックを1本ずつ**は追い切れていない（`getAdmin` ガードの
  存在は確認済みだが、各ハンドラ内の対象スコープ検証までは個別未確認）。
- `src/client/**`（ブラウザ glue）と DaaS エンタイトルメント判定の細部。
- 第三者 pentest は未実施。

## 結論の要約

コア（認証・セッション・トークン・2FA・パスワード・委任 IDOR）に穴は見つからず、設計・実装とも
一貫して堅牢。「製品レベルか」への回答として、**セキュリティ面では Yes（製品級）**。
優先度の高い残課題は CSP 整備と admin 変更系の網羅監査。
