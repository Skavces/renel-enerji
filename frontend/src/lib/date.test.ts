import { describe, expect, it } from 'vitest'
import { dayRangeToIso, formatDateTime } from './date'

// dayRangeToIso yerel saat diliminde çalışır; testler mutlak ISO string yerine
// yerel gün sınırlarına geri çözerek doğrular ki her TZ'de geçsin.
describe('dayRangeToIso', () => {
  it('yerel gün başlangıcını ve sonunu ISO olarak döner', () => {
    const { from, to } = dayRangeToIso('2026-07-01', '2026-07-15')
    expect(new Date(from!)).toEqual(new Date('2026-07-01T00:00:00'))
    expect(new Date(to!)).toEqual(new Date('2026-07-15T23:59:59.999'))
  })

  it('tek uç verilebilir', () => {
    expect(dayRangeToIso('2026-07-01', '')).not.toHaveProperty('to')
    expect(dayRangeToIso('', '2026-07-15')).not.toHaveProperty('from')
  })

  it('boş girdide boş nesne döner', () => {
    expect(dayRangeToIso('', '')).toEqual({})
    expect(dayRangeToIso(undefined, undefined)).toEqual({})
  })

  it('geçersiz girdi sessizce atlanır', () => {
    expect(dayRangeToIso('dun', 'yarin')).toEqual({})
  })
})

// formatDateTime yerel bileşenlerden (new Date(y, m, d, h, mi)) kurulan bir
// Date alır, böylece hem kurulum hem doğrulama aynı TZ'de olur — TZ'e duyarlı
// olan toLocaleString çıktısı testte TZ farkına bağlı kalmaz.
describe('formatDateTime', () => {
  it('gün/ay(kısa)/yıl saat:dakika olarak döner', () => {
    expect(formatDateTime(new Date(2026, 6, 1, 14, 5).toISOString())).toBe('01 Tem 2026 14:05')
  })

  it('formatDate ile aynı adı taşımaz, ayrı bir fonksiyondur', () => {
    // formatDate saat içermez (month: 'long'); formatDateTime içerir (month: 'short').
    expect(formatDateTime(new Date(2026, 0, 5, 9, 0).toISOString())).toBe('05 Oca 2026 09:00')
  })
})
