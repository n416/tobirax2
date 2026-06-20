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
- ✅ **D 完了**（2026-06-20）— `@cloudflare/vitest-pool-workers` を統合専用に隔離再導入し、
  DB 密結合の OIDC エンドポイントを実 D1 で検証（統合 25 件）。対象の主要フロー
  （checkPermission / authenticateClient / issueOidcTokens / getEntitlements 経路を含む）を網羅。
  - authorization_code 交換（`test/integration/auth-code.test.ts`、4 件）: ハッピーパス＋負例3種
    （code 再利用拒否 / redirect_uri 不一致 / PKCE 失敗）。
  - refresh_token 更新（`test/integration/refresh.test.ts`、3 件）: 回転＋offline_access で新 refresh
    返却＋auth_time 維持／古い refresh の再利用拒否／`checkPermission` 拒否時の invalid_grant＋
    セッション破棄。
  - /userinfo（`test/integration/userinfo.test.ts`、4 件）: authorization_code で得た実 access_token で
    profile/email クレーム／scope=openid のみは sub 以外を返さない／Bearer 無し・失効トークンは 401。
  - /oauth/revoke（`test/integration/revoke.test.ts`、5 件、RFC 7009）: access/refresh での失効／未知
    トークンも 200／token 欠落は 400／機密クライアントの誤シークレットは 401 かつ失効しない。
  - /oauth/introspect（`test/integration/introspect.test.ts`、5 件、RFC 7662）: 自クライアントの active な
    access(Bearer+exp+auth_time)／refresh(token_type ラベル, exp なし)／他クライアントのトークンは
    inactive(§4 プライバシー)／失効 access は inactive／client_id 欠落は 401。
  - /oidc/logout（`test/integration/logout.test.ts`、4 件、RP-Initiated Logout 1.0）: SSO Cookie で
    app_sessions と sessions を失効／Cookie 無しでも id_token_hint の sub でフォールバック失効／
    登録済み post_logout_redirect_uri は state エコーでリダイレクト／未登録はオープンリダイレクト
    防止で /login。Back-Channel の外部送信(sendBackchannelLogouts)は範囲外として切り分け
    （seed アプリに backchannel_logout_uri を設定せず送信経路に入れない）。
- ✅ **E 完了**（2026-06-20）— isolate レベルの鍵キャッシュにテスト用クリアフックを追加。
  `keys.ts` の `resetKeysetCacheForTests()` と `jwt.ts` の `resetSigningKeyCachesForTests()`、
  統合側に集約 `resetKeyCaches()`（`test/integration/helpers.ts`）。`keys.ts` の keyset キャッシュは
  時間 TTL のみで DB 非依存のため `reset()`（D1 消去）では消えず状態が漏れる — これを実証＋隔離する
  テストを追加（`test/integration/key-cache-isolation.test.ts`、2 件）。なお `jwt.ts` の署名/検証
  キャッシュは kid キーで自己無効化されるため漏れ自体は起きないが、cold-start 用にフックは揃えた。
  本番経路は不変（フックは test 専用）。
- ✅ **F 完了**（2026-06-20）— サーバ側ハンドラ群の `c: any` を共有型 `AppContext`
  （`Context<{ Bindings: Env }>`、`src/types.ts` に定義）へ全置換（29 箇所: index.tsx 15 /
  routes/oidc.tsx 2 / routes/group-admin.tsx 3 / oidc/helpers.ts 4 / utils/logger.ts 1 / i18n.ts 2）。
  事前に懸念した波及（実型化で `as any`/`: any` 群が連鎖して `tsc` が噴く）は**ゼロ**だった —
  `c` 経由の利用は全て Context で正当、body 等はヘルパ戻り型で既に具体化済みだったため。
  挙動不変・`tsc` クリーン・ユニット 100＋統合 27 全緑で確認。client/ のフロント `c`（≈5）は
  Hono ではないため対象外。`as any`(116) / その他 `: any`(111) の広い型負債は F の範囲外（別タスク）。

現在テストはユニット 100 件＋統合 27 件・全緑、`tsc --noEmit` も clean。
リファクタ A〜F すべて完了。テスト容易化の一連はここで一区切りとする。

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
**「分けずに D1 統合テスト」を採用**（`checkPermission` / `authenticateClient` / `issueOidcTokens` /
`getEntitlements` を実 D1 で通す）。`@cloudflare/vitest-pool-workers` を統合専用 config に隔離して
再導入済み（[test/README.md](../test/README.md) と上記「D 第一弾の構成」参照）、ユニットは Node の
まま残す。ロジックと SQL の分離（D の別解）は未実施 — 統合テストで挙動を固定できたので、必要に
なった時点で安全に行える。

## E. isolate レベルの可変キャッシュ（テスト分離性）

- `src/oidc/jwt.ts:29` — `signingKeyCache`
- `src/oidc/keys.ts:53` — `cache`

どちらもモジュール singleton でリセット手段が無い。テスト順序依存・状態漏れの温床。
テスト用の clear フック（あるいは注入可能なキャッシュ）があると安全。

## F. 横断 — `c: any` の多用（✅ 完了）

`src/index.tsx` の export 群が軒並み `c: any` だった。共有型 `AppContext`
（`Context<{ Bindings: Env }>`、`src/types.ts`）へ全置換し型安全を回復（サーバ側 29 箇所、波及ゼロ・
挙動不変）。client/ のフロント `c` と `as any`/その他 `: any` の広い型負債は範囲外（別タスク）。

## G. 追加 — 型負債（`as any` / `: any`）の段階的解消（🟨 着手）

F に続き、広い型負債を**テスト網が守る範囲から**段階的に解消する。第一弾（2026-06-20）:
OIDC/DB のサーバ経路（`routes/oidc.tsx` 全面、`index.tsx` の純粋 DB 関数
`checkPermission`/`getManagedGroupIds`/`getBillingGroupIds`/`createAssignment`/`getEntitlements`、
`oidc/helpers.ts`、`utils/logger.ts`）の `as any` を、D1 の `.first<T>()`/`.all<T>()` と行型
（`AppSession` を `types.ts` に追加）で正攻法に解消。`as any` は **116→88**（−28）。挙動不変・
`tsc` クリーン・ユニット 100＋統合 27 全緑で確認。`createAssignment` の grant 型付けで
`seat_limit`/`contract_id` の実利用を型が炙り出し、行型を実列に合わせた。

第二弾（2026-06-21）: `routes/admin.tsx` / `routes/group-admin.tsx` の**安全な D1 行型付けのみ**を実施。
`.all() as any` ＋ `(rows as any[])` を `.all<行型>()` に、`(res as any).meta.changes` を `res.meta.changes`
に置換（D1 の `.all()`/`.first()`/`.run()` の既定型は `Record<string, unknown>` で `any` ではないと確認）。
`new Map(...)` のタプル化は明示返り型で対応。`as any` は **88→79**。挙動不変・`tsc` クリーン・
ユニット 100＋統合 27 全緑。

残り（網が薄く要慎重・別スライス）: **JSX プロップキャスト**（`results as any` 等、ビュー側の prop 型
整備が必要）、`catch (e: any)`、`group-admin.tsx` のポータル画面用**集約パイプライン**（中間
アキュムレータが最終的に `as any` の JSX プロップへ流れるため、ビュー型を直すまで内部型付けは
低価値）、`index.tsx` のダッシュボード/ポータル経路、`views/` / `client/`。`keys.ts` の
`let v: any`（`JSON.parse` 出力）等、正当な any は残す。
