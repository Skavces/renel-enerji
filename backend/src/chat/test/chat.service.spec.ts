import { ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { BUDGET_EXCEEDED_MESSAGE, ChatService } from '../chat.service'
import { JUDGE_SYSTEM_PROMPT, judgeUserMessage, PRICING_EXTRACTION_PROMPT, RETRY_NUDGE } from '../chat-prompts'
import { LlmService } from '../../llm/llm.service'

type LlmPayload = { messages: { role: string; content: string }[] } & Record<string, unknown>

interface TestService {
  service: ChatService
  call: jest.Mock
  // Judge çağrıları payload'daki JUDGE_SYSTEM_PROMPT üzerinden ayırt edilir
  judgeCallCount: () => number
  // Sıradaki judge kararlarını kuyruğa ekler; null = ağ hatası. Kuyruk boşsa EVET.
  setJudgeVerdicts: (...verdicts: (string | null)[]) => void
}

function makeService(...replies: string[]): TestService {
  const config = { get: () => undefined }
  const genQueue = [...replies]
  const judgeQueue: (string | null)[] = []

  const isJudgePayload = (payload: LlmPayload): boolean =>
    payload.messages[0]?.content === JUDGE_SYSTEM_PROMPT

  const call = jest.fn((_keys: string[], payload: LlmPayload) => {
    if (isJudgePayload(payload)) {
      const verdict = judgeQueue.length ? judgeQueue.shift() : 'EVET'
      if (verdict == null) return Promise.resolve({ res: null, data: null })
      return Promise.resolve({
        res: { ok: true, status: 200 },
        data: { choices: [{ message: { content: verdict } }] },
      })
    }
    return Promise.resolve({
      res: { ok: true, status: 200 },
      data: { choices: [{ message: { content: genQueue.shift() } }] },
    })
  })

  const llm = { call, getKeys: jest.fn().mockReturnValue(['key1']) }
  return {
    service: new ChatService(
      config as unknown as ConfigService,
      llm as unknown as LlmService,
      // Varsayılan: bütçe sayacı hep izin verir; bütçe testleri withRedis ile ezer
      { incr: jest.fn().mockResolvedValue(1), expire: jest.fn() } as unknown as import('ioredis').Redis,
    ),
    call,
    judgeCallCount: () =>
      call.mock.calls.filter(args => isJudgePayload(args[1] as LlmPayload)).length,
    setJudgeVerdicts: (...verdicts: (string | null)[]) => judgeQueue.push(...verdicts),
  }
}

const MESSAGES = [{ role: 'user' as const, content: 'merhaba' }]

describe('ChatService — non-Turkish output guard', () => {
  it('returns LLM reply unchanged when Turkish', async () => {
    const { service, call, judgeCallCount } = makeService('Çatı GES için aylık faturanız nedir?')
    await expect(service.chat(MESSAGES)).resolves.toBe('Çatı GES için aylık faturanız nedir?')
    // temiz yol: 1 üretim + 1 judge
    expect(call).toHaveBeenCalledTimes(2)
    expect(judgeCallCount()).toBe(1)
  })

  it('regenerates once when reply leaks foreign words, then returns the clean retry', async () => {
    const { service, call, judgeCallCount } = makeService(
      'Çatı GES için monthly elektrik faturanız nedir?',
      'Çatı GES için aylık elektrik faturanız nedir?',
    )
    await expect(service.chat(MESSAGES)).resolves.toBe('Çatı GES için aylık elektrik faturanız nedir?')
    // kirli ilk yanıtta judge atlanır: üretim + üretim + judge
    expect(call).toHaveBeenCalledTimes(3)
    expect(judgeCallCount()).toBe(1)
    // ilk üretim nudge'sız, retry düzeltici talimatla yapılır
    const systemOf = (i: number) => (call.mock.calls[i][1] as LlmPayload).messages[0].content
    expect(systemOf(0)).not.toContain(RETRY_NUDGE)
    expect(systemOf(1)).toContain(RETRY_NUDGE)
  })

  it('regenerates a second time when the retry also leaks, then returns the clean third attempt', async () => {
    const { service, call, judgeCallCount } = makeService(
      'Çatı GES için monthly elektrik faturanız nedir?',
      'Kurulum yeriniz about bir konut çatısı mı?',
      'Kurulum yeriniz konut çatısı mı?',
    )
    await expect(service.chat(MESSAGES)).resolves.toBe('Kurulum yeriniz konut çatısı mı?')
    // ilk iki yanıt deterministik kirli (judge atlanır), üçüncüde judge çağrılır
    expect(call).toHaveBeenCalledTimes(4)
    expect(judgeCallCount()).toBe(1)
  })

  it('falls back to fixed Turkish message when all attempts leak', async () => {
    const { service, call, judgeCallCount } = makeService(
      'Bilgi almak içinmonthly elektrik faturanız nedir?',
      'Kurulum yeriniz about bir konut çatısı mı?',
      'Fiyat için cost bilgisi paylaşır mısınız?',
    )
    const reply = await service.chat(MESSAGES)
    expect(reply).toBe('Üzgünüm, yanıt oluşturulurken bir sorun yaşandı. Sorunuzu tekrar yazar mısınız?')
    // üç yanıt da deterministik kirli: judge hiç çağrılmaz
    expect(call).toHaveBeenCalledTimes(3)
    expect(judgeCallCount()).toBe(0)
  })

  it('replaces non-Latin chat reply with fixed Turkish message after all retries', async () => {
    const { service } = makeService(
      'Солнечная энергия очень выгодна для вашего дома',
      'Солнечная энергия очень выгодна для вашего дома',
      'Солнечная энергия очень выгодна для вашего дома',
    )
    const reply = await service.chat(MESSAGES)
    expect(reply).toBe('Üzgünüm, yanıt oluşturulurken bir sorun yaşandı. Sorunuzu tekrar yazar mısınız?')
  })

  it('throws 503 for non-Latin summary so frontend falls back to plain WhatsApp link', async () => {
    const { service, judgeCallCount } = makeService('Здравствуйте, я использовал систему консультаций')
    await expect(service.generateSummary(MESSAGES)).rejects.toThrow(ServiceUnavailableException)
    // alfabe kontrolü kısa devre yapar, judge'a gidilmez
    expect(judgeCallCount()).toBe(0)
  })
})

describe('ChatService — LLM dil denetçisi (judge)', () => {
  it('regenerates when the judge rejects a heuristically clean reply', async () => {
    const { service, call, setJudgeVerdicts } = makeService(
      'Selamlar, size nasıl yardımcı olabilirim acaba efendim?',
      'Çatı GES için aylık faturanız nedir?',
    )
    setJudgeVerdicts('HAYIR', 'EVET')
    await expect(service.chat(MESSAGES)).resolves.toBe('Çatı GES için aylık faturanız nedir?')
    // üretim + judge(HAYIR) + üretim + judge(EVET)
    expect(call).toHaveBeenCalledTimes(4)
  })

  it('falls back to the fixed message when the judge rejects all attempts', async () => {
    const { service, call, setJudgeVerdicts } = makeService('İlk yanıt', 'İkinci yanıt', 'Üçüncü yanıt')
    setJudgeVerdicts('HAYIR', 'HAYIR', 'HAYIR')
    const reply = await service.chat(MESSAGES)
    expect(reply).toBe('Üzgünüm, yanıt oluşturulurken bir sorun yaşandı. Sorunuzu tekrar yazar mısınız?')
    // üç üretim + üç judge
    expect(call).toHaveBeenCalledTimes(6)
  })

  it('fails open when the judge is unreachable', async () => {
    const { service, setJudgeVerdicts } = makeService('Çatı GES için aylık faturanız nedir?')
    setJudgeVerdicts(null) // ağ hatası
    await expect(service.chat(MESSAGES)).resolves.toBe('Çatı GES için aylık faturanız nedir?')
  })

  it('fails open on an unexpected judge verdict', async () => {
    const { service, setJudgeVerdicts } = makeService('Çatı GES için aylık faturanız nedir?')
    setJudgeVerdicts('BELKİ')
    await expect(service.chat(MESSAGES)).resolves.toBe('Çatı GES için aylık faturanız nedir?')
  })

  it('wraps the evaluated text in the METİN/KARAR template for the judge', async () => {
    const { service, call } = makeService('Çatı GES için aylık faturanız nedir?')
    await service.chat(MESSAGES)
    const judgeCall = call.mock.calls.find(
      args => (args[1] as LlmPayload).messages[0]?.content === JUDGE_SYSTEM_PROMPT,
    )
    expect((judgeCall?.[1] as LlmPayload).messages[1].content).toBe(
      judgeUserMessage('Çatı GES için aylık faturanız nedir?'),
    )
  })

  it('rejects when HAYIR is embedded in a decorated verdict ("Karar: HAYIR")', async () => {
    const { service, setJudgeVerdicts } = makeService('İlk yanıt', 'Çatı GES için aylık faturanız nedir?')
    setJudgeVerdicts('Karar: HAYIR', 'EVET')
    await expect(service.chat(MESSAGES)).resolves.toBe('Çatı GES için aylık faturanız nedir?')
  })

  it('fails open when the judge echoes the text instead of answering (canlı 2026-07-17)', async () => {
    const { service, setJudgeVerdicts } = makeService('Çatı GES için aylık faturanız nedir?')
    setJudgeVerdicts('Çatı tipi')
    await expect(service.chat(MESSAGES)).resolves.toBe('Çatı GES için aylık faturanız nedir?')
  })

  it('rejects a summary when the judge says HAYIR', async () => {
    const { service, setJudgeVerdicts } = makeService('Merhaba, teklif almak istiyorum.')
    setJudgeVerdicts('HAYIR')
    await expect(service.generateSummary(MESSAGES)).rejects.toThrow(ServiceUnavailableException)
  })

  it('returns the summary when the judge approves', async () => {
    const { service, judgeCallCount } = makeService('Merhaba, teklif almak istiyorum.')
    await expect(service.generateSummary(MESSAGES)).resolves.toBe('Merhaba, teklif almak istiyorum.')
    expect(judgeCallCount()).toBe(1)
  })
})

describe('ChatService — LLM günlük bütçe devre kesici', () => {
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

  it('returns the fixed message without calling LLM when the daily budget is exceeded', async () => {
    const { service, call } = makeService('kullanılmayacak yanıt')
    withRedis(service, 1001) // varsayılan limit 1000

    await expect(service.chat(MESSAGES)).resolves.toBe(BUDGET_EXCEEDED_MESSAGE)
    expect(call).not.toHaveBeenCalled()
  })

  it('allows the request and sets a TTL on the first increment of the day', async () => {
    const { service, judgeCallCount } = makeService('Çatı GES için aylık faturanız nedir?')
    const redis = withRedis(service, 1)

    await expect(service.chat(MESSAGES)).resolves.toBe('Çatı GES için aylık faturanız nedir?')
    expect(redis.incr).toHaveBeenCalledWith(expect.stringMatching(/^llm:daily:\d{4}-\d{2}-\d{2}$/))
    expect(redis.expire).toHaveBeenCalledTimes(1)
    // judge bütçe sayacını TÜKETMEZ: 1 üretim + 1 judge'a rağmen incr 1 kez çağrılır
    expect(judgeCallCount()).toBe(1)
    expect(redis.incr).toHaveBeenCalledTimes(1)
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

describe('ChatService — fiyat çıkarımı (pricing)', () => {
  function makePricingService(options: {
    genReplies?: string[]
    // undefined = extraction hiç çağrılmayacağı testlerde kullanılmaz; null = ağ hatası
    pricingContent?: string | null
    judgeVerdict?: string
  }): { service: ChatService; call: jest.Mock; incr: jest.Mock } {
    const genQueue = [...(options.genReplies ?? [])]
    const isPricingPayload = (payload: LlmPayload): boolean =>
      payload.messages[0]?.content === PRICING_EXTRACTION_PROMPT
    const isJudgePayload = (payload: LlmPayload): boolean =>
      payload.messages[0]?.content === JUDGE_SYSTEM_PROMPT

    const call = jest.fn((_keys: string[], payload: LlmPayload) => {
      if (isPricingPayload(payload)) {
        if (options.pricingContent === null) return Promise.resolve({ res: null, data: null })
        return Promise.resolve({
          res: { ok: true, status: 200 },
          data: { choices: [{ message: { content: options.pricingContent } }] },
        })
      }
      if (isJudgePayload(payload)) {
        return Promise.resolve({
          res: { ok: true, status: 200 },
          data: { choices: [{ message: { content: options.judgeVerdict ?? 'EVET' } }] },
        })
      }
      return Promise.resolve({
        res: { ok: true, status: 200 },
        data: { choices: [{ message: { content: genQueue.shift() } }] },
      })
    })

    const llm = { call, getKeys: jest.fn().mockReturnValue(['key1']) }
    const config = { get: () => undefined }
    const incr = jest.fn().mockResolvedValue(1)
    return {
      service: new ChatService(
        config as unknown as ConfigService,
        llm as unknown as LlmService,
        { incr, expire: jest.fn() } as unknown as import('ioredis').Redis,
      ),
      call,
      incr,
    }
  }

  const PRICE_MESSAGE = [{ role: 'user' as const, content: 'çatı ges için fiyat ne kadar, faturam 3200 TL' }]
  const NON_PRICE_MESSAGE = [{ role: 'user' as const, content: 'merhaba, bilgi almak istiyorum' }]

  it('does not call pricing extraction when the user did not ask about price', async () => {
    const { service, call } = makePricingService({ genReplies: ['Kurulum yeriniz neresi?'] })
    await service.chat(NON_PRICE_MESSAGE)
    // yalnızca üretim + judge; pricing extraction hiç çağrılmaz
    expect(call).toHaveBeenCalledTimes(2)
  })

  it('detects price intent from an earlier turn even when the latest reply is just a bare number (canlıda görülen boşluk, 2026-09-02)', async () => {
    const { service, call } = makePricingService({
      pricingContent: JSON.stringify({ kategori: 'cati_konut', aylikFatura: 3200 }),
    })
    const conversation = [
      { role: 'user' as const, content: 'çatı ges yaptırmak istiyorum, fiyatı ne kadar tutar' },
      { role: 'assistant' as const, content: 'Aylık elektrik faturanız ne kadar?' },
      { role: 'user' as const, content: '3200 TL civarı' },
    ]
    const reply = await service.chat(conversation)
    expect(reply).toContain('200.000 - 330.000 TL')
    expect(call).toHaveBeenCalledTimes(1)
  })

  it('returns the deterministic quote and skips generation entirely when extraction resolves', async () => {
    const { service, call } = makePricingService({
      pricingContent: JSON.stringify({ kategori: 'cati_konut', aylikFatura: 3200 }),
    })
    const reply = await service.chat(PRICE_MESSAGE)
    expect(reply).toContain('200.000 - 330.000 TL')
    expect(reply).toContain("WhatsApp'tan Teklif Al")
    // yalnızca 1 çağrı: pricing extraction; üretim/judge hiç çağrılmaz
    expect(call).toHaveBeenCalledTimes(1)
  })

  it('falls back to the normal LLM flow when the category is "yok"', async () => {
    const { service, call } = makePricingService({
      pricingContent: JSON.stringify({ kategori: 'yok' }),
      genReplies: ['Hangi tür GES ile ilgileniyorsunuz?'],
    })
    const reply = await service.chat(PRICE_MESSAGE)
    expect(reply).toBe('Hangi tür GES ile ilgileniyorsunuz?')
    // pricing extraction + üretim + judge
    expect(call).toHaveBeenCalledTimes(3)
  })

  it('falls back to the normal LLM flow when the required field is missing (band unresolved)', async () => {
    const { service } = makePricingService({
      pricingContent: JSON.stringify({ kategori: 'cati_konut' }), // aylikFatura yok
      genReplies: ['Aylık faturanız ne kadar?'],
    })
    await expect(service.chat(PRICE_MESSAGE)).resolves.toBe('Aylık faturanız ne kadar?')
  })

  it('falls back to the normal LLM flow when the extracted amount is out of every band', async () => {
    const { service } = makePricingService({
      pricingContent: JSON.stringify({ kategori: 'cati_konut', aylikFatura: 50_000 }),
      genReplies: ['Bu tür sistemler için keşif gerekiyor.'],
    })
    await expect(service.chat(PRICE_MESSAGE)).resolves.toBe('Bu tür sistemler için keşif gerekiyor.')
  })

  it('falls back to the normal LLM flow when the extraction reply has no JSON object', async () => {
    const { service } = makePricingService({
      pricingContent: 'bozuk yanıt, JSON değil',
      genReplies: ['Hangi tür GES ile ilgileniyorsunuz?'],
    })
    await expect(service.chat(PRICE_MESSAGE)).resolves.toBe('Hangi tür GES ile ilgileniyorsunuz?')
  })

  it('falls back to the normal LLM flow when the extraction call network-fails', async () => {
    const { service } = makePricingService({
      pricingContent: null,
      genReplies: ['Hangi tür GES ile ilgileniyorsunuz?'],
    })
    await expect(service.chat(PRICE_MESSAGE)).resolves.toBe('Hangi tür GES ile ilgileniyorsunuz?')
  })

  it('drops an invalid field but keeps a resolvable quote from the remaining valid fields', async () => {
    const { service } = makePricingService({
      pricingContent: JSON.stringify({ kategori: 'tarimsal_sulama', pompaHp: 10, aylikFatura: 'onbin' }),
    })
    await expect(service.chat(PRICE_MESSAGE)).resolves.toContain('210.000 - 340.000 TL')
  })

  it('skips the pricing extraction call entirely when the price-intent window has no extractable number/hint (canlıda görülen ~17s gecikme, 2026-09-02)', async () => {
    const { service, call } = makePricingService({ genReplies: ['Yaklaşık kaç kW düşünüyorsunuz?'] })
    const conversation = [
      { role: 'user' as const, content: 'bağ evi için fiyat bilgisi alabilir miyim' },
      { role: 'assistant' as const, content: 'İhtiyacınız olan gücü (kW) belirtir misiniz?' },
      { role: 'user' as const, content: 'aydınlatma ve buzdolabı çalıştıracağım' },
    ]
    const reply = await service.chat(conversation)
    expect(reply).toBe('Yaklaşık kaç kW düşünüyorsunuz?')
    // extraction hiç çağrılmaz (hint yok); yalnızca üretim + judge
    expect(call).toHaveBeenCalledTimes(2)
  })

  it('still calls extraction when the only hint is an EV charger type word rather than a digit', async () => {
    const { service, call } = makePricingService({
      pricingContent: JSON.stringify({ kategori: 'ev_sarj', sarjTipi: 'ac_trifaze_11_22' }),
    })
    const conversation = [
      { role: 'user' as const, content: 'ev şarj istasyonu fiyatı ne kadar' },
      { role: 'assistant' as const, content: 'Monofaze mi trifaze mi düşünüyorsunuz?' },
      { role: 'user' as const, content: 'trifaze olsun' },
    ]
    const reply = await service.chat(conversation)
    expect(reply).toContain("WhatsApp'tan Teklif Al")
    expect(call).toHaveBeenCalledTimes(1)
  })

  it('skips extraction and falls straight to the budget-exceeded message when the daily budget is already spent', async () => {
    const { service, call, incr } = makePricingService({ pricingContent: 'unused' })
    incr.mockResolvedValue(1001) // varsayılan limit 1000
    await expect(service.chat(PRICE_MESSAGE)).resolves.toBe(BUDGET_EXCEEDED_MESSAGE)
    expect(call).not.toHaveBeenCalled()
  })
})
