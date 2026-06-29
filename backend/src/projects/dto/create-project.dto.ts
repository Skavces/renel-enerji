import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min, ValidateNested } from 'class-validator'
import { Transform, Type } from 'class-transformer'

export class StatBoxDto {
  @IsString()
  @MaxLength(100)
  value: string

  @IsString()
  @MaxLength(100)
  label: string
}

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug sadece küçük harf, rakam ve tire içerebilir' })
  slug: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  location: string

  @IsNumber()
  @Min(0)
  @Max(99999999.99)
  @Type(() => Number)
  kw: number

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}$/, { message: 'Tarih 4 haneli yıl formatında olmalı (örn: 2024)' })
  date: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  description: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  about?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  specsTitle?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  specs?: string[]

  @IsOptional()
  @IsString()
  @MaxLength(500)
  highlightsTitle?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  highlights?: string[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StatBoxDto)
  statBoxes?: StatBoxDto[]

  @IsOptional()
  @IsString()
  @MaxLength(500)
  ctaText?: string

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  published?: boolean

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2147483647)
  @Type(() => Number)
  sortOrder?: number
}
