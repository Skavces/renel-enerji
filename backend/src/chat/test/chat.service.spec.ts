import { ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { BUDGET_EXCEEDED_MESSAGE, ChatService } from '../chat.service'
import { JUDGE_SYSTEM_PROMPT, judgeUserMessage, RETRY_NUDGE } from '../chat-prompts'
import { GroqService } from '../../groq/groq.service'

type GroqPayload = { messages: { role: string; content: string }[] } & Record<string, unknown>

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

  const isJudgePayload = (payload: GroqPayload): boolean =>
    payload.messages[0]?.content === JUDGE_SYSTEM_PROMPT

  const call = jest.fn((_keys: string[], payload: GroqPayload) => {
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

  const groq = { call, getKeys: jest.fn().mockReturnValue(['key1']) }
  return {
    service: new ChatService(
      config as unknown as ConfigService,
      groq as unknown as GroqService,
      // Varsayılan: bütçe sayacı hep izin verir; bütçe testleri withRedis ile ezer
      { incr: jest.fn().mockResolvedValue(1), expire: jest.fn() } as unknown as import('ioredis').Redis,
    ),
    call,
    judgeCallCount: () =>
      call.mock.calls.filter(args => isJudgePayload(args[1] as GroqPayload)).length,
    setJudgeVerdicts: (...verdicts: (string | null)[]) => judgeQueue.push(...verdicts),
  }
}

const MESSAGES = [{ role: 'user' as const, content: 'merhaba' }]

describe('ChatService — non-Turkish output guard', () => {
  it('returns Groq reply unchanged when Turkish', async () => {
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
    const systemOf = (i: number) => (call.mock.calls[i][1] as GroqPayload).messages[0].content
    expect(systemOf(0)).not.toContain(RETRY_NUDGE)
    expect(systemOf(1)).toContain(RETRY_NUDGE)
  })

  it('falls back to fixed Turkish message when the retry also leaks', async () => {
    const { service, call, judgeCallCount } = makeService(
      'Bilgi almak içinmonthly elektrik faturanız nedir?',
      'Kurulum yeriniz about bir konut çatısı mı?',
    )
    const reply = await service.chat(MESSAGES)
    expect(reply).toBe('Üzgünüm, yanıt oluşturulurken bir sorun yaşandı. Sorunuzu tekrar yazar mısınız?')
    // iki yanıt da deterministik kirli: judge hiç çağrılmaz
    expect(call).toHaveBeenCalledTimes(2)
    expect(judgeCallCount()).toBe(0)
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

  it('falls back to the fixed message when the judge rejects both attempts', async () => {
    const { service, call, setJudgeVerdicts } = makeService('İlk yanıt', 'İkinci yanıt')
    setJudgeVerdicts('HAYIR', 'HAYIR')
    const reply = await service.chat(MESSAGES)
    expect(reply).toBe('Üzgünüm, yanıt oluşturulurken bir sorun yaşandı. Sorunuzu tekrar yazar mısınız?')
    expect(call).toHaveBeenCalledTimes(4)
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
      args => (args[1] as GroqPayload).messages[0]?.content === JUDGE_SYSTEM_PROMPT,
    )
    expect((judgeCall?.[1] as GroqPayload).messages[1].content).toBe(
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
    const { service, judgeCallCount } = makeService('Çatı GES için aylık faturanız nedir?')
    const redis = withRedis(service, 1)

    await expect(service.chat(MESSAGES)).resolves.toBe('Çatı GES için aylık faturanız nedir?')
    expect(redis.incr).toHaveBeenCalledWith(expect.stringMatching(/^groq:daily:\d{4}-\d{2}-\d{2}$/))
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
