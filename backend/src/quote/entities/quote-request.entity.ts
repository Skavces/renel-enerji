import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

export type QuoteServiceType = 'cati-ges' | 'tarimsal-sulama' | 'ev-sarj' | 'diger'
export type QuoteStatus = 'new' | 'contacted' | 'won' | 'lost'

@Entity('quote_requests')
export class QuoteRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string

  // KVKK temizliğinde null'lanır; NOT NULL kolon değil
  @Column({ type: 'varchar', length: 120, nullable: true })
  name: string | null

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null

  @Column({ type: 'varchar', length: 120, nullable: true })
  city: string | null

  @Column({ type: 'varchar', length: 40 })
  serviceType: QuoteServiceType

  @Column({ type: 'integer', nullable: true })
  monthlyBill: number | null

  @Column({ type: 'text', nullable: true })
  message: string | null

  @Column({ default: false })
  kvkkConsent: boolean

  @Column({ type: 'timestamp' })
  consentAt: Date

  // 'new' = henüz aranmadı, 'contacted' = iletişime geçildi, 'won'/'lost' = sonuçlandı
  @Column({ type: 'varchar', length: 20, default: 'new' })
  status: QuoteStatus

  @Index()
  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
