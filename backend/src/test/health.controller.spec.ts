import { Test } from '@nestjs/testing'
import { HealthCheckError, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus'
import { getDataSourceToken } from '@nestjs/typeorm'
import { HealthController } from '../health.controller'
import { AuthService } from '../auth/auth.service'

type Indicator = () => Promise<unknown>

const mockHealthCheckService = {
  // Gerçek terminus indicator'ları hemen çalıştırıp sonucu birleştirir; burada
  // amaç sadece controller'ın health.check()'e geçirdiği fonksiyonları
  // yakalayıp testte ayrıca çağırmak, bu yüzden indicator'ları çalıştırmıyoruz.
  check: jest.fn((_indicators: Indicator[]) => Promise.resolve({ status: 'ok' })),
}

const mockDb = {
  pingCheck: jest.fn(),
}

const mockAuthService = {
  pingRedis: jest.fn(),
}

async function makeController() {
  const module = await Test.createTestingModule({
    controllers: [HealthController],
    providers: [
      { provide: HealthCheckService, useValue: mockHealthCheckService },
      { provide: TypeOrmHealthIndicator, useValue: mockDb },
      { provide: getDataSourceToken(), useValue: {} },
      { provide: AuthService, useValue: mockAuthService },
    ],
  }).compile()

  return module.get(HealthController)
}

describe('HealthController', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('redis erişilemediğinde ham hata mesajını sızdırmadan HealthCheckError fırlatır', async () => {
    mockAuthService.pingRedis.mockRejectedValue(new Error('connect ECONNREFUSED 172.18.0.4:6379'))
    mockDb.pingCheck.mockResolvedValue({ database: { status: 'up' } })

    const controller = await makeController()
    await controller.check()

    const [indicators] = mockHealthCheckService.check.mock.calls[0] as [Indicator[]]
    const redisIndicator = indicators[1]

    await expect(redisIndicator()).rejects.toMatchObject({
      causes: { redis: { status: 'down' } },
    })

    let caught: unknown
    try {
      await redisIndicator()
    } catch (err) {
      caught = err
    }
    expect(caught).toBeInstanceOf(HealthCheckError)
    const causes = (caught as HealthCheckError).causes as Record<string, unknown>
    expect(causes.redis).toEqual({ status: 'down' })
    expect(JSON.stringify(causes)).not.toContain('ECONNREFUSED')
  })

  it('redis erişilebilir olduğunda up döner', async () => {
    mockAuthService.pingRedis.mockResolvedValue(undefined)
    mockDb.pingCheck.mockResolvedValue({ database: { status: 'up' } })

    const controller = await makeController()
    await controller.check()

    const [indicators] = mockHealthCheckService.check.mock.calls[0] as [Indicator[]]
    const redisIndicator = indicators[1]

    await expect(redisIndicator()).resolves.toEqual({ redis: { status: 'up' } })
  })
})
