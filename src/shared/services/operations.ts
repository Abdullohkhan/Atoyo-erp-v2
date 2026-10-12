import dayjs from 'dayjs'
import i18n from '@/i18n'
import api from '@/lib/axios'
import type { AppThunk } from '@/app/store'
import type { Customer, Product, Supplier } from '@/shared/types/catalog.types'
import type { StockBalance } from '@/shared/types/common.types'
import type { DocumentItem, Invoice, Payment, PurchaseOrder, SaleOrder, StockMovement } from '@/shared/types/document.types'
import { generateId, generateNumber } from '@/shared/utils/formatters'
import { allocateFifo, applyStockDelta, invoiceStatus, InsufficientStockError } from './calc'
import { fetchSaleOrders } from '@/features/sales/orders/store/saleOrdersSlice'
import { fetchInvoices } from '@/features/sales/invoices/store/invoicesSlice'
import { fetchCustomers } from '@/features/catalogs/customers/store/customersSlice'
import { fetchSuppliers } from '@/features/catalogs/suppliers/store/suppliersSlice'
import { fetchPurchaseOrders } from '@/features/purchases/orders/store/purchaseOrdersSlice'
import { fetchBalance } from '@/features/warehouse/balance/store/balanceSlice'
import { fetchMovements } from '@/features/warehouse/movements/store/movementsSlice'
import { fetchPayments } from '@/features/finance/payments/store/paymentsSlice'
import { fetchProducts } from '@/features/catalogs/products/store/productsSlice'

/*
 * Business operations on top of json-server. Each one updates several collections
 * (stock, movements, invoices, balances). With a real backend these become single
 * transactional endpoints; the UI keeps calling the same thunks.
 */

const get = async <T,>(url: string) => (await api.get<T[]>(url)).data

/** Turns low-level errors into user-facing, translated messages. */
export function operationError(e: unknown): string {
  if (e instanceof InsufficientStockError) {
    return i18n.t('Omborda yetarli tovar yo\'q: {{name}} (mavjud {{available}}, kerak {{requested}})', {
      name: e.productName, available: e.available, requested: e.requested,
    })
  }
  return e instanceof Error ? e.message : i18n.t('Xatolik yuz berdi')
}

async function findBalance(warehouseId: string, productId: string) {
  const rows = await get<StockBalance>(`/stockBalance?warehouseId=${warehouseId}&productId=${productId}`)
  return rows[0]
}

/** Checks every line first, then writes, so a failing line never leaves half-applied stock. */
async function moveStock(
  warehouseId: string,
  warehouseName: string,
  lines: { item: DocumentItem; sign: 1 | -1; unitCost?: number }[],
  productCodes: Record<string, string> = {},
) {
  const plan = new Map<string, { existing?: StockBalance; next: StockBalance }>()
  for (const { item, sign, unitCost } of lines) {
    const cur = plan.get(item.productId)
    if (cur) {
      cur.next = applyStockDelta(cur.next, sign * item.qty, unitCost)
      continue
    }
    const existing = await findBalance(warehouseId, item.productId)
    const base: StockBalance = existing ?? {
      id: generateId(), warehouseId, warehouseName, productId: item.productId, productName: item.productName,
      productCode: productCodes[item.productId] ?? '', unit: item.unit, qty: 0, reservedQty: 0, availableQty: 0, costPrice: unitCost ?? 0, totalValue: 0,
    }
    plan.set(item.productId, { existing, next: applyStockDelta(base, sign * item.qty, unitCost) })
  }
  for (const { existing, next } of plan.values()) {
    if (existing) await api.patch(`/stockBalance/${existing.id}`, next)
    else await api.post('/stockBalance', next)
  }
}

async function addMovement(m: Omit<StockMovement, 'id' | 'createdAt'>) {
  await api.post('/movements', { id: generateId(), ...m, createdAt: new Date().toISOString() })
}

