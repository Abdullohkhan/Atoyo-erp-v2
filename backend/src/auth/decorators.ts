import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common'
import type { Permission } from './permissions.js'
import type { AuthUser } from './auth.types.js'

export const IS_PUBLIC = 'isPublic'
export const PERMS = 'permissions'

/** Endpoint is reachable without a token. */
export const Public = () => SetMetadata(IS_PUBLIC, true)

/** User needs at least ONE of the listed permissions. */
export const Perm = (...perms: Permission[]) => SetMetadata(PERMS, perms)

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthUser =>
  ctx.switchToHttp().getRequest<{ user: AuthUser }>().user)

export const has = (user: AuthUser, perm: Permission) => user.permissions.includes(perm)
