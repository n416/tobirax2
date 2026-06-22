import { env, createExecutionContext } from 'cloudflare:test'
import { describe, it, expect, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { applySchema, seedUser, seedGroup, seedMembership, seedSession, seedProvider, seedService, seedContract, seedGrant } from './helpers'
import { getManagedGroupIds, getBillingGroupIds } from '../../src/index'
import { groupAdminRouter } from '../../src/routes/group-admin'
import type { AppContext } from '../../src/types'

const nowSec = () => Math.floor(Date.now() / 1000)

describe('DaaS IDOR and Scope limits', () => {
  let db: D1Database
  let c: AppContext
  let ctx: ExecutionContext
  let app: Hono<any>

  beforeEach(async () => {
    db = env.DB
    ctx = createExecutionContext()
    c = { env: { DB: db } as any, req: {} as any, get: (() => {}) as any } as unknown as AppContext
    await applySchema(db)

    // Setup Hono app with groupAdminRouter
    app = new Hono<any>()
    app.use('*', async (c, next) => {
      // env is passed via request() args
      await next()
    })
    app.route('/', groupAdminRouter)
  })

  it('getManagedGroupIds should return the group and its descendants', async () => {
    const parentId = await seedGroup(db)
    const childId = await seedGroup(db, { parent_id: parentId })
    const grandchildId = await seedGroup(db, { parent_id: childId })
    const otherId = await seedGroup(db)

    const userId = await seedUser(db)
    await seedMembership(db, { user_id: userId, group_id: parentId, is_group_admin: 1 })

    const managed = await getManagedGroupIds(c, userId)
    expect(managed.has(parentId)).toBe(true)
    expect(managed.has(childId)).toBe(true)
    expect(managed.has(grandchildId)).toBe(true)
    expect(managed.has(otherId)).toBe(false)
  })

  it('getBillingGroupIds should return the group and its descendants for billing_admin', async () => {
    const parentId = await seedGroup(db)
    const childId = await seedGroup(db, { parent_id: parentId })
    const otherId = await seedGroup(db)

    const userId = await seedUser(db)
    await seedMembership(db, { user_id: userId, group_id: parentId, is_billing_admin: 1 })

    const billing = await getBillingGroupIds(c, userId)
    expect(billing.has(parentId)).toBe(true)
    expect(billing.has(childId)).toBe(true)
    expect(billing.has(otherId)).toBe(false)
  })

  it('POST /group-admin/api/group/create should return 403 if parent group is outside of managed scope', async () => {
    const parentId = await seedGroup(db)
    const otherId = await seedGroup(db)

    const userId = await seedUser(db)
    await seedMembership(db, { user_id: userId, group_id: parentId, is_group_admin: 1 })
    
    // Seed a session
    await seedSession(db, { plainSessionId: 'session1', user_id: userId })

    // Valid case
    const res1 = await app.request('/group-admin/api/group/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': '__Host-idp_session=session1' },
      body: JSON.stringify({ parent_group_id: parentId, name: 'Child', admin_user_id: userId })
    }, { DB: db }, ctx)
    expect(res1.status).toBe(200)

    // Invalid case (outside of scope)
    const res2 = await app.request('/group-admin/api/group/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': '__Host-idp_session=session1' },
      body: JSON.stringify({ parent_group_id: otherId, name: 'Child2', admin_user_id: userId })
    }, { DB: db }, ctx)
    expect(res2.status).toBe(403)
  })

  it('POST /group-admin/api/grant/add should return 403 if target or context is outside billing scope', async () => {
    const parentId = await seedGroup(db)
    const childId = await seedGroup(db, { parent_id: parentId })
    const otherId = await seedGroup(db)

    const userId = await seedUser(db)
    await seedMembership(db, { user_id: userId, group_id: parentId, is_billing_admin: 1 })
    await seedSession(db, { plainSessionId: 'session2', user_id: userId })

    const provId = await seedProvider(db)
    const serviceId = await seedService(db, { provider_id: provId })
    const contractId = await seedContract(db, { service_id: serviceId, customer_group_id: parentId, seat_limit: 10 })
    await seedGrant(db, { group_id: parentId, service_id: serviceId, contract_id: contractId, seat_limit: 10 })

    const now = nowSec()

    // Valid: distributing to child
    const res1 = await app.request('/group-admin/api/grant/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': '__Host-idp_session=session2' },
      body: JSON.stringify({ group_id: childId, contract_id: contractId, seat_limit: 5, valid_from: now, valid_to: now + 3600, context_group_id: parentId })
    }, { DB: db }, ctx)
    expect(res1.status).toBe(200)

    // Invalid: distributing to other group outside of scope
    const res2 = await app.request('/group-admin/api/grant/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': '__Host-idp_session=session2' },
      body: JSON.stringify({ group_id: otherId, contract_id: contractId, seat_limit: 5, valid_from: now, valid_to: now + 3600, context_group_id: parentId })
    }, { DB: db }, ctx)
    expect(res2.status).toBe(403)
  })
})
