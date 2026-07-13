import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FindManyOptions, Repository } from 'typeorm'
import { Faq } from './entities/faq.entity'
import { BaseContentService } from '../common/base-content.service'

@Injectable()
export class FaqService extends BaseContentService<Faq> {
  protected readonly entityClass = Faq
  protected readonly notFoundMessage = 'SSS bulunamadı'

  constructor(@InjectRepository(Faq) repo: Repository<Faq>) {
    super(repo)
  }

  // SSS eklenme sırasıyla okunur (en eski üstte)
  protected defaultOrder(): FindManyOptions<Faq>['order'] {
    return { sortOrder: 'ASC', createdAt: 'ASC' }
  }
}
