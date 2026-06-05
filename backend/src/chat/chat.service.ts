import { BadRequestException, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const SYSTEM_PROMPT = `Sen RenEl Enerji Mühendislik'in yapay zeka asistanısın. Şirket Soma/Manisa merkezli bir güneş enerjisi mühendislik firmasıdır. Mühendis Mertcan Yılmaz tarafından yönetilmektedir.

Sunduğunuz hizmetler:
- Çatı tipi GES (konut ve ticari binalar)
- Tarımsal sulama GES sistemleri
- EV şarj istasyonları
- Off-grid (şebekeden bağımsız) sistemler
- Hibrit GES sistemleri (bataryalı+şebekeli)
- Depolamalı enerji çözümleri

Görevin: Kullanıcıya sıcak ve samimi sorular sorarak ihtiyacını anla, en uygun sistemi öner. Şu bilgileri topla:
1. Sistem nerede kullanılacak? (ev, işyeri, tarla, çiftlik vb.)
2. Aylık elektrik faturası ya da tahmini tüketim miktarı
3. Şebekeye bağlantı durumu (var mı, yok mu)
4. Bütçe aralığı (opsiyonel, sormak zorunda değilsin)

Kurallar:
- Cevaplar kısa ve anlaşılır olsun, uzun paragraflar yazma
- Türkçe konuş, samimi ol
- 2-3 soru sonrası kullanıcıya uygun sistem önerisi yap
- Son olarak gerçek teklif için Mertcan Yılmaz ile iletişime geçmelerini öner: WhatsApp 0554 379 60 04 veya mertcan.yilmaz@renelenerji.com
- Sadece güneş enerjisi ve RenEl hizmetleriyle ilgili konuşma yap, konu dışına çıkma`

@Injectable()
export class ChatService {
  constructor(private config: ConfigService) {}

  async chat(messages: ChatMessage[]): Promise<string> {
    const apiKey = this.config.get<string>('GROQ_API_KEY')
    if (!apiKey) throw new BadRequestException('Chatbot şu anda kullanılamıyor')

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages.slice(-12),
        ],
        max_tokens: 400,
        temperature: 0.7,
      }),
    })

    if (!res.ok) throw new BadRequestException('Yanıt alınamadı, lütfen tekrar deneyin')
    const data = await res.json()
    return data.choices[0].message.content
  }
}
