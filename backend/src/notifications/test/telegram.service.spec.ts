import { ConfigService } from '@nestjs/config'
import { TelegramService } from '../telegram.service'
import { TelegramLogger } from '../telegram-logger.service'
import { fetchWithTimeout } from '../../common/fetch-with-timeout'

jest.mock('../../common/fetch-with-timeout')

const mockFetch = fetchWithTimeout as jest.MockedFunction<typeof fetchWithTimeout>

function makeService(env: Record<string, string> = {}): TelegramService {
  const config = { get: (key: string) => env[key] } as unknown as ConfigService
  return new TelegramService(config)
}

const FULL_ENV = { TELEGRAM_BOT_TOKEN: 'test-token', TELEGRAM_CHAT_ID: '12345' }

describe('TelegramService', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    mockFetch.mockReset()
    mockFetch.mockResolvedValue({ ok: true } as Response)
  })

  it('token tanımlı değilse fetch çağrılmaz', async () => {
    const service = makeService({})
    await service.send('merhaba')
    await service.notifyError('hata')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('chat id tanımlı değilse fetch çağrılmaz', async () => {
    const service = makeService({ TELEGRAM_BOT_TOKEN: 'test-token' })
    await service.send('merhaba')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('send doğru URL ve body ile POST atar', async () => {
    const service = makeService(FULL_ENV)
    await service.send('merhaba dünya')
    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toBe('https://api.telegram.org/bottest-token/sendMessage')
    expect(JSON.parse((options as RequestInit).body as string)).toEqual({
      chat_id: '12345',
      text: 'merhaba dünya',
    })
  })

  it('4096 karakterden uzun mesajı kırpar', async () => {
    const service = makeService(FULL_ENV)
    await service.send('a'.repeat(5000))
    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
    expect(body.text).toHaveLength(4096)
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
    const body = JSON.parse((mockFetch.mock.calls[5][1] as RequestInit).body as string)
    expect(body.text).toContain('yeni pencere hatası')
    expect(body.text).toContain('2 hata daha bastırıldı')
  })
})

describe('TelegramLogger', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    mockFetch.mockResolvedValue({ ok: true } as Response)
  })

  it('error çağrısını context ile birlikte notifyError\'a iletir', () => {
    const telegram = { notifyError: jest.fn().mockResolvedValue(undefined) } as unknown as TelegramService
    const logger = new TelegramLogger(telegram)
    jest.spyOn(console, 'error').mockImplementation(() => {})
    logger.error('bir şeyler patladı', 'ChatService')
    expect(telegram.notifyError).toHaveBeenCalledWith('❌ [ChatService] bir şeyler patladı')
  })

  it('çok satırlı son parametreyi (stack trace) context saymaz', () => {
    const telegram = { notifyError: jest.fn().mockResolvedValue(undefined) } as unknown as TelegramService
    const logger = new TelegramLogger(telegram)
    jest.spyOn(console, 'error').mockImplementation(() => {})
    logger.error('patladı', 'Error: x\n    at foo()')
    expect(telegram.notifyError).toHaveBeenCalledWith('❌ patladı')
  })
})
