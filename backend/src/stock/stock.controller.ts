import { Body, Controller, Get, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { z } from 'zod'
import { PrismaService } from '../common/prisma.service.js'
import { BusinessError } from '../common/errors.js'
import { ZodPipe, optStr, qty, str } from '../common/zod.js'
import { num } from '../common/serialize.js'
import { CurrentUser, Perm, has } from '../auth/decorators.js'
import type { AuthUser } from '../auth/auth.types.js'
import { StockService } from './stock.service.js'

const MoveDto = z.object({
  type: z.enum(['transfer', 'writeoff']),
  fromWarehouseId: str, toWarehouseId: optStr, productId: str, qty, notes: optStr,
})

@ApiTags('stock')
@Controller()
export class StockController {
  constructor(private prisma: PrismaService, private stock: StockService) {}

  @Get('stock-balance') @Perm('stock.view')
  async balance(@CurrentUser() user: AuthUser) {
    const rows = await this.prisma.stockBalance.findMany({ include: { product: true, warehouse: true }, orderBy: { product: { code: 'asc' } } })
    const showCost = has(user, 'costs.view')
    return rows.map((r) => ({
      id: r.id, warehouseId: r.warehouseId, warehouseName: r.warehouse.name, productId: r.productId,
      productName: r.product.name, productCode: r.product.code, unit: r.product.unit,
      qty: num(r.qty), reservedQty: num(r.reservedQty), availableQty: num(r.qty) - num(r.reservedQty),
      ...(showCost ? { costPrice: num(r.costPrice), totalValue: num(r.qty) * num(r.costPrice) } : {}),
    }))
  }

  @Get('movements') @Perm('stock.view')
  async movements(@CurrentUser() user: AuthUser) {
    const rows = await this.prisma.stockMovement.findMany({ orderBy: { createdAt: 'desc' } })
    if (has(user, 'costs.view')) return rows
    return rows.map((m) => ({ ...m, items: (m.items as { price?: number; sum?: number }[]).map(({ price: _p, sum: _s, ...i }) => i) }))
  }

  @Post('movements') @Perm('stock.move')
  async move(@CurrentUser() user: AuthUser, @Body(new ZodPipe(MoveDto)) b: z.infer<typeof MoveDto>) {
    if (b.type === 'transfer' && (!b.toWarehouseId || b.toWarehouseId === b.fromWarehouseId)) {
      throw new BusinessError("Qabul qiluvchi ombor noto'g'ri")
    }
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUniqueOrThrow({ where: { id: b.productId } })
      const cost = await this.stock.costOf(tx, b.fromWarehouseId, b.productId)
      await this.stock.apply(tx, b.fromWarehouseId, [{ productId: b.productId, productName: product.name, qty: b.qty }], -1)
      if (b.type === 'transfer') await this.stock.apply(tx, b.toWarehouseId!, [{ productId: b.productId, qty: b.qty, unitCost: cost }], 1)
      return this.stock.movement(tx, {
        type: b.type, fromWarehouseId: b.fromWarehouseId, toWarehouseId: b.type === 'transfer' ? b.toWarehouseId! : undefined,
        items: [{ productId: product.id, productName: product.name, unit: product.unit, qty: b.qty, price: cost, sum: cost * b.qty }],
        notes: b.notes, createdById: user.id,
      })
    })
  }
}
