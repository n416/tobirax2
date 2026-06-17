# Tobira 🚪

> **Cloudflare Workers + D1 上で動く、セルフホスト型 OpenID Connect IdP（認証プロバイダ）。**
> 🇬🇧 English: [README.md](README.md)

**Tobira** は、Cloudflare Workers + D1 だけで完結する OpenID Connect (OIDC)
**Identity Provider（IdP）** です。Authorization Code フロー（PKCE対応）を話すので、
標準的な OIDC クライアント / SDK からログイン基盤として利用できます。ユーザー・
グループ・権限はすべて自分の D1 データベースで管理します。

> もともとは tobira 認証スターターキット（OIDCを使わない「埋め込み型認証」の
> ボイラープレート）のフォークでした。そこへ OIDC 一式を実装し、今では独立した
> IdP になっています。SDK の向け方や Auth0 互換の早見表は
> **[OIDC_MOCK_ja.md](OIDC_MOCK_ja.md)** を参照してください。

---

## ✨ 特徴

* **標準的な OIDC プロバイダ** — Discovery、JWKS、Authorization Code + PKCE、
  リフレッシュトークン、UserInfo、RP-initiated ログアウト。
* **再認証コントロール** — `prompt`（`none` / `login` / `select_account`）と
  `max_age` に対応。ユーザーが実際に認証した時刻を表す本物の `auth_time` クレームを
  発行し（リフレッシュ後も保持）。
* **本物の RS256 id_token** — 署名鍵はDBごとに生成され、**保存時に暗号化**
  （`OIDC_KEK` シークレットによる AES-256-GCM）、さらに **自動ローテーション**。
  JWKSに重複期間を設けるので、発行済みトークンは引き続き検証できます。
* **コンフィデンシャル / パブリッククライアント** — `client_secret` を持つアプリは
  コンフィデンシャル（定数時間比較で検証）、シークレット無しのアプリはパブリックで
  PKCE 必須。
* **認可ゲート内蔵** — `/authorize` でアプリごとの権限を強制。権限の無いユーザーは
  `access_denied` になります。
* **ユーザーライフサイクル一式** — ユーザー / グループ / アプリ / 権限の管理UI、
  セルフ登録、招待、パスワードリセット、監査ログ。
* **2段階認証 (TOTP)** と、ログイン / 登録への **D1ベースのレート制限**。
* **データは自分の手元（エッジ）に** — すべて自分の D1 に保存。Hono + JSX の
  素直なコードベースで読みやすく、カスタマイズしやすい。

> **ステータス:** Authorization Code + PKCE フローはエンドツーエンドで動作し、
> 署名まわりは堅牢化済みです。標準仕様への完全準拠は現在仕上げ中なので、唯一の
> IdP として本番運用する前にコンフォーマンスの確認を推奨します。

---

## 🔌 OIDC エンドポイント

| エンドポイント | 役割 |
|---|---|
| `GET /.well-known/openid-configuration` | Discovery ドキュメント |
| `GET /.well-known/jwks.json` | 公開署名鍵 (RS256) |
| `GET /authorize` | Authorization Code フロー（PKCE: S256 のみ、`prompt`・`max_age`・`login_hint`） |
| `POST /oauth/token` | `authorization_code` + `refresh_token` グラント（`refresh_token` は `offline_access` 時のみ発行） |
| `POST /oauth/revoke` | トークン失効（RFC 7009、access / refresh いずれも可） |
| `POST /oauth/introspect` | トークンイントロスペクション（RFC 7662、クライアント認証必須） |
| `GET\|POST /userinfo` | Bearer access_token に対する OIDC クレーム |
| `GET\|POST /oidc/logout` | RP-initiated ログアウト（`post_logout_redirect_uri` / `returnTo`、`id_token_hint`、`state`）。ユーザーのトークンも失効 |

`id_token` は JWKS で検証できる本物の RS256 JWT、`access_token` は不透明（opaque）で
`/userinfo` で解決します。

---

## 🛠️ クイックスタート（ローカル）

デモ環境の構築や、豊富なデモデータ（階層グループやサービス・アプリ等）を用いたテストを行うには、一発構築スクリプトを利用します。

```bash
npm install
npm run demo:setup  # DB初期化とデモデータ投入
npm run dev         # -> http://localhost:8787/login
```

> **注意**: デモ用のアカウント一覧や詳細な検証方法、およびデモアプリ（OIDC クライアント）の実行手順については、[DEMO_ja.md](DEMO_ja.md) を参照してください。

ローカル開発では署名鍵の暗号化が固定の（安全でない）KEKにフォールバックするため、
シークレット無しでもすぐ動かせます。

---

## 🚀 本番デプロイ

```bash
# 1. 本番用 D1 を作成し、database_id を wrangler.toml に記載
wrangler d1 create tobira-mock-db
wrangler d1 execute tobira-mock-db --remote --file ./schema.sql

# 2. シークレットを設定
wrangler secret put OIDC_KEK     # OIDC署名鍵を保存時に暗号化する鍵（本番では必須）
# wrangler.toml [vars] の JWT_SECRET も独自の乱数に変更してください
# （内部セッション / API トークンの署名に使用）。シークレット化も推奨。

# 3. リモートの管理者を作成（プロンプトで [2] Remote を選択）
npx tsx scripts/manage-admin.ts create admin@example.com mypassword

# 4. デプロイ
npm run deploy
```

> ⚠️ 運用開始後に `OIDC_KEK` を変更すると、暗号化済みの署名鍵を復号できなくなり、
> 鍵が再生成されます（それまでに発行したトークンはすべて検証不能に）。本番開始前に
> 一度だけ設定してください。

---

## 🔐 クライアント（リライングパーティ）の登録

**管理UI → Apps** からアプリを追加します:

- **id** → `client_id` になります
- **base_url** → `redirect_uri` が一致すべき登録オリジン（任意でパスも）。
  オリジンは完全一致が必要で、`base_url` 以下のパスは許可されます
  （例: `https://app.example.com` は `https://app.example.com/callback` を許可）。

新規アプリは既定で **コンフィデンシャル** — `client_secret` が生成され、編集モーダルに
表示されます。SPA / ネイティブクライアントの場合は、編集モーダルで
**Make public (SPA)** を押してシークレットを消すと、以後 PKCE が必須になります。

ユーザー（またはそのグループ）にアプリへの権限を付与してください。さもないと
`/authorize` は `access_denied` を返します。

SDK を使わない完全動作する OIDC クライアント例（Cloudflare Workers 製）による動作確認手順は、[DEMO_ja.md](DEMO_ja.md) に記載されています。

---

## 🔑 署名鍵とローテーション

RS256 鍵は `system_config` テーブル（`oidc_keys` 行）に暗号化されたセットとして
保存されます。署名は常に最新鍵を使い、古い公開鍵は重複期間だけ JWKS に残して
発行済みトークンの検証を担保し、その後削除されます。詳細は
[`src/oidc/keys.ts`](src/oidc/keys.ts)。

手動ローテーション（ゼロから再生成）:

```bash
npx wrangler d1 execute tobira-mock-db --local --command "DELETE FROM system_config WHERE key='oidc_keys';"
```

## License
MIT
