import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Reference } from './entities/reference.entity'
import { BaseContentService } from '../common/base-content.service'
import { PublicCacheService } from '../common/public-cache.service'

@Injectable()
export class ReferencesService extends BaseContentService<Reference> {
  protected readonly entityClass = Reference
  protected readonly notFoundMessage = 'Referans bulunamadı'
  protected readonly fileField = 'logo'

  constructor(@InjectRepository(Reference) repo: Repository<Reference>, cache: PublicCacheService) {
    super(repo, cache)
  }
}
