import { Body, Controller, Delete, Get, Patch, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common'
import type { Response } from 'express'
import type { AuthenticatedRequest } from './jwt-payload'
import { Throttle } from '@nestjs/throttler'
import { ConfigService } from '@nestjs/config'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from './jwt-auth.guard'
import { LoginDto } from './dto/login.dto'
import { ChangeCredentialsDto } from './dto/change-credentials.dto'
import { Verify2faDto } from './dto/verify-2fa.dto'
import { ConfirmSetupDto } from './dto/confirm-setup.dto'
import { Remove2faDto } from './dto/remove-2fa.dto'

const COOKIE_MAX_AGE = {
  short: 8 * 60 * 60 * 1000,
  long: 30 * 24 * 60 * 60 * 1000,
}

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private cfg: ConfigService,
  ) {}

  private cookieOptions(rememberMe: boolean) {
    return {
      httpOnly: true,
      secure: this.cfg.get('NODE_ENV') === 'production',
      sameSite: 'strict' as const,
      maxAge: rememberMe ? COOKIE_MAX_AGE.long : COOKIE_MAX_AGE.short,
    }
  }

  private clearCookieOptions() {
    return {
      httpOnly: true,
      secure: this.cfg.get('NODE_ENV') === 'production',
      sameSite: 'strict' as const,
    }
  }

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('login')
  async login(@Body() dto: LoginDto, @Res() res: Response) {
    const data = await this.authService.login(dto.username, dto.password, dto.rememberMe)
    if (data.requires2fa) {
      return res.json(data)
    }
    res.cookie('admin_token', data.access_token, this.cookieOptions(data.rememberMe ?? false))
    return res.json({ success: true })
  }

  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('2fa/verify')
  async verify2fa(@Body() dto: Verify2faDto, @Res() res: Response) {
    const data = await this.authService.verify2FA(dto.preAuthToken, dto.code)
    res.cookie('admin_token', data.access_token, this.cookieOptions(data.rememberMe))
    return res.json({ success: true })
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    const { jti, exp } = req.user
    if (!jti || !exp) throw new UnauthorizedException('Token kimliği bulunamadı')
    await this.authService.blacklistToken(jti, exp)
    res.clearCookie('admin_token', this.clearCookieOptions())
    return res.json({ ok: true })
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: AuthenticatedRequest) {
    return { ok: true, username: req.user.username }
  }

  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @UseGuards(JwtAuthGuard)
  @Patch('credentials')
  async changeCredentials(@Body() dto: ChangeCredentialsDto, @Req() req: AuthenticatedRequest, @Res() res: Response) {
    await this.authService.changeCredentials(
      dto.currentPassword,
      dto.totpCode,
      req.user.username,
      dto.newUsername,
      dto.newPassword,
    )
    const { jti, exp } = req.user
    if (jti && exp) await this.authService.blacklistToken(jti, exp)
    res.clearCookie('admin_token', this.clearCookieOptions())
    return res.json({ ok: true })
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

  // TOTP kodu brute-force edilebilir; verify2fa ile aynı sıkılıkta sınırla
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @UseGuards(JwtAuthGuard)
  @Post('2fa/setup/confirm')
  confirmSetup(@Body() dto: ConfirmSetupDto) {
    return this.authService.confirmSetup(dto.secret, dto.code, dto.currentCode)
  }

  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @UseGuards(JwtAuthGuard)
  @Delete('2fa/setup')
  remove2fa(@Body() dto: Remove2faDto) {
    return this.authService.remove2FA(dto.code, dto.currentPassword)
  }
}
