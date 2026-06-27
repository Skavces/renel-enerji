import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { config } from 'dotenv'
import { Project } from './projects/entities/project.entity'
import { MediaType, ProjectMedia } from './projects/entities/project-media.entity'

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
    media: [
      { type: 'image', src: '/bag-projesi/SnapInsta.to_658048509_17877068112551552_3955411799585925962_n.jpg' },
      { type: 'image', src: '/bag-projesi/SnapInsta.to_658993120_17877068097551552_530301442728432572_n.jpg' },
      { type: 'image', src: '/bag-projesi/SnapInsta.to_656829483_17877068085551552_9099235329430647652_n.jpg' },
      { type: 'image', src: '/bag-projesi/SnapInsta.to_657225888_17877068076551552_781352117709125062_n.jpg' },
      { type: 'image', src: '/bag-projesi/SnapInsta.to_656367211_17877068067551552_5595932734356314435_n.jpg' },
    ],
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
    media: [
      { type: 'image', src: '/hibrit-ges/SnapInsta.to_540529601_17847453474551552_7890774048914980763_n.jpg' },
      { type: 'image', src: '/hibrit-ges/SnapInsta.to_540609246_17847453456551552_8132941253529611121_n.jpg' },
      { type: 'image', src: '/hibrit-ges/SnapInsta.to_540388995_17847453465551552_5607991210025723648_n.jpg' },
      { type: 'image', src: '/hibrit-ges/SnapInsta.to_539550993_17847453438551552_4441868670112979963_n.jpg' },
      { type: 'image', src: '/hibrit-ges/SnapInsta.to_539538434_17847453447551552_6919977082585415323_n.jpg' },
      { type: 'video', src: '/hibrit-ges/SnapInsta.to_AQMM_5yxVmBDc-PC8E0GJ-xbcdK4vFofDOvzCSjdFNzN5u9E55kgUmvOSs95K3hZqIKHjiLZ1MVVA0aeIdMgrBVp_i3PL-y0Q6cXxoA.mp4' },
    ],
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
    media: [
      { type: 'image', src: '/2,3kWp/SnapInsta.to_567104077_17854973667551552_2686719391728865953_n.jpg' },
      { type: 'image', src: '/2,3kWp/SnapInsta.to_566644862_17854973658551552_5090855825196779551_n.jpg' },
      { type: 'video', src: '/2,3kWp/SnapInsta.to_AQOvXlOWAM_J8kevQ6EErVeTctoHTeli2Y1qGDEoBIq2kL0tOUJ43HDFEIeF994hcjOjrFrrKgvdAJdwFt9deILFojy09ts0-qQhnus.mp4' },
    ],
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
    media: [
      { type: 'image', src: '/4kwp-bagevi/SnapInsta.to_572962383_17857134906551552_2235488587040886983_n.jpg' },
      { type: 'image', src: '/4kwp-bagevi/SnapInsta.to_573313405_17857134897551552_1782090065706594247_n.jpg' },
      { type: 'image', src: '/4kwp-bagevi/SnapInsta.to_573689641_17857134888551552_2721821468274745229_n.jpg' },
    ],
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
    media: [
      { type: 'image', src: '/hayvan-ciftligi/SnapInsta.to_581867901_17858371554551552_1664283504094743853_n.jpg' },
      { type: 'image', src: '/hayvan-ciftligi/SnapInsta.to_581865005_17858371542551552_3948687021531757533_n.jpg' },
      { type: 'image', src: '/hayvan-ciftligi/SnapInsta.to_583637153_17858371530551552_7037390681860944930_n.jpg' },
      { type: 'image', src: '/hayvan-ciftligi/SnapInsta.to_582194221_17858371521551552_1754378382427015973_n.jpg' },
    ],
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
    media: [
      { type: 'image', src: '/off-grid/SnapInsta.to_606030691_17863261425551552_5849723382801399238_n.jpg' },
      { type: 'image', src: '/off-grid/SnapInsta.to_606302793_17863261416551552_3153582796018964246_n.jpg' },
      { type: 'image', src: '/off-grid/SnapInsta.to_606927601_17863261407551552_6676336886876542149_n.jpg' },
      { type: 'video', src: '/off-grid/SnapInsta.to_AQPvEJkOFwuaV-xVLx98EKIoZngi2rbv1XfuvObEpujnXhjq9zyGtjac4ufO4krLyAvUr_R7-zTrFRj51AGfCus8JT9IZ5U-wx79w_k.mp4' },
    ],
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
    media: [
      { type: 'image', src: '/sebekesiz-sulama-cozumu/SnapInsta.to_685360645_17882474067551552_3241083911849974964_n.jpg' },
      { type: 'image', src: '/sebekesiz-sulama-cozumu/SnapInsta.to_684650418_17882474049551552_284955555832794576_n.jpg' },
      { type: 'image', src: '/sebekesiz-sulama-cozumu/SnapInsta.to_686047932_17882474058551552_262508276789012101_n.jpg' },
      { type: 'video', src: '/sebekesiz-sulama-cozumu/SnapInsta.to_AQO0z0q21Up5hQbavNOpj8ICPChj1TMNx9csHXkkTM18gC3SSYkze-4zeenssb0AcM9d9Kz6EDqAQEx_n2h1X71Q2T8aKdol6G1Rrck.mp4' },
    ],
  },
]

async function seed() {
  await ds.initialize()
  console.log('DB bağlandı')

  const projectRepo = ds.getRepository(Project)
  const mediaRepo = ds.getRepository(ProjectMedia)

  const existing = await projectRepo.count()
  if (existing > 0) {
    console.log(`Veritabanında zaten ${existing} proje var. Seed atlanıyor.`)
    await ds.destroy()
    return
  }

  for (const data of PROJECTS) {
    const { media, ...projectData } = data
    const project = projectRepo.create(projectData)
    const saved = await projectRepo.save(project)

    for (let i = 0; i < media.length; i++) {
      const m = mediaRepo.create({ project: saved, type: media[i].type as MediaType, src: media[i].src, sortOrder: i })
      await mediaRepo.save(m)
    }

    console.log(`✓ ${saved.name}`)
  }

  console.log('Seed tamamlandı!')
  await ds.destroy()
}

seed().catch((err) => {
  console.error('Seed hatası:', err)
  process.exit(1)
})
