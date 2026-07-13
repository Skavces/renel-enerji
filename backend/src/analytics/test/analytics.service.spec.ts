import { ConfigService } from '@nestjs/config'
import { AnalyticsService } from '../analytics.service'
import { fetchWithTimeout } from '../../common/fetch-with-timeout'

jest.mock('../../common/fetch-with-timeout')

const mockFetch = fetchWithTimeout as jest.MockedFunction<typeof fetchWithTimeout>

const CONFIG_VALUES: Record<string, string> = {
  UMAMI_URL: 'http://umami:3000',
  UMAMI_WEBSITE_ID: 'site-1',
  UMAMI_USER: 'admin',
  UMAMI_PASS: 'pass',
}

function makeService(): AnalyticsService {
  const config = {
    get: (key: string, def?: string) => CONFIG_VALUES[key] ?? def,
  } as unknown as ConfigService
  return new AnalyticsService(config)
}

function jsonResponse(status: number, body: unknown = {}): Response {
  return { ok: status < 400, status, json: async () => body } as unknown as Response
}

function isLogin(call: [string | URL | Request, ...unknown[]]): boolean {
  return String(call[0]).includes('/api/auth/login')
}

describe('AnalyticsService — Umami token yenileme', () => {
  beforeEach(() => mockFetch.mockReset())

  it('caches the token across calls', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse(200, { token: 't1' })) // login
      .mockResolvedValue(jsonResponse(200, { pageviews: { value: 1, change: 0 } }))

    const service = makeService()
    await service.getStats(0, 1)
    await service.getStats(0, 1)

    expect(mockFetch.mock.calls.filter(isLogin)).toHaveLength(1)
  })

  it('drops the cached token on 401 and retries once with a fresh one', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse(200, { token: 'eski' })) // ilk login
      .mockResolvedValueOnce(jsonResponse(401)) // Umami restart: token geçersiz
      .mockResolvedValueOnce(jsonResponse(200, { token: 'yeni' })) // yeniden login
      .mockResolvedValueOnce(jsonResponse(200, { pageviews: { value: 5, change: 0 } }))

    const service = makeService()
    const stats = await service.getStats(0, 1)

    expect(stats).toEqual({ pageviews: { value: 5, change: 0 } })
    expect(mockFetch.mock.calls.filter(isLogin)).toHaveLength(2)
    const lastCall = mockFetch.mock.calls[3]
    expect((lastCall[1]?.headers as Record<string, string>).Authorization).toBe('Bearer yeni')
  })

  it('gives up after one retry when the API keeps returning 401', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse(200, { token: 't1' }))
      .mockResolvedValueOnce(jsonResponse(401))
      .mockResolvedValueOnce(jsonResponse(200, { token: 't2' }))
      .mockResolvedValueOnce(jsonResponse(401))

    const service = makeService()
    // getStats hatayı yutup null döner; sonsuz retry döngüsü olmamalı
    await expect(service.getStats(0, 1)).resolves.toBeNull()
    expect(mockFetch).toHaveBeenCalledTimes(4)
  })
})
