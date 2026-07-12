import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ChatLead } from './entities/chat-lead.entity'
import { ChatMessage } from './chat.service'

export interface LeadStats {
  total: number
  active: number
  whatsapp: number
}

// Bir konuşmanın "lead" sayılması için gereken kullanıcı mesajı sayısı
// (chatbot'taki WhatsApp butonu eşiğiyle aynı)
const LEAD_USER_MESSAGE_THRESHOLD = 2

@Injectable()
export class ChatLeadService {
  constructor(
    @InjectRepository(ChatLead)
    private repo: Repository<ChatLead>,
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
    const lead = await this.repo.findOne({ where: { id } })
    if (!lead) throw new NotFoundException('Talep bulunamadı')
    await this.repo.remove(lead)
  }

  async findAllWithStats(): Promise<{ stats: LeadStats; leads: ChatLead[] }> {
    const [leads, total, whatsapp] = await Promise.all([
      this.repo.find({ order: { updatedAt: 'DESC' }, take: 200 }),
      this.repo.count(),
      this.repo.count({ where: { status: 'whatsapp' } }),
    ])
    return { stats: { total, whatsapp, active: total - whatsapp }, leads }
  }
}
