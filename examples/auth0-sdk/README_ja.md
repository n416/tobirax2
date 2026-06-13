# 例：本物の Auth0 SDK を tobirax2 に向ける

> 🇬🇧 English version: [README.md](README.md)

**`express-openid-connect`**（Auth0 の**公式** Express SDK）で作った最小の
リライングパーティを、本物の Auth0 テナントの代わりに tobirax2 へ向けたものです。

これでログインできれば、tobirax2 が**本物の Auth0 ライブラリに標準のOIDC
プロバイダとして受理された**証拠になります。SDKはディスカバリ文書を読み、JWKSを
取得し、セッションを張る前に **`id_token` の RS256 署名と `iss` / `aud` / `nonce`
を検証**します。ごまかしは一切ありません。

実際の Auth0 設定と違うのは `issuerBaseURL` の1行だけ：

```js
issuerBaseURL: 'http://localhost:8787', // tobirax2（通常は https://YOUR.auth0.com）
clientID:      'app-test-1',
clientSecret:  'sdkが要求するだけで未使用',
```

## 前提

リポジトリのルートで、ローカル D1 をシード済みにしておきます：

```bash
# リポジトリのルートで
npm install
npx wrangler d1 execute tobira-mock-db --local --file ./schema.sql
npx wrangler d1 execute tobira-mock-db --local --file ./scripts/seed-test.sql
npm run dev        # IdP が http://localhost:8787 で起動
```

`seed-test.sql` はクライアント `app-test-1`（リダイレクト接頭辞
`http://localhost:3000`）を登録し、テストユーザーに権限を付与し、ログインを
作成します：**tester@example.com / admin1234**。

## 実行

```bash
cd examples/auth0-sdk
npm install
node index.js      # RP が http://localhost:3000 で起動
```

<http://localhost:3000> を開く → **ログイン（Auth0 SDK経由）** → tobira の画面で
ログイン → 検証済みの `id_token` クレームが表示されるページに戻ってきます。
再度開くとそのままログイン状態になります（tobira のセッションによるSSO）。

> 開発用専用。本番には絶対に向けないこと。
