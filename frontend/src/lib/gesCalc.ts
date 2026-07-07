// GES tasarruf hesaplayıcı sabitleri — tümü yaklaşık değerlerdir ve tek yerden güncellenir.
// Birim fiyatlar vergiler dahil ortalama satış fiyatıdır (TL/kWh); tarife değişikliklerinde güncelleyin.
export interface Tariff {
  id: string
  label: string
  unitPrice: number
}

export const TARIFFS: Tariff[] = [
  { id: 'mesken', label: 'Mesken', unitPrice: 2.9 },
  { id: 'ticarethane', label: 'Ticarethane', unitPrice: 3.7 },
  { id: 'sanayi', label: 'Sanayi', unitPrice: 3.3 },
]

// Ege bölgesi ortalama özgül üretim (kWh/kWp/yıl)
const SPECIFIC_YIELD = 1450
// Panel başına güç (kWp) — 550W panel varsayımı
const PANEL_KWP = 0.55
// kWp başına gereken yaklaşık çatı alanı (m²)
const AREA_M2_PER_KWP = 5

const MAX_BILL = 10000000

export interface GesResult {
  monthlyKwh: number
  annualKwh: number
  systemKwp: number
  panelCount: number
  roofArea: number
  annualProduction: number
  annualSavings: number
}

// Kullanıcı yazarken binlik ayraçlarla girilen değeri ham rakamlara indirger (üst sınırla kırpar).
export function parseBillInput(rawValue: string): string {
  const digits = rawValue.replace(/\D/g, '')
  if (!digits) return ''
  return String(Math.min(Number(digits), MAX_BILL))
}

export function calculateGes(monthlyBill: number, tariffId: string): GesResult | null {
  const tariff = TARIFFS.find(t => t.id === tariffId) ?? TARIFFS[0]
  if (!monthlyBill || monthlyBill <= 0) return null

  const monthlyKwh = monthlyBill / tariff.unitPrice
  const annualKwh = monthlyKwh * 12

  // Temel birim panel adedidir: yıllık tüketimi karşılayan en küçük tam panel sayısı
  // seçilir, kurulu güç / üretim / çatı alanı hep bu adetten türetilir.
  const panelCount = Math.max(1, Math.ceil(annualKwh / SPECIFIC_YIELD / PANEL_KWP))
  const systemKwp = Math.round(panelCount * PANEL_KWP * 10) / 10
  const annualProduction = Math.round(systemKwp * SPECIFIC_YIELD)

  return {
    monthlyKwh: Math.round(monthlyKwh),
    annualKwh: Math.round(annualKwh),
    systemKwp,
    panelCount,
    roofArea: Math.round(systemKwp * AREA_M2_PER_KWP),
    annualProduction,
    // Yukarı yuvarlama nedeniyle üretim tüketimi aşabilir; mahsuplaşmada fazla üretim
    // tam perakende fiyattan dönmediği için tasarruf tüketimle sınırlandırılır.
    annualSavings: Math.round(Math.min(annualProduction, annualKwh) * tariff.unitPrice),
  }
}
