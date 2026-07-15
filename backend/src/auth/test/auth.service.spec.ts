import { UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { authenticator } from 'otplib'
import * as bcrypt from 'bcrypt'
import { AuthService } from '../auth.service'
import { AdminConfigService } from '../admin-config.service'

// Redis mock — RedisModule DI sayesinde düz obje yeterli
const redisMock = {
  get: jest.fn(),
  set: jest.fn(),
}

const mockAdminConfig = {
  id: 1,
  username: 'admin',
  passwordHash: null as string | null,
  totpSecret: null as string | null,
  tokenVersion: 0,
}

function makeService(overrides: Partial<typeof mockAdminConfig> = {}) {
  const config = { ...mockAdminConfig, ...overrides }

  const jwtService = {
    sign: jest.fn((payload: any) => JSON.stringify(payload)),
    verify: jest.fn((token: string) => JSON.parse(token)),
    decode: jest.fn((token: string) => JSON.parse(token)),
  } as unknown as JwtService

  const configService = {
    get: jest.fn((key: string, def?: any) => {
      const vals: Record<string, string> = {
        REDIS_URL: 'redis://localhost:6379',
        NODE_ENV: 'development',
        JWT_EXPIRES_IN: '8h',
        ADMIN_USERNAME: config.username,
        ADMIN_PASSWORD_HASH: config.passwordHash ?? '',
      }
      return vals[key] ?? def
    }),
  } as unknown as ConfigService

  const adminConfigService = {
    getConfig: jest.fn().mockResolvedValue(config),
    setTotpSecret: jest.fn(),
    removeTotpSecret: jest.fn(),
    setUsername: jest.fn(),
    setPasswordHash: jest.fn(),
    incrementTokenVersion: jest.fn(),
  } as unknown as AdminConfigService

  const service = new AuthService(
    jwtService,
    configService,
    adminConfigService,
    redisMock as unknown as import('ioredis').Redis,
  )

  return { service, jwtService, adminConfigService }
}

describe('AuthService', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('login', () => {
    it('should return access_token when 2FA not configured', async () => {
      const hash = await bcrypt.hash('secret', 10)
      const { service, jwtService } = makeService({ passwordHash: hash, totpSecret: null })

      const result = await service.login('admin', 'secret')

      expect(result).toHaveProperty('access_token')
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ sub: 'admin', jti: expect.any(String) }),
        expect.any(Object),
      )
    })

    it('should return preAuthToken with jti when 2FA is configured', async () => {
      const hash = await bcrypt.hash('secret', 10)
      const { service } = makeService({ passwordHash: hash, totpSecret: 'TOTP_SECRET' })

      const result = await service.login('admin', 'secret') as any

      expect(result.requires2fa).toBe(true)
      expect(result.preAuthToken).toBeDefined()
      const payload = JSON.parse(result.preAuthToken)
      expect(payload.role).toBe('pre-auth')
      expect(payload.jti).toBeDefined()
    })

    it('should reject wrong password', async () => {
      const hash = await bcrypt.hash('correct', 10)
      const { service } = makeService({ passwordHash: hash, totpSecret: null })

      await expect(service.login('admin', 'wrong')).rejects.toThrow(UnauthorizedException)
    })

    it('should embed current tokenVersion as ver claim', async () => {
      const hash = await bcrypt.hash('secret', 10)
      const { service } = makeService({ passwordHash: hash, totpSecret: null, tokenVersion: 3 })

      const result = await service.login('admin', 'secret') as any

      const payload = JSON.parse(result.access_token)
      expect(payload.ver).toBe(3)
    })
  })

  describe('changeCredentials', () => {
    it('should increment tokenVersion so other sessions are invalidated', async () => {
      const hash = await bcrypt.hash('current', 10)
      const { service, adminConfigService } = makeService({ passwordHash: hash, totpSecret: null })

      await service.changeCredentials('current', undefined, 'admin', undefined, 'yeni-sifre-123')

      expect(adminConfigService.setPasswordHash).toHaveBeenCalled()
      expect(adminConfigService.incrementTokenVersion).toHaveBeenCalledTimes(1)
    })

    it('should not increment tokenVersion when current password is wrong', async () => {
      const hash = await bcrypt.hash('current', 10)
      const { service, adminConfigService } = makeService({ passwordHash: hash, totpSecret: null })

      await expect(
        service.changeCredentials('wrong', undefined, 'admin', undefined, 'yeni-sifre-123'),
      ).rejects.toThrow(UnauthorizedException)
      expect(adminConfigService.incrementTokenVersion).not.toHaveBeenCalled()
    })
  })

  describe('verify2FA', () => {
    it('should reject replayed pre-auth token (blacklisted)', async () => {
      const totpSecret = authenticator.generateSecret()
      const { service } = makeService({ totpSecret })

      const preAuthPayload = { sub: 'admin', role: 'pre-auth', rememberMe: false, jti: 'test-jti-123', exp: 9999999999 }
      const preAuthToken = JSON.stringify(preAuthPayload)

      redisMock.get.mockImplementation((key: string) => {
        if (key === 'blacklist:test-jti-123') return Promise.resolve('1')
        return Promise.resolve(null)
      })

      await expect(service.verify2FA(preAuthToken, '123456')).rejects.toThrow(UnauthorizedException)
      await expect(service.verify2FA(preAuthToken, '123456')).rejects.toThrow('daha önce kullanıldı')
    })

    it('should blacklist pre-auth token after successful 2FA', async () => {
      const totpSecret = authenticator.generateSecret()
      const { service } = makeService({ totpSecret })
      const code = authenticator.generate(totpSecret)

      const preAuthPayload = { sub: 'admin', role: 'pre-auth', username: 'admin', rememberMe: false, jti: 'fresh-jti', exp: 9999999999 }
      const preAuthToken = JSON.stringify(preAuthPayload)

      redisMock.get.mockResolvedValue(null)
      redisMock.set.mockResolvedValue('OK')

      await service.verify2FA(preAuthToken, code)

      const blacklistCall = redisMock.set.mock.calls.find((c: any) => c[0] === 'blacklist:fresh-jti')
      expect(blacklistCall).toBeDefined()
    })

    it('should reject invalid TOTP code', async () => {
      const totpSecret = authenticator.generateSecret()
      const { service } = makeService({ totpSecret })

      const preAuthPayload = { sub: 'admin', role: 'pre-auth', username: 'admin', rememberMe: false, jti: 'x', exp: 9999999999 }
      const preAuthToken = JSON.stringify(preAuthPayload)

      redisMock.get.mockResolvedValue(null)

      await expect(service.verify2FA(preAuthToken, '000000')).rejects.toThrow(UnauthorizedException)
    })

    it('should reject replayed TOTP code (OTP blacklist)', async () => {
      const totpSecret = authenticator.generateSecret()
      const { service } = makeService({ totpSecret })
      const code = authenticator.generate(totpSecret)

      const preAuthPayload = { sub: 'admin', role: 'pre-auth', username: 'admin', rememberMe: false, jti: 'y', exp: 9999999999 }
      const preAuthToken = JSON.stringify(preAuthPayload)

      redisMock.get.mockImplementation((key: string) => {
        if (key.startsWith(`otp:${code}`)) return Promise.resolve('1')
        return Promise.resolve(null)
      })

      await expect(service.verify2FA(preAuthToken, code)).rejects.toThrow('daha önce kullanıldı')
    })
  })

  describe('confirmSetup', () => {
    it('should require current TOTP code when 2FA is already enabled', async () => {
      const existingSecret = authenticator.generateSecret()
      const { service } = makeService({ totpSecret: existingSecret })

      redisMock.get.mockResolvedValue(null)

      const newSecret = authenticator.generateSecret()
      const newCode = authenticator.generate(newSecret)

      await expect(service.confirmSetup(newSecret, newCode, undefined)).rejects.toThrow(
        'Mevcut TOTP kodu gerekli',
      )
    })

    it('should reject wrong current TOTP code when replacing 2FA', async () => {
      const existingSecret = authenticator.generateSecret()
      const { service } = makeService({ totpSecret: existingSecret })

      redisMock.get.mockResolvedValue(null)

      const newSecret = authenticator.generateSecret()
      const newCode = authenticator.generate(newSecret)

      await expect(service.confirmSetup(newSecret, newCode, '000000')).rejects.toThrow(
        'Mevcut TOTP kodu yanlış',
      )
    })

    it('should allow setup without currentCode when 2FA is not yet configured', async () => {
      const { service, adminConfigService } = makeService({ totpSecret: null })

      redisMock.get.mockResolvedValue(null)
      redisMock.set.mockResolvedValue('OK')

      const newSecret = authenticator.generateSecret()
      const newCode = authenticator.generate(newSecret)

      const result = await service.confirmSetup(newSecret, newCode)

      expect(result).toEqual({ ok: true })
      expect(adminConfigService.setTotpSecret).toHaveBeenCalledWith(newSecret)
    })
  })
})
