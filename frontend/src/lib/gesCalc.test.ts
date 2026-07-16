import { describe, expect, it } from 'vitest'
import {
  TARIFFS,
  billToMonthlyKwh,
  calculateGes,
  monthlyKwhToBill,
  parseBillInput,
} from './gesCalc'

const mesken = TARIFFS[0]
const sanayi = TARIFFS[2]

describe('parseBillInput', () => {
  it('binlik ayraçlarını ve rakam dışı karakterleri temizler', () => {
    expect(parseBillInput('2.500')).toBe('2500')
    expect(parseBillInput('1.250.000 TL')).toBe('1250000')
  })

  it('rakam yoksa boş döner', () => {
    expect(parseBillInput('')).toBe('')
    expect(parseBillInput('abc')).toBe('')
  })

  it('üst sınırı aşan girdiyi kırpar', () => {
    expect(parseBillInput('99999999999')).toBe('10000000')
  })
})

describe('monthlyKwhToBill / billToMonthlyKwh', () => {
  it('mesken kademeli tarifeyi doğru hesaplar', () => {
    // İlk 240 kWh 3.24'ten, kalanı 4.86'dan
    expect(monthlyKwhToBill(100, mesken)).toBeCloseTo(324, 5)
    expect(monthlyKwhToBill(300, mesken)).toBeCloseTo(240 * 3.24 + 60 * 4.86, 5)
  })

  it('tek kademeli sanayi tarifesinde doğrusaldır', () => {
    expect(monthlyKwhToBill(100, sanayi)).toBeCloseTo(585, 5)
    expect(billToMonthlyKwh(585, sanayi)).toBeCloseTo(100, 5)
  })

  it('her tarifede kademe sınırları etrafında round-trip tutarlıdır', () => {
    // Regresyon: bill -> kwh -> bill dönüşümü aynı tutara dönmeli
    for (const tariff of TARIFFS) {
      for (const kwh of [10, 239, 240, 241, 500, 899, 900, 901, 2000]) {
        const bill = monthlyKwhToBill(kwh, tariff)
        expect(billToMonthlyKwh(bill, tariff)).toBeCloseTo(kwh, 5)
      }
    }
  })
})

describe('calculateGes', () => {
  it('geçersiz fatura için null döner', () => {
    expect(calculateGes(0, 'mesken')).toBeNull()
    expect(calculateGes(-100, 'mesken')).toBeNull()
  })

  it('bilinmeyen tarife id ilk tarifeye düşer', () => {
    expect(calculateGes(2000, 'olmayan')).toEqual(calculateGes(2000, 'mesken'))
  })

  it('mesken 2000 TL için bilinen değerleri üretir (regresyon kilidi)', () => {
    // Bu sayılar müşteriye gösterilir; sabitler (tarife/verim) değişmeden
    // bu test kırılıyorsa hesap mantığı bozulmuş demektir.
    const r = calculateGes(2000, 'mesken')
    expect(r).toEqual({
      monthlyKwh: 492,
      annualKwh: 5898,
      systemKwp: 4.4,
      panelCount: 8,
      roofArea: 22,
      annualProduction: 6380,
      annualSavings: 24000,
    })
  })

  it('tasarruf hiçbir durumda yıllık faturayı aşamaz', () => {
    for (const tariff of TARIFFS) {
      for (const bill of [250, 1000, 2500, 10000, 50000]) {
        const r = calculateGes(bill, tariff.id)
        expect(r).not.toBeNull()
        expect(r!.annualSavings).toBeLessThanOrEqual(bill * 12 + 1)
        expect(r!.annualSavings).toBeGreaterThan(0)
        expect(r!.panelCount).toBeGreaterThanOrEqual(1)
      }
    }
  })

  it('üretim tüketimi karşıladığında tasarruf faturanın tamamına eşittir', () => {
    // Panel adedi yukarı yuvarlandığı için üretim > tüketim; kalan tüketim 0
    const r = calculateGes(2000, 'mesken')
    expect(r!.annualProduction).toBeGreaterThan(r!.annualKwh)
    expect(r!.annualSavings).toBe(24000)
  })
})
