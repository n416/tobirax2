# テスト

素の Node 上で vitest を実行する。設定は [`vitest.config.mts`](../vitest.config.mts)。

現状のテストは純粋関数のユニットのみで、依存している API（`crypto.subtle` / `btoa` /
`atob`）も `bcryptjs` / `otplib` も Node に揃っている。よって workerd / miniflare を
起動する重い環境（`@cloudflare/vitest-pool-workers`）は使わない — 軽くて速く、環境都合に
振り回されない。D1 バインディングを実際に叩くエンドポイント統合テストを書く段になったら、
その時だけ pool-workers を別 config に隔離して再導入する（ユニットは Node のまま残す）。

## ディレクトリ構成 — OIDC とその他を明確に分ける

| ディレクトリ | 対象 |
| --- | --- |
| `test/oidc/`  | OIDC / OAuth2 の仕様準拠ロジック（PKCE、redirect_uri 検証、at_hash、scope→クレーム写像、buildRedirect 等） |
| `test/utils/` | OIDC 以外の基盤ユーティリティ（シークレット暗号化、TOTP、トークン/パスワード） |
| `test/integration/` | **DB 密結合のエンドポイント統合テスト**（実 D1）。Node ではなく workerd 上で動く別ランナー（下記）。 |

新しいテストは必ずどちらかに振り分ける。OIDC 仕様に関わるものは `test/oidc/`、
それ以外（暗号・2FA・認証素材など）は `test/utils/`。

## 実行

```bash
npm test             # ユニット全テスト（Node, test/integration を除外）
npm run test:oidc    # OIDC ユニットのみ
npm run test:utils   # OIDC 以外のユニットのみ
npm run test:watch   # ウォッチモード（ユニット）
npm run test:integration # D1 統合テスト（workerd, 別 config）
```

## 統合テスト（test/integration）

DB に密結合した OIDC エンドポイント（まず `/oauth/token` の authorization_code 交換）を、実際の
D1 に当てて検証する。ユニット（素の Node, 高速・環境非依存）とは**完全に分離**する。

- ランナー: `@cloudflare/vitest-pool-workers` **0.16.18**（vitest 4 系）。この版に `./config`
  サブパスと `isolatedStorage` オプションは無く、`cloudflareTest()` プラグインに miniflare 設定を
  渡す（[`vitest.integration.config.mts`](../vitest.integration.config.mts)）。`nodejs_compat` 必須
  （bcryptjs のため）。D1 バインディング `DB` は miniflare 設定で直接与え、wrangler.toml の
  `RP_*` サービスバインディングには依存しない。
- スキーマ投入: **`schema.sql` 一発**（本番投入の正本。`migrations/` は既存 DB への ALTER パッチ
  なので fresh DB には流せない）。[`test/integration/helpers.ts`](integration/helpers.ts) の
  `applySchema` が `schema.sql` を `?raw` で取り込み、`;` で分割して適用する。
- テスト間の初期化: `cloudflare:test` の **`reset()`（全バインディングのデータ消去）＋ schema 再適用**
  を `beforeEach` で行い、各テストはクリーンな DB から始まる。
- シークレット: `requireSecret` は `ENVIRONMENT='dev'` のときだけフォールバックを許すため、config で
  `ENVIRONMENT='dev'` と `OIDC_KEK` / `JWT_SECRET`（テスト用固定値）を注入する。
- 型: `cloudflare:test` と `Cloudflare.Env` の型は [`test/integration/env.d.ts`](integration/env.d.ts) で
  補う。`schema.sql` の `?raw`（相対指定子）はアンビエント wildcard 宣言に当たらないため、helpers
  側で明示的に string 化している。

### 既知の落とし穴

- `npm install` 時に `workerd` / `wrangler dev` が動いていると `node_modules/miniflare` が EBUSY で
  ロックする。先に dev サーバを止める。
- `keys.ts` / `jwt.ts` の per-isolate キャッシュ（リファクタ項目 E）は `reset()` では消えない。
  sign↔verify は同一 isolate のキャッシュで整合するので第一弾は問題にならないが、エンドポイント
  間で DB 再読込を期待するテストを足す前に E（リセットフック）の着手が要る。
