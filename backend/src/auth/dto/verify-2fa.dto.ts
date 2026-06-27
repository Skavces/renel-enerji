import { IsString, IsNotEmpty, MaxLength, Length, Matches } from 'class-validator'

export class Verify2faDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  preAuthToken: string

  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  code: string
}
