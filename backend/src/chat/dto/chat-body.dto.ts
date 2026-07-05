import { Type } from 'class-transformer'
import { IsArray, IsIn, IsOptional, IsString, IsUUID, MaxLength, ValidateNested, ArrayMaxSize, ArrayMinSize } from 'class-validator'

export class ChatMessageDto {
  @IsIn(['user', 'assistant'])
  role: 'user' | 'assistant'

  @IsString()
  @MaxLength(1000)
  content: string
}

export class ChatBodyDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages: ChatMessageDto[]

  // Konuşma başına frontend'de üretilen UUID; lead takibi için
  @IsOptional()
  @IsUUID('4')
  sessionId?: string
}

export class SummaryBodyDto {
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages: ChatMessageDto[]

  @IsOptional()
  @IsUUID('4')
  sessionId?: string
}
