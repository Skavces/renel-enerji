import { IsString, Length, Matches, MaxLength, MinLength } from 'class-validator'

export class Remove2faDto {
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  code: string

  @IsString()
  @MinLength(1)
  @MaxLength(72)
  currentPassword: string
}
