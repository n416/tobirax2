# 🐵 サルでもわかる tobirax2 デプロイガイド（日本語版）

このドキュメントは、コマンドをコピペするだけで

1. **tobirax2（認証サーバー＝IdP）** を Cloudflare に本番公開する
2. **アプリ（クライアント）を登録**する
3. **サンプルデモ `examples/auth0-sdk`（Auth0 公式 SDK のデモ）** を動かして、ちゃんと認証できることを確認する

——ここまでを、できるだけ迷わず進められることを目標にしています。

> ⚠️ **大前提：これは「Auth0 のモック（開発用の代役）」です。**
> 学習・検証・社内デモには使えますが、**本物の Auth0 の代わりに本番サービスの認証基盤として使ってはいけません**。レート制限などの堅牢化は入っていません。詳しくは [OIDC_MOCK_ja.md](OIDC_MOCK_ja.md) を参照。

---

## 0. 全体像（まずこれだけ理解すればOK）

登場人物は2人だけです。

```
┌─────────────────────────┐         ┌──────────────────────────┐
│  ① tobirax2 (IdP)        │         │  ② デモアプリ (RP)         │
│  = ログイン画面を出す側    │  ←───→  │  = ログインを「お願い」する側 │
│  Cloudflare Workers に公開 │         │  Auth0公式SDKで作られている   │
│  例: https://xxx.workers.dev│         │  例: http://localhost:3000  │
└─────────────────────────┘         └──────────────────────────┘
        ↑ D1 (データベース)
        ユーザー・アプリ・権限を保存
```

- **① tobirax2** … 「ログインさせる人」。Cloudflare Workers + D1（データベース）で動きます。**これを本番公開するのがこのガイドのメイン作業**です。
- **② デモアプリ (auth0-sdk)** … 「ログインを使う人（＝あなたが作るアプリ役）」。Auth0 の公式 SDK を①に向けるだけで動きます。

用語の対応（Auth0 を触ったことがある人向け）：

| Auth0 の用語 | tobirax2 での実体 |
|---|---|
| テナント（`https://xxx.auth0.com`） | tobirax2 を公開した URL（`https://xxx.workers.dev`） |
| Application（アプリ） | 管理画面で登録する「App」。`id` が `client_id` になる |
| Client Secret | App 作成時に自動生成され、編集画面に表示される |
| Callback URL | App の `base_url`（リダイレクト先の前方一致プレフィックス） |

---

## 1. 事前準備（最初の1回だけ）

### 1-1. 必要なもの

- **Node.js 18 以上**（`node -v` で確認）
- **Cloudflare アカウント**（無料プランでOK） … 持っていなければ <https://dash.cloudflare.com/sign-up> で作成
- このリポジトリ（`tobirax2`）をクローン済みであること

### 1-2. 依存パッケージのインストール

リポジトリのルート（`tobirax2/` フォルダ）で：

```bash
npm install
```

### 1-3. Cloudflare にログイン

```bash
npx wrangler login
```

ブラウザが開くので「**Allow（許可）**」を押します。ターミナルに `Successfully logged in.` と出ればOK。

確認：

```bash
npx wrangler whoami
```

自分のアカウント名・メールが表示されれば準備完了です。

> 💡 ブラウザが使えないサーバー等の場合は、Cloudflare ダッシュボードで API トークンを作り、
> `export CLOUDFLARE_API_TOKEN=xxxxx`（PowerShell なら `$env:CLOUDFLARE_API_TOKEN="xxxxx"`）でも代用できます。

---

## 2. tobirax2（認証サーバー）を本番公開する

ここがメイン作業です。**上から順にコピペ**していけば公開できます。

### 2-1. 本番用データベース（D1）を作る

```bash
npx wrangler d1 create tobira-mock-db
```

実行すると、こんな出力が返ってきます：

```toml
[[d1_databases]]
binding = "DB"
database_name = "tobira-mock-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"   ← これが大事！
```

この **`database_id`（長いランダムな文字列）をコピー**しておきます。

### 2-2. `wrangler.toml` を書き換える

`wrangler.toml` を開き、`database_id` を 2-1 でコピーした値に置き換えます。
あわせて `JWT_SECRET` を**自分だけの長いランダム文字列**に変えてください（これはセッション署名に使われます）。

ランダム文字列の作り方（どれか一つ）：

```bash
# Mac/Linux
openssl rand -hex 32
# Windows PowerShell
[guid]::NewGuid().ToString() + [guid]::NewGuid().ToString()
```

