import { UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtStrategy } from '../jwt.strategy'
import { AuthService } from '../auth.service'
import { AdminConfigService } from '../admin-config.service'
import type { JwtPayload } from '../jwt-payload'

// validate imzası artık tiplendi; testler kasten eksik claim'li payload yollar
const validate = (strategy: JwtStrategy, payload: Partial<JwtPayload>) =>
  strategy.validate({} as never, payload as JwtPayload)

function makeStrategy(opts: { tokenVersion?: number; blacklisted?: boolean } = {}) {
  const cfg = {
    get: jest.fn((key: string) => (key === 'JWT_SECRET' ? 'test-secret' : undefined)),
  } as unknown as ConfigService

  const authService = {
    isTokenBlacklisted: jest.fn().mockResolvedValue(opts.blacklisted ?? false),
  } as unknown as AuthService

  const adminConfigService = {
    getConfig: jest.fn().mockResolvedValue({ id: 1, tokenVersion: opts.tokenVersion ?? 0 }),
  } as unknown as AdminConfigService

  return new JwtStrategy(cfg, authService, adminConfigService)
}

describe('JwtStrategy.validate', () => {
  it('should reject pre-auth tokens', async () => {
    const strategy = makeStrategy()
    await expect(
      validate(strategy, { role: 'pre-auth', username: 'admin' }),
    ).rejects.toThrow(UnauthorizedException)
  })

  it('should reject blacklisted tokens', async () => {
    const strategy = makeStrategy({ blacklisted: true })
    await expect(
      validate(strategy, { username: 'admin', jti: 'x', ver: 0 }),
    ).rejects.toThrow('Oturum sonlandırılmış')
  })

  it('should reject tokens with a stale ver claim (credentials changed)', async () => {
    const strategy = makeStrategy({ tokenVersion: 2 })
    await expect(
      validate(strategy, { username: 'admin', jti: 'x', ver: 1 }),
    ).rejects.toThrow('yeniden giriş')
  })

  it('should reject legacy tokens without a ver claim', async () => {
    const strategy = makeStrategy({ tokenVersion: 0 })
    await expect(
      validate(strategy, { username: 'admin', jti: 'x' }),
    ).rejects.toThrow(UnauthorizedException)
  })

  it('should accept tokens with the current ver claim', async () => {
    const strategy = makeStrategy({ tokenVersion: 2 })
    const user = await validate(strategy, { sub: 'admin', username: 'admin', jti: 'x', exp: 1, ver: 2 })
    expect(user).toEqual({ userId: 'admin', username: 'admin', jti: 'x', exp: 1 })
  })
})
