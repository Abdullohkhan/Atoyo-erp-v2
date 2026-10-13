import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { z } from 'zod'
import { PrismaService } from '../common/prisma.service.js'
import { AuditService } from '../common/audit.service.js'
import { BusinessError } from '../common/errors.js'
import { ZodPipe, optStr, str } from '../common/zod.js'
import { CurrentUser, Perm } from '../auth/decorators.js'
import { ALL_PERMISSIONS, OWNER_ROLE, PERMISSIONS } from '../auth/permissions.js'
import type { AuthUser } from '../auth/auth.types.js'

const permList = z.array(z.enum(ALL_PERMISSIONS as [string, ...string[]]))
const CreateDto = z.object({
  key: z.string().trim().min(2).regex(/^[a-z][a-z0-9_]*$/, 'Kalit: kichik lotin harflari, raqam va _'),
  name: str, description: optStr, permissions: permList.default([]),
})
const UpdateDto = z.object({ name: str.optional(), description: optStr, permissions: permList.optional() })

@ApiTags('roles')
@Controller()
export class RolesController {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  /** Permission catalog for the role editor. */
  @Get('permissions') @Perm('roles.view', 'roles.manage', 'users.manage')
  permissions() {
    return Object.entries(PERMISSIONS).map(([key, v]) => ({ key, ...v }))
  }

  @Get('roles') @Perm('roles.view', 'roles.manage', 'users.view', 'users.manage')
  async list() {
    const roles = await this.prisma.role.findMany({ orderBy: { createdAt: 'asc' }, include: { _count: { select: { users: true } } } })
    return roles.map(({ _count, ...r }) => ({ ...r, permissions: r.key === OWNER_ROLE ? ALL_PERMISSIONS : r.permissions, userCount: _count.users }))
  }

  @Post('roles') @Perm('roles.manage')
  async create(@CurrentUser() me: AuthUser, @Body(new ZodPipe(CreateDto)) b: z.infer<typeof CreateDto>) {
    const role = await this.prisma.role.create({ data: { ...b, isSystem: false } })
    await this.audit.log(me, 'create', 'role', role.id, b)
    return role
  }

  @Patch('roles/:id') @Perm('roles.manage')
  async update(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body(new ZodPipe(UpdateDto)) b: z.infer<typeof UpdateDto>) {
    const role = await this.prisma.role.findUniqueOrThrow({ where: { id } })
    if (role.key === OWNER_ROLE) throw new BusinessError("Owner rolini o'zgartirib bo'lmaydi")
    const updated = await this.prisma.role.update({ where: { id }, data: b })
    await this.audit.log(me, 'update', 'role', id, b)
    return updated
  }

  @Delete('roles/:id') @Perm('roles.manage') @HttpCode(204)
  async remove(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    const role = await this.prisma.role.findUniqueOrThrow({ where: { id }, include: { _count: { select: { users: true } } } })
    if (role.isSystem) throw new BusinessError("Tizim rolini o'chirib bo'lmaydi")
    if (role._count.users > 0) throw new BusinessError("Bu rolda foydalanuvchilar bor, avval ularni boshqa rolga o'tkazing")
    await this.prisma.role.delete({ where: { id } })
    await this.audit.log(me, 'delete', 'role', id, { key: role.key })
  }
}
