import { Body, Controller, Get, HttpCode, Param, Post, Put, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { PrismaService } from '../common/prisma.service.js'
import { AuditService } from '../common/audit.service.js'
import { ZodPipe } from '../common/zod.js'
import { CurrentUser, Perm, Public } from '../auth/decorators.js'
import type { AuthUser } from '../auth/auth.types.js'
import { SettingsSchema, getSettings, saveSettings, type Settings } from './settings.js'

@ApiTags('system')
@Controller()
export class SystemController {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  @Public() @Get('health')
  async health() {
    await this.prisma.$queryRaw`SELECT 1`
    return { status: 'ok' }
  }

  @Get('settings')
  settings() {
    return getSettings(this.prisma)
  }

  @Put('settings') @Perm('settings.manage')
  async saveSettings(@CurrentUser() u: AuthUser, @Body(new ZodPipe(SettingsSchema)) b: Settings) {
    await saveSettings(this.prisma, b)
    await this.audit.log(u, 'update', 'settings', 'app', b)
    return b
  }

  @Get('notifications')
  async notifications(@CurrentUser() u: AuthUser) {
    const [items, unread] = await Promise.all([
      this.prisma.notification.findMany({ where: { userId: u.id }, orderBy: { createdAt: 'desc' }, take: 100 }),
      this.prisma.notification.count({ where: { userId: u.id, read: false } }),
    ])
    return { items, unread }
  }

  @Post('notifications/:id/read') @HttpCode(204)
  async read(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    await this.prisma.notification.updateMany({ where: { id, userId: u.id }, data: { read: true } })
  }

  @Post('notifications/read-all') @HttpCode(204)
  async readAll(@CurrentUser() u: AuthUser) {
    await this.prisma.notification.updateMany({ where: { userId: u.id, read: false }, data: { read: true } })
  }

  @Get('audit') @Perm('audit.view')
  audit_(@Query('entity') entity?: string, @Query('entityId') entityId?: string) {
    return this.prisma.auditLog.findMany({
      where: { ...(entity ? { entity } : {}), ...(entityId ? { entityId } : {}) },
      orderBy: { createdAt: 'desc' }, take: 500,
    })
  }
}
