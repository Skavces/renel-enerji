import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'

export type InstagramSkipReason = 'deleted' | 'parse_failed'

// Instagram sync'inin tekrar içeri almaması gereken postlar: admin'in sildiği
// projeler ('deleted') ve parse'ı tekrar tekrar başarısız olanlar ('parse_failed')
@Entity('instagram_skipped_media')
export class InstagramSkippedMedia {
  @PrimaryColumn()
  mediaId: string

  @Column({ type: 'varchar', length: 20 })
  reason: InstagramSkipReason

  @Column({ type: 'int', default: 0 })
  failCount: number

  @Column('text', { nullable: true })
  lastError: string | null

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
