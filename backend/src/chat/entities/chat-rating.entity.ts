import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('chat_ratings')
export class ChatRating {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'smallint' })
  rating: number

  @Column({ default: 0 })
  messageCount: number

  @Column({ type: 'jsonb', nullable: true })
  conversation: { role: string; content: string }[] | null

  @CreateDateColumn()
  createdAt: Date
}
