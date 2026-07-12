import { ConfigService } from '@nestjs/config'
import { NtfyService } from '../ntfy.service'
import { NtfyLogger } from '../ntfy-logger.service'
import { fetchWithTimeout } from '../../common/fetch-with-timeout'

jest.mock('../../common/fetch-with-timeout')

const mockFetch = fetchWithTimeout as jest.MockedFunction<typeof fetchWithTimeout>

function makeService(env: Record<string, string> = {}): NtfyService {
  const config = { get: (key: string) => env[key] } as unknown as ConfigService
  return new NtfyService(config)
}

const FULL_ENV = { NTFY_URL: 'https://renelenerji.com/ntfy', NTFY_TOPIC: 'renel-lead', NTFY_TOKEN: 'tk_test' }

describe('NtfyService', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    mockFetch.mockReset()
    mockFetch.mockResolvedValue({ ok: true } as Response)
  })

  it('URL tanımlı değilse fetch çağrılmaz', async () => {
    const service = makeService({})
    await service.send('merhaba')
    await service.notifyError('hata')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('topic tanımlı değilse fetch çağrılmaz', async () => {
    const service = makeService({ NTFY_URL: 'https://renelenerji.com/ntfy' })
    await service.send('merhaba')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('send doğru URL, Authorization header ve body ile POST atar', async () => {
    const service = makeService(FULL_ENV)
    await service.send('merhaba dünya')
    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toBe('https://renelenerji.com/ntfy/renel-lead')
    const init = options as RequestInit
    expect(init.body).toBe('merhaba dünya')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tk_test')
  })

  it('token yoksa Authorization header eklenmez', async () => {
    const service = makeService({ NTFY_URL: 'https://renelenerji.com/ntfy', NTFY_TOPIC: 'renel-lead' })
    await service.send('merhaba')
    const init = mockFetch.mock.calls[0][1] as RequestInit
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined()
  })

  it('4096 karakterden uzun mesajı kırpar', async () => {
    const service = makeService(FULL_ENV)
    await service.send('a'.repeat(5000))
    const body = (mockFetch.mock.calls[0][1] as RequestInit).body as string
    expect(body).toHaveLength(4096)
  })

  it('fetch hatası yutulur, fırlatılmaz', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    mockFetch.mockRejectedValue(new Error('ağ hatası'))
    const service = makeService(FULL_ENV)
    await expect(service.send('merhaba')).resolves.toBeUndefined()
    await expect(service.notifyError('hata')).resolves.toBeUndefined()
  })

  it('aynı hata 1 saat içinde ikinci kez gönderilmez', async () => {
    const service = makeService(FULL_ENV)
    await service.notifyError('aynı hata mesajı')
    await service.notifyError('aynı hata mesajı')
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('aynı hata 1 saat sonra tekrar gönderilir', async () => {
    const service = makeService(FULL_ENV)
    const start = Date.now()
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(start)
    await service.notifyError('aynı hata mesajı')
    nowSpy.mockReturnValue(start + 61 * 60 * 1000)
    await service.notifyError('aynı hata mesajı')
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('saatte 5 mesajlık global tavan uygulanır ve bastırılanlar sonraki mesaja eklenir', async () => {
    const service = makeService(FULL_ENV)
    const start = Date.now()
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(start)
    for (let i = 0; i < 7; i++) {
      await service.notifyError(`farklı hata ${i}`)
    }
    expect(mockFetch).toHaveBeenCalledTimes(5)

    // pencere sıfırlanınca bastırılan 2 hata yeni mesajda raporlanır
    nowSpy.mockReturnValue(start + 61 * 60 * 1000)
    await service.notifyError('yeni pencere hatası')
    expect(mockFetch).toHaveBeenCalledTimes(6)
    const body = (mockFetch.mock.calls[5][1] as RequestInit).body as string
    expect(body).toContain('yeni pencere hatası')
    expect(body).toContain('2 hata daha bastırıldı')
  })
})

describe('NtfyLogger', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    mockFetch.mockResolvedValue({ ok: true } as Response)
  })

  it('error çağrısını context ile birlikte notifyError\'a iletir', () => {
    const ntfy = { notifyError: jest.fn().mockResolvedValue(undefined) } as unknown as NtfyService
    const logger = new NtfyLogger(ntfy)
    jest.spyOn(console, 'error').mockImplementation(() => {})
    logger.error('bir şeyler patladı', 'ChatService')
    expect(ntfy.notifyError).toHaveBeenCalledWith('❌ [ChatService] bir şeyler patladı')
  })

  it('çok satırlı son parametreyi (stack trace) context saymaz', () => {
    const ntfy = { notifyError: jest.fn().mockResolvedValue(undefined) } as unknown as NtfyService
    const logger = new NtfyLogger(ntfy)
    jest.spyOn(console, 'error').mockImplementation(() => {})
    logger.error('patladı', 'Error: x\n    at foo()')
    expect(ntfy.notifyError).toHaveBeenCalledWith('❌ patladı')
  })
})
