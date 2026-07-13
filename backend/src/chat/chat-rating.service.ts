import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ChatRating } from './entities/chat-rating.entity'
import { ChatMessage } from './chat.service'

export interface RatingStats {
  total: number
  average: number
  counts: Record<1 | 2 | 3 | 4 | 5, number>
}

const PAGE_SIZE = 50

@Injectable()
export class ChatRatingService {
  constructor(
    @InjectRepository(ChatRating)
    private repo: Repository<ChatRating>,
  ) {}

  async create(rating: number, conversation: ChatMessage[], sessionId?: string): Promise<ChatRating> {
    try {
      return await this.repo.save(
        this.repo.create({
          rating,
          messageCount: conversation.filter(m => m.role === 'user').length,
          conversation: conversation.length ? conversation : null,
          sessionId: sessionId ?? null,
        }),
      )
    } catch (err) {
      // Unique ihlali: aynı sessionId ikinci kez puan gönderdi (spam/tekrar)
      if ((err as { code?: string })?.code === '23505') {
        throw new ConflictException('Bu sohbet için zaten bir değerlendirme gönderilmiş')
      }
      throw err
    }
  }

  async remove(id: string): Promise<void> {
    const rating = await this.repo.findOne({ where: { id } })
    if (!rating) throw new NotFoundException('Değerlendirme bulunamadı')
    await this.repo.remove(rating)
  }

  async findAllWithStats(
    page = 1,
  ): Promise<{ stats: RatingStats; ratings: ChatRating[]; page: number; pageCount: number }> {
    const [ratings, grouped] = await Promise.all([
      this.repo.find({ order: { createdAt: 'DESC' }, take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE }),
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
      page,
      pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    }
  }
}
