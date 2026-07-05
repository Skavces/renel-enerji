import { Type } from 'class-transformer'
import { IsArray, IsIn, IsString, MaxLength, ValidateNested, ArrayMaxSize, ArrayMinSize } from 'class-validator'

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
}

export class SummaryBodyDto {
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages: ChatMessageDto[]
}
