import { Body, Controller, ForbiddenException, Get, Param, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { z } from 'zod'
import { Prisma } from '../generated/prisma/client.js'
import { PrismaService } from '../common/prisma.service.js'
import { AuditService } from '../common/audit.service.js'
import { BusinessError } from '../common/errors.js'
import { ZodPipe, date, money, optStr, qty, str } from '../common/zod.js'
import { nextNumber } from '../common/numbering.js'
import { num } from '../common/serialize.js'
import { CurrentUser, Perm, has } from '../auth/decorators.js'
import type { AuthUser } from '../auth/auth.types.js'
import { FinanceService, invoiceStatus } from './finance.service.js'

const Line = z.object({ productId: str, qty, price: z.coerce.number().positive('Narx 0 dan katta'), salePrice: money.optional() })
const SaleDto = z.object({
  date: date.default(() => new Date()), customerId: str, warehouseId: str, items: z.array(Line).min(1, "Kamida bitta mahsulot"),
  notes: optStr, confirm: z.boolean().default(false),
})
const PurchaseDto = SaleDto.omit({ customerId: true }).extend({ supplierId: str })
const InvoiceDto = z.object({ type: z.enum(['sale', 'purchase']), orderId: str, dueDate: date })
const PaymentDto = z.object({
  number: optStr, date: date.default(() => new Date()), type: z.enum(['cash', 'card', 'transfer']),
  direction: z.enum(['income', 'expense']), amount: z.coerce.number().positive("Summa 0 dan katta bo'lishi kerak"),
  category: str, counterpartyId: optStr, description: optStr, requestId: optStr,
})

const withBalance = <T extends { total: Prisma.Decimal; paid: Prisma.Decimal }>(o: T) => ({ ...o, balance: num(o.total) - num(o.paid) })

@ApiTags('sales')
@Controller('sale-orders')
export class SaleOrdersController {
  constructor(private prisma: PrismaService, private fin: FinanceService, private audit: AuditService) {}

  @Get() @Perm('sales.view')
  async list() {
    const rows = await this.prisma.saleOrder.findMany({ include: { customer: { select: { name: true } } }, orderBy: { date: 'desc' } })
    return rows.map(({ customer, ...o }) => ({ ...withBalance(o), customerName: customer.name }))
  }

  @Get(':id') @Perm('sales.view')
  async get(@Param('id') id: string) {
    const { customer, ...o } = await this.prisma.saleOrder.findUniqueOrThrow({ where: { id }, include: { customer: { select: { name: true } } } })
    return { ...withBalance(o), customerName: customer.name }
  }

  @Post() @Perm('sales.create')
  async create(@CurrentUser() user: AuthUser, @Body(new ZodPipe(SaleDto)) b: z.infer<typeof SaleDto>) {
    if (b.confirm && !has(user, 'sales.confirm')) throw new ForbiddenException("Tasdiqlashga ruxsat yo'q")
    const order = await this.prisma.$transaction(async (tx) => {
      const wh = await tx.warehouse.findUniqueOrThrow({ where: { id: b.warehouseId } })
      const { items, total } = await this.fin.buildItems(tx, b.items)
      const o = await tx.saleOrder.create({ data: {
        number: await nextNumber(tx, 'SAV'), date: b.date, customerId: b.customerId, warehouseId: wh.id, warehouseName: wh.name,
        items: items as unknown as Prisma.InputJsonValue, total, notes: b.notes ?? undefined, createdById: user.id,
      } })
      return b.confirm ? this.fin.confirmSale(tx, o.id, user.id) : o
    })
    await this.audit.log(user, 'create', 'saleOrder', order.id, { number: order.number, confirm: b.confirm })
    return withBalance(order)
  }

  @Post(':id/confirm') @Perm('sales.confirm')
  async confirm(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const o = await this.prisma.$transaction((tx) => this.fin.confirmSale(tx, id, user.id))
    await this.audit.log(user, 'confirm', 'saleOrder', id)
    return withBalance(o)
  }

  @Post(':id/cancel') @Perm('sales.cancel', 'sales.confirm')
  async cancel(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const current = await this.prisma.saleOrder.findUniqueOrThrow({ where: { id } })
    if (current.status !== 'draft' && !has(user, 'sales.cancel')) throw new ForbiddenException("Tasdiqlangan hujjatni bekor qilishga ruxsat yo'q")
    const o = await this.prisma.$transaction((tx) => this.fin.cancelSale(tx, id, user.id))
    await this.audit.log(user, 'cancel', 'saleOrder', id)
    return withBalance(o)
  }
}

@ApiTags('purchases')
@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private prisma: PrismaService, private fin: FinanceService, private audit: AuditService) {}

  @Get() @Perm('purchases.view')
  async list(@CurrentUser() user: AuthUser) {
    const rows = await this.prisma.purchaseOrder.findMany({ include: { supplier: { select: { name: true } } }, orderBy: { date: 'desc' } })
    const showCost = has(user, 'costs.view')
    return rows.map(({ supplier, ...o }) => showCost
      ? { ...withBalance(o), supplierName: supplier.name }
      : { ...o, total: undefined, paid: undefined, items: (o.items as { productName: string; qty: number; unit: string }[]).map(({ productName, qty, unit }) => ({ productName, qty, unit })), supplierName: supplier.name })
  }

  @Post() @Perm('purchases.create')
  async create(@CurrentUser() user: AuthUser, @Body(new ZodPipe(PurchaseDto)) b: z.infer<typeof PurchaseDto>) {
    if (b.confirm && !has(user, 'purchases.confirm') && !has(user, 'purchases.create')) throw new ForbiddenException("Ruxsat yo'q")
    const order = await this.prisma.$transaction(async (tx) => {
      const wh = await tx.warehouse.findUniqueOrThrow({ where: { id: b.warehouseId } })
      const { items, total } = await this.fin.buildItems(tx, b.items)
      const o = await tx.purchaseOrder.create({ data: {
        number: await nextNumber(tx, 'XAR'), date: b.date, supplierId: b.supplierId, warehouseId: wh.id, warehouseName: wh.name,
        items: items as unknown as Prisma.InputJsonValue, total, notes: b.notes ?? undefined, createdById: user.id,
      } })
      return b.confirm ? this.fin.confirmPurchase(tx, o.id, user.id) : o
    })
    await this.audit.log(user, 'create', 'purchaseOrder', order.id, { number: order.number, confirm: b.confirm })
    return withBalance(order)
  }

  @Post(':id/confirm') @Perm('purchases.confirm', 'purchases.create')
  async confirm(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const o = await this.prisma.$transaction((tx) => this.fin.confirmPurchase(tx, id, user.id))
    await this.audit.log(user, 'confirm', 'purchaseOrder', id)
    return withBalance(o)
  }

  @Post(':id/cancel') @Perm('purchases.cancel', 'purchases.create')
  async cancel(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const current = await this.prisma.purchaseOrder.findUniqueOrThrow({ where: { id } })
    if (current.status !== 'draft' && !has(user, 'purchases.cancel')) throw new ForbiddenException("Tasdiqlangan hujjatni bekor qilishga ruxsat yo'q")
    const o = await this.prisma.$transaction((tx) => this.fin.cancelPurchase(tx, id, user.id))
    await this.audit.log(user, 'cancel', 'purchaseOrder', id)
    return withBalance(o)
  }
}

