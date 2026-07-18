import { describe, expect, it } from 'vitest'
import { dayRangeToIso } from './date'

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
