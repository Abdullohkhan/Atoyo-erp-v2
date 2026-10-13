import i18n from '@/i18n'
import api from '@/lib/axios'
import type { AppThunk } from '@/app/store'
import { fetchSaleOrders } from '@/features/sales/orders/store/saleOrdersSlice'
import { fetchInvoices } from '@/features/sales/invoices/store/invoicesSlice'
import { fetchCustomers } from '@/features/catalogs/customers/store/customersSlice'
import { fetchSuppliers } from '@/features/catalogs/suppliers/store/suppliersSlice'
import { fetchPurchaseOrders } from '@/features/purchases/orders/store/purchaseOrdersSlice'
import { fetchBalance } from '@/features/warehouse/balance/store/balanceSlice'
import { fetchMovements } from '@/features/warehouse/movements/store/movementsSlice'
import { fetchPayments } from '@/features/finance/payments/store/paymentsSlice'
import { fetchProducts } from '@/features/catalogs/products/store/productsSlice'
import { can } from '@/app/permissions'

/*
 * Business operations. Each one is a single transactional endpoint on the backend
 * (stock, movements, invoices and balances are updated there); afterwards the
 * affected lists are re-fetched.
 */

export function operationError(e: unknown): string {
  return e instanceof Error ? e.message : i18n.t('Xatolik yuz berdi')
}

const refreshAll = (): AppThunk<Promise<void>> => async (dispatch, getState) => {
  const user = getState().auth.user
  const jobs: Promise<unknown>[] = [dispatch(fetchProducts())]
  if (can(user, 'sales.view')) jobs.push(dispatch(fetchSaleOrders()))
  if (can(user, 'invoices.view')) jobs.push(dispatch(fetchInvoices()))
  if (can(user, 'customers.view') || can(user, 'customers.manage')) jobs.push(dispatch(fetchCustomers()))
  if (can(user, 'suppliers.view') || can(user, 'suppliers.manage')) jobs.push(dispatch(fetchSuppliers()))
  if (can(user, 'purchases.view')) jobs.push(dispatch(fetchPurchaseOrders()))
  if (can(user, 'stock.view')) jobs.push(dispatch(fetchBalance()), dispatch(fetchMovements()))
  if (can(user, 'payments.view')) jobs.push(dispatch(fetchPayments()))
  await Promise.all(jobs)
}

const call = (fn: () => Promise<unknown>): AppThunk<Promise<void>> => async (dispatch) => {
  await fn()
  await dispatch(refreshAll())
}

export interface LineInput { productId: string; qty: number; price: number; salePrice?: number }

export const createSale = (b: { date: string; customerId: string; warehouseId: string; items: LineInput[]; confirm: boolean; notes?: string }): AppThunk<Promise<void>> =>
  call(() => api.post('/sale-orders', b))
export const confirmSaleOrder = (id: string) => call(() => api.post(`/sale-orders/${id}/confirm`))
export const cancelSaleOrder = (id: string) => call(() => api.post(`/sale-orders/${id}/cancel`))

export const createPurchase = (b: { date: string; supplierId: string; warehouseId: string; items: LineInput[]; confirm: boolean; notes?: string }): AppThunk<Promise<void>> =>
  call(() => api.post('/purchase-orders', b))
export const confirmPurchaseOrder = (id: string) => call(() => api.post(`/purchase-orders/${id}/confirm`))
export const cancelPurchaseOrder = (id: string) => call(() => api.post(`/purchase-orders/${id}/cancel`))

export interface MovementInput {
  type: 'transfer' | 'writeoff'
  fromWarehouseId: string
  toWarehouseId?: string
  productId: string
  qty: number
  notes?: string
}
export const createStockMovement = (m: MovementInput) => call(() => api.post('/movements', m))

export interface PaymentInput {
  direction: 'income' | 'expense'
  type: 'cash' | 'card' | 'transfer'
  number?: string
  date: string
  amount: number
  category: string
  counterpartyId?: string
  description?: string
  requestId?: string
}
export const recordPayment = (p: PaymentInput) => call(() => api.post('/payments', p))

export const createInvoiceFor = (type: 'sale' | 'purchase', orderId: string, dueDate: string) =>
  call(() => api.post('/invoices', { type, orderId, dueDate }))
