import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { INestApplication } from '@nestjs/common'
import { client, login, prisma, resetDb, startApp, type Api } from './helpers.js'

let app: INestApplication
const as: Record<string, Api> = {}

before(async () => {
  await resetDb()
  app = await startApp()
  for (const u of ['owner', 'admin', 'director', 'seller1', 'engineer', 'declarant', 'supply', 'accountant', 'storekeeper']) {
    as[u] = await login(app, u, u === 'owner' ? process.env.SEED_OWNER_PASSWORD : undefined)
  }
})
after(async () => { await app.close(); await prisma.$disconnect() })

const ok = (res: { status: number; body: unknown }, status = 200) =>
  assert.equal(res.status, status, JSON.stringify(res.body))

describe('auth', () => {
  it('rejects wrong password and anonymous access', async () => {
    assert.equal((await client(app).post('/auth/login', { username: 'seller1', password: 'nope' })).status, 401)
    assert.equal((await client(app).get('/products')).status, 401)
  })
  it('refresh token rotates', async () => {
    const r = await client(app).post('/auth/login', { username: 'seller1', password: 'Demo12345' })
    const r2 = await client(app).post('/auth/refresh', { refreshToken: r.body.refreshToken })
    ok(r2)
    assert.equal((await client(app).post('/auth/refresh', { refreshToken: r.body.refreshToken })).status, 401, 'old refresh token must be invalid')
  })
})

describe('roles and permissions', () => {
  it('only owner manages role permissions', async () => {
    const roles = (await as.owner.get('/roles')).body as { id: string; key: string; permissions: string[] }[]
    const seller = roles.find((r) => r.key === 'seller')!
    assert.equal((await as.admin.patch(`/roles/${seller.id}`, { permissions: [] })).status, 403)
    ok(await as.owner.patch(`/roles/${seller.id}`, { permissions: [...seller.permissions, 'reports.view'] }))
    const owner = roles.find((r) => r.key === 'owner')!
    assert.equal((await as.owner.patch(`/roles/${owner.id}`, { permissions: [] })).status, 400)
  })
  it('custom role can be created and assigned', async () => {
    const role = await as.owner.post('/roles', { key: 'courier', name: 'Kuryer', permissions: ['requests.view', 'requests.deliver'] })
    ok(role, 201)
    const user = await as.admin.post('/users', { username: 'courier1', password: 'Courier123', fullName: 'Kuryer', roleId: role.body.id })
    ok(user, 201)
    const c = await login(app, 'courier1', 'Courier123')
    assert.equal((await c.get('/products')).status, 403)
    ok(await c.get('/requests'))
  })
  it('admin cannot create an owner; last owner cannot be removed', async () => {
    const roles = (await as.owner.get('/roles')).body as { id: string; key: string }[]
    const ownerRole = roles.find((r) => r.key === 'owner')!
    assert.equal((await as.admin.post('/users', { username: 'x1234', password: 'Password1', fullName: 'X', roleId: ownerRole.id })).status, 403)
    const users = (await as.owner.get('/users')).body as { id: string; username: string }[]
    const me = users.find((u) => u.username === 'owner')!
    assert.equal((await as.owner.del(`/users/${me.id}`)).status, 400)
  })
  it('seller cannot see suppliers, engineer cannot see cost prices', async () => {
    assert.equal((await as.seller1.get('/suppliers')).status, 403)
    const products = (await as.engineer.get('/products')).body as Record<string, unknown>[]
    assert.ok(products.length > 0 && !('costPrice' in products[0]))
    const stock = (await as.engineer.get('/stock-balance')).body as Record<string, unknown>[]
    assert.ok(!('costPrice' in stock[0]) && !('totalValue' in stock[0]))
  })
})