書き換え後の `wrangler.toml`（例）：

```toml
name = "tobirax2"
main = "src/index.tsx"
compatibility_date = "2025-12-22"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "tobira-mock-db"
database_id = "ここに 2-1 でコピーした本物のIDを貼る"

[vars]
JWT_SECRET = "ここに自分で作った長いランダム文字列を貼る"
```

> 🔐 もっと安全にしたい場合は、`[vars]` から `JWT_SECRET` の行を消し、
> 代わりに `npx wrangler secret put JWT_SECRET` で登録すると、値が dashboard に平文表示されなくなります（任意）。

#### 署名鍵の暗号化キー（OIDC_KEK）を設定（推奨）

OIDC の署名用 RSA 秘密鍵は DB に保存されますが、**AES-256-GCM で暗号化**されます。
その暗号化キー（KEK）を Worker シークレットとして登録しておくと、**DBが漏れても
署名鍵が復号されません**（未設定でも開発用の既定値で動きますが、本番では必ず設定を）。

```bash
# 32バイトのランダム値を生成して登録（プロンプトに貼り付け）
npx wrangler secret put OIDC_KEK
```

既に鍵を生成済みのDBで `OIDC_KEK` を後から変えると、署名鍵は自動で再生成されます
（発行済みトークンは無効化）。

### 2-3. データベースに「表」を作る（スキーマ適用）

`--remote` を付けると、**本番（Cloudflare 上）の DB** に対して実行されます。

```bash
npx wrangler d1 execute tobira-mock-db --remote --file ./schema.sql
```

`Executed N commands` のように出れば成功です。

### 2-4. デプロイ（公開）！

```bash
npm run deploy
```

成功すると、最後に**公開URL**が表示されます：

```
Deployed tobirax2 ...
  https://tobirax2.<あなたのサブドメイン>.workers.dev
```

この URL が **あなたの認証サーバー（＝Auth0 テナント相当）** です。以降 `<IdP-URL>` と書きます。

### 2-5. 管理者アカウントを作る

ログインできる最初のユーザー（管理者）を作ります。

```bash
npx tsx scripts/manage-admin.ts create admin@example.com 好きなパスワード
```

メニューが出たら **`[2] Remote（本番）`** を選びます。
（`tsx` が無いと言われたら `npx tsx ...` の代わりに先に `npm i -D tsx` でもOK）

### 2-6. 動作確認

まず OIDC の「自己紹介ページ」が出るか確認します。ブラウザで開く（または curl）：

```
<IdP-URL>/.well-known/openid-configuration
```

`issuer` `authorization_endpoint` などの JSON が返ってくれば、**OIDC プロバイダとして生きています**。

次にログイン画面：

```
<IdP-URL>/login
```

2-5 で作った `admin@example.com` とパスワードでログインできれば、認証サーバーの公開は完了です 🎉
管理画面は `<IdP-URL>/admin` です。

---

## 3. アプリ（クライアント）を登録する

「ログインを使う側のアプリ」を IdP に登録します。これは Auth0 でいう **Application の作成**です。

### 3-1. 管理画面で App を追加

1. `<IdP-URL>/admin` にログイン → 左メニューの **Apps** を開く
2. **新規追加**フォームに入力：
   - **App ID** … 半角英数の好きなID。**これがそのまま `client_id` になります**（例：`demo-app`）。後から変更不可。
   - **Name** … 表示名（例：`Auth0 SDK デモ`）
   - **Base URL** … **リダイレクト先の前方一致プレフィックス**。デモをローカルで動かすなら `http://localhost:3000`
   - **Description / アイコン** … 任意
3. 保存すると、新規アプリは**機密クライアント（confidential client）**として作られ、`client_secret` が自動生成されます。

### 3-2. client_secret を取得する

作成したアプリの行をクリック → **編集モーダル**を開くと、`client_secret` が読み取り専用の入力欄（モノスペース表示）に出ています。クリックすると全選択できるので**コピー**してください。これをデモアプリ側の設定に貼ります。

> SPA（React など、ブラウザだけで動く公開クライアント）にしたい場合は、編集モーダルの **「Make public (SPA)」** を押すと secret が消え、代わりに PKCE が必須になります。今回のデモ（サーバーサイドの Express）は**機密クライアントのまま**でOKです。

### 3-3. ⚠️ 一番ハマるポイント：ユーザーに「権限」を付与する

