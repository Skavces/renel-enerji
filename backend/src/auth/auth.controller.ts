import { Body, Controller, Delete, Get, Patch, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common'
import { Response } from 'express'
import { IsString, Length, Matches, MaxLength } from 'class-validator'
import { Throttle } from '@nestjs/throttler'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from './jwt-auth.guard'
import { LoginDto } from './dto/login.dto'
import { ChangeCredentialsDto } from './dto/change-credentials.dto'
import { Verify2faDto } from './dto/verify-2fa.dto'

class ConfirmSetupDto {
  @IsString()
  @MaxLength(64)
  secret: string

  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  code: string
}

class TotpCodeDto {
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  code: string
}

const COOKIE_MAX_AGE = {
  short: 8 * 60 * 60 * 1000,
  long: 30 * 24 * 60 * 60 * 1000,
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
  async verify2fa(@Body() dto: Verify2faDto, @Res() res: Response) {
    const data = await this.authService.verify2FA(dto.preAuthToken, dto.code)
    res.cookie('admin_token', data.access_token, cookieOptions(data.rememberMe))
    return res.json({ success: true })
  }

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
  confirmSetup(@Body() dto: ConfirmSetupDto) {
    return this.authService.confirmSetup(dto.secret, dto.code)
  }

  @UseGuards(JwtAuthGuard)
  @Delete('2fa/setup')
  remove2fa(@Body() dto: TotpCodeDto) {
    return this.authService.remove2FA(dto.code)
  }
}
