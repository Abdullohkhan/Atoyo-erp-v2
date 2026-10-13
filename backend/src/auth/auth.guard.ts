import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../common/prisma.service.js'
import { IS_PUBLIC, PERMS } from './decorators.js'
import { ALL_PERMISSIONS, OWNER_ROLE, type Permission } from './permissions.js'
import type { AuthUser } from './auth.types.js'

/** Global guard: verifies the access token, loads the user with role permissions, checks @Perm(). */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private reflector: Reflector, private jwt: JwtService, private prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const targets = [ctx.getHandler(), ctx.getClass()]
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, targets)) return true

    const req = ctx.switchToHttp().getRequest<{ headers: Record<string, string | undefined>; user?: AuthUser }>()
    const header = req.headers.authorization ?? ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : ''
    if (!token) throw new UnauthorizedException('Avtorizatsiya talab qilinadi')

    let sub: string
    try {
      sub = (await this.jwt.verifyAsync<{ sub: string; typ: string }>(token, { secret: process.env.JWT_SECRET })).sub
    } catch {
      throw new UnauthorizedException('Token yaroqsiz yoki muddati tugagan')
    }
    req.user = await loadAuthUser(this.prisma, sub)

    const required = this.reflector.getAllAndOverride<Permission[] | undefined>(PERMS, targets)
    if (required?.length && !required.some((p) => req.user!.permissions.includes(p))) {
      throw new ForbiddenException("Bu amal uchun ruxsat yo'q")
    }
    return true
  }
}

export async function loadAuthUser(prisma: PrismaService, id: string): Promise<AuthUser> {
  const user = await prisma.user.findUnique({ where: { id }, include: { role: true } })
  if (!user || !user.isActive) throw new UnauthorizedException('Foydalanuvchi topilmadi yoki bloklangan')
  const permissions = user.role.key === OWNER_ROLE
    ? [...ALL_PERMISSIONS]
    : (user.role.permissions.filter((p) => (ALL_PERMISSIONS as string[]).includes(p)) as Permission[])
  return { id: user.id, username: user.username, fullName: user.fullName, roleKey: user.role.key, roleName: user.role.name, permissions }
}
