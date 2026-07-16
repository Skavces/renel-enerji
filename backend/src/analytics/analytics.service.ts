import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { fetchWithTimeout } from '../common/fetch-with-timeout'

interface UmamiStat { value: number; change: number }
export interface UmamiStats {
  pageviews: UmamiStat
  visitors: UmamiStat
  visits: UmamiStat
  bounces: UmamiStat
  totaltime: UmamiStat
}
interface UmamiSeriesPoint { x: string; y: number }
export interface UmamiPageviews {
  pageviews: UmamiSeriesPoint[]
  sessions: UmamiSeriesPoint[]
}
export interface UmamiMetric { x: string; y: number }

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name)
  private token: string | null = null
  private tokenExpiry = 0
  // Eşzamanlı dashboard istekleri ayrı ayrı Umami login'i tetiklemesin;
  // devam eden login varsa herkes aynı Promise'i bekler (single-flight)
  private tokenPromise: Promise<string> | null = null

  constructor(private config: ConfigService) {}

  private get umamiUrl() {
    return this.config.get('UMAMI_URL', 'http://localhost:3000')
  }

  private get websiteId() {
    return this.config.get('UMAMI_WEBSITE_ID', '')
  }

  private getToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiry) return Promise.resolve(this.token)

    // finally ile temizlenir: başarıda cache dolu olduğundan tekrar gelinmez,
    // hatada bir sonraki istek yeni login denemesi yapabilir
    this.tokenPromise ??= this.login().finally(() => {
      this.tokenPromise = null
    })
    return this.tokenPromise
  }

  private async login(): Promise<string> {
    const username = this.config.get<string>('UMAMI_USER')
    const password = this.config.get<string>('UMAMI_PASS')
    if (!username || !password) throw new Error('UMAMI_USER ve UMAMI_PASS env var zorunlu')

    const res = await fetchWithTimeout(`${this.umamiUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    if (!res.ok) throw new Error('Umami auth failed')
    const data = await res.json()
    const token: string = data.token
    this.token = token
    this.tokenExpiry = Date.now() + 23 * 60 * 60 * 1000
    return token
  }

  private async fetch<T>(path: string, retried = false): Promise<T> {
    const token = await this.getToken()
    const res = await fetchWithTimeout(`${this.umamiUrl}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    // Umami restart'ında cache'lenen token 23 saate kadar geçersiz kalabiliyordu;
    // 401'de cache'i düşürüp yeni token'la bir kez daha dene
    if (res.status === 401 && !retried) {
      this.token = null
      this.tokenExpiry = 0
      return this.fetch<T>(path, true)
    }
    if (!res.ok) throw new Error(`Umami API error: ${res.status}`)
    return res.json()
  }

  async getStats(startAt: number, endAt: number): Promise<UmamiStats | null> {
    if (!this.websiteId) return null
    try {
      return await this.fetch<UmamiStats>(`/api/websites/${this.websiteId}/stats?startAt=${startAt}&endAt=${endAt}`)
    } catch (err) {
      this.logger.warn('Umami getStats hatası:', err)
      return null
    }
  }

  async getPageviews(startAt: number, endAt: number, unit: string): Promise<UmamiPageviews | null> {
    if (!this.websiteId) return null
    try {
      return await this.fetch<UmamiPageviews>(
        `/api/websites/${this.websiteId}/pageviews?startAt=${startAt}&endAt=${endAt}&unit=${unit}&timezone=Europe/Istanbul`,
      )
    } catch (err) {
      this.logger.warn('Umami getPageviews hatası:', err)
      return null
    }
  }

  async getTopPages(startAt: number, endAt: number): Promise<UmamiMetric[] | null> {
    if (!this.websiteId) return null
    try {
      return await this.fetch<UmamiMetric[]>(
        `/api/websites/${this.websiteId}/metrics?startAt=${startAt}&endAt=${endAt}&type=path&limit=10`,
      )
    } catch (err) {
      this.logger.warn('Umami getTopPages hatası:', err)
      return null
    }
  }

  async getMetrics(type: string, startAt: number, endAt: number): Promise<UmamiMetric[]> {
    if (!this.websiteId) return []
    try {
      return await this.fetch<UmamiMetric[]>(
        `/api/websites/${this.websiteId}/metrics?startAt=${startAt}&endAt=${endAt}&type=${type}&limit=8`,
      )
    } catch (err) {
      this.logger.warn('Umami getMetrics hatası:', err)
      return []
    }
  }
}
