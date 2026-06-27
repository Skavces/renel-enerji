import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Faq } from './entities/faq.entity'
import { CreateFaqDto } from './dto/create-faq.dto'
import { UpdateFaqDto } from './dto/update-faq.dto'

@Injectable()
export class FaqService {
  constructor(
    @InjectRepository(Faq)
    private repo: Repository<Faq>,
  ) {}

  findAllPublic() {
    return this.repo.find({
      where: { published: true },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    })
  }

  findAll() {
    return this.repo.find({ order: { sortOrder: 'ASC', createdAt: 'ASC' } })
  }

  async findById(id: string) {
    const faq = await this.repo.findOne({ where: { id } })
    if (!faq) throw new NotFoundException('SSS bulunamadı')
    return faq
  }

  create(dto: CreateFaqDto) {
    return this.repo.save(this.repo.create(dto))
  }

  async update(id: string, dto: UpdateFaqDto) {
    const faq = await this.findById(id)
    Object.assign(faq, dto)
    return this.repo.save(faq)
  }

  async remove(id: string) {
    const faq = await this.findById(id)
    await this.repo.remove(faq)
  }

  async reorder(orderedIds: string[]) {
    await this.repo.manager.transaction(async (manager) => {
      await Promise.all(
        orderedIds.map((id, index) => manager.update(Faq, id, { sortOrder: index })),
      )
    })
  }
}