const refreshAll = (): AppThunk<Promise<void>> => async (dispatch) => {
  await Promise.all([
    dispatch(fetchSaleOrders()), dispatch(fetchInvoices()), dispatch(fetchCustomers()), dispatch(fetchSuppliers()),
    dispatch(fetchPurchaseOrders()), dispatch(fetchBalance()), dispatch(fetchMovements()), dispatch(fetchPayments()),
    dispatch(fetchProducts()),
  ])
}

async function adjustCustomer(id: string, debtDelta: number, purchasesDelta = 0) {
  const c = (await api.get<Customer>(`/customers/${id}`)).data
  await api.patch(`/customers/${id}`, { debt: c.debt + debtDelta, totalPurchases: Math.max(0, c.totalPurchases + purchasesDelta) })
}

async function adjustSupplier(id: string, balanceDelta: number, suppliedDelta = 0) {
  const s = (await api.get<Supplier>(`/suppliers/${id}`)).data
  await api.patch(`/suppliers/${id}`, { balance: s.balance + balanceDelta, totalSupplied: Math.max(0, s.totalSupplied + suppliedDelta) })
}

// ───────────── Sales ─────────────

/** Draft → confirmed: takes goods out of the warehouse, books the debt and issues an invoice. */
export const confirmSaleOrder = (orderId: string): AppThunk<Promise<void>> => async (dispatch) => {
  const order = (await api.get<SaleOrder>(`/saleOrders/${orderId}`)).data
  if (order.status !== 'draft') return
  await moveStock(order.warehouseId, order.warehouseName, order.items.map((item) => ({ item, sign: -1 as const })))
  await addMovement({
    number: generateNumber('HAR'), date: order.date, type: 'dispatch', fromWarehouseId: order.warehouseId,
    fromWarehouseName: order.warehouseName, items: order.items, status: 'completed', notes: order.number,
  })
  const exists = (await get<Invoice>(`/invoices?orderId=${order.id}`)).length > 0
  if (!exists) {
    await api.post('/invoices', {
      id: generateId(), number: generateNumber('FAK'), date: order.date, type: 'sale', orderId: order.id,
      counterpartyId: order.customerId, counterpartyName: order.customerName, amount: order.total,
      status: invoiceStatus(order.total, order.balance), dueDate: dayjs(order.date).add(14, 'day').format('YYYY-MM-DD'),
      createdAt: new Date().toISOString(),
    } satisfies Invoice)
  }
  await adjustCustomer(order.customerId, order.balance, order.total)
  await api.patch(`/saleOrders/${order.id}`, { status: 'confirmed', updatedAt: new Date().toISOString() })
  await dispatch(refreshAll())
}

/** Cancels a document; a confirmed one returns goods to stock and takes the debt back. Paid documents cannot be cancelled. */
export const cancelSaleOrder = (orderId: string): AppThunk<Promise<void>> => async (dispatch) => {
  const order = (await api.get<SaleOrder>(`/saleOrders/${orderId}`)).data
  if (order.status === 'cancelled') return
  if (order.status !== 'draft') {
    if (order.paid > 0) throw new Error(i18n.t("To'lov qilingan hujjatni bekor qilib bo'lmaydi"))
    await moveStock(order.warehouseId, order.warehouseName, order.items.map((item) => ({ item, sign: 1 as const })))
    await addMovement({
      number: generateNumber('HAR'), date: dayjs().format('YYYY-MM-DD'), type: 'receipt', toWarehouseId: order.warehouseId,
      toWarehouseName: order.warehouseName, items: order.items, status: 'completed', notes: `${order.number} (bekor)`,
    })
    await adjustCustomer(order.customerId, -order.balance, -order.total)
    for (const inv of await get<Invoice>(`/invoices?orderId=${order.id}`)) await api.delete(`/invoices/${inv.id}`)
  }
  await api.patch(`/saleOrders/${order.id}`, { status: 'cancelled', updatedAt: new Date().toISOString() })
  await dispatch(refreshAll())
}

// ───────────── Purchases ─────────────

