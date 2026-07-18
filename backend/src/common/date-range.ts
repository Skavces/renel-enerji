import { BadRequestException } from '@nestjs/common'
import { Between, FindOperator, LessThanOrEqual, MoreThanOrEqual } from 'typeorm'

// Admin liste filtreleri için ?from=&to= aralığı. Gün sınırı hesabı istemcide
// yapılır (yerel gün → tam ISO datetime); burada yalnızca doğrulama var.
export interface DateRange {
  from?: Date
  to?: Date
}

export function parseDateRange(from?: string, to?: string): DateRange {
  const range: DateRange = {}
  if (from) {
    const parsed = new Date(from)
    if (isNaN(parsed.getTime())) throw new BadRequestException('from geçerli bir ISO tarih olmalı')
    range.from = parsed
  }
  if (to) {
    const parsed = new Date(to)
    if (isNaN(parsed.getTime())) throw new BadRequestException('to geçerli bir ISO tarih olmalı')
    range.to = parsed
  }
  if (range.from && range.to && range.from > range.to) {
    throw new BadRequestException("from, to'dan sonra olamaz")
  }
  return range
}

// Aralığı tek bir TypeORM where operatörüne çevirir; aralık boşsa undefined
// (çağıran alanı where'e hiç koymaz)
export function dateRangeOperator(range: DateRange): FindOperator<Date> | undefined {
  if (range.from && range.to) return Between(range.from, range.to)
  if (range.from) return MoreThanOrEqual(range.from)
  if (range.to) return LessThanOrEqual(range.to)
  return undefined
}
