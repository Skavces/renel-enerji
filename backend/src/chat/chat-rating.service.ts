import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ChatRating } from './entities/chat-rating.entity'
import { ChatMessage } from './chat.service'

export interface RatingStats {
  total: number
  average: number
  counts: Record<1 | 2 | 3 | 4 | 5, number>
}

@Injectable()
export class ChatRatingService {
  constructor(
    @InjectRepository(ChatRating)
    private repo: Repository<ChatRating>,
  ) {}

  create(rating: number, conversation: ChatMessage[]): Promise<ChatRating> {
    return this.repo.save(
      this.repo.create({
        rating,
        messageCount: conversation.filter(m => m.role === 'user').length,
        conversation: conversation.length ? conversation : null,
      }),
    )
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id)
  }

  async findAllWithStats(): Promise<{ stats: RatingStats; ratings: ChatRating[] }> {
    const [ratings, grouped] = await Promise.all([
      this.repo.find({ order: { createdAt: 'DESC' }, take: 200 }),
      this.repo
        .createQueryBuilder('r')
        .select('r.rating', 'rating')
        .addSelect('COUNT(*)', 'count')
        .groupBy('r.rating')
        .getRawMany<{ rating: number; count: string }>(),
    ])

    const counts: RatingStats['counts'] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    let total = 0
    let sum = 0
    for (const row of grouped) {
      const count = Number(row.count)
      counts[Number(row.rating) as keyof RatingStats['counts']] = count
      total += count
      sum += Number(row.rating) * count
    }

    return {
      stats: { total, average: total ? Number((sum / total).toFixed(2)) : 0, counts },
      ratings,
    }
  }
}
