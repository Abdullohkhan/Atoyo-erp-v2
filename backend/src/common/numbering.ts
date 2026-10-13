import type { Tx } from './prisma.service.js'

/** Next document number, e.g. ZAY-000001. Uses a row lock-free atomic upsert. */
export async function nextNumber(tx: Tx, prefix: string): Promise<string> {
  const row = await tx.counter.upsert({
    where: { key: prefix },
    create: { key: prefix, value: 1 },
    update: { value: { increment: 1 } },
  })
  return `${prefix}-${String(row.value).padStart(6, '0')}`
}
