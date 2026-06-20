# リファクタ候補（テスト容易性の観点）

2026-06-20 時点。純粋関数のユニットテスト（[test/README.md](../test/README.md)、76 件）を
入れる過程で見えた「テストを書きにくくしている構造」を、優先度順に列挙する。

おすすめ着手順: **A（分割）→ B / C（露出・鍵注入）→ D（D1 統合テスト）**。
A だけでも B/C/F が芋づる式に進む。各段階で既存テストは緑のまま維持すること
（`npm test`）。コメントも UI も日本語で書く方針は踏襲する。

## 進捗

- ✅ **A 完了**（2026-06-20, commit 2c6c123）— 純粋ヘルパを `src/oidc/helpers.ts` へ移動。
  index.tsx に重複定義なし、参照は付け替え済み。
- ✅ **B 完了**（2026-06-20, commit 9f78849）— jwt.ts/keys.ts の未 export 純粋関数を露出し
  ユニット追加（`test/oidc/base64url.test.ts`, `test/oidc/keys.test.ts`）。
- ✅ **C 完了**（2026-06-20, commit 8a999eb）— RS256 署名/検証を鍵注入可能にし、D1 なしで
  ラウンドトリップを検証（`test/oidc/jwt-roundtrip.test.ts`）。
- 🟨 **D 着手（第一・二弾完了）**（2026-06-20）— `@cloudflare/vitest-pool-workers` を統合専用に
  隔離再導入し、実 D1 で `/oauth/token` を検証（統合 7 件）。
  - authorization_code 交換（`test/integration/auth-code.test.ts`、4 件）: ハッピーパス＋負例3種
    （code 再利用拒否 / redirect_uri 不一致 / PKCE 失敗）。
  - refresh_token 更新（`test/integration/refresh.test.ts`、3 件）: 回転＋offline_access で新 refresh
    返却＋auth_time 維持／古い refresh の再利用拒否／`checkPermission` 拒否時の invalid_grant＋
    セッション破棄。
  - 残: /userinfo（スコープ別クレーム）/ revoke / introspect / logout。
- ⬜ **E 未着手** — isolate キャッシュのリセット手段。統合テストでも `keys.ts`/`jwt.ts` の
  per-isolate キャッシュは reset() で消えない（in-process で sign↔verify は整合するので第一弾は
  不問）。エンドポイント間でDB再読込を期待するケースを足す前に着手が必要。
- ⬜ **F 未着手** — `c: any` の解消（A の分割で一部は移動済みだが型付けは残）。

現在テストはユニット 100 件＋統合 7 件・全緑、`tsc --noEmit` も clean。次は D の続き
（/userinfo のスコープ別クレーム、続いて revoke / introspect / logout）。

### D 第一弾の構成（再現メモ）

- ランナー: `@cloudflare/vitest-pool-workers` **0.16.18**。この版に `./config` サブパスと
  `isolatedStorage` オプションは無く、`cloudflareTest()` プラグインに miniflare 設定を渡す
  （`vitest.integration.config.mts`）。`nodejs_compat` 必須。
- スキーマ投入: **schema.sql 一発**（本番投入の正本。migrations は ALTER パッチで fresh DB に
  流せない）。`test/integration/helpers.ts` の `applySchema` が `--` を除去し `;` で分割して適用。
- テスト間の初期化: `cloudflare:test` の **`reset()`（全バインディングのデータ消去）＋ schema 再適用**
  を `beforeEach` で実施。`schema.sql` は `?raw` で取り込む。
- 付随修正: `schema.sql` の `idx_logs_created`（drop 済み `audit_logs` への取り残しインデックス）を
  除去。fresh DB への schema.sql 投入が「no such table: audit_logs」で落ちる潜在バグだった
  （ランタイムの監査ログ書き込み先は `recent_audit_logs` で影響なし）。
- 実行: `npm run test:integration`。ユニット（`npm test`, Node）は `test/integration/**` を
  除外して従来どおり高速・独立に保つ。

---

## A. 最優先 — `src/index.tsx`（1177 行）のモノリス分割

純粋な OIDC ヘルパが、DB アクセス・ルートハンドラ・JSX ビューと同じ巨大ファイルに
同居している。そのためヘルパ 1 個のユニットテストにアプリ全体＋全ビューを import して
いる（動くが import コストと結合が無駄）。

