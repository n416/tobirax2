import { env, createExecutionContext } from 'cloudflare:test'
import { describe, it, expect, beforeEach } from 'vitest'
import { applySchema, seedUser, seedGroup, seedProvider, seedService, seedContract, seedGrant, seedFacility, seedRoleMaster, seedAssignment } from './helpers'
import { createAssignment } from '../../src/index'
import type { AppContext } from '../../src/types'

const nowSec = () => Math.floor(Date.now() / 1000)

describe('DaaS Seat Limits (createAssignment)', () => {
  let db: D1Database
  let c: AppContext
  let ctx: ExecutionContext

  beforeEach(async () => {
    db = env.DB
    ctx = createExecutionContext()
    c = { env: { DB: db } as any, req: {} as any, get: (() => {}) as any } as unknown as AppContext
    await applySchema(db)
  })

  it('should return no_grant if there is no valid grant for the group', async () => {
    const groupId = await seedGroup(db)
    const userId = await seedUser(db)
    const provId = await seedProvider(db)
    const serviceId = await seedService(db, { provider_id: provId })
    const facId = await seedFacility(db, { managing_group_id: groupId })
    const roleId = await seedRoleMaster(db, { service_id: serviceId })

    // No grant exists
    const now = nowSec()
    const result = await createAssignment(c, {
      userId, groupId, serviceId, facilityId: facId, roleId, validFrom: now, validTo: now + 3600
    })
    expect(result).toBe('no_grant')
  })

  it('should return ok if seat limit is not exceeded', async () => {
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

  it('should return seat when grant seat_limit is exceeded', async () => {
    const groupId = await seedGroup(db)
    const provId = await seedProvider(db)
    const serviceId = await seedService(db, { provider_id: provId })
    const contractId = await seedContract(db, { service_id: serviceId, customer_group_id: groupId, seat_limit: 10 })
    // Grant limit is 1
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

  it('should calculate effective grant limit by subtracting child grants', async () => {
    const parentGroupId = await seedGroup(db)
    const childGroupId = await seedGroup(db, { parent_id: parentGroupId })
    const provId = await seedProvider(db)
    const serviceId = await seedService(db, { provider_id: provId })
    const contractId = await seedContract(db, { service_id: serviceId, customer_group_id: parentGroupId, seat_limit: 10 })
    
    // Parent limit: 3
    await seedGrant(db, { group_id: parentGroupId, service_id: serviceId, contract_id: contractId, seat_limit: 3 })
    // Child limit: 2
    await seedGrant(db, { group_id: childGroupId, service_id: serviceId, contract_id: contractId, seat_limit: 2 })
    
    const facId = await seedFacility(db, { managing_group_id: parentGroupId })
    const roleId = await seedRoleMaster(db, { service_id: serviceId })

    const user1 = await seedUser(db)
    const user2 = await seedUser(db)

    const now = nowSec()
    // Parent's effective limit should be 3 - 2 = 1.
    const res1 = await createAssignment(c, {
      userId: user1, groupId: parentGroupId, serviceId, facilityId: facId, roleId, validFrom: now, validTo: now + 3600
    })
    expect(res1).toBe('ok')

    const res2 = await createAssignment(c, {
      userId: user2, groupId: parentGroupId, serviceId, facilityId: facId, roleId, validFrom: now, validTo: now + 3600
    })
    // Second user should exceed the effective limit of 1
    expect(res2).toBe('seat')
  })

  it('should return seat when contract seat_limit is exceeded across groups', async () => {
    const parentGroupId = await seedGroup(db)
    const childGroupId = await seedGroup(db, { parent_id: parentGroupId })
    const provId = await seedProvider(db)
    const serviceId = await seedService(db, { provider_id: provId })
    // Contract total limit: 2
    const contractId = await seedContract(db, { service_id: serviceId, customer_group_id: parentGroupId, seat_limit: 2 })
    
    // Grants are generous enough (each has 2)
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

  it('should not consume a new seat if user is already assigned to another facility in the same group and service', async () => {
    const groupId = await seedGroup(db)
    const provId = await seedProvider(db)
    const serviceId = await seedService(db, { provider_id: provId })
    const contractId = await seedContract(db, { service_id: serviceId, customer_group_id: groupId, seat_limit: 1 })
    // Limit is 1
    await seedGrant(db, { group_id: groupId, service_id: serviceId, contract_id: contractId, seat_limit: 1 })
    
    const fac1 = await seedFacility(db, { managing_group_id: groupId, structure_no: '001' })
    const fac2 = await seedFacility(db, { managing_group_id: groupId, structure_no: '002' })
    const roleId = await seedRoleMaster(db, { service_id: serviceId })

    const user1 = await seedUser(db)

    const now = nowSec()
    // First assignment consumes 1 seat
    await createAssignment(c, {
      userId: user1, groupId, serviceId, facilityId: fac1, roleId, validFrom: now, validTo: now + 3600
    })
    // Second assignment for the SAME user does NOT consume a new seat
    const res2 = await createAssignment(c, {
      userId: user1, groupId, serviceId, facilityId: fac2, roleId, validFrom: now, validTo: now + 3600
    })
    expect(res2).toBe('ok')
  })
})
