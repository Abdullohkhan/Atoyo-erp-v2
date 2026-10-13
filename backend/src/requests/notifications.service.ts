import { Injectable } from '@nestjs/common'
import type { Tx } from '../common/prisma.service.js'
import { OWNER_ROLE, type Permission } from '../auth/permissions.js'

@Injectable()
export class NotificationsService {
  /** Notifies every active user whose role explicitly has the permission (owners see everything anyway). */
  async toPermission(tx: Tx, perm: Permission, title: string, body: string | null, link: string, exceptUserId?: string) {
    const users = await tx.user.findMany({
      where: { isActive: true, role: { permissions: { has: perm }, key: { not: OWNER_ROLE } }, ...(exceptUserId ? { id: { not: exceptUserId } } : {}) },
      select: { id: true },
    })
    if (users.length) await tx.notification.createMany({ data: users.map((u) => ({ userId: u.id, title, body, link })) })
  }

  async toUser(tx: Tx, userId: string, title: string, body: string | null, link: string) {
    await tx.notification.create({ data: { userId, title, body, link } })
  }
}
