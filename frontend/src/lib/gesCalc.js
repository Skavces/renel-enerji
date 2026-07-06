// GES tasarruf hesaplayıcı sabitleri — tümü yaklaşık değerlerdir ve tek yerden güncellenir.
// Birim fiyatlar vergiler dahil ortalama satış fiyatıdır (TL/kWh); tarife değişikliklerinde güncelleyin.
export const TARIFFS = [
  { id: 'mesken', label: 'Mesken', unitPrice: 2.9 },
  { id: 'ticarethane', label: 'Ticarethane', unitPrice: 3.7 },
  { id: 'tarimsal', label: 'Tarımsal Sulama', unitPrice: 3.1 },
]

// Ege bölgesi ortalama özgül üretim (kWh/kWp/yıl)
const SPECIFIC_YIELD = 1450
// Panel başına güç (kWp) — 550W panel varsayımı
const PANEL_KWP = 0.55
// kWp başına gereken yaklaşık çatı alanı (m²)
const AREA_M2_PER_KWP = 5

const MAX_BILL = 10000000

// Kullanıcı yazarken binlik ayraçlarla girilen değeri ham rakamlara indirger (üst sınırla kırpar).
export function parseBillInput(rawValue) {
  const digits = rawValue.replace(/\D/g, '')
  if (!digits) return ''
  return String(Math.min(Number(digits), MAX_BILL))
}

export function calculateGes(monthlyBill, tariffId) {
  const tariff = TARIFFS.find(t => t.id === tariffId) ?? TARIFFS[0]
  if (!monthlyBill || monthlyBill <= 0) return null

  const monthlyKwh = monthlyBill / tariff.unitPrice
  const annualKwh = monthlyKwh * 12

  // Yıllık tüketimi karşılayacak sistem gücü, 0.5 kWp hassasiyetle yukarı yuvarlanır
  const rawKwp = annualKwh / SPECIFIC_YIELD
  const systemKwp = Math.max(0.5, Math.ceil(rawKwp * 2) / 2)
  const panelCount = Math.ceil(systemKwp / PANEL_KWP)

  return {
    monthlyKwh: Math.round(monthlyKwh),
    annualKwh: Math.round(annualKwh),
    systemKwp,
    panelCount,
    roofArea: Math.round(systemKwp * AREA_M2_PER_KWP),
    annualProduction: Math.round(systemKwp * SPECIFIC_YIELD),
    annualSavings: Math.round(monthlyBill * 12),
  }
}
