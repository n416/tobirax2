import { env, createExecutionContext } from 'cloudflare:test'
import { describe, it, expect, beforeEach } from 'vitest'
import { applySchema, seedUser, seedGroup, seedMembership, seedProvider, seedService, seedContract, seedGrant, seedFacility, seedRoleMaster, seedAssignment } from './helpers'
import { getEntitlements } from '../../src/index'
import type { AppContext } from '../../src/types'

const nowSec = () => Math.floor(Date.now() / 1000)

describe('DaaSアクセス3ゲート', () => {
  let db: D1Database
  let c: AppContext
  let ctx: ExecutionContext

  beforeEach(async () => {
    db = env.DB
    ctx = createExecutionContext()
    c = { env: { DB: db } as any, req: {} as any, get: (() => {}) as any } as unknown as AppContext
    await applySchema(db)
  })

  it('3つのゲートが全て有効な場合、エンタイトルメントを返す', async () => {
    const groupId = await seedGroup(db, { name: 'Test Group' })
    const userId = await seedUser(db, { email: 'u@example.com' })
    const provId = await seedProvider(db, { name: 'Test Provider' })
    const serviceId = await seedService(db, { provider_id: provId, name: 'Test Service' })
    const contractId = await seedContract(db, { service_id: serviceId, customer_group_id: groupId })
    const facId = await seedFacility(db, { managing_group_id: groupId, structure_no: '001' })
    const roleId = await seedRoleMaster(db, { service_id: serviceId })

    // ゲート1: メンバーシップ有効
    await seedMembership(db, { user_id: userId, group_id: groupId })
    // ゲート2: 利用枠有効
    await seedGrant(db, { group_id: groupId, service_id: serviceId, contract_id: contractId })
    // ゲート3: 割当有効
    await seedAssignment(db, { user_id: userId, group_id: groupId, service_id: serviceId, facility_id: facId, service_role_id: roleId })

    const entitlements = await getEntitlements(c, userId, serviceId)
    expect(entitlements.length).toBe(1)
    expect(entitlements[0].group.id).toBe(groupId)
    expect(entitlements[0].facility.id).toBe(facId)
  })

  it('メンバーシップが期限切れの場合、空を返す（ゲート1失敗）', async () => {
    const groupId = await seedGroup(db)
    const userId = await seedUser(db)
    const provId = await seedProvider(db)
    const serviceId = await seedService(db, { provider_id: provId })
    const contractId = await seedContract(db, { service_id: serviceId, customer_group_id: groupId })
    const facId = await seedFacility(db, { managing_group_id: groupId })
    const roleId = await seedRoleMaster(db, { service_id: serviceId })

    const now = nowSec()
    // ゲート1: メンバーシップ期限切れ
    await seedMembership(db, { user_id: userId, group_id: groupId, valid_to: now - 100 })
    
    await seedGrant(db, { group_id: groupId, service_id: serviceId, contract_id: contractId })
    await seedAssignment(db, { user_id: userId, group_id: groupId, service_id: serviceId, facility_id: facId, service_role_id: roleId })

    const entitlements = await getEntitlements(c, userId, serviceId)
    expect(entitlements.length).toBe(0)
  })

  it('利用枠が期限切れの場合、空を返す（ゲート2失敗）', async () => {
    const groupId = await seedGroup(db)
    const userId = await seedUser(db)
    const provId = await seedProvider(db)
    const serviceId = await seedService(db, { provider_id: provId })
    const contractId = await seedContract(db, { service_id: serviceId, customer_group_id: groupId })
    const facId = await seedFacility(db, { managing_group_id: groupId })
    const roleId = await seedRoleMaster(db, { service_id: serviceId })

    const now = nowSec()
    await seedMembership(db, { user_id: userId, group_id: groupId })
    
    // ゲート2: 利用枠期限切れ
    await seedGrant(db, { group_id: groupId, service_id: serviceId, contract_id: contractId, valid_to: now - 100 })
    
    await seedAssignment(db, { user_id: userId, group_id: groupId, service_id: serviceId, facility_id: facId, service_role_id: roleId })

    const entitlements = await getEntitlements(c, userId, serviceId)
    expect(entitlements.length).toBe(0)
  })

  it('割当が期限切れの場合、空を返す（ゲート3失敗）', async () => {
    const groupId = await seedGroup(db)
    const userId = await seedUser(db)
    const provId = await seedProvider(db)
    const serviceId = await seedService(db, { provider_id: provId })
    const contractId = await seedContract(db, { service_id: serviceId, customer_group_id: groupId })
    const facId = await seedFacility(db, { managing_group_id: groupId })
    const roleId = await seedRoleMaster(db, { service_id: serviceId })

    const now = nowSec()
    await seedMembership(db, { user_id: userId, group_id: groupId })
    await seedGrant(db, { group_id: groupId, service_id: serviceId, contract_id: contractId })
    
    // ゲート3: 割当期限切れ
    await seedAssignment(db, { user_id: userId, group_id: groupId, service_id: serviceId, facility_id: facId, service_role_id: roleId, valid_to: now - 100 })

    const entitlements = await getEntitlements(c, userId, serviceId)
    expect(entitlements.length).toBe(0)
  })

  it('サービスが自グループ所有でアクティブな場合、ゲート2（利用枠）をバイパスする', async () => {
    const groupId = await seedGroup(db)
    const userId = await seedUser(db)
    const provId = await seedProvider(db)
    // サービスは自グループ所有でアクティブ
    const serviceId = await seedService(db, { provider_id: provId, owner_group_id: groupId, status: 'active' })
    const facId = await seedFacility(db, { managing_group_id: groupId })
    const roleId = await seedRoleMaster(db, { service_id: serviceId })

    await seedMembership(db, { user_id: userId, group_id: groupId })
    // 利用枠は作成しない
    
    await seedAssignment(db, { user_id: userId, group_id: groupId, service_id: serviceId, facility_id: facId, service_role_id: roleId })

    const entitlements = await getEntitlements(c, userId, serviceId)
    expect(entitlements.length).toBe(1)
  })
})
