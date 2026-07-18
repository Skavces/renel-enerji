import { BadRequestException } from '@nestjs/common'
import { Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm'
import { dateRangeOperator, parseDateRange } from '../date-range'

describe('parseDateRange', () => {
  it('iki uç da boşsa boş aralık döner', () => {
    expect(parseDateRange(undefined, undefined)).toEqual({})
    expect(parseDateRange('', '')).toEqual({})
  })

  it('ISO datetime uçlarını Date olarak döner', () => {
    const range = parseDateRange('2026-07-01T00:00:00.000Z', '2026-07-15T23:59:59.999Z')
    expect(range.from?.toISOString()).toBe('2026-07-01T00:00:00.000Z')
    expect(range.to?.toISOString()).toBe('2026-07-15T23:59:59.999Z')
  })

  it('tek uç verilebilir', () => {
    expect(parseDateRange('2026-07-01T00:00:00.000Z', undefined).to).toBeUndefined()
    expect(parseDateRange(undefined, '2026-07-15T00:00:00.000Z').from).toBeUndefined()
  })

  it('geçersiz tarih 400 fırlatır', () => {
    expect(() => parseDateRange('dun', undefined)).toThrow(BadRequestException)
    expect(() => parseDateRange(undefined, 'yarin')).toThrow(BadRequestException)
  })

  it('ters aralık (from > to) 400 fırlatır', () => {
    expect(() => parseDateRange('2026-07-15T00:00:00.000Z', '2026-07-01T00:00:00.000Z')).toThrow(BadRequestException)
  })
})

describe('dateRangeOperator', () => {
  const from = new Date('2026-07-01T00:00:00.000Z')
  const to = new Date('2026-07-15T23:59:59.999Z')

  it('iki uç doluysa Between döner', () => {
    expect(dateRangeOperator({ from, to })).toEqual(Between(from, to))
  })

  it('yalnız from doluysa MoreThanOrEqual döner', () => {
    expect(dateRangeOperator({ from })).toEqual(MoreThanOrEqual(from))
  })

  it('yalnız to doluysa LessThanOrEqual döner', () => {
    expect(dateRangeOperator({ to })).toEqual(LessThanOrEqual(to))
  })

  it('boş aralıkta undefined döner', () => {
    expect(dateRangeOperator({})).toBeUndefined()
  })
})
