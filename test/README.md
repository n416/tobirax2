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

新しいテストは必ずどちらかに振り分ける。OIDC 仕様に関わるものは `test/oidc/`、
それ以外（暗号・2FA・認証素材など）は `test/utils/`。

## 実行

```bash
npm test          # 全テスト
npm run test:oidc # OIDC のみ
npm run test:utils # OIDC 以外のみ
npm run test:watch # ウォッチモード
```

## 現状のスコープ

純粋関数のユニットテストのみ（DB 不要）。`/authorize` や `/oauth/token` などエンドポイントを
実際に叩く統合テストを足す段になったら、`@cloudflare/vitest-pool-workers` を再導入し、
D1 バインディング＋マイグレーション適用を持つ統合テスト専用 config に隔離する。ユニットは
このまま Node で残す。
