import { Equals, IsEmpty, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator'
import { Transform, Type } from 'class-transformer'
import type { QuoteServiceType } from '../entities/quote-request.entity'

const SERVICE_TYPES: QuoteServiceType[] = ['cati-ges', 'tarimsal-sulama', 'ev-sarj', 'diger']

export class CreateQuoteRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string

  // Rakam dışı her karakter atılır; başındaki tek "0" (yerel çevirme) düşürülür ve
  // "90" ülke kodu yoksa eklenir — hem "0554 379 60 04" hem "554 379 60 04" hem
  // "905543796004" girdisi aynı kanonik forma ("905XXXXXXXXX") normalize edilir
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value
    let digits = value.replace(/\D/g, '')
    if (digits.startsWith('0')) digits = digits.slice(1)
    if (!digits.startsWith('90')) digits = `90${digits}`
    return digits
  })
  @Matches(/^905\d{9}$/, { message: 'Geçerli bir cep telefonu numarası girin' })
  phone: string

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string

  @IsIn(SERVICE_TYPES, { message: 'Geçersiz hizmet tipi' })
  serviceType: QuoteServiceType

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1000000)
  monthlyBill?: number

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string

  @Equals(true, { message: 'KVKK aydınlatma metnini onaylamanız gerekiyor' })
  kvkkConsent: boolean

  // Honeypot: gerçek kullanıcılar bu alanı görmez/doldurmaz. forbidNonWhitelisted
  // açık olduğu için DTO'da tanımlı olmalı; dolu gelirse validasyon 400 döner.
  @IsOptional()
  @IsEmpty()
  website?: string
}
