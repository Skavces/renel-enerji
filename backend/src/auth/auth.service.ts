import { Injectable, UnauthorizedException, OnModuleInit } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcrypt'
import { authenticator } from 'otplib'
import * as qrcode from 'qrcode'
import { AdminConfigService } from './admin-config.service'
import Redis from 'ioredis'

@Injectable()
export class AuthService implements OnModuleInit {
  private redis: Redis

  constructor(
    private jwtService: JwtService,
    private cfg: ConfigService,
    private adminConfigService: AdminConfigService,
  ) {}

  onModuleInit() {
    this.redis = new Redis(this.cfg.get<string>('REDIS_URL') ?? 'redis://localhost:6379')
  }

  // O-03: Blacklist kontrolü (JwtStrategy'den çağrılır)
  async isTokenBlacklisted(jti: string): Promise<boolean> {
    const val = await this.redis.get(`blacklist:${jti}`)
    return val !== null
  }

  // O-03: Token'ı blacklist'e ekle (8 saat TTL)
  async blacklistToken(jti: string): Promise<void> {
    await this.redis.set(`blacklist:${jti}`, '1', 'EX', 8 * 60 * 60)
  }

  private async getEffectiveUsername(): Promise<string> {
    const config = await this.adminConfigService.getConfig()
    return config.username ?? this.cfg.get<string>('ADMIN_USERNAME') ?? ''
  }

  private async getEffectivePasswordHash(): Promise<string> {
    const config = await this.adminConfigService.getConfig()
    return config.passwordHash ?? this.cfg.get<string>('ADMIN_PASSWORD_HASH') ?? ''
  }

  private async validateCredentials(username: string, password: string): Promise<void> {
    const effectiveUsername = await this.getEffectiveUsername()
    const effectiveHash = await this.getEffectivePasswordHash()

    if (!effectiveUsername || !effectiveHash) {
      throw new Error('Admin kimlik bilgileri yapılandırılmamış')
    }

    if (username !== effectiveUsername) {
      throw new UnauthorizedException('Kullanıcı adı veya şifre hatalı')
    }

    const valid = await bcrypt.compare(password, effectiveHash)
    if (!valid) {
      throw new UnauthorizedException('Kullanıcı adı veya şifre hatalı')
    }
  }

  async changeCredentials(
    currentPassword: string,
    totpCode: string | undefined,
    newUsername?: string,
    newPassword?: string,
  ): Promise<void> {
    if (!newUsername && !newPassword) {
      throw new UnauthorizedException('En az bir alan değiştirilmeli')
    }

    // Mevcut şifre doğrulama
    const effectiveUsername = await this.getEffectiveUsername()
    const effectiveHash = await this.getEffectivePasswordHash()
    const passwordValid = await bcrypt.compare(currentPassword, effectiveHash)
    if (!passwordValid) {
      throw new UnauthorizedException('Mevcut şifre hatalı')
    }

    // 2FA aktifse kod zorunlu
    const config = await this.adminConfigService.getConfig()
    if (config.totpSecret) {
      if (!totpCode) {
        throw new UnauthorizedException('2FA kodu gerekli')
      }
      const otpKey = `otp:${totpCode}-${Math.floor(Date.now() / 30000)}`
      const alreadyUsed = await this.redis.get(otpKey)
      if (alreadyUsed) {
        throw new UnauthorizedException('Bu 2FA kodu daha önce kullanıldı')
      }
      const otpValid = authenticator.verify({ token: totpCode, secret: config.totpSecret })
      if (!otpValid) {
        throw new UnauthorizedException('Geçersiz 2FA kodu')
      }
      await this.redis.set(otpKey, '1', 'EX', 60)
    }

    // Yeni kullanıcı adı mevcut ile aynıysa reddet
    if (newUsername && newUsername === effectiveUsername) {
      throw new UnauthorizedException('Yeni kullanıcı adı mevcut ile aynı olamaz')
    }

    if (newUsername) {
      await this.adminConfigService.setUsername(newUsername)
    }

    if (newPassword) {
      const hash = await bcrypt.hash(newPassword, 12)
      await this.adminConfigService.setPasswordHash(hash)
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

    // O-03: jti (JWT ID) ekle — O-02: fallback 8h
    const jti = crypto.randomUUID()
    return {
      access_token: this.jwtService.sign(
        { username, sub: 'admin', jti },
        { expiresIn: this.cfg.get('JWT_EXPIRES_IN', '8h') },
      ),
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

    // O-01: Replay koruması — kullanılan OTP'yi reddet
    const otpKey = `otp:${code}-${Math.floor(Date.now() / 30000)}`
    const alreadyUsed = await this.redis.get(otpKey)
    if (alreadyUsed) {
      throw new UnauthorizedException('Kod daha önce kullanıldı')
    }

    const valid = authenticator.verify({ token: code, secret: config.totpSecret })
    if (!valid) {
      throw new UnauthorizedException('Geçersiz doğrulama kodu')
    }

    // O-01: Kodu 60 saniye TTL ile Redis'e kaydet
    await this.redis.set(otpKey, '1', 'EX', 60)

    // O-03: jti ekle — O-02: fallback 8h
    const jti = crypto.randomUUID()
    return {
      access_token: this.jwtService.sign(
        { username: payload.username, sub: 'admin', jti },
        { expiresIn: this.cfg.get('JWT_EXPIRES_IN', '8h') },
      ),
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
