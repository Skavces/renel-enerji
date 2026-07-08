import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Sun, Zap, PanelTop, Ruler, TrendingUp, MessageCircle, ChevronDown } from 'lucide-react'
import SEO from '../components/SEO'
import PageHeader from '../components/PageHeader'
import { TARIFFS, calculateGes, parseBillInput } from '../lib/gesCalc'

const formatTl = value => value.toLocaleString('tr-TR')

const FAQS = [
  {
    question: 'Hesaplama sonuçları ne kadar doğru?',
    answer:
      'Sonuçlar Ege bölgesi ortalama güneşlenme (özgül üretim) değerleri ve güncel ortalama tarife fiyatları kullanılarak hesaplanan tahmini rakamlardır. Çatınızın yönü, eğimi, gölgelenme durumu ve gerçek tüketim profiliniz sonucu değiştirebilir; kesin sistem gücü ve fiyat için ücretsiz yerinde keşif gereklidir.',
  },
  {
    question: 'Güneş enerjisi sistemi kendini kaç yılda amorti eder?',
    answer:
      'Sistem büyüklüğüne, tüketim alışkanlıklarınıza ve güncel elektrik/malzeme fiyatlarına bağlı olarak değişmekle birlikte, GES yatırımları Türkiye\'de genellikle 4-7 yıl içinde kendini amorti eder. Sistem 25 yılın üzerinde üretime devam eder.',
  },
  {
    question: 'Çatım güneye bakmıyor, yine de güneş enerjisi kurabilir miyim?',
    answer:
      'Evet. Doğu-batı yönlü çatılarda da GES kurulumu mümkündür; üretim güney cepheye göre bir miktar daha düşük olabilir. Kesin üretim tahmini için çatınızı yerinde inceleyip size özel bir simülasyon hazırlıyoruz.',
  },
  {
    question: 'Panel sayısı ve sistem gücü (kWp) nasıl belirleniyor?',
    answer:
      'Yıllık elektrik tüketiminiz, bölge ortalama güneşlenme verimine bölünerek ihtiyaç duyduğunuz sistem gücü (kWp) bulunur. Panel sayısı ise bu gücün, kullanılan panel başına gücüne (yaklaşık 550W) bölünmesiyle hesaplanır.',
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'Güneş Enerjisi Tasarruf Hesaplayıcı',
      url: 'https://renelenerji.com/tasarruf-hesaplayici',
      description:
        'Aylık elektrik faturanızı girin; size uygun güneş enerjisi sistemi gücünü, panel sayısını, gerekli çatı alanını ve yıllık tasarrufunuzu anında hesaplayın.',
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'TRY' },
      provider: { '@type': 'Organization', name: 'RenEL Enerji Mühendislik', url: 'https://renelenerji.com' },
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQS.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    },
  ],
}

