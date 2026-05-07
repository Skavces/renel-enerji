import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Project } from './project.entity'

@Entity('project_media')
export class ProjectMedia {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => Project, (p) => p.media, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project

  @Column()
  type: string

  @Column()
  src: string

  @Column({ default: 0 })
  sortOrder: number
}
