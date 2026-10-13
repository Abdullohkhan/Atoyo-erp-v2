import { Injectable } from '@nestjs/common'
import type { Tx } from '../common/prisma.service.js'
import { BusinessError } from '../common/errors.js'
import { nextNumber } from '../common/numbering.js'
import { num } from '../common/serialize.js'
import { StockService, type DocItem } from '../stock/stock.service.js'

const DAY = 86_400_000
export const invoiceStatus = (total: number, balance: number) => (balance <= 0 ? 'paid' : balance < total ? 'partial' : 'unpaid')

/** Spreads an amount over open documents, oldest first. */
export function allocateFifo<T extends { id: string; date: Date; balance: number }>(docs: T[], amount: number) {
  let left = amount
  const out: { doc: T; amount: number }[] = []
  for (const d of [...docs].filter((x) => x.balance > 0).sort((a, b) => a.date.getTime() - b.date.getTime())) {
    if (left <= 0) break
    const part = Math.min(left, d.balance)
    out.push({ doc: d, amount: part })
    left -= part
  }
  return { allocations: out, remainder: left }
}

export interface LineInput { productId: string; qty: number; price: number; salePrice?: number }

@Injectable()
export class FinanceService {
  constructor(private stock: StockService) {}

  async buildItems(tx: Tx, lines: LineInput[]): Promise<{ items: DocItem[]; total: number }> {
    const products = await tx.product.findMany({ where: { id: { in: lines.map((l) => l.productId) } } })
    const items = lines.map((l) => {
      const p = products.find((x) => x.id === l.productId)
      if (!p) throw new BusinessError('Mahsulot topilmadi')
      return { productId: p.id, productName: p.name, unit: p.unit, qty: l.qty, price: l.price, discount: 0, sum: Math.round(l.qty * l.price * 100) / 100, ...(l.salePrice ? { salePrice: l.salePrice } : {}) }
    })
    return { items, total: items.reduce((s, i) => s + i.sum, 0) }
  }

  // ───── Sales ─────

  async confirmSale(tx: Tx, id: string, userId: string) {
    const o = await tx.saleOrder.findUniqueOrThrow({ where: { id } })
    if (o.status !== 'draft') throw new BusinessError('Faqat qoralama hujjatni tasdiqlash mumkin')
    const items = o.items as unknown as DocItem[]
    await this.stock.apply(tx, o.warehouseId, items.map((i) => ({ productId: i.productId, productName: i.productName, qty: i.qty })), -1)
    await this.stock.movement(tx, { type: 'dispatch', date: o.date, fromWarehouseId: o.warehouseId, items, notes: o.number, createdById: userId })
    const total = num(o.total)
    const balance = total - num(o.paid)
    if (!(await tx.invoice.findFirst({ where: { orderId: o.id } }))) {
      const customer = await tx.customer.findUniqueOrThrow({ where: { id: o.customerId } })
      await tx.invoice.create({ data: {
        number: await nextNumber(tx, 'FAK'), date: o.date, type: 'sale', orderId: o.id, counterpartyId: o.customerId,
        counterpartyName: customer.name, amount: total, status: invoiceStatus(total, balance), dueDate: new Date(o.date.getTime() + 14 * DAY),
      } })
    }
    await tx.customer.update({ where: { id: o.customerId }, data: { debt: { increment: balance }, totalPurchases: { increment: total } } })
    return tx.saleOrder.update({ where: { id }, data: { status: 'confirmed' } })
  }

  async cancelSale(tx: Tx, id: string, userId: string) {
    const o = await tx.saleOrder.findUniqueOrThrow({ where: { id } })
    if (o.status === 'cancelled') return o
    if (o.status !== 'draft') {
      if (num(o.paid) > 0) throw new BusinessError("To'lov qilingan hujjatni bekor qilib bo'lmaydi")
      const items = o.items as unknown as DocItem[]
      await this.stock.apply(tx, o.warehouseId, items.map((i) => ({ productId: i.productId, qty: i.qty })), 1)
      await this.stock.movement(tx, { type: 'receipt', toWarehouseId: o.warehouseId, items, notes: `${o.number} (bekor)`, createdById: userId })
      await tx.customer.update({ where: { id: o.customerId }, data: { debt: { decrement: num(o.total) - num(o.paid) }, totalPurchases: { decrement: num(o.total) } } })
      await tx.invoice.deleteMany({ where: { orderId: o.id } })
    }
    return tx.saleOrder.update({ where: { id }, data: { status: 'cancelled' } })
  }

  // ───── Purchases ─────

