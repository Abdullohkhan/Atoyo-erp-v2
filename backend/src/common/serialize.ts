import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { map } from 'rxjs'
import { Prisma } from '../generated/prisma/client.js'

/** Converts Prisma Decimals to plain numbers so the frontend receives JSON numbers. */
export function toPlain(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (Prisma.Decimal.isDecimal(value)) return Number(value)
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value.map(toPlain)
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) out[k] = toPlain(v)
    return out
  }
  return value
}

@Injectable()
export class SerializeInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(map(toPlain))
  }
}

export const num = (v: Prisma.Decimal | number | null | undefined): number => (v === null || v === undefined ? 0 : Number(v))