/** Goods receipt: stores a purchase document; confirmed ones also add stock, supplier debt and an invoice. */
export const createPurchase = (data: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt' | 'number'>): AppThunk<Promise<string>> => async (dispatch) => {
  const now = new Date().toISOString()
  const po: PurchaseOrder = { id: generateId(), number: generateNumber('XAR'), ...data, status: 'draft', createdAt: now, updatedAt: now }
  await api.post('/purchaseOrders', po)
  if (data.status === 'confirmed') await dispatch(confirmPurchaseOrder(po.id))
  else await dispatch(refreshAll())
  return po.number
}

export const confirmPurchaseOrder = (orderId: string): AppThunk<Promise<void>> => async (dispatch) => {
  const po = (await api.get<PurchaseOrder>(`/purchaseOrders/${orderId}`)).data
  if (po.status !== 'draft') return
  const products = await get<Product>('/products')
  const codes = Object.fromEntries(products.map((p) => [p.id, p.code]))
  await moveStock(po.warehouseId, po.warehouseName, po.items.map((item) => ({ item, sign: 1 as const, unitCost: item.price })), codes)
  await addMovement({
    number: generateNumber('HAR'), date: po.date, type: 'receipt', toWarehouseId: po.warehouseId,
    toWarehouseName: po.warehouseName, items: po.items, status: 'completed', notes: po.number,
  })
  for (const item of po.items) {
    const p = products.find((x) => x.id === item.productId)
    if (!p) continue
    const patch: Partial<Product> = { costPrice: item.price, updatedAt: new Date().toISOString() }
    if (item.salePrice && item.salePrice > 0) patch.price = item.salePrice
    await api.patch(`/products/${p.id}`, patch)
  }
  if ((await get<Invoice>(`/invoices?orderId=${po.id}`)).length === 0) {
    await api.post('/invoices', {
      id: generateId(), number: generateNumber('FAK'), date: po.date, type: 'purchase', orderId: po.id,
      counterpartyId: po.supplierId, counterpartyName: po.supplierName, amount: po.total,
      status: invoiceStatus(po.total, po.balance), dueDate: dayjs(po.date).add(14, 'day').format('YYYY-MM-DD'),
      createdAt: new Date().toISOString(),
    } satisfies Invoice)
  }
  await adjustSupplier(po.supplierId, po.balance, po.total)
  await api.patch(`/purchaseOrders/${po.id}`, { status: 'confirmed', updatedAt: new Date().toISOString() })
  await dispatch(refreshAll())
}

export const cancelPurchaseOrder = (orderId: string): AppThunk<Promise<void>> => async (dispatch) => {
  const po = (await api.get<PurchaseOrder>(`/purchaseOrders/${orderId}`)).data
  if (po.status === 'cancelled') return
  if (po.status !== 'draft') {
    if (po.paid > 0) throw new Error(i18n.t("To'lov qilingan hujjatni bekor qilib bo'lmaydi"))
    await moveStock(po.warehouseId, po.warehouseName, po.items.map((item) => ({ item, sign: -1 as const })))
    await addMovement({
      number: generateNumber('HAR'), date: dayjs().format('YYYY-MM-DD'), type: 'dispatch', fromWarehouseId: po.warehouseId,
      fromWarehouseName: po.warehouseName, items: po.items, status: 'completed', notes: `${po.number} (bekor)`,
    })
    await adjustSupplier(po.supplierId, -po.balance, -po.total)
    for (const inv of await get<Invoice>(`/invoices?orderId=${po.id}`)) await api.delete(`/invoices/${inv.id}`)
  }
  await api.patch(`/purchaseOrders/${po.id}`, { status: 'cancelled', updatedAt: new Date().toISOString() })
  await dispatch(refreshAll())
}

// ───────────── Stock movements ─────────────

export interface MovementInput {
  type: 'transfer' | 'writeoff'
  fromWarehouseId: string
  fromWarehouseName: string
  toWarehouseId?: string
  toWarehouseName?: string
  item: DocumentItem
  notes?: string
}

