import { IsString, Matches } from 'class-validator'

export class LinkMediaDto {
  @IsString()
  @Matches(/^\/uploads\/[\w\-\.]+\.(jpg|jpeg|png|webp|mp4|mov|webm)$/i, {
    message: 'Geçersiz medya yolu',
  })
  src: string
}
