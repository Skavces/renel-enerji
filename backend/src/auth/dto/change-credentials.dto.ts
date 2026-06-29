import { IsString, IsOptional, MinLength, MaxLength, Matches, Length } from 'class-validator'

export class ChangeCredentialsDto {
  @IsString()
  @MinLength(1)
  @MaxLength(72)
  currentPassword: string

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: 'Kullanıcı adı sadece harf, rakam, _ ve - içerebilir' })
  newUsername?: string

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Şifre en az 8 karakter olmalıdır' })
  @MaxLength(72)
  newPassword?: string

  @IsOptional()
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  totpCode?: string
}
