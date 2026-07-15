import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import type { Request } from 'express'
import { AuthService } from './auth.service'
import { AdminConfigService } from './admin-config.service'
import type { AuthUser, JwtPayload } from './jwt-payload'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    cfg: ConfigService,
    private authService: AuthService,
    private adminConfigService: AdminConfigService,
  ) {
    const secret = cfg.get<string>('JWT_SECRET')
    if (!secret) throw new Error('JWT_SECRET env değişkeni set edilmeli')
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => req?.cookies?.admin_token ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true,
    })
  }

  async validate(req: Request, payload: JwtPayload): Promise<AuthUser> {
    // K-01: pre-auth token'ları korumalı endpoint'lere erişemez
    if (payload.role === 'pre-auth') {
      throw new UnauthorizedException('2FA doğrulaması tamamlanmadı')
    }

    // O-03: Blacklist kontrolü
    if (payload.jti && await this.authService.isTokenBlacklisted(payload.jti)) {
      throw new UnauthorizedException('Oturum sonlandırılmış')
    }

    // Kimlik bilgileri değiştiğinde tokenVersion artar; eski token'lar (ver eşleşmeyen
    // veya ver claim'i hiç olmayan) tüm cihazlarda geçersizleşir
    const config = await this.adminConfigService.getConfig()
    if ((payload.ver ?? -1) !== (config.tokenVersion ?? 0)) {
      throw new UnauthorizedException('Oturum geçersiz, yeniden giriş yapın')
    }

    return { userId: payload.sub, username: payload.username, jti: payload.jti, exp: payload.exp }
  }
}
