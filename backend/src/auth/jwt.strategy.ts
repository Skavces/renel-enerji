import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import { AuthService } from './auth.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    cfg: ConfigService,
    private authService: AuthService,
  ) {
    const secret = cfg.get<string>('JWT_SECRET')
    if (!secret) throw new Error('JWT_SECRET env değişkeni set edilmeli')
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => req?.cookies?.admin_token ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken(), // geriye dönük uyumluluk
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true,
    })
  }

  async validate(req: any, payload: any) {
    // K-01: pre-auth token'ları korumalı endpoint'lere erişemez
    if (payload.role === 'pre-auth') {
      throw new UnauthorizedException('2FA doğrulaması tamamlanmadı')
    }

    // O-03: Blacklist kontrolü
    if (payload.jti && await this.authService.isTokenBlacklisted(payload.jti)) {
      throw new UnauthorizedException('Oturum sonlandırılmış')
    }

    return { userId: payload.sub, username: payload.username, jti: payload.jti }
  }
}
