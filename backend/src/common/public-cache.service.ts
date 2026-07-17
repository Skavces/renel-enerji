import { Injectable } from '@nestjs/common'

const TTL_MS = 60_000

// Public içerik GET'leri için 60sn'lik süreç içi cache (4.4). Yazan servis
// metodları bust() ile ilgili önekin tamamını düşürür; raw SQL kullanan reorder
// entity event'i üretmediğinden invalidation bilinçli olarak servis katmanında.
// Tek-instance varsayımı bilinçlidir (AdminConfigService ile aynı); yatay
// ölçeklemede Redis'e taşınmalı (4.7).
@Injectable()
export class PublicCacheService {
  private store = new Map<string, { value: unknown; expiresAt: number }>()

  // Hit → cache'teki değer; miss → fn() çalışır ve sonucu kaydedilir.
  // fn throw ederse cache'e yazılmaz: NotFound'lar cache'lenmez, slug anahtarları
  // yalnızca gerçekten var olan içerik kadar büyür.
  async wrap<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const hit = this.store.get(key)
    if (hit && hit.expiresAt > Date.now()) return hit.value as T
    const value = await fn()
    this.store.set(key, { value, expiresAt: Date.now() + TTL_MS })
    return value
  }

  bust(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key)
    }
  }
}
