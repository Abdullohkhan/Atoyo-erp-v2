import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { z } from 'zod'
import { AuthService } from './auth.service.js'
import { CurrentUser, Public } from './decorators.js'
import { ZodPipe, str } from '../common/zod.js'
import type { AuthUser } from './auth.types.js'

const LoginDto = z.object({ username: str, password: str })
const RefreshDto = z.object({ refreshToken: str })
const ChangePasswordDto = z.object({ oldPassword: str, newPassword: z.string().min(8, 'Parol kamida 8 ta belgi') })

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Public() @Post('login') @HttpCode(200)
  login(@Body(new ZodPipe(LoginDto)) b: z.infer<typeof LoginDto>) {
    return this.auth.login(b.username, b.password)
  }

  @Public() @Post('refresh') @HttpCode(200)
  refresh(@Body(new ZodPipe(RefreshDto)) b: z.infer<typeof RefreshDto>) {
    return this.auth.refresh(b.refreshToken)
  }

  @Post('logout') @HttpCode(204)
  logout(@CurrentUser() user: AuthUser) {
    return this.auth.logout(user.id)
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return user
  }

  @Post('change-password') @HttpCode(204)
  changePassword(@CurrentUser() user: AuthUser, @Body(new ZodPipe(ChangePasswordDto)) b: z.infer<typeof ChangePasswordDto>) {
    return this.auth.changePassword(user, b.oldPassword, b.newPassword)
  }
}
