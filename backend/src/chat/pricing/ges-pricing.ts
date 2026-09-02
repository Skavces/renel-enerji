// Chatbot fiyat aralığı hesaplayıcı — tümü saf veri/fonksiyon, I/O yok.
// Kaynak: fiyat-listesi-taslak-2026-08-25.txt (Mertcan onayı; bağ evi bölümü
// 2026-09-02'de güncellendi). Rakamlar RenEl'in gerçek maliyeti değil, piyasa
// taramasından çıkarılmış ORTALAMA aralıklardır — kesin teklif değil.
//
// Deseni frontend/src/lib/gesCalc.ts ile aynı: LLM asla rakam üretmez, yalnızca
// kategori + tek girdiyi (fatura/HP/kW/şarj tipi) çıkarır; rakamı bu modül seçer.

export type PricingCategory = 'cati_konut' | 'tarimsal_sulama' | 'bag_evi' | 'ev_sarj'

export type EvSarjTipi = 'ac_mono_7_4' | 'ac_trifaze_11_22' | 'ac_ticari_22'

export interface PricingInput {
  kategori: PricingCategory
  aylikFatura?: number
  pompaHp?: number
  kw?: number
  sarjTipi?: EvSarjTipi
}

export interface Quote {
  kategori: PricingCategory
  aciklama: string
  minTl: number
  maxTl: number
  not?: string
}

interface Band {
  min: number
  max: number
  minTl: number
  maxTl: number
}

interface CatiKonutBand extends Band {
  kwp: string
}

// Rapordaki çatı/konut tablosunda üst sınır bir sonraki bandın alt sınırıyla
// çakışıyor ("2.500-4.000" ve "4.000-6.000" gibi) — tam sınır değeri (ör. 4.000)
// yalnızca bir banda düşsün diye üst sınır, son bant hariç HARİÇ tutulur.
const CATI_KONUT_BANDS: readonly CatiKonutBand[] = [
  { min: 1500, max: 2500, kwp: '4-5', minTl: 160_000, maxTl: 240_000 },
  { min: 2500, max: 4000, kwp: '5-7', minTl: 200_000, maxTl: 330_000 },
  { min: 4000, max: 6000, kwp: '8-11', minTl: 300_000, maxTl: 480_000 },
  { min: 6000, max: 10_000, kwp: '11-17', minTl: 400_000, maxTl: 700_000 },
]

// Pompa (HP) ve bağ evi (kW) tablolarında bantlar arasında boşluk var (ör. 5 HP
// ile 6 HP ayrı bantlar, aradaki değer yok) — çakışma riski olmadığından alt/üst
// sınır her iki uçta da dahildir.
const TARIMSAL_SULAMA_BANDS: readonly Band[] = [
  { min: 1, max: 5, minTl: 120_000, maxTl: 200_000 },
  { min: 6, max: 10, minTl: 210_000, maxTl: 340_000 },
  { min: 11, max: 15, minTl: 260_000, maxTl: 420_000 },
  { min: 16, max: 20, minTl: 420_000, maxTl: 560_000 },
  { min: 21, max: 30, minTl: 600_000, maxTl: 850_000 },
]

// Mertcan onayı (2026-09-02): temel 1-3 kW, orta 4-6 kW, tam konfor 8-12 kW.
// Orta bandın üst sınırı 6'dan 7'ye genişletildi ki 6-8 arasında boşluk kalmasın
// (rapor metninde bu aralık tanımsızdı); Mertcan isterse tek satırdan düzeltilir.
const BAG_EVI_BANDS: readonly Band[] = [
  { min: 1, max: 3, minTl: 50_000, maxTl: 100_000 },
  { min: 4, max: 7, minTl: 100_000, maxTl: 180_000 },
  { min: 8, max: 12, minTl: 180_000, maxTl: 450_000 },
]

