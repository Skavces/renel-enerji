import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Entity('chat_ratings')
export class ChatRating {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'smallint' })
  rating: number

  // Aynı sohbet ikinci kez puanlayamasın (spam koruması); NULL'lar serbest
  // çünkü sessionId'siz eski kayıtlar ve sessionId göndermeyen istemciler var
  @Index('UQ_chat_ratings_sessionId', { unique: true })
  @Column({ type: 'uuid', nullable: true })
  sessionId: string | null

  @Column({ default: 0 })
  messageCount: number

  @Column({ type: 'jsonb', nullable: true })
  conversation: { role: string; content: string }[] | null

  @CreateDateColumn()
  createdAt: Date
}
