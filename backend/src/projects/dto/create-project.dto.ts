import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator'
import { Transform, Type } from 'class-transformer'

export class StatBoxDto {
  @IsString()
  value: string

  @IsString()
  label: string
}

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  slug: string

  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  @IsNotEmpty()
  location: string

  @IsNumber()
  @Min(0)
  @Max(99999999.99)
  @Type(() => Number)
  kw: number

  @IsString()
  @IsNotEmpty()
  date: string

  @IsString()
  @IsNotEmpty()
  description: string

  @IsOptional()
  @IsString()
  about?: string

  @IsOptional()
  @IsString()
  specsTitle?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specs?: string[]

  @IsOptional()
  @IsString()
  highlightsTitle?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  highlights?: string[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StatBoxDto)
  statBoxes?: StatBoxDto[]

  @IsOptional()
  @IsString()
  ctaText?: string

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  published?: boolean

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  sortOrder?: number
}
