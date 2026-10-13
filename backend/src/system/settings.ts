import { z } from 'zod'
import type { Tx } from '../common/prisma.service.js'
import type { PrismaService } from '../common/prisma.service.js'
import type { Prisma } from '../generated/prisma/client.js'

export const SettingsSchema = z.object({
  company: z.object({
    name: z.string().default('Atoyo'),
    inn: z.string().default(''),
    address: z.string().default(''),
    phone: z.string().default(''),
    bank: z.string().default(''),
    director: z.string().default(''),
  }).default({ name: 'Atoyo', inn: '', address: '', phone: '', bank: '', director: '' }),
  advancePct: z.coerce.number().min(0).max(100).default(30),
  defaultMarkupPct: z.coerce.number().min(0).max(1000).default(20),
  deadlineDays: z.coerce.number().int().min(1).max(3650).default(90),
  defaultVatPct: z.coerce.number().min(0).max(100).default(12),
})
export type Settings = z.infer<typeof SettingsSchema>

export async function getSettings(db: Tx | PrismaService): Promise<Settings> {
  const row = await db.setting.findUnique({ where: { key: 'app' } })
  return SettingsSchema.parse(row?.value ?? {})
}

export async function saveSettings(db: Tx | PrismaService, s: Settings) {
  const value = s as unknown as Prisma.InputJsonValue
  await db.setting.upsert({ where: { key: 'app' }, create: { key: 'app', value }, update: { value } })
}
