import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { ProjectMedia } from './project-media.entity'

@Entity('projects')
@Index(['published', 'sortOrder'])
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  slug: string

  @Column()
  name: string

  @Column()
  location: string

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
  })
  kw: number

  @Column()
  date: string

  @Column({ nullable: true })
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

  @Column({ nullable: true, unique: true })
  instagramMediaId: string

  @OneToMany(() => ProjectMedia, (m) => m.project, { cascade: true })
  media: ProjectMedia[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
