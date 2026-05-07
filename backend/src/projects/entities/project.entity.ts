import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { ProjectMedia } from './project-media.entity'

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  slug: string

  @Column()
  name: string

  @Column()
  location: string

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  kw: number

  @Column()
  date: string

  @Column()
  category: string

  @Column('text')
  description: string

  @Column('text', { nullable: true })
  about: string

  @Column({ default: 'Sistem Özellikleri' })
  specsTitle: string

  @Column('text', { array: true, default: '{}' })
  specs: string[]

  @Column({ default: 'Öne Çıkan Özellikler' })
  highlightsTitle: string

  @Column('text', { array: true, default: '{}' })
  highlights: string[]

  @Column('jsonb', { default: '[]' })
  statBoxes: { value: string; label: string }[]

  @Column({ default: 'Benzer Proje İçin Teklif Al' })
  ctaText: string

  @Column({ default: true })
  published: boolean

  @Column({ default: 0 })
  sortOrder: number

  @OneToMany(() => ProjectMedia, (m) => m.project, { cascade: true, eager: true })
  media: ProjectMedia[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
