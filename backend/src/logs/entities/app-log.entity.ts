import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

export type LogLevel = 'error' | 'warn'

@Entity('app_logs')
export class AppLog {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 10 })
  level: LogLevel

  // Nest Logger context'i (örn. "ChatService"); parse edilemezse boş
  @Column({ type: 'varchar', length: 100, nullable: true })
  context: string | null

  @Column({ type: 'text' })
  message: string

  @Index()
  @CreateDateColumn()
  createdAt: Date
}
