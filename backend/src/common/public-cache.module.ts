import { Global, Module } from '@nestjs/common'
import { PublicCacheService } from './public-cache.service'

// RedisModule gibi global: içerik servisleri ve mutasyon yapan her yer
// (media, Instagram importu) modül importu olmadan inject edebilsin
@Global()
@Module({
  providers: [PublicCacheService],
  exports: [PublicCacheService],
})
export class PublicCacheModule {}
