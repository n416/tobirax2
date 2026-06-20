// ------------------------------------------------------------------
// 統合テスト(E の実証): isolate レベルの鍵キャッシュのリセット。
//
// keys.ts の keyset キャッシュは時間 TTL のみで DB に依存しないため、テスト間で D1 を
// 作り直しても(cloudflare:test の reset())古い鍵集合を返す＝状態漏れの温床。
// resetKeyCaches() を併用すると、各 DB が自分の鍵を cold-start し直すことを示す。
//
// 観測点: /.well-known/jwks.json が返す先頭鍵の kid。cold-start のたびに新しい
//   ランダム kid が払い出される。
// ------------------------------------------------------------------
import { env, SELF, reset } from 'cloudflare:test'
import { describe, it, expect } from 'vitest'
import { applySchema, resetKeyCaches } from './helpers'

const ISSUER = 'https://idp.test'

async function jwksKid(): Promise<string> {
  const res = await SELF.fetch(`${ISSUER}/.well-known/jwks.json`)
  expect(res.status).toBe(200)
  const json = (await res.json()) as { keys: Array<{ kid: string }> }
  return json.keys[0].kid
}

describe('OIDC 署名鍵キャッシュの隔離（リファクタ E）', () => {
  it('reset() だけではキャッシュが残り、DB を作り直しても同じ kid を返す（漏れの実証）', async () => {
    // 起点をそろえるため一度だけクリアしてから cold-start。
    resetKeyCaches()
    await reset()
    await applySchema(env.DB)
    const kidA = await jwksKid() // DB-A で鍵を cold-start（キャッシュにも載る）

    // DB を作り直すがキャッシュはクリアしない。
    await reset()
    await applySchema(env.DB)
    const kidStale = await jwksKid()

    // system_config は空(reset 済み)なのに、キャッシュが古い鍵集合を返す = 漏れ。
    expect(kidStale).toBe(kidA)
  })

  it('resetKeyCaches() を併用すると DB ごとに別 kid を cold-start する（隔離の実証）', async () => {
    resetKeyCaches()
    await reset()
    await applySchema(env.DB)
    const kidA = await jwksKid()

    // キャッシュも一緒にクリアしてから DB を作り直す。
    resetKeyCaches()
    await reset()
    await applySchema(env.DB)
    const kidB = await jwksKid()

    // 各 DB が自分の鍵を cold-start するので kid は別物。
    expect(kidB).not.toBe(kidA)
  })
})
