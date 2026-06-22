import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as sharp from 'sharp'
import { writeFile } from 'fs/promises'
import { Project } from './entities/project.entity'
import { ProjectMedia } from './entities/project-media.entity'
import { CreateProjectDto } from './dto/create-project.dto'
import { UpdateProjectDto } from './dto/update-project.dto'

const PARSE_PROMPT = `Sen RenEl Enerji şirketinin web sitesi için Instagram gönderilerinden proje bilgisi çıkaran bir içerik asistanısın.

Aşağıdaki Instagram gönderisini analiz et ve SADECE şu JSON formatında yanıt ver, başka hiçbir şey yazma:

{
  "name": "Proje adı. Güç değeri varsa başa yaz, sonra sistem tipi. Gerçek örnekler: '10,2 kW Hibrit GES Sistemi', '4 kWp Bağ Evi GES Sistemi', 'Hayvan Çiftliği GES Kurulumu', 'Ahmetli Bağ Sulama Projesi'",
  "location": "Sadece şehir adı (örn: 'Manisa', 'Balıkesir')",
  "kw": 11.25,
"description": "Liste sayfası için 1 cümle. Teknik özellikleri virgülle sırala, sonuna müşteri faydası ekle. Gerçek örnekler: '16 panel, hibrit invertör ve 15,3 kWh LiFePO₄ batarya ile kesintisiz enerji depolama sistemi.' / 'Çatı tipi 4,6 kW GES ve 5 kWh LiFePO₄ batarya ile sağım, havalandırma ve aydınlatmada kesintisiz enerji.'",
  "about": "Detay sayfası için 2-3 cümle. Müşteriye ne kazandırdığını anlat, gönderinin canlı dilini koru. Gerçek örnekler: 'Doğanın içinde, sessizliğin ortasında artık enerji kesintisi yok. 4 kWp güneş enerjisi sistemiyle bu bağ evi şebekeden tamamen bağımsız hale geldi.' / 'Manisa Ahmetli'de bağ alanına kurduğumuz akıllı sistemle tarımsal sulamada enerji maliyetlerini sıfırladık. Çiftçimiz artık telefonundan tek tıkla sulama sistemini yönetiyor.'",
  "specs": ["N Adet XW Marka Panel formatında — örn: '28 Adet 600W Kalyon Güneş Paneli'", "X kW Tip İnvertör — örn: '10,2 kW Hibrit İnvertör'", "X kWh LiFePO₄ Batarya — örn: '15,3 kWh Depolama Kapasitesi'"],
  "highlights": ["Müşteri faydası odaklı kısa maddeler", "Gerçek örnekler: 'Elektrik kesintilerinden etkilenmeyen çalışma'", "'Şebekeden tamamen bağımsız çalışma'", "'DC sistem sayesinde maksimum verim, sıfır dönüşüm kaybı'"],
  "statBoxes": [{"value": "11,25 kWp", "label": "Kurulu Güç"}, {"value": "15 kWh", "label": "Depolama"}, {"value": "18", "label": "Panel"}],
  "date": "2025"
}

Kurallar:
- Sayılarda Türkçe ondalık ayracı kullan: 11,25 kWp (nokta değil virgül) — SADECE kw alanı hariç (JavaScript sayısı: 11.25)
- specs formatı: "N Adet XW Marka Panel", "X kW Tip İnvertör", "X kWh Tip Batarya"
- highlights müşteriye "ne işe yarar" sorusunu yanıtlar, fiil veya isim cümlesi
- statBoxes: value çok kısa (sadece sayı+birim), label açıklayıcı
- Emin olamadığın alanlar için boş string ("") ya da boş dizi ([]) kullan
- Hiçbir alanda markdown kullanma — yıldız (*), çift yıldız (**), alt çizgi (_) kesinlikle yazma`

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectRepo: Repository<Project>,
    @InjectRepository(ProjectMedia)
    private mediaRepo: Repository<ProjectMedia>,
    private config: ConfigService,
  ) {}

  findAllPublic() {
    return this.projectRepo.find({
      where: { published: true },
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    })
  }

  findAll() {
    return this.projectRepo.find({ order: { sortOrder: 'ASC', createdAt: 'DESC' } })
  }

  async findBySlug(slug: string) {
    const project = await this.projectRepo.findOne({ where: { slug } })
    if (!project) throw new NotFoundException('Proje bulunamadı')
    return project
  }

  async findById(id: string) {
    const project = await this.projectRepo.findOne({ where: { id } })
    if (!project) throw new NotFoundException('Proje bulunamadı')
    return project
  }

  async create(dto: CreateProjectDto) {
    const existing = await this.projectRepo.findOne({ where: { slug: dto.slug } })
    if (existing) throw new ConflictException('Bu slug zaten kullanımda')
    const project = this.projectRepo.create(dto)
    return this.projectRepo.save(project)
  }

  async update(id: string, dto: UpdateProjectDto) {
    const project = await this.findById(id)
    if (dto.slug && dto.slug !== project.slug) {
      const existing = await this.projectRepo.findOne({ where: { slug: dto.slug } })
      if (existing) throw new ConflictException('Bu slug zaten kullanımda')
    }
    Object.assign(project, dto)
    return this.projectRepo.save(project)
  }

  async remove(id: string) {
    const project = await this.findById(id)
    await this.projectRepo.remove(project)
  }

  async reorderProjects(orderedIds: string[]) {
    await Promise.all(
      orderedIds.map((id, index) => this.projectRepo.update(id, { sortOrder: index })),
    )
  }

  async addMedia(projectId: string, type: string, src: string) {
    const project = await this.findById(projectId)
    const count = await this.mediaRepo.count({ where: { project: { id: projectId } } })
    const media = this.mediaRepo.create({ project, type, src, sortOrder: count })
    return this.mediaRepo.save(media)
  }

  async removeMedia(projectId: string, mediaId: string) {
    const media = await this.mediaRepo.findOne({
      where: { id: mediaId, project: { id: projectId } },
    })
    if (!media) throw new NotFoundException('Medya bulunamadı')
    await this.mediaRepo.remove(media)
  }

  async reorderMedia(projectId: string, orderedIds: string[]) {
    await Promise.all(
      orderedIds.map((id, index) =>
        this.mediaRepo.update({ id, project: { id: projectId } }, { sortOrder: index }),
      ),
    )
    return this.findById(projectId)
  }

  async syncInstagram(autoPublish = false): Promise<{ imported: number; skipped: number }> {
    const token = this.config.get<string>('INSTAGRAM_ACCESS_TOKEN')
    const userId = this.config.get<string>('INSTAGRAM_USER_ID')
    if (!token || !userId) {
      throw new InternalServerErrorException('INSTAGRAM_ACCESS_TOKEN veya INSTAGRAM_USER_ID .env dosyasında tanımlı değil')
    }

    const apiUrl =
      `https://graph.instagram.com/v21.0/${userId}/media` +
      `?fields=id,caption,media_url,thumbnail_url,media_type,timestamp,children{id,media_url,media_type,thumbnail_url}` +
      `&limit=50&access_token=${token}`

    const res = await fetch(apiUrl)
    if (!res.ok) {
      const err = await res.text()
      throw new InternalServerErrorException(`Instagram API hatası: ${err}`)
    }

    const data = await res.json()
    const posts: any[] = (data.data ?? []).filter(
      (p: any) => p.caption?.toLowerCase().includes('#proje'),
    )

    let imported = 0
    let skipped = 0

    for (const post of posts) {
      const already = await this.projectRepo.findOne({ where: { instagramMediaId: post.id } })
      if (already) {
        skipped++
        continue
      }

      let parsed: any
      try {
        parsed = await this.parseInstagram(post.caption)
      } catch {
        skipped++
        continue
      }

      const baseSlug = this.toSlug(parsed.name)
      const slug = await this.uniqueSlug(baseSlug)

      const project = this.projectRepo.create({
        slug,
        name: parsed.name || 'Instagram Proje',
        location: parsed.location || '',
        kw: parsed.kw || 0,
        date: parsed.date || String(new Date().getFullYear()),
        description: parsed.description || '',
        about: parsed.about || '',
        specs: parsed.specs || [],
        highlights: parsed.highlights || [],
        statBoxes: parsed.statBoxes || [],
        category: parsed.category || null,
        published: autoPublish,
        instagramMediaId: post.id,
      })
      const saved = await this.projectRepo.save(project)
      await this.importInstagramImages(saved, post)
      imported++
    }

    return { imported, skipped }
  }

  private toSlug(name: string): string {
    if (!name) return 'proje'
    return name
      .toLowerCase()
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
      .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'proje'
  }

  private async uniqueSlug(base: string): Promise<string> {
    let slug = base
    let n = 0
    while (await this.projectRepo.findOne({ where: { slug } })) {
      n++
      slug = `${base}-${n}`
    }
    return slug
  }

  private async importInstagramImages(project: Project, post: any): Promise<void> {
    const items: { url: string; type: 'image' | 'video' }[] = []

    if (post.media_type === 'IMAGE' && post.media_url) {
      items.push({ url: post.media_url, type: 'image' })
    } else if (post.media_type === 'VIDEO' && post.media_url) {
      if (post.thumbnail_url) items.push({ url: post.thumbnail_url, type: 'image' })
      items.push({ url: post.media_url, type: 'video' })
    } else if (post.media_type === 'CAROUSEL_ALBUM') {
      for (const child of post.children?.data ?? []) {
        if (child.media_type === 'IMAGE' && child.media_url) {
          items.push({ url: child.media_url, type: 'image' })
        } else if (child.media_type === 'VIDEO' && child.media_url) {
          if (child.thumbnail_url) items.push({ url: child.thumbnail_url, type: 'image' })
          items.push({ url: child.media_url, type: 'video' })
        }
      }
    }

    for (const item of items) {
      try {
        const r = await fetch(item.url)
        if (!r.ok) continue
        const buf = Buffer.from(await r.arrayBuffer())

        if (item.type === 'video') {
          const filename = `${project.slug}-ig-${Date.now()}-${Math.round(Math.random() * 1e4)}.mp4`
          await writeFile(`./uploads/${filename}`, buf)
          await this.addMedia(project.id, 'video', `/uploads/${filename}`)
        } else {
          const filename = `${project.slug}-ig-${Date.now()}-${Math.round(Math.random() * 1e4)}.webp`
          await sharp(buf).webp({ quality: 82 }).toFile(`./uploads/${filename}`)
          await this.addMedia(project.id, 'image', `/uploads/${filename}`)
        }
      } catch {
        // medya indirilemezse geç
      }
    }
  }

  async parseInstagram(text: string) {
    const apiKey = this.config.get<string>('GROQ_API_KEY')
    if (!apiKey) throw new InternalServerErrorException('GROQ_API_KEY tanımlı değil')

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: PARSE_PROMPT },
          { role: 'user', content: text },
        ],
        temperature: 0,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new InternalServerErrorException(`Groq API hatası: ${err}`)
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content ?? ''

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new InternalServerErrorException('Grok geçersiz yanıt döndürdü')

    return JSON.parse(jsonMatch[0])
  }
}
