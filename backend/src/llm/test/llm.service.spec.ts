import { ConfigService } from '@nestjs/config'
import { LlmService, LLM_MODEL, LLM_FALLBACK_MODEL } from '../llm.service'
import { fetchWithTimeout } from '../../common/fetch-with-timeout'

function makeConfig(vals: Record<string, string | undefined> = {}): ConfigService {
  return { get: jest.fn((key: string) => vals[key]) } as unknown as ConfigService
}

jest.mock('../../common/fetch-with-timeout')

const mockFetch = fetchWithTimeout as jest.MockedFunction<typeof fetchWithTimeout>

function okResponse(content = 'cevap'): Response {
  return {
    ok: true,
    status: 200,
    json: async () => ({ choices: [{ message: { content } }] }),
  } as unknown as Response
}

function emptyResponse(): Response {
  return {
    ok: true,
    status: 200,
    json: async () => ({ choices: [{ message: { content: null, reasoning: 'düşünüyorum...' }, finish_reason: 'length' }] }),
  } as unknown as Response
}

function errResponse(status: number, retryAfter?: string): Response {
  return {
    ok: false,
    status,
    headers: { get: (name: string) => (name.toLowerCase() === 'retry-after' ? retryAfter ?? null : null) },
  } as unknown as Response
}

function sentPayload(callIndex: number): { model: string; key: string } {
  const [, options] = mockFetch.mock.calls[callIndex]
  const body = JSON.parse(options!.body as string)
  const headers = options!.headers as Record<string, string>
  return { model: body.model, key: headers.Authorization.replace('Bearer ', '') }
}

