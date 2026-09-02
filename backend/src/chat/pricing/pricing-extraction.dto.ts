import { IsIn, IsNumber, IsOptional, Max, Min } from 'class-validator'

// LLM fiyat-çıkarım çağrısının şeması. instagram-parse.service.ts'teki
// ParsedProjectDto deseniyle aynı: hepsi @IsOptional (model alanı atlayabilir),
// geçersiz alan tüm payload'ı reddetmez — chat.service.ts sadece o alanı düşürür.
//
// @Type(() => Number) BİLİNÇLİ olarak yok (parsed-project.dto.ts:27-30 ile aynı
// gerekçe): prompt sayısal alanları JS sayısı olarak istiyor, coercion olursa
// hatalı biçimli bir değer sessizce geçebilir; string gelmesi model hatasıdır
// ve reddedilmelidir.
export class PricingExtractionDto {
  @IsOptional()
  @IsIn(['cati_konut', 'tarimsal_sulama', 'bag_evi', 'ev_sarj', 'yok'])
  kategori?: string

  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(10_000_000)
  aylikFatura?: number

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(200)
  pompaHp?: number

  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(100)
  kw?: number

  @IsOptional()
  @IsIn(['ac_mono_7_4', 'ac_trifaze_11_22', 'ac_ticari_22'])
  sarjTipi?: string
}
