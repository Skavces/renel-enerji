import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity('chat_leads')
export class ChatLead {
  @PrimaryGeneratedColumn('uuid')
  id: string

  // Frontend'in konuşma başına ürettiği UUID; aynı konuşma tek lead olarak upsert edilir
  @Column({ type: 'uuid', unique: true })
  sessionId: string

  @Column({ type: 'jsonb', nullable: true })
  conversation: { role: string; content: string }[] | null

  @Column({ default: 0 })
  messageCount: number

  // 'active' = WhatsApp'a geçmedi (kaçan lead adayı), 'whatsapp' = özet üretildi
  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: 'active' | 'whatsapp'

  @Column({ type: 'smallint', nullable: true })
  rating: number | null

  // Kaçan-lead Telegram bildirimi gönderildiyse dolu; tekrar bildirimi engeller
  @Column({ type: 'timestamp', nullable: true })
  notifiedAt: Date | null

  @Index()
  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
