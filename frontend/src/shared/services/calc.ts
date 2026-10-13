import type { StockBalance } from '@/shared/types/common.types'

export interface Payable { id: string; date: string; balance: number }
export interface Allocation { id: string; amount: number }

/** Spreads a payment over open documents, oldest first. */
export function allocateFifo(docs: Payable[], amount: number): { allocations: Allocation[]; remainder: number } {
  let left = amount
  const allocations: Allocation[] = []
  const sorted = [...docs].filter((d) => d.balance > 0).sort((a, b) => a.date.localeCompare(b.date))
  for (const d of sorted) {
    if (left <= 0) break
    const part = Math.min(left, d.balance)
    allocations.push({ id: d.id, amount: part })
    left -= part
  }
  return { allocations, remainder: left }
}

export class InsufficientStockError extends Error {
  productName: string
  available: number
  requested: number
  constructor(productName: string, available: number, requested: number) {
    super(`INSUFFICIENT_STOCK:${productName}:${available}:${requested}`)
    this.productName = productName
    this.available = available
    this.requested = requested
  }
}

/** Returns the stock record after adding `delta` (negative = take out). `unitCost` re-averages the cost on receipts. */
export function applyStockDelta(
  rec: StockBalance,
  delta: number,
  unitCost?: number,
): StockBalance {
  const qty = rec.qty + delta
  if (qty < 0 || (delta < 0 && rec.availableQty + delta < 0)) {
    throw new InsufficientStockError(rec.productName, rec.availableQty, -delta)
  }
  let costPrice = rec.costPrice
  if (delta > 0 && unitCost !== undefined && qty > 0) {
    costPrice = Math.round((rec.qty * rec.costPrice + delta * unitCost) / qty)
  }
  return { ...rec, qty, availableQty: qty - rec.reservedQty, costPrice, totalValue: qty * costPrice }
}

export const invoiceStatus = (total: number, balance: number): 'unpaid' | 'partial' | 'paid' =>
  balance <= 0 ? 'paid' : balance < total ? 'partial' : 'unpaid'

export const sumItems = (items: { sum: number }[]) => items.reduce((s, i) => s + i.sum, 0)
