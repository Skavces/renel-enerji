import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity('admin_config')
export class AdminConfig {
  @PrimaryColumn()
  id: number

  @Column({ nullable: true, type: 'text' })
  totpSecret: string | null

  @Column({ nullable: true, type: 'text' })
  username: string | null

  @Column({ nullable: true, type: 'text' })
  passwordHash: string | null
}
