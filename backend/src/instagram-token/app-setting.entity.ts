import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm'

@Entity('app_settings')
export class AppSetting {
  @PrimaryColumn()
  key: string

  @Column('text')
  value: string

  @UpdateDateColumn()
  updatedAt: Date
}