tobirax2 は**アプリごとに利用権限**を持っています。**権限が無いユーザーがログインしようとすると `access_denied` で弾かれます。**

- 管理画面の **Users** で対象ユーザー（例：`admin@example.com`）を開き、登録した App（`demo-app`）の利用権限を付与してください。
- または **Groups** でグループに権限を付け、ユーザーをそのグループに入れてもOKです。

これを忘れると「ログインボタンを押したのにエラーで戻ってくる」状態になります。

---

## 4. サンプルデモ `auth0-sdk` を動かす（＝本当に使えるか検証）

`examples/auth0-sdk` は、**Auth0 の公式 SDK（`express-openid-connect`）**で作った最小のアプリです。
向き先を本物の Auth0 ではなく **あなたの `<IdP-URL>`** にするだけで、ログインが通れば「tobirax2 が本物の Auth0 ライブラリに OIDC プロバイダとして受理された」証拠になります。

### 4-1. デモの設定を本番IdPに向ける

`examples/auth0-sdk/index.js` を開き、`auth({ ... })` の中を次のように書き換えます：

```js
auth({
  issuerBaseURL: '<IdP-URL>',          // ← 2-4 で公開した URL（末尾スラッシュなし）
  clientID:      'demo-app',           // ← 3-1 の App ID
  clientSecret:  '<3-2でコピーしたsecret>',
  baseURL:       'http://localhost:3000',   // ← このデモ自身のURL（3-1のBase URLと一致させる）
  secret:        'cookie用の長いランダム文字列に変える',
  idpLogout:     true,
  authorizationParams: {
    response_type: 'code',             // 認可コードフロー
    scope: 'openid profile email',
  },
})
```

> ポイント：`baseURL`（デモ自身のURL）と、3-1 で登録した App の **Base URL** は**一致させる**必要があります。
> ここがズレると `redirect_uri` の前方一致に失敗してログインできません。

### 4-2. デモを起動

```bash
cd examples/auth0-sdk
npm install
node index.js
```

`demo-auth0 RP on http://localhost:3000` と出ればOK。

### 4-3. ログインを試す

1. ブラウザで <http://localhost:3000> を開く
2. **「ログイン（Auth0 SDK経由）」** をクリック
3. あなたの `<IdP-URL>` のログイン画面が出る → 3-3 で権限を付けたユーザーでログイン
4. デモ画面に戻り、**検証済みの `id_token` クレーム（JSON）**が表示されれば成功 🎉

これが表示された時点で、SDK は内部で
**discovery 文書の取得 → JWKS の取得 → `id_token` の RS256 署名検証 → `iss`/`aud`/`nonce` の検証**
をすべて通しています。ごまかしはありません。

### 4-4. （任意）デモ自体も公開したい場合

`examples/auth0-sdk` は Node（Express）アプリなので、そのままでは Cloudflare Workers に載りません。公開したい場合の選択肢：

- **手軽**：ローカルで `node index.js` を動かしたまま、`<IdP-URL>` だけ本番を指す（上記 4-1〜4-3 がこれ。検証はこれで十分）。
- **常時公開**：Render / Railway / Fly.io などの Node が動く PaaS にデプロイし、`baseURL` をその公開URL（例 `https://your-demo.onrender.com`）に変更 → 3-1 の App の **Base URL** も同じURLに更新。
- **一時的に外部公開**：`cloudflared tunnel --url http://localhost:3000` で一時URLを発行し、それを `baseURL` と App の Base URL に設定。

いずれの場合も「**App の Base URL ＝ デモの baseURL**」を必ず揃えてください。

---

## 5. よくあるエラーと対処

| 症状 | 原因 | 対処 |
|---|---|---|
| ログイン後に `access_denied` で戻る | ユーザーにそのアプリの権限が無い | 3-3 の権限付与を行う |
| `redirect_uri` 関連のエラー | App の Base URL とデモの baseURL が不一致 | 両者を完全一致させる |
| `invalid_client` | client_secret 間違い、または public クライアントなのに secret を送っている | 編集画面の secret を貼り直す／public 化したなら PKCE を使う |
| `wrangler d1 execute` で DB が見つからない | `wrangler.toml` の `database_name` とコマンドの名前が不一致 | どちらも `tobira-mock-db` に揃える |
| 管理者作成コマンドが Remote で失敗 | 本番DBにスキーマ未適用 | 2-3 を先に実行する |
| デプロイURLにアクセスして 500 | スキーマ未適用 / `JWT_SECRET` 未設定 | 2-2・2-3 を確認 |

