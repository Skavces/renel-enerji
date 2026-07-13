import { Controller, Get, Header, Res } from '@nestjs/common'
import type { Response } from 'express'
import { SitemapService } from './sitemap.service'

@Controller('sitemap.xml')
export class SitemapController {
  constructor(private readonly sitemapService: SitemapService) {}

  @Get()
  @Header('Content-Type', 'application/xml; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=3600')
  async getSitemap(@Res() res: Response) {
    res.send(await this.sitemapService.generateXml())
  }
}
