import { IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator'

export class ConfirmSetupDto {
  @IsString()
  @MaxLength(64)
  secret: string

  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  code: string

  @IsOptional()
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  currentCode?: string
}
