import { ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  BUDGET_EXCEEDED_MESSAGE,
  ChatService,
  hasForeignWordLeak,
  nonLatinLetterRatio,
} from '../chat.service'
import { GroqService } from '../../groq/groq.service'

function makeService(...replies: string[]): { service: ChatService; call: jest.Mock } {
  const config = { get: (key: string) => (key === 'GROQ_API_KEY' ? 'key1' : undefined) }
  const call = jest.fn()
  for (const reply of replies) {
    call.mockResolvedValueOnce({
      res: { ok: true, status: 200 },
      data: { choices: [{ message: { content: reply } }] },
    })
  }
  const groq = { call }
  return {
    service: new ChatService(
      config as unknown as ConfigService,
      groq as unknown as GroqService,
      // Varsayılan: bütçe sayacı hep izin verir; bütçe testleri withRedis ile ezer
      { incr: jest.fn().mockResolvedValue(1), expire: jest.fn() } as unknown as import('ioredis').Redis,
    ),
    call,
  }
}

const MESSAGES = [{ role: 'user' as const, content: 'merhaba' }]

describe('nonLatinLetterRatio', () => {
  it('is low for Turkish text with special characters', () => {
    expect(nonLatinLetterRatio('Güneş enerjisi çok avantajlı; ışığı öğütür müyüz?')).toBe(0)
  })

  it('is high for Cyrillic and CJK text', () => {
    expect(nonLatinLetterRatio('Солнечная энергия очень выгодна')).toBeGreaterThan(0.9)
    expect(nonLatinLetterRatio('太阳能非常有利')).toBeGreaterThan(0.9)
  })

  it('ignores digits and punctuation', () => {
    expect(nonLatinLetterRatio('10 kW sistem: 250.000 TL!')).toBe(0)
    expect(nonLatinLetterRatio('123 !?')).toBe(0)
  })

  it('flags mixed text once non-Latin dominates', () => {
    expect(nonLatinLetterRatio('fiyat цена стоимость сколько это будет')).toBeGreaterThan(0.3)
  })
})

describe('hasForeignWordLeak', () => {
  it('is false for clean Turkish replies', () => {
    expect(hasForeignWordLeak('Çatı GES için aylık elektrik faturanız nedir?')).toBe(false)
    expect(hasForeignWordLeak('Teşekkürler, gerekli bilgileri aldım.')).toBe(false)
  })

  it('allows whitelisted brand/unit terms', () => {
    expect(hasForeignWordLeak("Aşağıdaki WhatsApp'tan Teklif Al butonuna basın.")).toBe(false)
    expect(hasForeignWordLeak('10 kWp sistem yıllık 15.000 kWh üretir; off-grid de mümkün.')).toBe(false)
  })

  it('catches common English words', () => {
    expect(hasForeignWordLeak('Çatı GES için monthly elektrik faturanız nedir?')).toBe(true)
  })

  it('catches English words glued to Turkish words', () => {
    expect(hasForeignWordLeak('Bilgi almak içinmonthly elektrik faturanız nedir?')).toBe(true)
  })

  it('catches words with q/w/x letters', () => {
    expect(hasForeignWordLeak('Sistem kurulumu için planladığınız yer tentang wattage nedir?')).toBe(true)
    expect(hasForeignWordLeak('Fiyat quotation için bilgi verin.')).toBe(true)
  })

  it('does not flag Turkish homographs of English words', () => {
    expect(hasForeignWordLeak('On kişilik ekibimiz her an hazır; bu bölgeye has bir çözüm.')).toBe(false)
  })
})

describe('ChatService — non-Turkish output guard', () => {
  it('returns Groq reply unchanged when Turkish', async () => {
    const { service } = makeService('Çatı GES için aylık faturanız nedir?')
    await expect(service.chat(MESSAGES)).resolves.toBe('Çatı GES için aylık faturanız nedir?')
  })

  it('regenerates once when reply leaks foreign words, then returns the clean retry', async () => {
    const { service, call } = makeService(
      'Çatı GES için monthly elektrik faturanız nedir?',
      'Çatı GES için aylık elektrik faturanız nedir?',
    )
    await expect(service.chat(MESSAGES)).resolves.toBe('Çatı GES için aylık elektrik faturanız nedir?')
    expect(call).toHaveBeenCalledTimes(2)
  })

  it('falls back to fixed Turkish message when the retry also leaks', async () => {
    const { service, call } = makeService(
      'Bilgi almak içinmonthly elektrik faturanız nedir?',
      'Kurulum yeriniz about bir konut çatısı mı?',
    )
    const reply = await service.chat(MESSAGES)
    expect(reply).toBe('Üzgünüm, yanıt oluşturulurken bir sorun yaşandı. Sorunuzu tekrar yazar mısınız?')
    expect(call).toHaveBeenCalledTimes(2)
  })

  it('replaces non-Latin chat reply with fixed Turkish message after retry', async () => {
    const { service } = makeService(
      'Солнечная энергия очень выгодна для вашего дома',
      'Солнечная энергия очень выгодна для вашего дома',
    )
    const reply = await service.chat(MESSAGES)
    expect(reply).toBe('Üzgünüm, yanıt oluşturulurken bir sorun yaşandı. Sorunuzu tekrar yazar mısınız?')
  })

  it('throws 503 for non-Latin summary so frontend falls back to plain WhatsApp link', async () => {
    const { service } = makeService('Здравствуйте, я использовал систему консультаций')
    await expect(service.generateSummary(MESSAGES)).rejects.toThrow(ServiceUnavailableException)
  })
})

describe('ChatService — Groq günlük bütçe devre kesici', () => {
  function withRedis(
    service: ChatService,
    incrResult: number | Error,
  ): { incr: jest.Mock; expire: jest.Mock } {
    const incr =
      incrResult instanceof Error
        ? jest.fn().mockRejectedValue(incrResult)
        : jest.fn().mockResolvedValue(incrResult)
    const redis = { incr, expire: jest.fn().mockResolvedValue(1) }
    ;(service as unknown as { redis: unknown }).redis = redis
    return redis
  }

  it('returns the fixed message without calling Groq when the daily budget is exceeded', async () => {
    const { service, call } = makeService('kullanılmayacak yanıt')
    withRedis(service, 1001) // varsayılan limit 1000

    await expect(service.chat(MESSAGES)).resolves.toBe(BUDGET_EXCEEDED_MESSAGE)
    expect(call).not.toHaveBeenCalled()
  })

  it('allows the request and sets a TTL on the first increment of the day', async () => {
    const { service } = makeService('Çatı GES için aylık faturanız nedir?')
    const redis = withRedis(service, 1)

    await expect(service.chat(MESSAGES)).resolves.toBe('Çatı GES için aylık faturanız nedir?')
    expect(redis.incr).toHaveBeenCalledWith(expect.stringMatching(/^groq:daily:\d{4}-\d{2}-\d{2}$/))
    expect(redis.expire).toHaveBeenCalledTimes(1)
  })

  it('fails open when Redis is unreachable', async () => {
    const { service } = makeService('Çatı GES için aylık faturanız nedir?')
    withRedis(service, new Error('connection refused'))

    await expect(service.chat(MESSAGES)).resolves.toBe('Çatı GES için aylık faturanız nedir?')
  })

  it('throws 503 for summary when the budget is exceeded (frontend falls back to wa.me)', async () => {
    const { service, call } = makeService('kullanılmayacak özet')
    withRedis(service, 1001)

    await expect(service.generateSummary(MESSAGES)).rejects.toThrow(ServiceUnavailableException)
    expect(call).not.toHaveBeenCalled()
  })
})
