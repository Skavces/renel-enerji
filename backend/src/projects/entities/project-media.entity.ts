import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Project } from './project.entity'

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  THUMBNAIL = 'thumbnail',
}

@Entity('project_media')
export class ProjectMedia {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => Project, (p) => p.media, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project

  @Column({ type: 'enum', enum: MediaType })
  type: MediaType

  @Column()
  src: string

  @Column({ default: 0 })
  sortOrder: number
}
