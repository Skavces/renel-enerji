import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator'
import { Transform, Type } from 'class-transformer'

export class CreateFaqDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  question: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  answer: string

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
