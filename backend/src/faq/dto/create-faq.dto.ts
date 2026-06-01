import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator'
import { Transform, Type } from 'class-transformer'

export class CreateFaqDto {
  @IsString()
  @IsNotEmpty()
  question: string

  @IsString()
  @IsNotEmpty()
  answer: string

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  published?: boolean

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  sortOrder?: number
}
