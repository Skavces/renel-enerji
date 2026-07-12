import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Reference } from './entities/reference.entity'
import { CreateReferenceDto } from './dto/create-reference.dto'
import { UpdateReferenceDto } from './dto/update-reference.dto'
import { deleteUploadedFile } from '../upload/uploaded-files'

@Injectable()
export class ReferencesService {
  constructor(
    @InjectRepository(Reference)
    private repo: Repository<Reference>,
  ) {}

  findAllPublic() {
    return this.repo.find({
      where: { published: true },
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    })
  }

  findAll() {
    return this.repo.find({ order: { sortOrder: 'ASC', createdAt: 'DESC' } })
  }

  async findById(id: string) {
    const ref = await this.repo.findOne({ where: { id } })
    if (!ref) throw new NotFoundException('Referans bulunamadı')
    return ref
  }

  create(dto: CreateReferenceDto) {
    return this.repo.save(this.repo.create(dto))
  }

  async update(id: string, dto: UpdateReferenceDto) {
    const ref = await this.findById(id)
    const oldLogo = ref.logo
    Object.assign(ref, dto)
    const saved = await this.repo.save(ref)
    // Logo değiştiyse eski dosyayı diskte bırakma
    if (dto.logo !== undefined && oldLogo && oldLogo !== saved.logo) {
      await deleteUploadedFile(oldLogo)
    }
    return saved
  }

  async remove(id: string) {
    const ref = await this.findById(id)
    await this.repo.remove(ref)
    await deleteUploadedFile(ref.logo)
  }

  async reorder(orderedIds: string[]) {
    await this.repo.manager.transaction(async (manager) => {
      await Promise.all(
        orderedIds.map((id, index) => manager.update(Reference, id, { sortOrder: index })),
      )
    })
  }
}
