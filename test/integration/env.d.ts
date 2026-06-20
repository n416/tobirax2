// pool-workers が提供する仮想モジュール cloudflare:test の型を可視化する。
// cloudflare:test の宣言は ./types サブパスにあるため、そこを参照する。
/// <reference types="@cloudflare/vitest-pool-workers/types" />
import type { Env as AppEnv } from '../../src/types'

// cloudflare:test の env は Cloudflare.Env 型。@cloudflare/workers-types は
// `interface Env {}`(空)を「プロジェクト側でマージ前提」で宣言しているので、
// ここで本プロジェクトの Env を継承して env.DB / env.OIDC_KEK 等を型付けする。
declare global {
  namespace Cloudflare {
    interface Env extends AppEnv {}
  }
}

declare module 'cloudflare:test' {
  // env を ProvidedEnv 経由で参照する箇所のための保険(このバージョンの env 自体は
  // Cloudflare.Env だが、両方を揃えておく)。
  interface ProvidedEnv extends AppEnv {}
}

// 注: schema.sql の ?raw インポートは相対指定子のため、ここでアンビエント wildcard
// 宣言を置いても TS には当たらない（test/integration/helpers.ts 側で明示的に string 化）。
