// ------------------------------------------------------------------
// 統合テスト専用 config（ユニットとは完全分離）。
//
// DB に密結合した OIDC エンドポイント（/oauth/token 等）を、実際の D1 に当てて
// 検証するための設定。@cloudflare/vitest-pool-workers を使い workerd 上で
// src/index.tsx をそのまま起動する。素の Node で走る既存ユニット
// （vitest.config.mts, 100 件）はこれに一切依存させない・遅くさせない。
//
// 既知の落とし穴（プロジェクトメモリ参照）:
//   - pool-workers 0.16.18(vitest4 系)。設定は defineWorkersConfig ではなく
//     cloudflareTest() プラグインに miniflare 設定を渡す形式（このバージョンには
//     ./config サブパスも isolatedStorage オプションも無い）。
//   - bcryptjs のため nodejs_compat フラグが必須。
//   - D1 バインディング(DB)は miniflare 設定で直接与える。wrangler.toml の
//     RP_* サービスバインディングには依存しない。
//   - テスト間のクリーン化は cloudflare:test の reset()(全バインディングのデータ消去)
//     ＋ schema.sql 再適用で行う（test/integration 側の beforeEach 参照）。
//   - requireSecret は ENVIRONMENT='dev' のときだけフォールバックを許す。OIDC_KEK /
//     JWT_SECRET はテスト用に固定値を注入し、本番の fail-closed 経路を踏まない。
// ------------------------------------------------------------------
import { defineConfig } from 'vitest/config'
import { cloudflareTest } from '@cloudflare/vitest-pool-workers'

export default defineConfig({
  plugins: [
    cloudflareTest({
      // tests と同一 isolate で動かす Worker のエントリ。SELF はこれに dispatch される。
      main: './src/index.tsx',
      miniflare: {
        compatibilityDate: '2025-12-22',
        compatibilityFlags: ['nodejs_compat'],
        // ローカル D1 を DB バインディングとして用意。
        d1Databases: ['DB'],
        bindings: {
          // dev のときだけ requireSecret がフォールバックを許す。
          ENVIRONMENT: 'dev',
          // 署名鍵の KEK と JWT 署名鍵はテスト用固定値。
          OIDC_KEK: 'test-only-oidc-kek-do-not-use-in-prod',
          JWT_SECRET: 'test-only-jwt-secret-do-not-use-in-prod',
        },
      },
    }),
  ],
  test: {
    include: ['test/integration/**/*.test.ts'],
  },
})
