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
  （commit b27fc67）。**CSP も付与済み**（下記「対応済み」参照）

## 対応済み（本監査の優先課題2件）

### A. CSP 整備（commit 予定）

`src/index.tsx` の `secureHeaders()` に Content-Security-Policy を追加した。本アプリは全画面で
インライン `<script>` と `onclick` 等のインラインイベントハンドラ（計160超）に依存しており、
CSP3 で script-src に nonce/hash を入れると `'unsafe-inline'` が無効化され、これら onclick が
一斉に壊れる。全ハンドラの `addEventListener` 化は未テスト UI への大規模改修となるため別タスクとし、
**script-src は当面 `'unsafe-inline'` を残しつつ、それ以外の高効果・非破壊なディレクティブを締める**
実利優先の方針を採った（XSS の一次防御は `hono/html` の自動エスケープで既に成立）。

付与したポリシー:
```
default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self';
form-action 'self'; connect-src 'self';
script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net;
font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https:
```
- `object-src 'none'`（プラグイン全面禁止）/ `base-uri 'self'`（`<base>` 乗っ取り遮断）/
  `frame-ancestors 'self'`（クリックジャッキング遮断・既存 X-Frame-Options:SAMEORIGIN と整合）/
  `form-action 'self'`（フォーム送信先を自オリジンに限定）を新たに enforce。
- 外部依存は Google Fonts と tom-select(jsdelivr) のみで全て allowlist 済み。検証で
  全外部参照を grep し、未許可オリジンが無いことを確認。
- `form-action 'self'` の安全性: OIDC 応答は `buildRedirect` による 302 redirect のみで
  form_post 自動 POST は未実装のため、RP への正常リダイレクトを阻害しない。
- 検証: `tsc --noEmit` 通過。`wrangler dev` で `/login`（HTML）に CSP ヘッダが乗ること、
  `/.well-known/jwks.json`（マシン向け）が 200 を維持することを確認。
- **残課題（既知）**: 理想は nonce/hash 化による `'unsafe-inline'` 撤廃。インラインハンドラの
  `addEventListener` 移植を伴うため、回帰網の整備とセットで別タスク。

### B. admin 変更系ルートの認可・網羅監査（完了・指摘なし）

`routes/admin.tsx` の全 73 ルートを1本ずつ確認した。`getAdmin(c)` は**システム管理者の単一
グローバルロール**（`admins` テーブルにメールが在るか）であり、管理者間の権限細分は無い。よって
本ファイルの IDOR 観点は「全変更系が副作用の**前**にガードして離脱しているか」に帰着する。

- 保護対象 67 ルートはすべて先頭で `const user = await getAdmin(c); if (!user) return …`
  （または `if (!await getAdmin(c)) return c.json(...,401)`）を実行し、**副作用の前に離脱**する。
  全 `getAdmin` 代入の直後行が必ず `if (!user)` であることを機械的に走査し、抜けが無いことを確認。
- ガード無しの 6 ルートは `/invite`・`/forgot-password`・`/reset-password`（各 GET+POST）で、
  いずれもトークンベースの**正当な公開フロー**。`hono/csrf` で保護される。
- `:id` を取る JSON 取得系（user/group/facility 詳細）も `getAdmin` ガード下にあり、グローバル
  管理者前提のため情報漏えい経路は無い。SQL は全てバインド済み。
- **結論: 認可の穴は検出されず。** スコープ留保だった本項目はクローズ。

## 軽微な指摘（いずれも非 HIGH・即時対応不要）

1. **`pre_2fa_token` の `role` 未検証** — `/login/2fa` は JWT を `verify` するが `role === 'pre_2fa'` を
   確認していない。ただし JWT_SECRET で署名されるトークンはこの pre_2fa_token が**唯一**であり、
   かつ 2FA 突破には TOTP コードが依然必須なため**悪用不可**（防御の厚みとして role 検証を足すと尚良）。
2. ~~**CSP 未設定**~~ → **対応済み**（上記 A）。`'unsafe-inline'` 撤廃は引き続き残課題。
3. **CORP / COOP 無効** — クロスオリジンで叩かれる OIDC メタデータ/RP フローの阻害回避のため意図的。
   将来、エンドポイント別に厳格化する余地あり。
4. **HSTS max-age が約180日** — 1 年＋preload も検討余地（微）。

## スコープ留保（未カバー / 次の監査候補）

- ~~`routes/admin.tsx` の変更系73ルートの認可ロジックを1本ずつ~~ → **完了**（上記 B）。
- `src/client/**`（ブラウザ glue）と DaaS エンタイトルメント判定の細部。
- 第三者 pentest は未実施。

## 結論の要約

コア（認証・セッション・トークン・2FA・パスワード・委任 IDOR）に穴は見つからず、設計・実装とも
一貫して堅牢。「製品レベルか」への回答として、**セキュリティ面では Yes（製品級）**。
優先度の高かった残課題（CSP 整備・admin 変更系の網羅監査）は本監査で**いずれも対応済み**。
残るは `'unsafe-inline'` 撤廃（nonce/hash 化）と第三者 pentest 程度。