describe('LlmService', () => {
  let service: LlmService

  beforeEach(() => {
    service = new LlmService(makeConfig())
    mockFetch.mockReset()
    jest.spyOn(global, 'setTimeout').mockImplementation(((fn: () => void) => {
      fn()
      return 0 as unknown as NodeJS.Timeout
    }) as unknown as typeof setTimeout)
  })

  afterEach(() => jest.restoreAllMocks())

  const payload = { model: LLM_MODEL, messages: [] }

  it('returns data on first successful attempt', async () => {
    mockFetch.mockResolvedValueOnce(okResponse())

    const { res, data } = await service.call(['key1', 'key2'], payload)
    expect(res?.ok).toBe(true)
    expect(data?.choices?.[0]?.message?.content).toBe('cevap')
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(sentPayload(0)).toEqual({ model: LLM_MODEL, key: 'key1' })
  })

  it('falls back to second key on 429', async () => {
    mockFetch.mockResolvedValueOnce(errResponse(429)).mockResolvedValueOnce(okResponse())

    const { res } = await service.call(['key1', 'key2'], payload)
    expect(res?.ok).toBe(true)
    expect(sentPayload(1)).toEqual({ model: LLM_MODEL, key: 'key2' })
  })

  it('retries on 5xx and falls back to secondary model on repeated failure', async () => {
    mockFetch
      .mockResolvedValueOnce(errResponse(503))
      .mockResolvedValueOnce(errResponse(503))
      .mockResolvedValueOnce(okResponse())

    const { res } = await service.call(['key1', 'key2'], payload)
    expect(res?.ok).toBe(true)
    expect(mockFetch).toHaveBeenCalledTimes(3)
    expect(sentPayload(2)).toEqual({ model: LLM_FALLBACK_MODEL, key: 'key1' })
  })

  describe('çoklu anahtar: dönüşüm ve soğuma', () => {
    const keysOf = (n: number): string[] => Array.from({ length: n }, (_, i) => sentPayload(i).key)

    it('rotates the starting key across calls to spread load over accounts', async () => {
      mockFetch.mockResolvedValue(okResponse())
      for (let i = 0; i < 4; i++) await service.call(['k1', 'k2', 'k3'], payload)
      expect(keysOf(4)).toEqual(['k1', 'k2', 'k3', 'k1'])
    })

    it('tries every key on the primary model before falling back to the secondary model', async () => {
      mockFetch.mockResolvedValue(errResponse(503))
      await service.call(['k1', 'k2', 'k3'], payload)
      expect(mockFetch).toHaveBeenCalledTimes(4)
      expect([0, 1, 2].map(i => sentPayload(i))).toEqual([
        { model: LLM_MODEL, key: 'k1' },
        { model: LLM_MODEL, key: 'k2' },
        { model: LLM_MODEL, key: 'k3' },
      ])
      expect(sentPayload(3)).toEqual({ model: LLM_FALLBACK_MODEL, key: 'k1' })
    })

    it('puts a key that returned 401 last on following calls (dead key is not tried first)', async () => {
      mockFetch.mockResolvedValueOnce(errResponse(401)).mockResolvedValue(okResponse())
      await service.call(['k1', 'k2', 'k3'], payload) // k1 401 → k2 ok
      mockFetch.mockClear()
      mockFetch.mockResolvedValue(errResponse(503))
      await service.call(['k1', 'k2', 'k3'], payload)
      // cursor 1 → k2,k3,k1 sırası; soğuyan k1 sonda kalır
      expect([0, 1, 2].map(i => sentPayload(i).key)).toEqual(['k2', 'k3', 'k1'])
    })

    it('cools a rate-limited key down using Retry-After and restores it afterwards', async () => {
      const now = jest.spyOn(Date, 'now').mockReturnValue(1_000_000)
      mockFetch.mockResolvedValueOnce(errResponse(429, '30')).mockResolvedValue(okResponse())
      await service.call(['k1', 'k2'], payload) // k1 429 (30 sn soğuma) → k2 ok
      mockFetch.mockClear()
      mockFetch.mockResolvedValue(okResponse())

      await service.call(['k1', 'k2'], payload) // cursor 1 → sıra k2,k1; k1 soğuyor
      expect(sentPayload(0).key).toBe('k2')

      mockFetch.mockClear()
      now.mockReturnValue(1_000_000 + 31_000) // soğuma bitti
      await service.call(['k1', 'k2'], payload) // cursor 2 → k1 ilk sırada
      expect(sentPayload(0).key).toBe('k1')
    })

    it('does not cool a key down for server errors or empty content (model issues, not key issues)', async () => {
      mockFetch.mockResolvedValueOnce(errResponse(503)).mockResolvedValue(okResponse())
      await service.call(['k1', 'k2'], payload)
      mockFetch.mockClear()
      mockFetch.mockResolvedValue(okResponse())
      await service.call(['k1', 'k2'], payload) // cursor 1 → k2 önce (soğuma değil, dönüşüm)
      await service.call(['k1', 'k2'], payload) // cursor 2 → k1 yine ilk sırada
      expect(keysOf(2)).toEqual(['k2', 'k1'])
    })

    it('still tries cooled-down keys as a last resort when every key is cooling', async () => {
      mockFetch.mockResolvedValue(errResponse(401))
      await service.call(['k1', 'k2'], payload)
      mockFetch.mockClear()
      mockFetch.mockResolvedValue(okResponse())
      const { data } = await service.call(['k1', 'k2'], payload)
      expect(data).not.toBeNull()
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  it('treats a 200 with empty content as a failed attempt and moves down the chain', async () => {
    mockFetch
      .mockResolvedValueOnce(emptyResponse())
      .mockResolvedValueOnce(emptyResponse())
      .mockResolvedValueOnce(okResponse())

    const { data } = await service.call(['key1', 'key2'], payload)
    expect(data?.choices?.[0]?.message?.content).toBe('cevap')
    expect(mockFetch).toHaveBeenCalledTimes(3)
    expect(sentPayload(2)).toEqual({ model: LLM_FALLBACK_MODEL, key: 'key1' })
  })

  it('returns null data when every attempt comes back with empty content', async () => {
    mockFetch.mockResolvedValue(emptyResponse())

    const { data } = await service.call(['key1', 'key2'], payload)
    expect(data).toBeNull()
    expect(mockFetch).toHaveBeenCalledTimes(3)
  })

  it('sends reasoning_effort for gpt-oss models so reasoning cannot eat the token budget', async () => {
    mockFetch.mockResolvedValueOnce(okResponse())
    await service.call(['key1'], payload)
    const body = JSON.parse(mockFetch.mock.calls[0][1]!.body as string)
    expect(body.reasoning_effort).toBe('low')
  })

  it('does not add model params for unknown models', async () => {
    mockFetch.mockResolvedValueOnce(okResponse())
    await service.call(['key1'], { model: 'baska/model', messages: [] })
    const body = JSON.parse(mockFetch.mock.calls[0][1]!.body as string)
    expect(body).not.toHaveProperty('reasoning_effort')
  })

  it('survives network errors/timeouts and keeps retrying', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('aborted'))
      .mockResolvedValueOnce(okResponse())

    const { res } = await service.call(['key1'], payload)
    expect(res?.ok).toBe(true)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('returns null res/data when all attempts fail with network errors', async () => {
    mockFetch.mockRejectedValue(new Error('aborted'))

    const { res, data } = await service.call(['key1', 'key2'], payload)
    expect(res).toBeNull()
    expect(data).toBeNull()
    expect(mockFetch).toHaveBeenCalledTimes(3)
  })

  it('returns failed res and null data when all attempts return errors', async () => {
    mockFetch.mockResolvedValue(errResponse(500))

    const { res, data } = await service.call(['key1', 'key2'], payload)
    expect(res?.status).toBe(500)
    expect(data).toBeNull()
    expect(mockFetch).toHaveBeenCalledTimes(3)
  })
})

describe('LlmService.ping', () => {
  let service: LlmService

  beforeEach(() => {
    service = new LlmService(makeConfig())
    mockFetch.mockReset()
  })

  it('returns true for a single successful attempt', async () => {
    mockFetch.mockResolvedValueOnce(okResponse())
    await expect(service.ping('key1', LLM_MODEL)).resolves.toBe(true)
    // call()'un aksine tek deneme, fallback zinciri yok
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(sentPayload(0)).toEqual({ model: LLM_MODEL, key: 'key1' })
  })

  it('returns false when the model answers 200 but with empty content', async () => {
    mockFetch.mockResolvedValueOnce(emptyResponse())
    await expect(service.ping('key1', LLM_MODEL)).resolves.toBe(false)
  })

  it('returns false without retrying on a non-ok response (ör. 404 model_not_found)', async () => {
    mockFetch.mockResolvedValueOnce(errResponse(404))
    await expect(service.ping('key1', LLM_MODEL)).resolves.toBe(false)
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('returns false on a network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('aborted'))
    await expect(service.ping('key1', LLM_MODEL)).resolves.toBe(false)
  })
})

describe('LlmService.getKeys', () => {
  it('prefers the purpose-specific comma lists and trims entries', () => {
    const service = new LlmService(makeConfig({
      LLM_CHAT_KEYS: ' c1 , c2 ,',
      LLM_PARSE_KEYS: 'p1',
      LLM_API_KEY: 'legacy',
    }))
    expect(service.getKeys('chat')).toEqual(['c1', 'c2'])
    expect(service.getKeys('parse')).toEqual(['p1'])
  })

  it('falls back to legacy variables with the historical priorities', () => {
    const service = new LlmService(makeConfig({
      LLM_API_KEY: 'k1',
      LLM_API_KEY_2: 'k2',
      LLM_API_KEY_3: 'k3',
    }))
    // Eski davranış: chatbot KEY_3'ü tercih eder, parse KEY'i kullanır
    expect(service.getKeys('chat')).toEqual(['k3', 'k2'])
    expect(service.getKeys('parse')).toEqual(['k1', 'k2'])
  })

  it('uses the primary key for chat when KEY_3 is absent', () => {
    const service = new LlmService(makeConfig({ LLM_API_KEY: 'k1' }))
    expect(service.getKeys('chat')).toEqual(['k1'])
  })

  it('returns an empty list when nothing is configured', () => {
    const service = new LlmService(makeConfig())
    expect(service.getKeys('chat')).toEqual([])
    expect(service.getKeys('parse')).toEqual([])
  })
})
