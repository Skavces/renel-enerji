import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { GroqService, GROQ_MODEL } from '../groq/groq.service'

const PARSE_PROMPT = `Sen RenEl Enerji şirketinin web sitesi için Instagram gönderilerinden proje bilgisi çıkaran bir içerik asistanısın.

Aşağıdaki Instagram gönderisini analiz et ve SADECE şu JSON formatında yanıt ver, başka hiçbir şey yazma:

{
  "name": "Proje adı. Güç değeri varsa başa yaz, sonra sistem tipi. Gerçek örnekler: '10,2 kW Hibrit GES Sistemi', '4 kWp Bağ Evi GES Sistemi', 'Hayvan Çiftliği GES Kurulumu', 'Ahmetli Bağ Sulama Projesi'",
  "location": "Sadece şehir adı (örn: 'Manisa', 'Balıkesir')",
  "kw": 11.25,
"description": "Liste sayfası için 1 cümle. Teknik özellikleri virgülle sırala, sonuna müşteri faydası ekle. Gerçek örnekler: '16 panel, hibrit invertör ve 15,3 kWh LiFePO₄ batarya ile kesintisiz enerji depolama sistemi.' / 'Çatı tipi 4,6 kW GES ve 5 kWh LiFePO₄ batarya ile sağım, havalandırma ve aydınlatmada kesintisiz enerji.'",
  "about": "Detay sayfası için 2-3 cümle. Müşteriye ne kazandırdığını anlat, gönderinin canlı dilini koru. Gerçek örnekler: 'Doğanın içinde, sessizliğin ortasında artık enerji kesintisi yok. 4 kWp güneş enerjisi sistemiyle bu bağ evi şebekeden tamamen bağımsız hale geldi.' / 'Manisa Ahmetli'de bağ alanına kurduğumuz akıllı sistemle tarımsal sulamada enerji maliyetlerini sıfırladık. Çiftçimiz artık telefonundan tek tıkla sulama sistemini yönetiyor.'",
  "specs": ["N Adet XW Marka Panel formatında — örn: '28 Adet 600W Kalyon Güneş Paneli'", "X kW Tip İnvertör — örn: '10,2 kW Hibrit İnvertör'", "X kWh LiFePO₄ Batarya — örn: '15,3 kWh Depolama Kapasitesi'"],
  "highlights": ["Müşteri faydası odaklı kısa maddeler", "Gerçek örnekler: 'Elektrik kesintilerinden etkilenmeyen çalışma'", "'Şebekeden tamamen bağımsız çalışma'", "'DC sistem sayesinde maksimum verim, sıfır dönüşüm kaybı'"],
  "statBoxes": [{"value": "11,25 kWp", "label": "Kurulu Güç"}, {"value": "15 kWh", "label": "Depolama"}, {"value": "18", "label": "Panel"}],
  "date": "2025"
}

Kurallar:
- Sayılarda Türkçe ondalık ayracı kullan: 11,25 kWp (nokta değil virgül) — SADECE kw alanı hariç (JavaScript sayısı: 11.25)
- specs formatı: "N Adet XW Marka Panel", "X kW Tip İnvertör", "X kWh Tip Batarya"
- highlights müşteriye "ne işe yarar" sorusunu yanıtlar, fiil veya isim cümlesi
- statBoxes: value çok kısa (sadece sayı+birim), label açıklayıcı
- Emin olamadığın alanlar için boş string ("") ya da boş dizi ([]) kullan
- Hiçbir alanda markdown kullanma — yıldız (*), çift yıldız (**), alt çizgi (_) kesinlikle yazma`

@Injectable()
export class InstagramParseService {
  constructor(
    private config: ConfigService,
    private groq: GroqService,
  ) {}

  async parseInstagram(text: string): Promise<any> {
    const key1 = this.config.get<string>('GROQ_API_KEY')
    const key2 = this.config.get<string>('GROQ_API_KEY_2')
    if (!key1) throw new InternalServerErrorException('GROQ_API_KEY tanımlı değil')

    const { res, data } = await this.groq.call(key1, key2, {
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: PARSE_PROMPT },
        { role: 'user', content: text },
      ],
      temperature: 0,
    })

    if (!res?.ok) throw new InternalServerErrorException(`Groq API hatası: ${res?.status ?? 'ağ hatası'}`)

    const content = data.choices?.[0]?.message?.content ?? ''
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new InternalServerErrorException('Groq geçersiz yanıt döndürdü')

    try {
      return JSON.parse(jsonMatch[0])
    } catch (err) {
      throw new InternalServerErrorException(
        `JSON parse hatası: ${(err as Error).message}. Ham yanıt: ${jsonMatch[0].slice(0, 200)}`,
      )
    }
  }
}