export default function TasarrufHesaplayici() {
  const [searchParams] = useSearchParams()
  const [bill, setBill] = useState(parseBillInput(searchParams.get('fatura') || ''))
  const [tariff, setTariff] = useState(
    TARIFFS.some(t => t.id === searchParams.get('tarife')) ? searchParams.get('tarife') : 'mesken'
  )

  const result = calculateGes(Number(bill), tariff)

  const cards = result && [
    { icon: Sun, label: 'Önerilen Sistem Gücü', value: `${result.systemKwp.toLocaleString('tr-TR')} kWp` },
    { icon: PanelTop, label: 'Panel Sayısı (~550W)', value: `${result.panelCount} adet` },
    { icon: Ruler, label: 'Gerekli Çatı Alanı', value: `~${result.roofArea} m²` },
    { icon: Zap, label: 'Tahmini Yıllık Üretim', value: `${formatTl(result.annualProduction)} kWh` },
    { icon: TrendingUp, label: 'Yıllık Tasarruf', value: `${formatTl(result.annualSavings)} TL` },
  ]

  return (
    <>
      <SEO
        title="Güneş Enerjisi Tasarruf Hesaplayıcı"
        description="Aylık elektrik faturanızı girin; size uygun güneş enerjisi sistemi gücünü, panel sayısını, gerekli çatı alanını ve yıllık tasarrufunuzu anında hesaplayın."
        jsonLd={jsonLd}
      />
      <PageHeader title="Tasarruf Hesaplayıcı" />

      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Ne kadar tasarruf edebilirsiniz?</h2>
            <p className="text-base text-gray-500 mb-8">
              Aylık elektrik faturanızı girin, size uygun sistemi ve yıllık tasarrufunuzu anında görün.
            </p>

            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Tüketim Tipi</p>
            <div className="flex flex-wrap gap-3 mb-6">
              {TARIFFS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTariff(t.id)}
                  className={`px-5 py-2.5 rounded-lg text-base font-medium transition-colors ${
                    tariff === t.id
                      ? 'bg-[#448834] text-white'
                      : 'bg-gray-50 border border-gray-200 text-gray-600 hover:border-[#448834]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="relative mb-10">
              <input
                type="text"
                inputMode="numeric"
                value={bill ? Number(bill).toLocaleString('tr-TR') : ''}
                onChange={e => setBill(parseBillInput(e.target.value))}
                placeholder="Aylık elektrik faturanız"
                className="w-full px-4 sm:px-5 py-3.5 sm:py-4 pr-12 sm:pr-14 rounded-xl border border-gray-200 text-base sm:text-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#448834] transition-colors"
              />
              <span className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 text-gray-400 text-sm sm:text-base">TL</span>
            </div>

            {result ? (
              <>
                <div className="grid sm:grid-cols-2 gap-5 mb-8">
                  {cards.map(card => (
                    <div key={card.label} className="bg-gray-50 border border-gray-100 rounded-xl p-6 flex items-center gap-4">
                      <card.icon size={36} className="text-[#448834] shrink-0" />
                      <div>
                        <p className="text-3xl font-bold font-['Rajdhani'] text-gray-900 leading-tight">{card.value}</p>
                        <p className="text-sm text-gray-500">{card.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-gray-400 leading-relaxed mb-8">
                  Sonuçlar Ege bölgesi ortalama güneşlenme değerleri ve güncel ortalama tarife fiyatlarıyla
                  hesaplanan tahmini değerlerdir; kesin sistem tasarımı ve fiyatlandırma için ücretsiz keşif
                  gereklidir.
                </p>

                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('open-chat', {
                    detail: {
                      prefill: `Tasarruf hesaplayıcıda ${TARIFFS.find(t => t.id === tariff)?.label} tarifesinde aylık ${formatTl(Number(bill))} TL faturamla hesapladım: yaklaşık ${result.systemKwp} kWp sistem, yıllık ${formatTl(result.annualSavings)} TL tasarruf öneriliyor. Ücretsiz keşif ve teklif almak istiyorum.`,
                    },
                  }))}
                  className="w-full flex items-center justify-center gap-2 bg-[#448834] hover:bg-[#357228] text-white font-semibold text-base py-4 rounded-xl transition-colors"
                >
                  <MessageCircle size={18} />
                  Ücretsiz Keşif ve Teklif Alın
                </button>
              </>
            ) : (
              <p className="text-base text-gray-400 text-center py-8">
                Faturanızı girdiğinizde sonuçlar burada görünecek.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Güneş Enerjisi Tasarrufu Nasıl Hesaplanır?</h2>
          <div className="text-gray-600 leading-relaxed space-y-4">
            <p>
              Hesaplayıcı, girdiğiniz aylık elektrik faturası tutarından seçtiğiniz tarifenin (mesken, ticarethane
              veya sanayi) güncel kademeli birim fiyatlarını kullanarak yıllık elektrik tüketiminizi bulur. Bu tüketimi
              karşılayacak sistem gücü (kWp), Ege bölgesi ortalama güneşlenme verimi kullanılarak hesaplanır;
              panel sayısı ve gerekli çatı alanı da bu güce göre belirlenir.
            </p>
            <p>
              Gerçek sistem büyüklüğü; çatınızın yönü, eğimi, gölgelenme durumu, gerçek tüketim profiliniz ve
              şebekeyle mahsuplaşma koşullarına göre değişebilir. Bu nedenle hesaplayıcı sonuçları size fikir
              vermek amaçlıdır; kesin sistem tasarımı ve fiyat teklifi için ücretsiz keşif talep edebilirsiniz.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Hesaplayıcı Hakkında Sık Sorulan Sorular</h2>
          <div className="space-y-3">
            {FAQS.map(faq => (
              <details key={faq.question} className="group bg-white border border-gray-100 rounded-2xl overflow-hidden">
                <summary className="flex items-center gap-4 px-6 py-5 cursor-pointer list-none font-semibold text-gray-900 text-base leading-snug">
                  <span className="flex-1">{faq.question}</span>
                  <ChevronDown size={18} className="text-[#448834] shrink-0 transition-transform duration-300 group-open:rotate-180" />
                </summary>
                <p className="px-6 pb-6 pt-0 text-gray-600 leading-relaxed">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
