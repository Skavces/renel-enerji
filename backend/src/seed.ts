import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { config } from 'dotenv'
import { Project } from './projects/entities/project.entity'
import { ProjectMedia } from './projects/entities/project-media.entity'

config()

const ds = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'postgres',
  database: process.env.DB_NAME || 'renel_enerji',
  entities: [Project, ProjectMedia],
})

const PROJECTS = [
  {
    slug: 'ahmetli-bag-projesi',
    name: 'Ahmetli Bağ Sulama Projesi',
    location: 'Ahmetli, Manisa',
    kw: 11,
    date: '2024',
    category: 'Sulama GES',
    description: 'Bağ alanına kurulan akıllı sistemle tarımsal sulama enerji maliyetleri sıfırlandı. 28 panel, uzaktan kontrol.',
    about: "Manisa Ahmetli'de gerçekleştirdiğimiz bu projede, bağ alanının üzerine kurduğumuz akıllı sistemle tarımsal sulamada enerji maliyetlerini sıfırladık.\n\nÇiftçimiz artık telefonundan tek tıkla sulama sistemini yönetiyor, enerjisini doğrudan güneşten alıyor. Verimli, çevreci ve ekonomik bir çözüm.",
    specsTitle: 'Sistem Detayları',
    specs: [
      '28 Adet 600W Kalyon Güneş Paneli',
      '15 HP (11 kW) Mexxsun Sürücü',
      'Uzaktan Kontrol ve Çalıştırma Sistemi',
      '12.5 HP Dalgıç Pompa Uyumu',
    ],
    highlightsTitle: 'Öne Çıkan Özellikler',
    highlights: [],
    statBoxes: [
      { value: '11 kW', label: 'Kurulu Güç' },
      { value: '28 Adet', label: 'Panel Sayısı' },
    ],
    sortOrder: 0,
  },
  {
    slug: 'hibrit-ges',
    name: '10,2 kW Hibrit GES Sistemi',
    location: 'Manisa',
    kw: 10.2,
    date: '2025',
    category: 'Depolamalı GES',
    description: '16 panel, hibrit invertör ve 15,3 kWh LiFePO₄ batarya ile kesintisiz enerji depolama sistemi.',
    about: 'RenEl Enerji Mühendislik olarak, yenilenebilir enerjiye verdiğimiz değeri bir adım daha ileriye taşıdık. 10,2 kW kapasiteli hibrit güneş enerji sistemimizi başarıyla devreye aldık.',
    specsTitle: 'Kullanılan Ekipmanlar',
    specs: [
      '16 Adet 610 Wp Solinved Güneş Paneli',
      '10,2 kW Hibrit İnvertör',
      '3 Adet 5,1 kWh LiFePO₄ Lityum Demir Fosfat Batarya',
      'Toplam 15,3 kWh Depolama Kapasitesi',
    ],
    highlightsTitle: 'Sistem Avantajları',
    highlights: [
      'Güneşten üretilen enerji en verimli şekilde kullanılıyor',
      'Bataryalar sayesinde kesintisiz enerji imkânı',
      'Hem çevre dostu hem uzun ömürlü çözüm',
    ],
    statBoxes: [
      { value: '10,2 kW', label: 'Kurulu Güç' },
      { value: '16', label: 'Panel' },
      { value: '15,3 kWh', label: 'Depolama' },
    ],
    sortOrder: 1,
  },
  {
    slug: '2-3kwp-hibrit-ges',
    name: '2,3 kWp Hibrit GES Sistemi',
    location: 'Manisa',
    kw: 2.3,
    date: '2025',
    category: 'Depolamalı GES',
    description: '4 panel, NP Power hibrit invertör ve jel akü desteğiyle kompakt ve ekonomik kesintisiz enerji çözümü.',
    about: '2,3 kWp gücündeki güneş enerji sistemimizi başarıyla devreye aldık. Jel akü desteğiyle hibrit çalışan bu sistem, kesintisiz enerji ihtiyacını karşılayan kompakt ve ekonomik bir çözüm sunuyor.',
    specsTitle: 'Kullanılan Ürünler',
    specs: [
      '4 Adet 575 Wp HSA Güneş Paneli',
      '3,5 kW NP Power Hibrit İnvertör',
      '2 Adet 12V 200Ah Orbus Jel Akü',
    ],
    highlightsTitle: 'Öne Çıkan Özellikler',
    highlights: [],
    statBoxes: [
      { value: '2,3 kWp', label: 'Kurulu Güç' },
      { value: '4', label: 'Panel' },
      { value: '4,8 kWh', label: 'Depolama' },
    ],
    sortOrder: 2,
  },
  {
    slug: '4kwp-bag-evi',
    name: '4 kWp Bağ Evi GES Sistemi',
    location: 'Manisa',
    kw: 4,
    date: '2025',
    category: 'Depolamalı GES',
    description: 'TOPCon panel, 6 kW hibrit invertör ve 5 kWh LiFePO₄ batarya ile şebekeden tamamen bağımsız bağ evi.',
    about: "Doğanın içinde, sessizliğin ortasında artık enerji kesintisi yok. 4 kWp güneş enerjisi sistemiyle bu bağ evi şebekeden tamamen bağımsız hale geldi; tüm enerji ihtiyacını güneşten karşılıyor.\n\nTemiz, sürdürülebilir ve uzun ömürlü bir çözüm.",
    specsTitle: 'Kullanılan Ekipmanlar',
    specs: [
      '575 W TOPCon Yüksek Verimli Güneş Panelleri',
      '6 kW Hibrit İnvertör',
      '5 kWh LiFePO₄ Lityum Demir Fosfat Batarya',
      'Alüminyum Paslanmaz Konstrüksiyon',
    ],
    highlightsTitle: 'Öne Çıkan Özellikler',
    highlights: [],
    statBoxes: [
      { value: '4 kWp', label: 'Kurulu Güç' },
      { value: '6 kW', label: 'İnvertör' },
      { value: '5 kWh', label: 'Depolama' },
    ],
    sortOrder: 3,
  },
  {
    slug: 'hayvan-ciftligi',
    name: 'Hayvan Çiftliği GES Kurulumu',
    location: 'Manisa',
    kw: 4.6,
    date: '2025',
    category: 'Depolamalı GES',
    description: 'Çatı tipi 4,6 kW GES ve 5 kWh LiFePO₄ batarya ile sağım, havalandırma ve aydınlatmada kesintisiz enerji.',
    about: 'Hayvan çiftliği için özel olarak tasarladığımız 4,6 kW çatı tipi GES sistemi ve 5 kWh LiFePO₄ batarya kurulumu başarıyla tamamlandı. Çiftlikteki temel elektrik ihtiyaçları artık yenilenebilir enerji ile kesintisiz ve ekonomik şekilde karşılanıyor.',
    specsTitle: 'Sistem Özellikleri',
    specs: [
      '4,6 kW Yüksek Verimli Güneş Paneli Grubu',
      '5 kWh LiFePO₄ Uzun Ömürlü Batarya',
      'Çatı Tipi Montaj Sistemi',
    ],
    highlightsTitle: 'Hayvancılık İşletmeleri İçin Avantajlar',
    highlights: [
      'Elektrik kesintilerinden etkilenmeyen çalışma',
      'Süt sağım, havalandırma, aydınlatma ve su motorları için kararlı enerji',
      'Gece kullanımında kesintisiz enerji desteği',
      'Düşük bakım maliyeti, uzun ömürlü depolama teknolojisi',
      'Tarım ve hayvancılık işletmeleri için ideal çözüm',
    ],
    statBoxes: [
      { value: '4,6 kW', label: 'Kurulu Güç' },
      { value: '5 kWh', label: 'Depolama' },
    ],
    sortOrder: 4,
  },
  {
    slug: 'off-grid',
    name: 'Off-Grid Güneş Enerji Sistemi',
    location: 'Manisa',
    kw: 3.75,
    date: '2025',
    category: 'Off-Grid GES',
    description: '6 adet TOPCon panel, 4 kW premium invertör ve LiFePO₄ batarya ile şebekeden tamamen bağımsız sistem.',
    about: 'Eviniz, iş yeriniz veya tarımsal uygulamalarınız için kesintisiz enerji çözümleri üretiyoruz. Bu projede 6 adet TOPCon panel, premium invertör ve LiFePO₄ batarya kombinasyonuyla şebekeden tamamen bağımsız bir sistem kuruldu.',
    specsTitle: 'Sistem Özellikleri',
    specs: [
      '6 Adet 625 W TOPCon Güneş Paneli',
      '4 kW Premium İnvertör',
      '2 Adet 12V 100Ah LiFePO₄ Batarya',
    ],
    highlightsTitle: 'Öne Çıkan Özellikler',
    highlights: [
      'Yüksek verim, uzun ömür, güvenli enerji depolama',
      'Şebekeden tamamen bağımsız çalışma',
      'Konut, iş yeri ve tarımsal uygulamalara uygun',
      'Sürdürülebilir ve çevre dostu enerji çözümü',
    ],
    statBoxes: [
      { value: '3,75 kWp', label: 'Kurulu Güç' },
      { value: '6', label: 'Panel' },
      { value: '2,4 kWh', label: 'Depolama' },
    ],
    sortOrder: 5,
  },
  {
    slug: 'sebekesiz-sulama-cozumu',
    name: 'Şebekesiz Sulama Çözümü',
    location: 'Manisa',
    kw: 1.1,
    date: '2025',
    category: 'Şebekesiz Sulama',
    description: 'Sadece 2 panel ile şebekeden bağımsız sulama. DC dalgıç pompa + DC yüzey pompası, inverter yok, kayıp yok.',
    about: 'Müşterimiz için sadece 2 adet 550W güneş paneli kullanarak şebekeden tamamen bağımsız bir sulama sistemi kuruldu. DC dalgıç pompa 50 metre derinlikten saatte 2 ton su çekerken, DC yüzey pompası havuzdan damlama sulamayı besliyor. Inverter olmadığı için dönüşüm kaybı yok, kurulum maliyeti düşük.',
    specsTitle: 'Sistem Özellikleri',
    specs: [
      '2 Adet 550 Watt Güneş Paneli (Toplam 1.1 kWp)',
      '0.8 HP DC Dalgıç Pompa – 50 m derinlikten saatte 2 ton su',
      '1 HP DC Yüzey Pompası – havuzdan damlama sulama',
      'Tamamen DC sistem – inverter yok, kayıp yok!',
    ],
    highlightsTitle: 'Öne Çıkan Özellikler',
    highlights: [
      'Şebekeden tamamen bağımsız sulama sistemi',
      'Sadece 2 panelle tarla sulamaya başla',
      'DC sistem sayesinde maksimum verim, sıfır dönüşüm kaybı',
      'Güneş yoğunluğuna göre otomatik pompa hız kontrolü',
      'Minimal bakım, sıfır işletme maliyeti',
    ],
    statBoxes: [
      { value: '1,1 kWp', label: 'Kurulu Güç' },
      { value: '2', label: 'Panel' },
      { value: '2 Ton', label: 'Saatte Su Debisi' },
    ],
    sortOrder: 6,
  },
]

// Seed yalnızca metin içeriğini yükler. Medya dosyaları repoda tutulmuyor;
// görseller admin panelden yüklenir ya da Instagram senkronuyla gelir.
async function seed() {
  await ds.initialize()
  console.log('DB bağlandı')

  const projectRepo = ds.getRepository(Project)

  const existing = await projectRepo.count()
  if (existing > 0) {
    console.log(`Veritabanında zaten ${existing} proje var. Seed atlanıyor.`)
    await ds.destroy()
    return
  }

  for (const data of PROJECTS) {
    const saved = await projectRepo.save(projectRepo.create(data))
    console.log(`✓ ${saved.name}`)
  }

  console.log('Seed tamamlandı! Proje görsellerini admin panelden ekleyebilirsiniz.')
  await ds.destroy()
}

seed().catch((err) => {
  console.error('Seed hatası:', err)
  process.exit(1)
})
