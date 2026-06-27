import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Reference } from './entities/reference.entity'
import { CreateReferenceDto } from './dto/create-reference.dto'
import { UpdateReferenceDto } from './dto/update-reference.dto'

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
    Object.assign(ref, dto)
    return this.repo.save(ref)
  }

  async remove(id: string) {
    const ref = await this.findById(id)
    await this.repo.remove(ref)
  }

  async reorder(orderedIds: string[]) {
    await this.repo.manager.transaction(async (manager) => {
      await Promise.all(
        orderedIds.map((id, index) => manager.update(Reference, id, { sortOrder: index })),
      )
    })
  }
}
