import { Body, Controller, Delete, Get, Patch, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common'
import { Response } from 'express'
import { Throttle } from '@nestjs/throttler'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from './jwt-auth.guard'
import { LoginDto } from './dto/login.dto'
import { ChangeCredentialsDto } from './dto/change-credentials.dto'

const COOKIE_MAX_AGE = {
  short: 8 * 60 * 60 * 1000,        // 8 saat
  long: 30 * 24 * 60 * 60 * 1000,   // 30 gün
}

function cookieOptions(rememberMe: boolean) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: rememberMe ? COOKIE_MAX_AGE.long : COOKIE_MAX_AGE.short,
  }
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('login')
  async login(@Body() dto: LoginDto, @Res() res: Response) {
    const data = await this.authService.login(dto.username, dto.password, dto.rememberMe)
    if (data.requires2fa) {
      return res.json(data)
    }
    res.cookie('admin_token', data.access_token, cookieOptions(data.rememberMe))
    return res.json({ success: true })
  }

  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('2fa/verify')
  async verify2fa(@Body() body: { preAuthToken: string; code: string }, @Res() res: Response) {
    const data = await this.authService.verify2FA(body.preAuthToken, body.code)
    res.cookie('admin_token', data.access_token, cookieOptions(data.rememberMe))
    return res.json({ success: true })
  }

  // O-03: Logout endpoint — token'ı blacklist'e alır ve cookie'yi temizler
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: any, @Res() res: Response) {
    const { jti, exp } = req.user ?? {}
    if (!jti || !exp) throw new UnauthorizedException('Token kimliği bulunamadı')
    await this.authService.blacklistToken(jti, exp)
    res.clearCookie('admin_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    })
    return res.json({ ok: true })
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: any) {
    return { ok: true, username: req.user?.username }
  }

  // Kimlik bilgisi değiştirme — mevcut şifre + 2FA (aktifse) zorunlu, oturum kapatılır
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @UseGuards(JwtAuthGuard)
  @Patch('credentials')
  async changeCredentials(@Body() dto: ChangeCredentialsDto, @Req() req: any, @Res() res: Response) {
    await this.authService.changeCredentials(
      dto.currentPassword,
      dto.totpCode,
      dto.newUsername,
      dto.newPassword,
    )
    // Kimlik bilgisi değişikliği sonrası mevcut oturumu kapat
    const { jti, exp } = req.user ?? {}
    if (jti && exp) await this.authService.blacklistToken(jti, exp)
    res.clearCookie('admin_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    })
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

  @UseGuards(JwtAuthGuard)
  @Post('2fa/setup/confirm')
  confirmSetup(@Body() body: { secret: string; code: string }) {
    return this.authService.confirmSetup(body.secret, body.code)
  }

  @UseGuards(JwtAuthGuard)
  @Delete('2fa/setup')
  remove2fa(@Body() body: { code: string }) {
    return this.authService.remove2FA(body.code)
  }
}
