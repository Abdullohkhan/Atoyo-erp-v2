import dayjs from 'dayjs'
import type { SaleOrder, PurchaseOrder, Payment } from '@/shared/types/document.types'
import type { Product } from '@/shared/types/catalog.types'

/** Documents that count as real turnover (drafts and cancelled ones are ignored). */
export const isBooked = (status: string) => status === 'confirmed' || status === 'completed'

export interface MonthPoint { key: string; month: number; savdo: number; xarid: number }

/** Sales / purchases per month for the last `months` months that have data (ending at the latest booked document). */
export function monthlySeries(sales: SaleOrder[], purchases: PurchaseOrder[], months = 7): MonthPoint[] {
  const sums = new Map<string, { savdo: number; xarid: number }>()
  const add = (date: string, field: 'savdo' | 'xarid', amount: number) => {
    const key = dayjs(date).format('YYYY-MM')
    const cur = sums.get(key) ?? { savdo: 0, xarid: 0 }
    cur[field] += amount
    sums.set(key, cur)
  }
  sales.filter((o) => isBooked(o.status)).forEach((o) => add(o.date, 'savdo', o.total))
  purchases.filter((o) => isBooked(o.status)).forEach((o) => add(o.date, 'xarid', o.total))
  if (sums.size === 0) return []
  const last = [...sums.keys()].sort().at(-1)!
  return Array.from({ length: months }, (_, i) => dayjs(`${last}-01`).subtract(months - 1 - i, 'month')).map((d) => {
    const key = d.format('YYYY-MM')
    return { key, month: d.month(), savdo: sums.get(key)?.savdo ?? 0, xarid: sums.get(key)?.xarid ?? 0 }
  })
}

/** Share of sales revenue per product category. */
export function salesByCategory(sales: SaleOrder[], products: Product[]): { category: string; value: number }[] {
  const cat = new Map(products.map((p) => [p.id, p.category]))
  const sums = new Map<string, number>()
  sales.filter((o) => isBooked(o.status)).forEach((o) =>
    o.items.forEach((i) => {
      const c = cat.get(i.productId) ?? 'other'
      sums.set(c, (sums.get(c) ?? 0) + i.sum)
    }),
  )
  return [...sums.entries()].map(([category, value]) => ({ category, value })).sort((a, b) => b.value - a.value)
}

export const cashBalance = (payments: Payment[]) =>
  payments.reduce((s, p) => s + (p.direction === 'income' ? p.amount : -p.amount), 0)

/** Change in percent between the last two points of a series, or undefined if not computable. */
export function trend(values: number[]): number | undefined {
  if (values.length < 2) return undefined
  const [prev, cur] = values.slice(-2)
  if (!prev) return undefined
  return Math.round(((cur - prev) / prev) * 100)
}
