import { Type } from 'class-transformer'
import { ArrayMaxSize, IsArray, IsInt, IsOptional, Max, Min, ValidateNested } from 'class-validator'
import { ChatMessageDto } from './chat-body.dto'

export class RatingBodyDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages?: ChatMessageDto[]
}
