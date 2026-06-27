import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { fetchWithTimeout } from '../common/fetch-with-timeout'

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name)
  private token: string | null = null
  private tokenExpiry = 0

  constructor(private config: ConfigService) {}

  private get umamiUrl() {
    return this.config.get('UMAMI_URL', 'http://localhost:3000')
  }

  private get websiteId() {
    return this.config.get('UMAMI_WEBSITE_ID', '')
  }

  private async getToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiry) return this.token

    const res = await fetchWithTimeout(`${this.umamiUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: this.config.get('UMAMI_USER', 'admin'),
        password: this.config.get('UMAMI_PASS', 'umami'),
      }),
    })

    if (!res.ok) throw new Error('Umami auth failed')
    const data = await res.json()
    this.token = data.token
    this.tokenExpiry = Date.now() + 23 * 60 * 60 * 1000
    return this.token
  }

  private async fetch(path: string): Promise<any> {
    const token = await this.getToken()
    const res = await fetchWithTimeout(`${this.umamiUrl}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error(`Umami API error: ${res.status}`)
    return res.json()
  }

  async getStats(startAt: number, endAt: number) {
    if (!this.websiteId) return null
    return this.fetch(
      `/api/websites/${this.websiteId}/stats?startAt=${startAt}&endAt=${endAt}`,
    )
  }

  async getPageviews(startAt: number, endAt: number, unit: string) {
    if (!this.websiteId) return null
    return this.fetch(
      `/api/websites/${this.websiteId}/pageviews?startAt=${startAt}&endAt=${endAt}&unit=${unit}&timezone=Europe/Istanbul`,
    )
  }

  async getTopPages(startAt: number, endAt: number) {
    if (!this.websiteId) return null
    return this.fetch(
      `/api/websites/${this.websiteId}/metrics?startAt=${startAt}&endAt=${endAt}&type=path&limit=10`,
    )
  }

  async getMetrics(type: string, startAt: number, endAt: number) {
    if (!this.websiteId) return []
    return this.fetch(
      `/api/websites/${this.websiteId}/metrics?startAt=${startAt}&endAt=${endAt}&type=${type}&limit=8`,
    )
  }
}
