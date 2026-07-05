import { IsIn } from 'class-validator'

export class EventBodyDto {
  @IsIn(['open'])
  type: 'open'
}