  async confirmPurchase(tx: Tx, id: string, userId: string) {
    const o = await tx.purchaseOrder.findUniqueOrThrow({ where: { id } })
    if (o.status !== 'draft') throw new BusinessError('Faqat qoralama hujjatni tasdiqlash mumkin')
    const items = o.items as unknown as DocItem[]
    await this.stock.apply(tx, o.warehouseId, items.map((i) => ({ productId: i.productId, qty: i.qty, unitCost: i.price })), 1)
    await this.stock.movement(tx, { type: 'receipt', date: o.date, toWarehouseId: o.warehouseId, items, notes: o.number, requestId: o.requestId ?? undefined, createdById: userId })
    for (const i of items) {
      await tx.product.update({ where: { id: i.productId }, data: { costPrice: i.price, ...(i.salePrice ? { price: i.salePrice } : {}) } })
    }
    const total = num(o.total)
    const balance = total - num(o.paid)
    if (!(await tx.invoice.findFirst({ where: { orderId: o.id } }))) {
      const supplier = await tx.supplier.findUniqueOrThrow({ where: { id: o.supplierId } })
      await tx.invoice.create({ data: {
        number: await nextNumber(tx, 'FAK'), date: o.date, type: 'purchase', orderId: o.id, counterpartyId: o.supplierId,
        counterpartyName: supplier.name, amount: total, status: invoiceStatus(total, balance), dueDate: new Date(o.date.getTime() + 14 * DAY),
      } })
    }
    await tx.supplier.update({ where: { id: o.supplierId }, data: { balance: { increment: balance }, totalSupplied: { increment: total } } })
    return tx.purchaseOrder.update({ where: { id }, data: { status: 'confirmed' } })
  }

  async cancelPurchase(tx: Tx, id: string, userId: string) {
    const o = await tx.purchaseOrder.findUniqueOrThrow({ where: { id } })
    if (o.status === 'cancelled') return o
    if (o.status !== 'draft') {
      if (num(o.paid) > 0) throw new BusinessError("To'lov qilingan hujjatni bekor qilib bo'lmaydi")
      const items = o.items as unknown as DocItem[]
      await this.stock.apply(tx, o.warehouseId, items.map((i) => ({ productId: i.productId, productName: i.productName, qty: i.qty })), -1)
      await this.stock.movement(tx, { type: 'dispatch', fromWarehouseId: o.warehouseId, items, notes: `${o.number} (bekor)`, createdById: userId })
      await tx.supplier.update({ where: { id: o.supplierId }, data: { balance: { decrement: num(o.total) - num(o.paid) }, totalSupplied: { decrement: num(o.total) } } })
      await tx.invoice.deleteMany({ where: { orderId: o.id } })
    }
    return tx.purchaseOrder.update({ where: { id }, data: { status: 'cancelled' } })
  }

  // ───── Payments ─────

  async recordPayment(tx: Tx, p: {
    number?: string | null; date: Date; type: string; direction: 'income' | 'expense'; amount: number; category: string
    counterpartyId?: string | null; description?: string | null; requestId?: string | null; createdById: string
  }) {
    let counterpartyName: string | undefined
    let counterpartyId = p.counterpartyId ?? undefined
    if (p.requestId) {
      if (p.direction !== 'income') throw new BusinessError("Zayavka bo'yicha faqat kirim to'lovi qabul qilinadi")
      const r = await tx.request.findUniqueOrThrow({ where: { id: p.requestId }, include: { customer: true } })
      counterpartyId = r.customerId
      counterpartyName = r.customer.name
      await tx.request.update({ where: { id: r.id }, data: { paid: { increment: p.amount } } })
      await tx.customer.update({ where: { id: r.customerId }, data: { debt: { decrement: p.amount } } })
    } else if (counterpartyId) {
      const isIncome = p.direction === 'income'
      if (isIncome) {
        const c = await tx.customer.findUniqueOrThrow({ where: { id: counterpartyId } })
        counterpartyName = c.name
        const docs = (await tx.saleOrder.findMany({ where: { customerId: c.id, status: { in: ['confirmed', 'completed'] } } }))
          .map((d) => ({ ...d, balance: num(d.total) - num(d.paid) }))
        for (const a of allocateFifo(docs, p.amount).allocations) await this.applyToDoc(tx, 'sale', a.doc.id, num(a.doc.total), num(a.doc.paid) + a.amount)
        await tx.customer.update({ where: { id: c.id }, data: { debt: { decrement: p.amount } } })
      } else {
        const s = await tx.supplier.findUniqueOrThrow({ where: { id: counterpartyId } })
        counterpartyName = s.name
        const docs = (await tx.purchaseOrder.findMany({ where: { supplierId: s.id, status: { in: ['confirmed', 'completed'] } } }))
          .map((d) => ({ ...d, balance: num(d.total) - num(d.paid) }))
        for (const a of allocateFifo(docs, p.amount).allocations) await this.applyToDoc(tx, 'purchase', a.doc.id, num(a.doc.total), num(a.doc.paid) + a.amount)
        await tx.supplier.update({ where: { id: s.id }, data: { balance: { decrement: p.amount } } })
      }
    }
    return tx.payment.create({ data: {
      number: p.number || (await nextNumber(tx, p.direction === 'income' ? 'KIR' : 'CHQ')), date: p.date, type: p.type,
      direction: p.direction, amount: p.amount, category: p.category, description: p.description ?? undefined,
      counterpartyId, counterpartyName, requestId: p.requestId ?? undefined, createdById: p.createdById,
    } })
  }

  private async applyToDoc(tx: Tx, kind: 'sale' | 'purchase', id: string, total: number, paid: number) {
    const data = { paid, status: paid >= total ? 'completed' : 'confirmed' }
    if (kind === 'sale') await tx.saleOrder.update({ where: { id }, data })
    else await tx.purchaseOrder.update({ where: { id }, data })
    await tx.invoice.updateMany({ where: { orderId: id }, data: { status: invoiceStatus(total, total - paid) } })
  }
}

