import { hasForeignWordLeak, nonLatinLetterRatio } from '../chat-guards'

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
