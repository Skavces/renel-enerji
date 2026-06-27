import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

@Entity('faqs')
@Index(['published', 'sortOrder'])
export class Faq {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  question: string

  @Column({ type: 'text' })
  answer: string

  @Column({ default: true })
  published: boolean

  @Column({ default: 0 })
  sortOrder: number

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
