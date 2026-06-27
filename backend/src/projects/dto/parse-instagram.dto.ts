import { IsString, IsNotEmpty, MaxLength } from 'class-validator'

export class ParseInstagramDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  text: string
}
