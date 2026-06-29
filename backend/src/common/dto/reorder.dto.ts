import { IsArray, IsUUID, ArrayMaxSize } from 'class-validator'

export class ReorderDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMaxSize(500)
  orderedIds: string[]
}
