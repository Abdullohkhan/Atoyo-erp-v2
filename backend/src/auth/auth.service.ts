import { Injectable, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import bcrypt from 'bcryptjs'
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto'
import { PrismaService } from '../common/prisma.service.js'
import { BusinessError } from '../common/errors.js'
import { loadAuthUser } from './auth.guard.js'
import type { AuthUser } from './auth.types.js'

const MAX_FAILS = 5
const LOCK_MS = 5 * 60 * 1000

// Refresh tokens are long random JWTs: SHA-256 is enough (bcrypt would only compare the first 72 bytes).
const tokenHash = (t: string) => createHash('sha256').update(t).digest('hex')
const sameHash = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b))

@Injectable()
export class AuthService {
  /** Simple in-memory brute-force protection per username. */
  private fails = new Map<string, { count: number; until: number }>()

  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async login(username: string, password: string) {
    const key = username.toLowerCase()
    const f = this.fails.get(key)
    if (f && f.until > Date.now()) {
      throw new HttpException({ statusCode: 429, message: "Juda ko'p urinish. 5 daqiqadan keyin qayta urining" }, HttpStatus.TOO_MANY_REQUESTS)
    }
    const user = await this.prisma.user.findUnique({ where: { username } })
    const ok = !!user && (await bcrypt.compare(password, user.passwordHash))
    if (!ok) {
      const count = (f && f.until <= Date.now() && f.until !== 0 ? 0 : f?.count ?? 0) + 1
      this.fails.set(key, { count, until: count >= MAX_FAILS ? Date.now() + LOCK_MS : 0 })
      throw new UnauthorizedException("Login yoki parol noto'g'ri")
    }
    if (!user.isActive) throw new UnauthorizedException('Foydalanuvchi bloklangan')
    this.fails.delete(key)
    return this.issue(user.id)
  }

  async refresh(refreshToken: string) {
    let sub: string
    try {
      sub = (await this.jwt.verifyAsync<{ sub: string }>(refreshToken, { secret: process.env.JWT_REFRESH_SECRET })).sub
    } catch {
      throw new UnauthorizedException('Sessiya tugagan, qayta kiring')
    }
    const user = await this.prisma.user.findUnique({ where: { id: sub } })
    if (!user?.isActive || !user.refreshTokenHash || !sameHash(user.refreshTokenHash, tokenHash(refreshToken))) {
      throw new UnauthorizedException('Sessiya tugagan, qayta kiring')
    }
    return this.issue(user.id)
  }

  async logout(userId: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { refreshTokenHash: null } })
  }

  async changePassword(user: AuthUser, oldPassword: string, newPassword: string) {
    const u = await this.prisma.user.findUniqueOrThrow({ where: { id: user.id } })
    if (!(await bcrypt.compare(oldPassword, u.passwordHash))) throw new BusinessError("Eski parol noto'g'ri")
    await this.prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(newPassword, 10), refreshTokenHash: null } })
  }

  private async issue(userId: string) {
    const accessToken = await this.jwt.signAsync({ sub: userId, typ: 'access' }, {
      secret: process.env.JWT_SECRET, expiresIn: (process.env.JWT_ACCESS_TTL ?? '15m') as '15m',
    })
    const refreshToken = await this.jwt.signAsync({ sub: userId, typ: 'refresh', jti: randomUUID() }, {
      secret: process.env.JWT_REFRESH_SECRET, expiresIn: (process.env.JWT_REFRESH_TTL ?? '7d') as '7d',
    })
    await this.prisma.user.update({ where: { id: userId }, data: { refreshTokenHash: tokenHash(refreshToken) } })
    return { accessToken, refreshToken, user: await loadAuthUser(this.prisma, userId) }
  }
}