@ApiTags('finance')
@Controller()
export class MoneyController {
  constructor(private prisma: PrismaService, private fin: FinanceService, private audit: AuditService) {}

  @Get('invoices') @Perm('invoices.view')
  invoices() {
    return this.prisma.invoice.findMany({ orderBy: { date: 'desc' } })
  }

  @Post('invoices') @Perm('invoices.create')
  async createInvoice(@CurrentUser() user: AuthUser, @Body(new ZodPipe(InvoiceDto)) b: z.infer<typeof InvoiceDto>) {
    if (await this.prisma.invoice.findFirst({ where: { orderId: b.orderId } })) throw new BusinessError('Bu hujjatga faktura allaqachon yaratilgan')
    const inv = await this.prisma.$transaction(async (tx) => {
      const o = b.type === 'sale'
        ? await tx.saleOrder.findUniqueOrThrow({ where: { id: b.orderId }, include: { customer: true } }).then((x) => ({ ...x, cp: x.customer }))
        : await tx.purchaseOrder.findUniqueOrThrow({ where: { id: b.orderId }, include: { supplier: true } }).then((x) => ({ ...x, cp: x.supplier }))
      if (!['confirmed', 'completed'].includes(o.status)) throw new BusinessError('Faqat tasdiqlangan hujjatga faktura yaratiladi')
      const total = num(o.total)
      return tx.invoice.create({ data: {
        number: await nextNumber(tx, 'FAK'), date: o.date, type: b.type, orderId: o.id, counterpartyId: o.cp.id,
        counterpartyName: o.cp.name, amount: total, status: invoiceStatus(total, total - num(o.paid)), dueDate: b.dueDate,
      } })
    })
    await this.audit.log(user, 'create', 'invoice', inv.id)
    return inv
  }

  @Get('payments') @Perm('payments.view')
  payments() {
    return this.prisma.payment.findMany({ orderBy: [{ date: 'desc' }, { createdAt: 'desc' }] })
  }

  @Post('payments') @Perm('payments.create')
  async createPayment(@CurrentUser() user: AuthUser, @Body(new ZodPipe(PaymentDto)) b: z.infer<typeof PaymentDto>) {
    const p = await this.prisma.$transaction((tx) => this.fin.recordPayment(tx, { ...b, createdById: user.id }))
    await this.audit.log(user, 'create', 'payment', p.id, { amount: b.amount, direction: b.direction, requestId: b.requestId })
    return p
  }
}
