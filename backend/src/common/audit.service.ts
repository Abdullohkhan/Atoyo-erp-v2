import { Injectable } from '@nestjs/common'
import { PrismaService, type Tx } from './prisma.service.js'
import type { AuthUser } from '../auth/auth.types.js'
import type { Prisma } from '../generated/prisma/client.js'

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  log(user: AuthUser | null, action: string, entity: string, entityId?: string, data?: unknown, tx?: Tx) {
    return (tx ?? this.prisma).auditLog.create({
      data: {
        userId: user?.id, userName: user?.fullName, action, entity, entityId,
        data: data === undefined ? undefined : (JSON.parse(JSON.stringify(data)) as Prisma.InputJsonValue),
      },
    })
  }
}
