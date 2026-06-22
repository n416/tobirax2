import { env, createExecutionContext } from 'cloudflare:test'
import { describe, it, expect, beforeEach } from 'vitest'
import { applySchema, seedUser, seedGroup, seedMembership, seedProvider, seedService, seedContract, seedGrant, seedFacility, seedRoleMaster, seedAssignment } from './helpers'
import { getEntitlements } from '../../src/index'
import type { AppContext } from '../../src/types'

const nowSec = () => Math.floor(Date.now() / 1000)

describe('DaaS Access Gates', () => {
  let db: D1Database
  let c: AppContext
  let ctx: ExecutionContext

  beforeEach(async () => {
    db = env.DB
    ctx = createExecutionContext()
    c = { env: { DB: db } as any, req: {} as any, get: (() => {}) as any } as unknown as AppContext
    await applySchema(db)
  })

  it('should return entitlements when all 3 gates are valid', async () => {
    const groupId = await seedGroup(db, { name: 'Test Group' })
    const userId = await seedUser(db, { email: 'u@example.com' })
    const provId = await seedProvider(db, { name: 'Test Provider' })
    const serviceId = await seedService(db, { provider_id: provId, name: 'Test Service' })
    const contractId = await seedContract(db, { service_id: serviceId, customer_group_id: groupId })
    const facId = await seedFacility(db, { managing_group_id: groupId, structure_no: '001' })
    const roleId = await seedRoleMaster(db, { service_id: serviceId })

    // Gate 1: membership ok
    await seedMembership(db, { user_id: userId, group_id: groupId })
    // Gate 2: grant ok
    await seedGrant(db, { group_id: groupId, service_id: serviceId, contract_id: contractId })
    // Gate 3: assignment ok
    await seedAssignment(db, { user_id: userId, group_id: groupId, service_id: serviceId, facility_id: facId, service_role_id: roleId })

    const entitlements = await getEntitlements(c, userId, serviceId)
    expect(entitlements.length).toBe(1)
    expect(entitlements[0].group.id).toBe(groupId)
    expect(entitlements[0].facility.id).toBe(facId)
  })

  it('should return empty when membership is expired (Gate 1 fails)', async () => {
    const groupId = await seedGroup(db)
    const userId = await seedUser(db)
    const provId = await seedProvider(db)
    const serviceId = await seedService(db, { provider_id: provId })
    const contractId = await seedContract(db, { service_id: serviceId, customer_group_id: groupId })
    const facId = await seedFacility(db, { managing_group_id: groupId })
    const roleId = await seedRoleMaster(db, { service_id: serviceId })

    const now = nowSec()
    // Gate 1: membership expired
    await seedMembership(db, { user_id: userId, group_id: groupId, valid_to: now - 100 })
    
    await seedGrant(db, { group_id: groupId, service_id: serviceId, contract_id: contractId })
    await seedAssignment(db, { user_id: userId, group_id: groupId, service_id: serviceId, facility_id: facId, service_role_id: roleId })

    const entitlements = await getEntitlements(c, userId, serviceId)
    expect(entitlements.length).toBe(0)
  })

  it('should return empty when grant is expired (Gate 2 fails)', async () => {
    const groupId = await seedGroup(db)
    const userId = await seedUser(db)
    const provId = await seedProvider(db)
    const serviceId = await seedService(db, { provider_id: provId })
    const contractId = await seedContract(db, { service_id: serviceId, customer_group_id: groupId })
    const facId = await seedFacility(db, { managing_group_id: groupId })
    const roleId = await seedRoleMaster(db, { service_id: serviceId })

    const now = nowSec()
    await seedMembership(db, { user_id: userId, group_id: groupId })
    
    // Gate 2: grant expired
    await seedGrant(db, { group_id: groupId, service_id: serviceId, contract_id: contractId, valid_to: now - 100 })
    
    await seedAssignment(db, { user_id: userId, group_id: groupId, service_id: serviceId, facility_id: facId, service_role_id: roleId })

    const entitlements = await getEntitlements(c, userId, serviceId)
    expect(entitlements.length).toBe(0)
  })

  it('should return empty when assignment is expired (Gate 3 fails)', async () => {
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
    
    // Gate 3: assignment expired
    await seedAssignment(db, { user_id: userId, group_id: groupId, service_id: serviceId, facility_id: facId, service_role_id: roleId, valid_to: now - 100 })

    const entitlements = await getEntitlements(c, userId, serviceId)
    expect(entitlements.length).toBe(0)
  })

  it('should bypass Gate 2 if the service is owned by the users group and active', async () => {
    const groupId = await seedGroup(db)
    const userId = await seedUser(db)
    const provId = await seedProvider(db)
    // Service owned by groupId and active
    const serviceId = await seedService(db, { provider_id: provId, owner_group_id: groupId, status: 'active' })
    const facId = await seedFacility(db, { managing_group_id: groupId })
    const roleId = await seedRoleMaster(db, { service_id: serviceId })

    await seedMembership(db, { user_id: userId, group_id: groupId })
    // No grant created!
    
    await seedAssignment(db, { user_id: userId, group_id: groupId, service_id: serviceId, facility_id: facId, service_role_id: roleId })

    const entitlements = await getEntitlements(c, userId, serviceId)
    expect(entitlements.length).toBe(1)
  })
})
