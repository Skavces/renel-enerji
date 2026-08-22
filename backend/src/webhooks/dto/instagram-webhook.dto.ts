import { IsNumber, IsOptional, IsString, Matches, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import type { InstagramWebhookBody } from '../../projects/instagram-types'

// Instagram medya ID'si her zaman sayısal — Graph API URL path'ine gidiyor
// (instagram-import.service.ts:150), bu yüzden burada sert doğrulanıyor.
export const MEDIA_ID_PATTERN = /^\d+$/

export class InstagramWebhookMediaDto {
  @IsOptional()
  @IsString()
  @Matches(MEDIA_ID_PATTERN, { message: 'Medya ID sayısal olmalı' })
  id?: string
}

export class InstagramWebhookValueDto {
  @IsOptional()
  @IsString()
  verb?: string

  @IsOptional()
  @ValidateNested()
  @Type(() => InstagramWebhookMediaDto)
  media?: InstagramWebhookMediaDto
}

export class InstagramWebhookChangeDto {
  @IsOptional()
  @IsString()
  field?: string

  @IsOptional()
  @ValidateNested()
  @Type(() => InstagramWebhookValueDto)
  value?: InstagramWebhookValueDto
}

export class InstagramWebhookEntryDto {
  // Gerçek Meta payload'ında her zaman var ama bu kod tabanında hiç okunmuyor;
  // burada tanımlanmazlarsa her gerçek teslimatta "beklenmeyen alan" uyarısı
  // sessizce gürültüye döner — teşhis sinyalini anlamlı tutmak için modellendi.
  @IsOptional()
  @IsString()
  id?: string

  @IsOptional()
  @IsNumber()
  time?: number

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => InstagramWebhookChangeDto)
  changes?: InstagramWebhookChangeDto[]
}

export class InstagramWebhookBodyDto implements InstagramWebhookBody {
  @IsOptional()
  @IsString()
  object?: string

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => InstagramWebhookEntryDto)
  entry?: InstagramWebhookEntryDto[]
}
