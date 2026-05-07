import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcrypt'
import { authenticator } from 'otplib'
import * as qrcode from 'qrcode'
import { AdminConfigService } from './admin-config.service'

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private cfg: ConfigService,
    private adminConfigService: AdminConfigService,
  ) {}

  private async validateCredentials(username: string, password: string): Promise<void> {
    const adminUsername = this.cfg.get<string>('ADMIN_USERNAME')
    const adminHash = this.cfg.get<string>('ADMIN_PASSWORD_HASH')

    if (!adminUsername || !adminHash) {
      throw new Error('ADMIN_USERNAME ve ADMIN_PASSWORD_HASH env değişkenleri set edilmeli')
    }

    if (username !== adminUsername) {
      throw new UnauthorizedException('Kullanıcı adı veya şifre hatalı')
    }

    const valid = await bcrypt.compare(password, adminHash)
    if (!valid) {
      throw new UnauthorizedException('Kullanıcı adı veya şifre hatalı')
    }
  }

  async login(username: string, password: string) {
    await this.validateCredentials(username, password)

    const config = await this.adminConfigService.getConfig()
    const bypass = this.cfg.get('TOTP_BYPASS') === '1'

    if (config.totpSecret && !bypass) {
      const preAuthToken = this.jwtService.sign(
        { username, sub: 'admin', role: 'pre-auth' },
        { expiresIn: '5m' },
      )
      return { requires2fa: true, preAuthToken }
    }

    return {
      access_token: this.jwtService.sign({ username, sub: 'admin' }),
    }
  }

  async verify2FA(preAuthToken: string, code: string) {
    let payload: any
    try {
      payload = this.jwtService.verify(preAuthToken)
    } catch {
      throw new UnauthorizedException('Oturum süresi doldu, tekrar giriş yapın')
    }

    if (payload.role !== 'pre-auth') {
      throw new UnauthorizedException('Geçersiz token')
    }

    const config = await this.adminConfigService.getConfig()
    if (!config.totpSecret) {
      throw new UnauthorizedException('2FA kurulu değil')
    }

    const valid = authenticator.verify({ token: code, secret: config.totpSecret })
    if (!valid) {
      throw new UnauthorizedException('Geçersiz doğrulama kodu')
    }

    return {
      access_token: this.jwtService.sign({ username: payload.username, sub: 'admin' }),
    }
  }

  async generateSetupSecret(): Promise<{ secret: string; qrCodeUrl: string }> {
    const adminUsername = this.cfg.get<string>('ADMIN_USERNAME') || 'admin'
    const secret = authenticator.generateSecret()
    const otpauth = authenticator.keyuri(adminUsername, 'RenEl Admin', secret)
    const qrCodeUrl = await qrcode.toDataURL(otpauth)
    return { secret, qrCodeUrl }
  }

  async confirmSetup(secret: string, code: string): Promise<{ ok: boolean }> {
    const valid = authenticator.verify({ token: code, secret })
    if (!valid) {
      throw new UnauthorizedException('Geçersiz doğrulama kodu, tekrar deneyin')
    }
    await this.adminConfigService.setTotpSecret(secret)
    return { ok: true }
  }

  async remove2FA(): Promise<{ ok: boolean }> {
    await this.adminConfigService.removeTotpSecret()
    return { ok: true }
  }

  async get2FAStatus(): Promise<{ enabled: boolean }> {
    const config = await this.adminConfigService.getConfig()
    return { enabled: !!config.totpSecret }
  }
}
