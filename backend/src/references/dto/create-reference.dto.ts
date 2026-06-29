import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator'
import { Transform, Type } from 'class-transformer'

export class CreateReferenceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string

  @IsOptional()
  @IsString()
  @Matches(/^(https?:\/\/|\/uploads\/)/, { message: 'Geçerli URL veya /uploads/ yolu olmalı' })
  logo?: string

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