抽出対象（純粋・DB 不要、`src/oidc/helpers.ts` などへ）:

| 関数 | 場所 |
| --- | --- |
| `isAllowedRedirectUri` | `src/index.tsx:470` |
| `parseRedirectUris`（未 export） | `src/index.tsx:456` |
| `isSafeReturnTo` | `src/index.tsx:946` |
| `buildRedirect` | `src/index.tsx:950` |
| `tokenError` | `src/index.tsx:957` |
| `bearerUnauthorized` | `src/index.tsx:964` |
| `safeEqual` | `src/index.tsx:975` |
| `parseBasicAuth` | `src/index.tsx:1007` |
| `parseClientBody` | `src/index.tsx:1019` |
| `buildOidcClaims` | `src/index.tsx:1031` |
| `computeAtHash` | `src/index.tsx:1048` |

抽出後はテスト（`test/oidc/helpers.test.ts`, `test/oidc/responses.test.ts`,
`test/utils/i18n.test.ts` の import 元）を新モジュールへ向け直す。`src/index.tsx` は
再 export するか、routes/oidc.tsx 等の参照を新モジュールへ付け替える。

## B. 未エクスポートの純粋関数（露出 or 抽出でテスト可能に）

- `src/oidc/jwt.ts:9` — base64url コーデック 3 種（`bytesToBase64Url` / `strToBase64Url` /
  `base64UrlToBytes`）。署名の土台。パディング/バイナリのエッジを直接突きたい。
- `src/oidc/keys.ts:106` — `parseStored`。v2→v3 鍵エンベロープ移行の純粋な分岐ロジック。
  レガシー行・壊れた行・空行の扱いを単体検証したい。
- `src/oidc/keys.ts:56` — `b64u` / `fromB64u`。`src/utils/secretbox.ts` と重複実装。
  共通モジュールへ括り出す候補でもある（重複の解消＝テストも一箇所で済む）。

## C. 署名 / 検証を「鍵注入可能」に

`signRS256`（`src/oidc/jwt.ts:49`）/ `verifyRS256`（`src/oidc/jwt.ts:70`）が
`getSigningKey`→`getOidcKeys(db)`（`src/oidc/jwt.ts:31`）に直結しているため、RS256 の
署名→検証ラウンドトリップを試すのに D1 が要る。鍵（JWK / CryptoKey）を引数で渡せる薄い
内部関数に割れば、crypto コアを純粋にテストできる（公開 API はそのまま、内部だけ分離）。

## D. DB ＋ ロジックの密結合（統合テスト側 or ロジック分離）

`c`（Hono コンテキスト）を受け取り中で `c.env.DB.prepare(...)` を直に叩く関数群:

- `checkPermission` — `src/index.tsx:115`
- `getEntitlements` — `src/index.tsx:360`
- `authenticateClient` — `src/index.tsx:985`
- `issueOidcTokens` — `src/index.tsx:1056`

判定ロジックと SQL を分けると、ロジックだけ単体化できる。分けないなら D1 統合テスト行き。
**第一弾は「分けずに D1 統合テスト」を採用**（`authenticateClient` / `issueOidcTokens` を実 D1 で
通す）。`@cloudflare/vitest-pool-workers` を統合専用 config に隔離して再導入済み
（[test/README.md](../test/README.md) と上記「D 第一弾の構成」参照）、ユニットは Node のまま残す。
`checkPermission` / `getEntitlements` は refresh_token 系フローを足す段で踏む。

## E. isolate レベルの可変キャッシュ（テスト分離性）

- `src/oidc/jwt.ts:29` — `signingKeyCache`
- `src/oidc/keys.ts:53` — `cache`

どちらもモジュール singleton でリセット手段が無い。テスト順序依存・状態漏れの温床。
テスト用の clear フック（あるいは注入可能なキャッシュ）があると安全。

## F. 横断 — `c: any` の多用

`src/index.tsx` の export 群が軒並み `c: any`。型安全が効かず、テスト時のモック契約も曖昧。
A の分割と合わせて型を付け直すと、モックも作りやすくなる。
