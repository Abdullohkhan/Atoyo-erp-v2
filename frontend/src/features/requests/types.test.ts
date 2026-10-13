import { describe, it, expect } from 'vitest'
import { unitCost } from './types'

describe('unitCost (mirrors backend pricing)', () => {
  it('adds duty, excise, VAT and fixed costs per unit', () => {
    expect(unitCost({ qty: 2, purchasePrice: 1000, customsDutyPct: 10, excisePct: 0, vatPct: 12, customsFee: 200, logisticsCost: 200 })).toBe(1432)
  })
  it('returns null without a purchase price', () => {
    expect(unitCost({ qty: 1, purchasePrice: null })).toBeNull()
  })
})
