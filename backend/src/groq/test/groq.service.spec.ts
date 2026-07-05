import { GroqService, GROQ_MODEL, GROQ_FALLBACK_MODEL } from '../groq.service'
import { fetchWithTimeout } from '../../common/fetch-with-timeout'

jest.mock('../../common/fetch-with-timeout')

const mockFetch = fetchWithTimeout as jest.MockedFunction<typeof fetchWithTimeout>

function okResponse(content = 'cevap'): Response {
  return {
    ok: true,
    status: 200,
    json: async () => ({ choices: [{ message: { content } }] }),
  } as unknown as Response
}

function errResponse(status: number): Response {
  return { ok: false, status } as unknown as Response
}

function sentPayload(callIndex: number): { model: string; key: string } {
  const [, options] = mockFetch.mock.calls[callIndex]
  const body = JSON.parse(options!.body as string)
  const headers = options!.headers as Record<string, string>
  return { model: body.model, key: headers.Authorization.replace('Bearer ', '') }
}

describe('GroqService', () => {
  let service: GroqService

  beforeEach(() => {
    service = new GroqService()
    mockFetch.mockReset()
    jest.spyOn(global, 'setTimeout').mockImplementation(((fn: () => void) => {
      fn()
      return 0 as unknown as NodeJS.Timeout
    }) as unknown as typeof setTimeout)
  })

  afterEach(() => jest.restoreAllMocks())

  const payload = { model: GROQ_MODEL, messages: [] }

  it('returns data on first successful attempt', async () => {
    mockFetch.mockResolvedValueOnce(okResponse())

    const { res, data } = await service.call('key1', 'key2', payload)
    expect(res?.ok).toBe(true)
    expect(data.choices[0].message.content).toBe('cevap')
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(sentPayload(0)).toEqual({ model: GROQ_MODEL, key: 'key1' })
  })

  it('falls back to second key on 429', async () => {
    mockFetch.mockResolvedValueOnce(errResponse(429)).mockResolvedValueOnce(okResponse())

    const { res } = await service.call('key1', 'key2', payload)
    expect(res?.ok).toBe(true)
    expect(sentPayload(1)).toEqual({ model: GROQ_MODEL, key: 'key2' })
  })

  it('retries on 5xx and falls back to secondary model on repeated failure', async () => {
    mockFetch
      .mockResolvedValueOnce(errResponse(503))
      .mockResolvedValueOnce(errResponse(503))
      .mockResolvedValueOnce(okResponse())

    const { res } = await service.call('key1', 'key2', payload)
    expect(res?.ok).toBe(true)
    expect(mockFetch).toHaveBeenCalledTimes(3)
    expect(sentPayload(2)).toEqual({ model: GROQ_FALLBACK_MODEL, key: 'key1' })
  })

  it('survives network errors/timeouts and keeps retrying', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('aborted'))
      .mockResolvedValueOnce(okResponse())

    const { res } = await service.call('key1', undefined, payload)
    expect(res?.ok).toBe(true)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('returns null res/data when all attempts fail with network errors', async () => {
    mockFetch.mockRejectedValue(new Error('aborted'))

    const { res, data } = await service.call('key1', 'key2', payload)
    expect(res).toBeNull()
    expect(data).toBeNull()
    expect(mockFetch).toHaveBeenCalledTimes(3)
  })

  it('returns failed res and null data when all attempts return errors', async () => {
    mockFetch.mockResolvedValue(errResponse(500))

    const { res, data } = await service.call('key1', 'key2', payload)
    expect(res?.status).toBe(500)
    expect(data).toBeNull()
    expect(mockFetch).toHaveBeenCalledTimes(3)
  })
})
