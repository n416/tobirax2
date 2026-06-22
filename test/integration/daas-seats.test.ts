import { env, createExecutionContext } from 'cloudflare:test'
import { describe, it, expect, beforeEach } from 'vitest'
import { applySchema, seedUser, seedGroup, seedProvider, seedService, seedContract, seedGrant, seedFacility, seedRoleMaster, seedAssignment } from './helpers'
import { createAssignment } from '../../src/index'
import type { AppContext } from '../../src/types'

const nowSec = () => Math.floor(Date.now() / 1000)

describe('DaaS席数上限 (createAssignment)', () => {
  let db: D1Database
  let c: AppContext
  let ctx: ExecutionContext

  beforeEach(async () => {
    db = env.DB
    ctx = createExecutionContext()
    c = { env: { DB: db } as any, req: {} as any, get: (() => {}) as any } as unknown as AppContext
    await applySchema(db)
  })

  it('有効な利用枠がない場合は no_grant を返す', async () => {
    const groupId = await seedGroup(db)
    const userId = await seedUser(db)
    const provId = await seedProvider(db)
    const serviceId = await seedService(db, { provider_id: provId })
    const facId = await seedFacility(db, { managing_group_id: groupId })
    const roleId = await seedRoleMaster(db, { service_id: serviceId })

    // 利用枠なし
    const now = nowSec()
    const result = await createAssignment(c, {
      userId, groupId, serviceId, facilityId: facId, roleId, validFrom: now, validTo: now + 3600
    })
    expect(result).toBe('no_grant')
  })

  it('席数上限を超えていなければ ok を返す', async () => {
    const groupId = await seedGroup(db)
    const userId = await seedUser(db)
    const provId = await seedProvider(db)
    const serviceId = await seedService(db, { provider_id: provId })
    const contractId = await seedContract(db, { service_id: serviceId, customer_group_id: groupId, seat_limit: 10 })
    await seedGrant(db, { group_id: groupId, service_id: serviceId, contract_id: contractId, seat_limit: 5 })
    
    const facId = await seedFacility(db, { managing_group_id: groupId })
    const roleId = await seedRoleMaster(db, { service_id: serviceId })

    const now = nowSec()
    const result = await createAssignment(c, {
      userId, groupId, serviceId, facilityId: facId, roleId, validFrom: now, validTo: now + 3600
    })
    expect(result).toBe('ok')
  })

  it('利用枠の席数上限を超えた場合は seat を返す', async () => {
    const groupId = await seedGroup(db)
    const provId = await seedProvider(db)
    const serviceId = await seedService(db, { provider_id: provId })
    const contractId = await seedContract(db, { service_id: serviceId, customer_group_id: groupId, seat_limit: 10 })
    // 利用枠上限は1
    await seedGrant(db, { group_id: groupId, service_id: serviceId, contract_id: contractId, seat_limit: 1 })
    
    const facId = await seedFacility(db, { managing_group_id: groupId })
    const roleId = await seedRoleMaster(db, { service_id: serviceId })

    const user1 = await seedUser(db)
    const user2 = await seedUser(db)

    const now = nowSec()
    await createAssignment(c, {
      userId: user1, groupId, serviceId, facilityId: facId, roleId, validFrom: now, validTo: now + 3600
    })

    const result2 = await createAssignment(c, {
      userId: user2, groupId, serviceId, facilityId: facId, roleId, validFrom: now, validTo: now + 3600
    })
    expect(result2).toBe('seat')
  })

  it('子グループへの配分を引いた実効上限を計算して判定する', async () => {
    const parentGroupId = await seedGroup(db)
    const childGroupId = await seedGroup(db, { parent_id: parentGroupId })
    const provId = await seedProvider(db)
    const serviceId = await seedService(db, { provider_id: provId })
    const contractId = await seedContract(db, { service_id: serviceId, customer_group_id: parentGroupId, seat_limit: 10 })
    
    // 親グループの枠: 3
    await seedGrant(db, { group_id: parentGroupId, service_id: serviceId, contract_id: contractId, seat_limit: 3 })
    // 子グループへの配分: 2
    await seedGrant(db, { group_id: childGroupId, service_id: serviceId, contract_id: contractId, seat_limit: 2 })
    
    const facId = await seedFacility(db, { managing_group_id: parentGroupId })
    const roleId = await seedRoleMaster(db, { service_id: serviceId })

    const user1 = await seedUser(db)
    const user2 = await seedUser(db)

    const now = nowSec()
    // 親の実効上限は 3 - 2 = 1 となる
    const res1 = await createAssignment(c, {
      userId: user1, groupId: parentGroupId, serviceId, facilityId: facId, roleId, validFrom: now, validTo: now + 3600
    })
    expect(res1).toBe('ok')

    const res2 = await createAssignment(c, {
      userId: user2, groupId: parentGroupId, serviceId, facilityId: facId, roleId, validFrom: now, validTo: now + 3600
    })
    // 2人目のユーザーで実効上限の1を超える
    expect(res2).toBe('seat')
  })

  it('契約自体の席数上限を超えた場合は seat を返す', async () => {
    const parentGroupId = await seedGroup(db)
    const childGroupId = await seedGroup(db, { parent_id: parentGroupId })
    const provId = await seedProvider(db)
    const serviceId = await seedService(db, { provider_id: provId })
    // 契約の総枠: 2
    const contractId = await seedContract(db, { service_id: serviceId, customer_group_id: parentGroupId, seat_limit: 2 })
    
    // 利用枠自体は余裕がある（それぞれ2）
    await seedGrant(db, { group_id: parentGroupId, service_id: serviceId, contract_id: contractId, seat_limit: 2 })
    await seedGrant(db, { group_id: childGroupId, service_id: serviceId, contract_id: contractId, seat_limit: 2 })
    
    const facId = await seedFacility(db, { managing_group_id: parentGroupId })
    const roleId = await seedRoleMaster(db, { service_id: serviceId })

    const user1 = await seedUser(db)
    const user2 = await seedUser(db)
    const user3 = await seedUser(db)

    const now = nowSec()
    await createAssignment(c, {
      userId: user1, groupId: parentGroupId, serviceId, facilityId: facId, roleId, validFrom: now, validTo: now + 3600
    })
    await createAssignment(c, {
      userId: user2, groupId: childGroupId, serviceId, facilityId: facId, roleId, validFrom: now, validTo: now + 3600
    })

    const result = await createAssignment(c, {
      userId: user3, groupId: parentGroupId, serviceId, facilityId: facId, roleId, validFrom: now, validTo: now + 3600
    })
    expect(result).toBe('seat')
  })

  it('同一ユーザーが同じグループ・サービスの別施設に割り当てられる場合、追加の席を消費しない', async () => {
    const groupId = await seedGroup(db)
    const provId = await seedProvider(db)
    const serviceId = await seedService(db, { provider_id: provId })
    const contractId = await seedContract(db, { service_id: serviceId, customer_group_id: groupId, seat_limit: 1 })
    // 上限は1
    await seedGrant(db, { group_id: groupId, service_id: serviceId, contract_id: contractId, seat_limit: 1 })
    
    const fac1 = await seedFacility(db, { managing_group_id: groupId, structure_no: '001' })
    const fac2 = await seedFacility(db, { managing_group_id: groupId, structure_no: '002' })
    const roleId = await seedRoleMaster(db, { service_id: serviceId })

    const user1 = await seedUser(db)

    const now = nowSec()
    // 最初の割当で1席消費する
    await createAssignment(c, {
      userId: user1, groupId, serviceId, facilityId: fac1, roleId, validFrom: now, validTo: now + 3600
    })
    // 同一ユーザーの2回目の割当は新しい席を消費しない
    const res2 = await createAssignment(c, {
      userId: user1, groupId, serviceId, facilityId: fac2, roleId, validFrom: now, validTo: now + 3600
    })
    expect(res2).toBe('ok')
  })
})