ログを見たいとき：

```bash
npx wrangler tail
```

---

## 6. 片付け（不要になったら）

```bash
# Worker を削除
npx wrangler delete

# D1 データベースを削除
npx wrangler d1 delete tobira-mock-db
```

---

## 7. 一般公開デモ（誰でもクリックで試せる版）

「URLを渡すだけで一般の人にログインを試させたい」場合の構成です。これは実際に本番で稼働しています。

### 構成

| 役割 | 実体 | URL |
|---|---|---|
| 認証サーバー（IdP） | tobirax2 Worker | https://tobirax2.tobira-sys.workers.dev |
| 公開デモアプリ（RP） | `examples/cf-demo`（Cloudflare Worker製のOIDCクライアント） | https://tobira-demo-rp.tobira-sys.workers.dev |

`examples/auth0-sdk`（Express）は Node 専用で Workers に載らないため、**一般公開用には `examples/cf-demo`（依存ライブラリなしのWorker版OIDCクライアント）**を別途用意してあります。Auth0公式SDKが受理することの証明は §4 で済んでいるので、公開デモはこちらを使います。

### 一般の人が試す手順（これを案内するだけ）

1. https://tobira-demo-rp.tobira-sys.workers.dev を開く
2. 「ログイン / 新規登録」→ ログイン画面下の **「新規登録」** からメールとパスワードでアカウント作成
3. 登録すると自動ログイン → デモアプリに戻り、**検証済み id_token クレーム**が表示される
4. 「ログアウト」も可能（IdP側のセッションも破棄されます）

### この公開デモを成立させている仕掛け

- **セルフ登録（sign up）機能を追加**：`GET/POST /signup`。誰でもアカウントを作れます（ログイン画面に「新規登録」リンクあり）。
- **登録ユーザーへの自動権限付与**：tobirax2 はアプリごとに権限が必要（無いと `access_denied`）。そこで
  - 「Public Demo」グループ (`grp-public`) を作成
  - そのグループに `cf-demo`（と `demo-app`）の利用権限を付与
  - `system_config` の `signup_group_id = grp-public` を設定
  - → 新規登録ユーザーは自動的にこのグループに所属し、デモアプリを即利用可能
- **Worker間通信は Service Binding 経由**：デモWorker → IdP の `/oauth/token`・JWKS取得は、同一アカウントのWorker同士を `fetch()` するとCloudflareエラー1042になるため、`wrangler.jsonc` の `services` バインディング（`IDP`）で接続しています（ブラウザのリダイレクトは公開URLのまま）。

### 自分でデモWorkerをデプロイ／再デプロイするには

```bash
# リポジトリのルートから
npx wrangler deploy -c examples/cf-demo/wrangler.jsonc
```

`examples/cf-demo/wrangler.jsonc` の `vars`（IDP_ISSUER / CLIENT_ID / CLIENT_SECRET / APP_BASE_URL / COOKIE_SECRET）を自分の環境に合わせて編集してください。`CLIENT_ID`・`CLIENT_SECRET` は IdP 管理画面で登録したアプリの値と一致させます。

> 🛡 **レート制限（実装済み）**：`/login`（10回/60秒/IP）と `/signup`（5回/60秒/IP）に
> D1ベースの固定ウィンドウ・レート制限を入れてあります（超過は429）。総当たりや自動大量
> 登録の抑止用。閾値は `src/index.tsx` の `rateLimit(...)` 呼び出しで調整可能。共有IP（NAT）
> 配下で大人数に同時に試させる場合は `/signup` の上限を上げてください。
> さらに固める場合は、独自ドメインを当てて **Cloudflare WAF / Rate Limiting Rules** を前段に
> 重ねると多層になります。**Turnstile（CAPTCHA）は今回は意図的に未導入**（挙動ベースとはいえ
> 決定的でなく、用途的に過剰と判断）。
>
> 一時的に登録を止めたい場合は、`signup_group_id` を消すと新規ユーザーは権限なし（デモを使えない）
> 状態になります。セルフ登録自体を無効化したい場合は `/signup` ルートを外して再デプロイしてください。

---

## 関連ドキュメント

- [README_ja.md](README_ja.md) … プロジェクト概要・クイックスタート
- [OIDC_MOCK_ja.md](OIDC_MOCK_ja.md) … OIDC モックの内部仕様・エンドポイント一覧
- [examples/auth0-sdk/README_ja.md](examples/auth0-sdk/README_ja.md) … デモアプリ単体の説明
