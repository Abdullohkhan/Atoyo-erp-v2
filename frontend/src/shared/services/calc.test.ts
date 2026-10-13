import { describe, it, expect } from 'vitest'
import { allocateFifo, applyStockDelta, invoiceStatus, InsufficientStockError } from './calc'
import type { StockBalance } from '@/shared/types/common.types'

const rec: StockBalance = {
  id: 's1', warehouseId: 'w1', warehouseName: 'W', productId: 'p1', productName: 'P', productCode: 'C', unit: 'dona',
  qty: 10, reservedQty: 2, availableQty: 8, costPrice: 100, totalValue: 1000,
}

describe('allocateFifo', () => {
  it('pays oldest documents first and returns remainder', () => {
    const r = allocateFifo([
      { id: 'b', date: '2025-02-01', balance: 50 },
      { id: 'a', date: '2025-01-01', balance: 30 },
      { id: 'c', date: '2025-03-01', balance: 0 },
    ], 100)
    expect(r.allocations).toEqual([{ id: 'a', amount: 30 }, { id: 'b', amount: 50 }])
    expect(r.remainder).toBe(20)
  })
  it('partially pays a document', () => {
    expect(allocateFifo([{ id: 'a', date: '2025-01-01', balance: 80 }], 30).allocations).toEqual([{ id: 'a', amount: 30 }])
  })
})

describe('applyStockDelta', () => {
  it('reduces stock and value', () => {
    const r = applyStockDelta(rec, -3)
    expect(r.qty).toBe(7)
    expect(r.availableQty).toBe(5)
    expect(r.totalValue).toBe(700)
  })
  it('re-averages cost on receipt', () => {
    const r = applyStockDelta(rec, 10, 200)
    expect(r.qty).toBe(20)
    expect(r.costPrice).toBe(150)
    expect(r.totalValue).toBe(3000)
  })
  it('rejects taking more than available (reserved stock is not available)', () => {
    expect(() => applyStockDelta(rec, -9)).toThrow(InsufficientStockError)
  })
})

describe('invoiceStatus', () => {
  it('maps balance to status', () => {
    expect(invoiceStatus(100, 100)).toBe('unpaid')
    expect(invoiceStatus(100, 40)).toBe('partial')
    expect(invoiceStatus(100, 0)).toBe('paid')
  })
})