describe('request workflow (zayavka)', () => {
  let id: string
  let customerId: string
  let supplierId: string

  it('seller creates a request; engineer is notified', async () => {
    customerId = (await prisma.customer.findFirstOrThrow()).id
    supplierId = (await prisma.supplier.findFirstOrThrow()).id
    const r = await as.seller1.post('/requests', { customerId, title: 'Dell: SSD 1TB, RAM 32GB', kind: 'modification' })
    ok(r, 201)
    id = r.body.id
    assert.equal(r.body.status, 'NEW')
    const n = (await as.engineer.get('/notifications')).body
    assert.ok(n.unread > 0)
    assert.equal((await as.seller1.post(`/requests/${id}/take`)).status, 403)
  })

  it('engineer configures: one stock item and one missing item (not in catalog)', async () => {
    ok(await as.engineer.post(`/requests/${id}/take`), 201)
    ok(await as.engineer.post(`/requests/${id}/configuration`, {
      items: [{ productId: 'p2', qty: 2 }, { name: 'NVIDIA RTX 4090 16GB', qty: 1, note: 'bazada yo\'q' }],
    }), 201)
    const r = await as.engineer.post(`/requests/${id}/submit-configuration`)
    ok(r, 201)
    assert.equal(r.body.status, 'PRICING')
    assert.ok(!('unitCost' in r.body.items[0]) && !('salePrice' in r.body.items[0]), 'engineer must not see prices')
    assert.deepEqual(r.body.items.map((i: { source: string }) => i.source), ['stock', 'purchase'])
  })

  it('declarant creates the product and prices it (customs, VAT, logistics)', async () => {
    const product = await as.declarant.post('/products', { code: 'GPU-4090', name: 'NVIDIA RTX 4090 16GB', price: 0, costPrice: 0, category: 'electronics' })
    ok(product, 201)
    const req = (await as.declarant.get(`/requests/${id}`)).body
    const line = req.items.find((i: { productId: string | null }) => !i.productId)
    assert.equal((await as.declarant.post(`/requests/${id}/submit-pricing`)).status, 400, 'unpriced line must block')
    ok(await as.declarant.post(`/requests/${id}/pricing`, { items: [{
      id: line.id, productId: product.body.id, tnvedCode: '8473302002', purchasePrice: 20_000_000, customsDutyPct: 0,
      vatPct: 12, excisePct: 0, customsFee: 100_000, certificateCost: 50_000, labCost: 0, serviceFee: 10_000, logisticsCost: 240_000,
    }] }), 201)
    const r = await as.declarant.post(`/requests/${id}/submit-pricing`)
    ok(r, 201)
    const priced = r.body.items.find((i: { id: string }) => i.id === line.id)
    // 20M + 12% VAT + (100k+50k+10k+240k)/1
    assert.equal(priced.unitCost, 22_800_000)
    assert.equal(r.body.status, 'REVIEW')
  })

  it('director sets markup, seller gets customer approval', async () => {
    const r = await as.director.post(`/requests/${id}/review`, { markupPct: 10 })
    ok(r, 201)
    assert.equal(r.body.status, 'CUSTOMER_APPROVAL')
    assert.ok(r.body.totalPrice > r.body.totalCost)
    ok(await as.seller1.post(`/requests/${id}/customer-decision`, { approved: true, comment: 'Kelishildi' }), 201)
  })

  it('contract with 30% advance; work is blocked until the advance is paid', async () => {
    ok(await as.seller1.post(`/requests/${id}/contract`, { deadlineDays: 90 }), 201)
    const signed = await as.seller1.post(`/requests/${id}/sign-contract`)
    ok(signed, 201)
    assert.equal(signed.body.status, 'ADVANCE_PAYMENT')
    assert.match(signed.body.contract.body, /SHARTNOMA/)
    assert.equal((await as.accountant.post(`/requests/${id}/confirm-advance`)).status, 400)
    ok(await as.accountant.post('/payments', { type: 'transfer', direction: 'income', amount: signed.body.advanceAmount, category: 'Avans', requestId: id }), 201)
    const r = await as.accountant.post(`/requests/${id}/confirm-advance`)
    ok(r, 201)
    assert.equal(r.body.status, 'PROCUREMENT')
  })

  it('procurement enters supplier and costs; accountant approves', async () => {
    const req = (await as.supply.get(`/requests/${id}`)).body
    const line = req.items.find((i: { source: string }) => i.source === 'purchase')
    ok(await as.supply.post(`/requests/${id}/procurement`, { items: [{ id: line.id, supplierId, actualPrice: 19_500_000, actualLogistics: 300_000 }] }), 201)
    ok(await as.supply.post(`/requests/${id}/submit-procurement`), 201)
    const rej = await as.accountant.post(`/requests/${id}/procurement-decision`, { approved: false, comment: 'Logistika qimmat' })
    assert.equal(rej.body.status, 'PROCUREMENT')
    ok(await as.supply.post(`/requests/${id}/submit-procurement`), 201)
    const r = await as.accountant.post(`/requests/${id}/procurement-decision`, { approved: true })
    assert.equal(r.body.status, 'RECEIVING')
  })

  it('storekeeper receives goods into the warehouse', async () => {
    const before = await prisma.stockBalance.findMany({ where: { warehouseId: 'w1' } })
    const r = await as.storekeeper.post(`/requests/${id}/receive`)
    ok(r, 201)
    assert.equal(r.body.status, 'ASSEMBLY')
    const after = await prisma.stockBalance.findMany({ where: { warehouseId: 'w1' } })
    assert.equal(after.length, before.length + 1, 'new GPU stock row')
    const po = await prisma.purchaseOrder.findFirstOrThrow({ where: { requestId: id } })
    assert.equal(po.status, 'confirmed')
  })

  it('engineer takes parts from stock, returns one, finishes assembly', async () => {
    const req = (await as.engineer.get(`/requests/${id}`)).body
    for (const i of req.items) ok(await as.engineer.post(`/requests/${id}/issue`, { itemId: i.id, qty: i.qty }), 201)
    const stockItem = req.items[0]
    ok(await as.engineer.post(`/requests/${id}/return`, { itemId: stockItem.id, qty: 1 }), 201)
    assert.equal((await as.engineer.post(`/requests/${id}/finish-assembly`)).status, 400, 'missing part must block')
    ok(await as.engineer.post(`/requests/${id}/issue`, { itemId: stockItem.id, qty: 1 }), 201)
    assert.equal((await as.engineer.post(`/requests/${id}/issue`, { itemId: stockItem.id, qty: 1 })).status, 400, 'over-issue blocked')
    const r = await as.engineer.post(`/requests/${id}/finish-assembly`)
    assert.equal(r.body.status, 'ACT')
  })

  it('act and delivery complete the request', async () => {
    const act = await as.seller1.post(`/requests/${id}/act`)
    ok(act, 201)
    assert.match(act.body.act.body, /DALOLATNOMA/)
    const r = await as.supply.post(`/requests/${id}/deliver`, { comment: 'Topshirildi' })
    assert.equal(r.body.status, 'COMPLETED')
    assert.ok(r.body.events.length >= 12)
  })

  it('wrong role / wrong stage is rejected', async () => {
    const r = await as.seller1.post('/requests', { customerId, title: 'Test' })
    assert.equal((await as.engineer.post(`/requests/${r.body.id}/submit-pricing`)).status, 403)
    assert.equal((await as.declarant.post(`/requests/${r.body.id}/submit-pricing`)).status, 400)
    ok(await as.director.post(`/requests/${r.body.id}/cancel`, { comment: 'Mijoz voz kechdi' }), 201)
  })
})

