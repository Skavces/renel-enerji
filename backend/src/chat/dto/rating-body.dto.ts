import { IsInt, IsUUID, Max, Min } from 'class-validator'

// Konuşma dökümü artık istemciden alınmaz; sunucudaki Redis geçmişinden okunur
export class RatingBodyDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number

  @IsUUID('4')
  sessionId: string
}
