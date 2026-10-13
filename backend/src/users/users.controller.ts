import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { PrismaService } from '../common/prisma.service.js'
import { AuditService } from '../common/audit.service.js'
import { BusinessError } from '../common/errors.js'
import { ZodPipe, optStr, str } from '../common/zod.js'
import { CurrentUser, Perm } from '../auth/decorators.js'
import { OWNER_ROLE } from '../auth/permissions.js'
import type { AuthUser } from '../auth/auth.types.js'

const CreateDto = z.object({
  username: z.string().trim().min(3).regex(/^[a-zA-Z0-9_.-]+$/, 'Faqat lotin harflari, raqam, _ . -'),
  password: z.string().min(8, 'Parol kamida 8 ta belgi'),
  fullName: str, phone: optStr, roleId: str, isActive: z.boolean().default(true),
})
const UpdateDto = z.object({
  fullName: str.optional(), phone: optStr, roleId: str.optional(), isActive: z.boolean().optional(),
  password: z.string().min(8, 'Parol kamida 8 ta belgi').optional(),
})

const select = {
  id: true, username: true, fullName: true, phone: true, isActive: true, roleId: true, createdAt: true,
  role: { select: { id: true, key: true, name: true } },
} as const

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  @Get() @Perm('users.view', 'users.manage')
  list() {
    return this.prisma.user.findMany({ select, orderBy: { createdAt: 'asc' } })
  }

  @Post() @Perm('users.manage')
  async create(@CurrentUser() me: AuthUser, @Body(new ZodPipe(CreateDto)) b: z.infer<typeof CreateDto>) {
    await this.assertRoleAssignable(me, b.roleId)
    const { password, ...data } = b
    const user = await this.prisma.user.create({ data: { ...data, passwordHash: await bcrypt.hash(password, 10) }, select })
    await this.audit.log(me, 'create', 'user', user.id, { username: user.username, role: user.role.key })
    return user
  }

  @Patch(':id') @Perm('users.manage')
  async update(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body(new ZodPipe(UpdateDto)) b: z.infer<typeof UpdateDto>) {
    const target = await this.prisma.user.findUniqueOrThrow({ where: { id }, include: { role: true } })
    if (target.role.key === OWNER_ROLE && me.roleKey !== OWNER_ROLE) throw new BusinessError("Owner foydalanuvchini faqat owner o'zgartira oladi", 403)
    if (b.roleId) await this.assertRoleAssignable(me, b.roleId)
    if (target.role.key === OWNER_ROLE && (b.isActive === false || (b.roleId && b.roleId !== target.roleId))) await this.assertAnotherOwner(id)
    if (id === me.id && b.isActive === false) throw new BusinessError("O'zingizni bloklay olmaysiz")
    const { password, ...data } = b
    const user = await this.prisma.user.update({
      where: { id },
      data: { ...data, ...(password ? { passwordHash: await bcrypt.hash(password, 10), refreshTokenHash: null } : {}) },
      select,
    })
    await this.audit.log(me, 'update', 'user', id, { ...data, password: password ? '***' : undefined })
    return user
  }

  @Delete(':id') @Perm('users.manage') @HttpCode(204)
  async remove(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    if (id === me.id) throw new BusinessError("O'zingizni o'chira olmaysiz")
    const target = await this.prisma.user.findUniqueOrThrow({ where: { id }, include: { role: true } })
    if (target.role.key === OWNER_ROLE) {
      if (me.roleKey !== OWNER_ROLE) throw new BusinessError("Owner foydalanuvchini faqat owner o'chira oladi", 403)
      await this.assertAnotherOwner(id)
    }
    await this.prisma.user.delete({ where: { id } })
    await this.audit.log(me, 'delete', 'user', id, { username: target.username })
  }

  private async assertRoleAssignable(me: AuthUser, roleId: string) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } })
    if (!role) throw new BusinessError('Rol topilmadi')
    if (role.key === OWNER_ROLE && me.roleKey !== OWNER_ROLE) throw new BusinessError('Owner rolini faqat owner bera oladi', 403)
  }

  private async assertAnotherOwner(exceptId: string) {
    const n = await this.prisma.user.count({ where: { id: { not: exceptId }, isActive: true, role: { key: OWNER_ROLE } } })
    if (n === 0) throw new BusinessError("Kamida bitta faol owner qolishi kerak")
  }
}