describe('sales, purchases, payments', () => {
  it('confirmed sale reduces stock, adds debt and invoice; oversell is blocked', async () => {
    const c = await prisma.customer.findFirstOrThrow({ where: { id: 'c2' } })
    const before = await prisma.stockBalance.findFirstOrThrow({ where: { warehouseId: 'w1', productId: 'p4' } })
    const r = await as.seller1.post('/sale-orders', { customerId: c.id, warehouseId: 'w1', items: [{ productId: 'p4', qty: 1, price: 650000 }], confirm: true })
    ok(r, 201)
    const after = await prisma.stockBalance.findFirstOrThrow({ where: { warehouseId: 'w1', productId: 'p4' } })
    assert.equal(Number(after.qty), Number(before.qty) - 1)
    assert.equal(Number((await prisma.customer.findFirstOrThrow({ where: { id: 'c2' } })).debt), Number(c.debt) + 650000)
    assert.ok(await prisma.invoice.findFirst({ where: { orderId: r.body.id } }))
    const over = await as.seller1.post('/sale-orders', { customerId: c.id, warehouseId: 'w1', items: [{ productId: 'p4', qty: 99999, price: 1 }], confirm: true })
    assert.equal(over.status, 400)
    assert.equal(await prisma.saleOrder.count({ where: { total: 99999 } }), 0, 'failed confirm rolls back the whole document')
  })

  it('payment is allocated FIFO and paid order cannot be cancelled', async () => {
    const order = await prisma.saleOrder.findFirstOrThrow({ where: { customerId: 'c2', status: 'confirmed' }, orderBy: { date: 'asc' } })
    ok(await as.accountant.post('/payments', { type: 'cash', direction: 'income', amount: 100000, category: 'Savdo', counterpartyId: 'c2' }), 201)
    const o = await prisma.saleOrder.findUniqueOrThrow({ where: { id: order.id } })
    assert.equal(Number(o.paid), Number(order.paid) + 100000)
    assert.equal((await as.owner.post(`/sale-orders/${order.id}/cancel`)).status, 400)
  })

  it('validation errors are 400 with a message', async () => {
    const r = await as.owner.post('/products', { code: '', name: 'x' })
    assert.equal(r.status, 400)
    assert.ok(r.body.message)
    assert.equal((await as.owner.post('/products', { code: 'MAH-001', name: 'Dup' })).status, 409)
  })
})
