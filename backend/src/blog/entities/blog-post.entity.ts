import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

@Entity('blog_posts')
export class BlogPost {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  title: string

  @Column({ unique: true })
  slug: string

  @Column({ nullable: true })
  excerpt: string

  @Column({ type: 'text', default: '' })
  content: string

  @Column({ nullable: true })
  coverImage: string

  @Column({ default: false })
  published: boolean

  @Column({ nullable: true })
  publishedAt: Date

  @Column({ default: 0 })
  sortOrder: number

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
