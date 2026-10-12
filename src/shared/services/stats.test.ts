import { describe, it, expect } from 'vitest'
import { monthlySeries, salesByCategory, cashBalance, trend } from './stats'
import type { SaleOrder, Payment } from '@/shared/types/document.types'
import type { Product } from '@/shared/types/catalog.types'

const sale = (date: string, total: number, status = 'completed', productId = 'p1'): SaleOrder => ({
  id: date + total, number: 'S', date, customerId: 'c', customerName: 'C', warehouseId: 'w', warehouseName: 'W',
  items: [{ productId, productName: 'P', unit: 'dona', qty: 1, price: total, discount: 0, sum: total }],
  status: status as SaleOrder['status'], total, paid: 0, balance: total, createdAt: date, updatedAt: date,
})

describe('monthlySeries', () => {
  it('ignores drafts and cancelled, fills empty months', () => {
    const r = monthlySeries([sale('2025-03-10', 100), sale('2025-03-12', 50, 'draft'), sale('2025-01-05', 70, 'cancelled')], [], 3)
    expect(r.map((p) => p.key)).toEqual(['2025-01', '2025-02', '2025-03'])
    expect(r.map((p) => p.savdo)).toEqual([0, 0, 100])
  })
  it('is empty without data', () => {
    expect(monthlySeries([], [])).toEqual([])
  })
})

describe('salesByCategory', () => {
  it('groups by product category', () => {
    const products = [{ id: 'p1', category: 'food' }, { id: 'p2', category: 'building' }] as Product[]
    const r = salesByCategory([sale('2025-01-01', 10, 'completed', 'p1'), sale('2025-01-02', 30, 'confirmed', 'p2')], products)
    expect(r).toEqual([{ category: 'building', value: 30 }, { category: 'food', value: 10 }])
  })
})

describe('cashBalance / trend', () => {
  it('sums income minus expense', () => {
    expect(cashBalance([{ direction: 'income', amount: 100 }, { direction: 'expense', amount: 30 }] as Payment[])).toBe(70)
  })
  it('computes percent change', () => {
    expect(trend([100, 150])).toBe(50)
    expect(trend([0, 10])).toBeUndefined()
    expect(trend([5])).toBeUndefined()
  })
})