export const createStockMovement = (m: MovementInput): AppThunk<Promise<void>> => async (dispatch) => {
  await moveStock(m.fromWarehouseId, m.fromWarehouseName, [{ item: m.item, sign: -1 }])
  if (m.type === 'transfer' && m.toWarehouseId) {
    const products = await get<Product>(`/products?id=${m.item.productId}`)
    const src = await findBalance(m.fromWarehouseId, m.item.productId)
    await moveStock(m.toWarehouseId, m.toWarehouseName ?? '', [{ item: m.item, sign: 1, unitCost: src?.costPrice }], { [m.item.productId]: products[0]?.code ?? '' })
  }
  await addMovement({
    number: generateNumber('HAR'), date: dayjs().format('YYYY-MM-DD'), type: m.type, fromWarehouseId: m.fromWarehouseId,
    fromWarehouseName: m.fromWarehouseName, toWarehouseId: m.toWarehouseId, toWarehouseName: m.toWarehouseName,
    items: [m.item], status: 'completed', notes: m.notes,
  })
  await dispatch(refreshAll())
}

// ───────────── Payments ─────────────

/** Records a payment and, for a customer / supplier, spreads it over their open documents (oldest first). */
export const recordPayment = (p: Omit<Payment, 'id' | 'createdAt' | 'number'> & { number?: string }): AppThunk<Promise<void>> => async (dispatch) => {
  const payment: Payment = { id: generateId(), ...p, number: p.number || generateNumber(p.direction === 'income' ? 'KIR' : 'CHQ'), createdAt: new Date().toISOString() }
  await api.post('/payments', payment)

  if (p.counterpartyId) {
    const isCustomerIncome = p.direction === 'income'
    const endpoint = isCustomerIncome ? 'saleOrders' : 'purchaseOrders'
    const idField = isCustomerIncome ? 'customerId' : 'supplierId'
    const docs = (await get<SaleOrder | PurchaseOrder>(`/${endpoint}?${idField}=${p.counterpartyId}`))
      .filter((d) => d.status === 'confirmed' || d.status === 'completed')
    const { allocations } = allocateFifo(docs, p.amount)
    for (const a of allocations) {
      const d = docs.find((x) => x.id === a.id)!
      const paid = d.paid + a.amount
      const balance = d.total - paid
      await api.patch(`/${endpoint}/${d.id}`, { paid, balance, status: balance <= 0 ? 'completed' : 'confirmed', updatedAt: new Date().toISOString() })
      for (const inv of await get<Invoice>(`/invoices?orderId=${d.id}`)) {
        await api.patch(`/invoices/${inv.id}`, { status: invoiceStatus(d.total, balance) })
      }
    }
    if (isCustomerIncome) await adjustCustomer(p.counterpartyId, -p.amount)
    else await adjustSupplier(p.counterpartyId, -p.amount)
  }
  await dispatch(refreshAll())
}

/** Creates an invoice for a confirmed document that has none yet. */
export const createInvoiceFor = (type: 'sale' | 'purchase', orderId: string, dueDate: string): AppThunk<Promise<void>> => async (dispatch) => {
  if (type === 'sale') {
    const o = (await api.get<SaleOrder>(`/saleOrders/${orderId}`)).data
    await api.post('/invoices', {
      id: generateId(), number: generateNumber('FAK'), date: o.date, type, orderId, counterpartyId: o.customerId,
      counterpartyName: o.customerName, amount: o.total, status: invoiceStatus(o.total, o.balance), dueDate, createdAt: new Date().toISOString(),
    } satisfies Invoice)
  } else {
    const o = (await api.get<PurchaseOrder>(`/purchaseOrders/${orderId}`)).data
    await api.post('/invoices', {
      id: generateId(), number: generateNumber('FAK'), date: o.date, type, orderId, counterpartyId: o.supplierId,
      counterpartyName: o.supplierName, amount: o.total, status: invoiceStatus(o.total, o.balance), dueDate, createdAt: new Date().toISOString(),
    } satisfies Invoice)
  }
  await dispatch(fetchInvoices())
}
