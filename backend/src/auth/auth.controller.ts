import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from './jwt-auth.guard'
import { LoginDto } from './dto/login.dto'

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.username, dto.password)
  }

  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('2fa/verify')
  verify2fa(@Body() body: { preAuthToken: string; code: string }) {
    return this.authService.verify2FA(body.preAuthToken, body.code)
  }

  @UseGuards(JwtAuthGuard)
  @Get('2fa/status')
  get2faStatus() {
    return this.authService.get2FAStatus()
  }

  @UseGuards(JwtAuthGuard)
  @Get('2fa/setup')
  generateSetup() {
    return this.authService.generateSetupSecret()
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/setup/confirm')
  confirmSetup(@Body() body: { secret: string; code: string }) {
    return this.authService.confirmSetup(body.secret, body.code)
  }

  @UseGuards(JwtAuthGuard)
  @Delete('2fa/setup')
  remove2fa() {
    return this.authService.remove2FA()
  }
}
