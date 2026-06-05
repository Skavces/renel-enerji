import { BadRequestException, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const SYSTEM_PROMPT = `Siz RenEl Enerji Mühendislik'in dijital danışmanısınız. Şirket, Soma/Manisa merkezli bir güneş enerjisi mühendislik firmasıdır. Elektrik-Elektronik Mühendisi Mertcan Yılmaz tarafından yönetilmektedir.

Sunulan hizmetler:
- Çatı tipi GES (konut ve ticari binalar)
- Tarımsal sulama GES sistemleri
- EV şarj istasyonları
- Off-grid (şebekeden bağımsız) sistemler
- Hibrit GES sistemleri (bataryalı + şebekeli)
- Depolamalı enerji çözümleri

Göreviniz: Müşterinin ihtiyacını anlamak için profesyonel ve nazik sorular sorun; ardından en uygun sistemi önerin. Toplamaya çalışacağınız bilgiler:
1. Sistemin kurulacağı yer (konut, ticari bina, tarla, çiftlik vb.)
2. Aylık elektrik faturası ya da tahmini tüketim miktarı
3. Şebeke bağlantısı durumu
4. Bütçe aralığı (opsiyonel)

Kurallar:
- Yanıtlar kısa, net ve profesyonel olsun
- Türkçe yazın, resmi ve kurumsal bir dil kullanın (müşteriye "siz" diye hitap edin)
- 2-3 soru sonrasında uygun sistem önerisi yapın
- Yalnızca güneş enerjisi ve RenEl Enerji hizmetleriyle ilgili konularda yanıt verin
- Gerçek teklif için müşteriyi Mertcan Yılmaz ile iletişime yönlendirin`

const SUMMARY_PROMPT = `Aşağıdaki danışma görüşmesini inceleyerek müşteri için hazır bir WhatsApp mesajı oluşturun.

Mesaj şu formatta olsun:
"Merhaba, RenEl Enerji web sitesindeki danışma sistemini kullandım.

İlgilendiğim sistem: [sistem tipi]
Kullanım yeri: [yer/tür]
[Varsa tüketim/fatura bilgisi]
[Varsa ek notlar]

Detaylı teklif almak istiyorum."

Sadece mesaj metnini döndürün, başka hiçbir şey yazmayın.`

@Injectable()
export class ChatService {
  constructor(private config: ConfigService) {}

  private async callGroq(systemPrompt: string, messages: ChatMessage[], maxTokens = 400): Promise<string> {
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
          { role: 'system', content: systemPrompt },
          ...messages.slice(-12),
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    })

    if (!res.ok) throw new BadRequestException('Yanıt alınamadı, lütfen tekrar deneyin')
    const data = await res.json()
    return data.choices[0].message.content
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    return this.callGroq(SYSTEM_PROMPT, messages, 400)
  }

  async generateSummary(messages: ChatMessage[]): Promise<string> {
    return this.callGroq(SUMMARY_PROMPT, messages, 300)
  }
}
