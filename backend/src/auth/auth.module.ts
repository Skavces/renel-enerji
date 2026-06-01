import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { JwtStrategy } from './jwt.strategy'
import { AdminConfig } from './admin-config.entity'
import { AdminConfigService } from './admin-config.service'

@Module({
  imports: [
    PassportModule,
    TypeOrmModule.forFeature([AdminConfig]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const secret = cfg.get<string>('JWT_SECRET')
        if (!secret) throw new Error('JWT_SECRET env değişkeni set edilmeli')
        return {
          secret,
          signOptions: { expiresIn: cfg.get('JWT_EXPIRES_IN', '8h') },
        }
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, AdminConfigService],
})
export class AuthModule {}
