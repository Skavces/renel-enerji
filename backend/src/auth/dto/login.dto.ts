import { IsString, IsNotEmpty, IsBoolean, IsOptional, MaxLength } from 'class-validator'

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  username: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password: string

  @IsBoolean()
  @IsOptional()
  rememberMe?: boolean
}
