import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Cron, CronExpression } from '@nestjs/schedule'
import { IsNull, LessThan, Repository } from 'typeorm'
import { ChatLead } from './entities/chat-lead.entity'
import { ChatMessage } from './chat.service'
import { TelegramService } from '../notifications/telegram.service'

export interface LeadStats {
  total: number
  active: number
  whatsapp: number
}

// Bir konuşmanın "lead" sayılması için gereken kullanıcı mesajı sayısı
// (chatbot'taki WhatsApp butonu eşiğiyle aynı)
const LEAD_USER_MESSAGE_THRESHOLD = 2

// Konuşma bu süredir güncellenmemişse ve WhatsApp'a geçilmemişse "kaçan lead" bildirimi atılır
const MISSED_LEAD_AGE_MS = 15 * 60 * 1000

@Injectable()
export class ChatLeadService {
  private readonly logger = new Logger(ChatLeadService.name)

  constructor(
    @InjectRepository(ChatLead)
    private repo: Repository<ChatLead>,
    private telegram: TelegramService,
  ) {}

  async upsertFromChat(sessionId: string | undefined, messages: ChatMessage[], reply: string): Promise<void> {
    if (!sessionId) return
    const messageCount = messages.filter(m => m.role === 'user').length
    if (messageCount < LEAD_USER_MESSAGE_THRESHOLD) return

    const conversation = [...messages, { role: 'assistant' as const, content: reply }]
    const existing = await this.repo.findOne({ where: { sessionId } })
    if (existing) {
      existing.conversation = conversation
      existing.messageCount = messageCount
      await this.repo.save(existing)
    } else {
      await this.repo.save(this.repo.create({ sessionId, conversation, messageCount }))
    }
  }

  async markWhatsapp(sessionId: string | undefined): Promise<void> {
    if (!sessionId) return
    await this.repo.update({ sessionId }, { status: 'whatsapp' })
  }

  async attachRating(sessionId: string | undefined, rating: number): Promise<void> {
    if (!sessionId) return
    await this.repo.update({ sessionId }, { rating })
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id)
  }

  async findAllWithStats(): Promise<{ stats: LeadStats; leads: ChatLead[] }> {
    const [leads, total, whatsapp] = await Promise.all([
      this.repo.find({ order: { updatedAt: 'DESC' }, take: 200 }),
      this.repo.count(),
      this.repo.count({ where: { status: 'whatsapp' } }),
    ])
    return { stats: { total, whatsapp, active: total - whatsapp }, leads }
  }

  // WhatsApp'a geçenler bildirilmez — o talep zaten WhatsApp'a düşüyor.
  // Bildirim, konuşma bittikten (15 dk hareketsizlikten) sonra tek sefer gider.
  @Cron(CronExpression.EVERY_10_MINUTES)
  async notifyMissedLeads(): Promise<void> {
    try {
      const cutoff = new Date(Date.now() - MISSED_LEAD_AGE_MS)
      const missed = await this.repo.find({
        where: { status: 'active', notifiedAt: IsNull(), updatedAt: LessThan(cutoff) },
        order: { createdAt: 'ASC' },
        take: 10,
      })
      for (const lead of missed) {
        await this.telegram.send(this.formatMissedLead(lead))
        lead.notifiedAt = new Date()
        await this.repo.save(lead)
      }
    } catch (err) {
      this.logger.error(`Kaçan lead bildirimi başarısız: ${err instanceof Error ? err.message : err}`)
    }
  }

  private formatMissedLead(lead: ChatLead): string {
    const userMessages = (lead.conversation ?? [])
      .filter(m => m.role === 'user')
      .slice(0, 4)
      .map(m => `• ${m.content.slice(0, 120)}`)
      .join('\n')
    const time = lead.createdAt.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })
    return (
      `🔔 Yeni potansiyel talep (WhatsApp'a geçmedi)\n\n${userMessages}\n\n` +
      `Mesaj sayısı: ${lead.messageCount}\nSaat: ${time}\n\n` +
      `Detay: admin panel → Chatbot → Potansiyel Talepler`
    )
  }
}
