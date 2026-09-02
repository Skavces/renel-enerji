import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { LlmService, LLM_MODEL } from '../llm/llm.service'
import { ParsedProjectDto } from './dto/parsed-project.dto'
import { errorMessage } from '../common/errors'
import type { ParsedProject } from './instagram-types'

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
  private readonly logger = new Logger(InstagramParseService.name)

  constructor(private llm: LlmService) {}

  async parseInstagram(text: string): Promise<ParsedProject> {
    const keys = this.llm.getKeys('parse')
    if (!keys.length) throw new InternalServerErrorException('LLM_PARSE_KEYS / LLM_API_KEY tanımlı değil')

    const { res, data } = await this.llm.call(keys, {
      model: LLM_MODEL,
      messages: [
        { role: 'system', content: PARSE_PROMPT },
        { role: 'user', content: text },
      ],
      temperature: 0,
    })

    if (!res?.ok) throw new InternalServerErrorException(`LLM API hatası: ${res?.status ?? 'ağ hatası'}`)

    const content = data?.choices?.[0]?.message?.content ?? ''
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new InternalServerErrorException('LLM geçersiz yanıt döndürdü')

    let raw: unknown
    try {
      raw = JSON.parse(jsonMatch[0])
    } catch (err) {
      throw new InternalServerErrorException(
        `JSON parse hatası: ${errorMessage(err)}. Ham yanıt: ${jsonMatch[0].slice(0, 200)}`,
      )
    }

    // `as ParsedProject` bir İDDİA'ydı, kontrol değil: model ne döndürürse
    // döndürsün doğrudan DB'ye gidiyordu (instagram-import manager.save ile
    // yazdığı için CreateProjectDto'nun ValidationPipe'ı bu yolda çalışmıyor).
    // Şema doğrulaması burada, çünkü hem IG sync hem de admin panelindeki
    // parse butonu aynı metottan geçiyor.
    //
    // whitelist:true ama forbidNonWhitelisted YOK (global pipe'ın aksine):
    // modelin uydurduğu fazladan anahtar sessizce düşürülür, postun tamamı
    // reddedilmez. Bilinen alanların tipinde katıyız, bilinmeyenlerin varlığında değil.
    const dto = plainToInstance(ParsedProjectDto, raw)
    const errors = await validate(dto, { whitelist: true })

    // Geçersiz alanlar DÜŞÜRÜLÜR, gönderi kurtarılır. Proje zaten published:false
    // taslak olarak kaydediliyor (4.3) ve admin yayınlamadan önce inceliyor —
    // yani eksik alan beklenen durum, importu tamamen kaybetmekten iyi.
    // Import servisi her alanı `parsed.x || default` ile dolduruyor, o yüzden
    // düşen alan aşağı akışta güvenli.
    if (errors.length) {
      for (const err of errors) Reflect.deleteProperty(dto, err.property)
      this.logger.warn(
        `LLM çıktısında geçersiz alanlar düşürüldü (${errors.map(e => e.property).join(', ')}). ` +
        `Ham yanıt: ${jsonMatch[0].slice(0, 200)}`,
      )
    }

    // Tek istisna: name olmadan anlamlı proje üretilemez — slug ondan türüyor
    // (toSlug('') -> 'proje', 'proje-1', 'proje-2'... çöp kayıtlar doğar).
    // Bu durumda gönderi atlanır; sync döngüsündeki mevcut catch yakalar.
    if (!dto.name) {
      throw new InternalServerErrorException(
        `LLM çıktısında kullanılabilir 'name' yok. Ham yanıt: ${jsonMatch[0].slice(0, 200)}`,
      )
    }
    return dto
  }
}
