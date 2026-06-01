import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, MaxLength } from 'class-validator'
import { Transform, Type } from 'class-transformer'

export class CreateBlogPostDto {
  @IsString()
  @IsNotEmpty()
  title: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug yalnızca küçük harf, rakam ve tire içerebilir' })
  slug: string

  @IsOptional()
  @IsString()
  excerpt?: string

  @IsOptional()
  @IsString()
  content?: string

  @IsOptional()
  @IsString()
  coverImage?: string

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  published?: boolean

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  sortOrder?: number
}
