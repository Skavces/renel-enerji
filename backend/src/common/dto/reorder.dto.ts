import { IsArray, IsString, ArrayMaxSize } from 'class-validator'

export class ReorderDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(500)
  orderedIds: string[]
}