const EV_SARJ_QUOTES: Record<EvSarjTipi, { aciklama: string; minTl: number; maxTl: number }> = {
  ac_mono_7_4: { aciklama: 'AC ev tipi, 7,4 kW (monofaze) şarj istasyonu', minTl: 35_000, maxTl: 70_000 },
  ac_trifaze_11_22: { aciklama: 'AC ev tipi, 11-22 kW (trifaze) şarj istasyonu', minTl: 60_000, maxTl: 120_000 },
  ac_ticari_22: { aciklama: 'AC ticari, 22 kW şarj istasyonu', minTl: 80_000, maxTl: 150_000 },
}

// Tarımsal sulama bandına eklenen hibe hatırlatması — yüzde/oran VERİLMEZ,
// Mertcan bu rakamları henüz onaylamadı (rapor §7, madde 1).
const TARIMSAL_HIBE_NOTU =
  'Bu kategoride IPARD/TKDK kırsal kalkınma hibesi maliyetin önemli bir kısmını karşılayabiliyor; ' +
  'detaylarını WhatsApp görüşmesinde ekibimizden öğrenebilirsiniz.'

function trNum(value: number): string {
  return value.toLocaleString('tr-TR')
}

function findOverlappingBand<T extends Band>(bands: readonly T[], value: number): T | null {
  return (
    bands.find((b, i) => {
      const isLast = i === bands.length - 1
      return value >= b.min && (isLast ? value <= b.max : value < b.max)
    }) ?? null
  )
}

function findClosedBand<T extends Band>(bands: readonly T[], value: number): T | null {
  return bands.find(b => value >= b.min && value <= b.max) ?? null
}

export function resolveQuote(input: PricingInput): Quote | null {
  switch (input.kategori) {
    case 'cati_konut': {
      if (input.aylikFatura == null) return null
      const band = findOverlappingBand(CATI_KONUT_BANDS, input.aylikFatura)
      if (!band) return null
      return {
        kategori: 'cati_konut',
        aciklama: `Aylık ${trNum(input.aylikFatura)} TL faturaya yaklaşık ${band.kwp} kWp'lik bir sistem uygun oluyor`,
        minTl: band.minTl,
        maxTl: band.maxTl,
      }
    }
    case 'tarimsal_sulama': {
      if (input.pompaHp == null) return null
      const band = findClosedBand(TARIMSAL_SULAMA_BANDS, input.pompaHp)
      if (!band) return null
      return {
        kategori: 'tarimsal_sulama',
        aciklama: `${trNum(input.pompaHp)} HP pompa için`,
        minTl: band.minTl,
        maxTl: band.maxTl,
        not: TARIMSAL_HIBE_NOTU,
      }
    }
    case 'bag_evi': {
      if (input.kw == null) return null
      const band = findClosedBand(BAG_EVI_BANDS, input.kw)
      if (!band) return null
      return {
        kategori: 'bag_evi',
        aciklama: `${trNum(input.kw)} kW ihtiyacınıza uygun off-grid bir sistem için`,
        minTl: band.minTl,
        maxTl: band.maxTl,
      }
    }
    case 'ev_sarj': {
      if (!input.sarjTipi) return null
      const quote = EV_SARJ_QUOTES[input.sarjTipi]
      if (!quote) return null
      return { kategori: 'ev_sarj', aciklama: quote.aciklama, minTl: quote.minTl, maxTl: quote.maxTl }
    }
    default:
      return null
  }
}

// KDV bilinçli olarak hiç anılmaz (Mertcan onayı, 2026-09-02): rapor §7 madde 2
// henüz cevaplanmadı, "KDV dahil/hariç" istenirse tek satırdan eklenir.
export function formatQuoteMessage(quote: Quote): string {
  const parts = [
    `${quote.aciklama}, tahmini yatırım ${trNum(quote.minTl)} - ${trNum(quote.maxTl)} TL aralığında.`,
    'Kesin rakam keşif sonrası netleşiyor.',
  ]
  if (quote.not) parts.push(quote.not)
  parts.push(
    'Aşağıdaki "WhatsApp\'tan Teklif Al" butonuna basarak talebinizi doğrudan ekibimize iletebilirsiniz.',
  )
  return parts.join('\n\n')
}
