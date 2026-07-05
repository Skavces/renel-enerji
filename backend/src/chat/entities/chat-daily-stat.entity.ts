import { Column, Entity, PrimaryColumn } from 'typeorm'

// Gün bazında chatbot açılma sayacı; huninin diğer adımları chat_leads'ten türetilir
@Entity('chat_daily_stats')
export class ChatDailyStat {
  @PrimaryColumn({ type: 'date' })
  date: string

  @Column({ default: 0 })
  opened: number
}
