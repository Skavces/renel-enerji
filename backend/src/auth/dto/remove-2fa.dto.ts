import { IsString, Length, Matches, MinLength } from 'class-validator'

export class Remove2faDto {
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  code: string

  @IsString()
  @MinLength(1)
  currentPassword: string
}
