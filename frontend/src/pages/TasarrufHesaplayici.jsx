import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Sun, Zap, PanelTop, Ruler, TrendingUp, MessageCircle } from 'lucide-react'
import SEO from '../components/SEO'
import PageHeader from '../components/PageHeader'
import { TARIFFS, calculateGes, parseBillInput } from '../lib/gesCalc'

const formatTl = value => value.toLocaleString('tr-TR')

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
      />
      <PageHeader title="Tasarruf Hesaplayıcı" />

      <section className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-8 sm:p-10">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Ne kadar tasarruf edebilirsiniz?</h2>
            <p className="text-sm text-gray-500 mb-6">
              Aylık elektrik faturanızı girin, size uygun sistemi ve yıllık tasarrufunuzu anında görün.
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {TARIFFS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTariff(t.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    tariff === t.id
                      ? 'bg-[#448834] text-white'
                      : 'bg-gray-50 border border-gray-200 text-gray-600 hover:border-[#448834]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="relative mb-8">
              <input
                type="text"
                inputMode="numeric"
                value={bill ? Number(bill).toLocaleString('tr-TR') : ''}
                onChange={e => setBill(parseBillInput(e.target.value))}
                placeholder="Aylık elektrik faturanız"
                className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#448834] transition-colors"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">TL</span>
            </div>

            {result ? (
              <>
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  {cards.map(card => (
                    <div key={card.label} className="bg-gray-50 border border-gray-100 rounded-xl p-5 flex items-center gap-4">
                      <card.icon size={32} className="text-[#448834] shrink-0" />
                      <div>
                        <p className="text-2xl font-bold font-['Rajdhani'] text-gray-900 leading-tight">{card.value}</p>
                        <p className="text-xs text-gray-500">{card.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-gray-400 leading-relaxed mb-6">
                  Sonuçlar Ege bölgesi ortalama güneşlenme değerleri ve güncel ortalama tarife fiyatlarıyla
                  hesaplanan tahmini değerlerdir; kesin sistem tasarımı ve fiyatlandırma için ücretsiz keşif
                  gereklidir.
                </p>

                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('open-chat'))}
                  className="w-full flex items-center justify-center gap-2 bg-[#448834] hover:bg-[#357228] text-white font-semibold text-sm py-3.5 rounded-xl transition-colors"
                >
                  <MessageCircle size={16} />
                  Ücretsiz Keşif ve Teklif Alın
                </button>
              </>
            ) : (
              <p className="text-sm text-gray-400 text-center py-6">
                Faturanızı girdiğinizde sonuçlar burada görünecek.
              </p>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
