import { ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ChatService, nonLatinLetterRatio } from '../chat.service'
import { GroqService } from '../../groq/groq.service'

function makeService(replyContent: string): ChatService {
  const config = { get: (key: string) => (key === 'GROQ_API_KEY' ? 'key1' : undefined) }
  const groq = {
    call: jest.fn().mockResolvedValue({
      res: { ok: true, status: 200 },
      data: { choices: [{ message: { content: replyContent } }] },
    }),
  }
  return new ChatService(config as unknown as ConfigService, groq as unknown as GroqService)
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

describe('ChatService — non-Turkish output guard', () => {
  it('returns Groq reply unchanged when Turkish', async () => {
    const service = makeService('Çatı GES için aylık faturanız nedir?')
    await expect(service.chat(MESSAGES)).resolves.toBe('Çatı GES için aylık faturanız nedir?')
  })

  it('replaces non-Latin chat reply with fixed Turkish message', async () => {
    const service = makeService('Солнечная энергия очень выгодна для вашего дома')
    const reply = await service.chat(MESSAGES)
    expect(reply).toBe('Üzgünüm, yanıt oluşturulurken bir sorun yaşandı. Sorunuzu tekrar yazar mısınız?')
  })

  it('throws 503 for non-Latin summary so frontend falls back to plain WhatsApp link', async () => {
    const service = makeService('Здравствуйте, я использовал систему консультаций')
    await expect(service.generateSummary(MESSAGES)).rejects.toThrow(ServiceUnavailableException)
  })
})
