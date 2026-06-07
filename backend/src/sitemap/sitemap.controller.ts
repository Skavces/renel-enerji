import { Controller, Get, Header, Res } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Response } from 'express'
import { BlogPost } from '../blog/entities/blog-post.entity'
import { Project } from '../projects/entities/project.entity'

const SITE = 'https://renelenerji.com'

const STATIC_URLS = [
  { loc: '/', priority: '1.0', changefreq: 'weekly' },
  { loc: '/hizmetler', priority: '0.9', changefreq: 'monthly' },
  { loc: '/hizmetler/sulama', priority: '0.7', changefreq: 'monthly' },
  { loc: '/hizmetler/cati-arazi', priority: '0.7', changefreq: 'monthly' },
  { loc: '/hizmetler/bag-evi', priority: '0.7', changefreq: 'monthly' },
  { loc: '/hizmetler/ev-sarj', priority: '0.7', changefreq: 'monthly' },
  { loc: '/kurumsal', priority: '0.8', changefreq: 'monthly' },
  { loc: '/projelerimiz', priority: '0.8', changefreq: 'weekly' },
  { loc: '/referanslar', priority: '0.7', changefreq: 'weekly' },
  { loc: '/blog', priority: '0.8', changefreq: 'weekly' },
  { loc: '/sss', priority: '0.7', changefreq: 'monthly' },
  { loc: '/iletisim', priority: '0.6', changefreq: 'yearly' },
  { loc: '/neden-biz/muhendislik-altyapisi', priority: '0.6', changefreq: 'monthly' },
  { loc: '/neden-biz/anahtar-teslim-hizmet', priority: '0.6', changefreq: 'monthly' },
  { loc: '/neden-biz/surdurulebilir-enerji', priority: '0.6', changefreq: 'monthly' },
  { loc: '/neden-biz/verimlilik-odakli', priority: '0.6', changefreq: 'monthly' },
  { loc: '/neden-biz/yerel-ve-guvenilir', priority: '0.6', changefreq: 'monthly' },
  { loc: '/neden-biz/onayli-ekipmanlar', priority: '0.6', changefreq: 'monthly' },
]

@Controller('sitemap.xml')
export class SitemapController {
  constructor(
    @InjectRepository(BlogPost) private blogRepo: Repository<BlogPost>,
    @InjectRepository(Project) private projectRepo: Repository<Project>,
  ) {}

  @Get()
  @Header('Content-Type', 'application/xml; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=3600')
  async getSitemap(@Res() res: Response) {
    const [posts, projects] = await Promise.all([
      this.blogRepo.find({
        where: { published: true },
        select: ['slug', 'updatedAt', 'publishedAt'],
        order: { publishedAt: 'DESC' },
      }),
      this.projectRepo.find({
        where: { published: true },
        select: ['slug', 'updatedAt'],
        order: { sortOrder: 'ASC' },
      }),
    ])

    const urlTag = (loc: string, opts: { lastmod?: Date; priority: string; changefreq: string }) => {
      const lastmod = opts.lastmod ? `\n    <lastmod>${opts.lastmod.toISOString().split('T')[0]}</lastmod>` : ''
      return `  <url>\n    <loc>${SITE}${loc}</loc>${lastmod}\n    <changefreq>${opts.changefreq}</changefreq>\n    <priority>${opts.priority}</priority>\n  </url>`
    }

    const staticUrls = STATIC_URLS.map((u) => urlTag(u.loc, { priority: u.priority, changefreq: u.changefreq }))

    const blogUrls = posts.map((p) =>
      urlTag(`/blog/${p.slug}`, {
        lastmod: p.updatedAt || p.publishedAt,
        priority: '0.7',
        changefreq: 'monthly',
      }),
    )

    const projectUrls = projects.map((p) =>
      urlTag(`/projelerimiz/${p.slug}`, {
        lastmod: p.updatedAt,
        priority: '0.6',
        changefreq: 'monthly',
      }),
    )

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticUrls, ...blogUrls, ...projectUrls].join('\n')}
</urlset>`

    res.send(xml)
  }
}
