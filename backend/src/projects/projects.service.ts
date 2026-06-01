import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
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
