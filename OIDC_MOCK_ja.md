# tobirax2 — Auth0 OIDC モック

> 🇬🇧 English version: [OIDC_MOCK.md](OIDC_MOCK.md)

**tobira** をフォークし、OpenID Connect の「皮」を被せたものです。ローカル開発で
**Auth0 の代役**として使えます。tobira のきれいなログインUI・ユーザー/グループ
管理・2FA はそのまま使えて、外から見ると Auth0 SDK には標準のOIDCプロバイダに
見えます。

> ⚠️ **開発用モック専用。** レート制限などの堅牢化はありません（必要なら
> Cloudflare の Rate Limiting / WAF を前段に置いてください）。RSA署名鍵は
> データベースごとに生成され（リポジトリには入っていない）、リポジトリを見ただけ
> では偽造できませんが、これはあくまでモックです。本物のIdPとしては絶対に使わない
> でください。

## 実装しているもの

| エンドポイント | 役割 |
|---|---|
| `GET /.well-known/openid-configuration` | ディスカバリ文書 |
| `GET /.well-known/jwks.json` | id_token 検証用の公開鍵（RS256） |
| `GET /authorize` | 認可コードフロー（PKCE対応） |
| `POST /oauth/token` | `authorization_code` + `refresh_token` グラント → `id_token`（RS256 JWT）＋ opaque な `access_token` |
| `GET\|POST /userinfo` | Bearer access_token に対する OIDC クレーム |
| `GET /oidc/logout` | RP起点ログアウト（`post_logout_redirect_uri` / `returnTo`） |

メモ：
- `access_token` は **opaque**（`/userinfo` で解決）。Auth0 が API audience 未指定の
  ときの挙動に合わせています。`id_token` は本物の RS256 JWT です。
- **クライアント認証を強制します。** `client_secret` が登録されたアプリは
  *機密*クライアントで、token時にsecret必須＆定数時間で照合します。secretなしの
  アプリは*公開*クライアントで、代わりに PKCE（S256 / plain）が必須です。
- tobira の **アプリ別権限ゲートは `/authorize` で有効**です。ユーザーがそのアプリの
  有効な権限を持たない場合、RP には `error=access_denied` が返ります。

## セットアップ

```bash
npm install

# ローカル D1 にスキーマを適用
npx wrangler d1 execute tobira-mock-db --local --file ./schema.sql

# （既存DBのみ）auth_codes に OIDC 用カラムを追加
# npx wrangler d1 execute tobira-mock-db --local --file ./scripts/oidc-migration.sql

npm run dev   # -> http://localhost:8787
```

`scripts/manage-admin.*` で管理者＋ユーザーを作成し、一度
`http://localhost:8787/login` からログインしておきます。

> 動作確認だけならテスト用フィクスチャが手軽です：
> `npx wrangler d1 execute tobira-mock-db --local --file ./scripts/seed-test.sql`
> （`tester@example.com` / `admin1234`、クライアント `app-test-1` を登録）

## クライアント（リライングパーティ）の登録

**管理画面 → Apps** でアプリを追加します：

- **name** — 任意
- **base_url** — `redirect_uri` が前方一致すべき接頭辞。例：`http://localhost:3000`

アプリの **id** が `client_id` になります。ユーザー（またはそのグループ）にその
アプリの権限を付与してください。さもないと `/authorize` が `access_denied` を返します。

新規アプリは**機密クライアント**として作成され、`client_secret` が生成されて編集
モーダルに表示されます。バックエンド系SDKの設定にコピーしてください。**公開
クライアント**（SPA。例：`@auth0/auth0-react`）にしたい場合は、編集モーダルの
**Make public (SPA)** を押して secret を消すと、代わりに PKCE が必須になります。

## Auth0 SDK の向き先を設定する

issuer は**末尾スラッシュなし**で指定：`http://localhost:8787`。

実際に動く例は [`examples/auth0-sdk/`](examples/auth0-sdk/)（`express-openid-connect`）を参照。

### React SPA (`@auth0/auth0-react`)
```tsx
<Auth0Provider
  domain="localhost:8787"          // issuer の origin
  clientId="<アプリのid>"
  authorizationParams={{ redirect_uri: window.location.origin }}
  // auth0-react は自動で Authorization Code + PKCE を使う
/>
```
SDKが `https://${domain}` を強制する場合は、`domain` をhttpsトンネルに向けるか、
モック自体をhttps化してください。

### Express (`express-openid-connect`)
```js
auth({
  issuerBaseURL: 'http://localhost:8787',
  baseURL: 'http://localhost:3000',
  clientID: '<アプリのid>',
  clientSecret: '<管理画面の編集モーダルに表示される client_secret>',
  authorizationParams: { response_type: 'code', scope: 'openid profile email' },
})
```

### Next.js (`@auth0/nextjs-auth0`)
```
AUTH0_ISSUER_BASE_URL=http://localhost:8787
AUTH0_CLIENT_ID=<アプリのid>
AUTH0_CLIENT_SECRET=<管理画面の編集モーダルに表示される client_secret>
AUTH0_BASE_URL=http://localhost:3000
```

## 署名鍵について

RS256 の鍵ペアは初回利用時に生成され、`system_config` テーブル（`oidc_keys`
行）に保存されます。データベースごとに固有で、ソースには含まれません。

**保存時の多層防御**：
- **秘密鍵は AES-256-GCM で暗号化**して保存します。鍵（KEK）は `OIDC_KEK`
  シークレット（本番は `wrangler secret put OIDC_KEK`、ローカルは未設定時に
  開発用の既定値）から SHA-256 で導出します。→ **DBだけが漏れても署名鍵は
  復号できません**（バックアップ流出や読み取り専用トークン漏洩に対する一段の砦）。
- 公開鍵と `kid` は JWKS で公開する情報なので平文のまま保存します。

**自動ローテーション（JWKS重複方式）**：
- 鍵は複数保持できるセット（v3）として保存され、**署名は常に最新の鍵**で行います。
- 最新鍵が `ROTATION_INTERVAL`（既定30日）を超えると、次回リクエストで新しい鍵を
  生成して署名を切り替えます。**旧鍵の公開鍵は `RETENTION`（既定37日）までJWKSに
  残す**ので、発行済みトークンは引き続き検証可能（`kid` で識別）。期限を過ぎた鍵は
  剪定されます。
- クライアント側は「**未知の `kid` が来たらJWKSを再取得**」する標準的な実装にして
  おけば、ローテーションを透過的に追従できます（`examples/cf-demo` がその実装例）。

手動ローテーション（即時、既存トークンを無効化）するには行を削除すれば次のリクエストで
再生成されます。`OIDC_KEK` を変更した場合も、旧封筒が復号できなくなるため自動で
再生成されます。

```bash
npx wrangler d1 execute tobira-mock-db --local --command "DELETE FROM system_config WHERE key='oidc_keys';"
```
