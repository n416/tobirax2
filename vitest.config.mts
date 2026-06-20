import { defineConfig } from 'vitest/config'

// 素の Node 上でテストを実行する。現状のテストは純粋関数のユニットのみで、
// 依存している API(crypto.subtle / btoa / atob)も bcryptjs / otplib も Node に
// 揃っているため、workerd / miniflare を起動する重い環境は不要。軽くて速く、
// インストール時のロックや ESM 縛りといった環境都合に振り回されない。
//
// JSX (hono/jsx) のトランスパイル設定は tsconfig.json の jsxImportSource を
// vitest(oxc)が読む。index.tsx を import する OIDC ヘルパのテストもこれで通る。
//
// 注意: D1 バインディングを実際に叩くエンドポイント統合テストを書く段になったら、
// その時は Node 単体では完結しない。@cloudflare/vitest-pool-workers を再導入して
// 統合テスト用の別 config(または別プロジェクト)に隔離し、ユニットは Node のまま
// 残すのがよい。今はその必要が無いので入れない。
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    // 統合テスト(test/integration)は workerd 上で走らせる別 config
    // (vitest.integration.config.mts / npm run test:integration)に隔離する。
    // ここ(素の Node)で拾うと cloudflare:test を解決できず壊れるため除外する。
    exclude: ['test/integration/**', 'node_modules/**'],
  },
})
