import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ArrowRight } from 'lucide-react'
import PageHeader from '../components/PageHeader'

const API = import.meta.env.VITE_API_URL || ''

function FaqItem({ faq, isOpen, onToggle }) {
  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-6 py-5 text-left hover:bg-gray-50/50 transition-colors"
      >
        <span className="flex-1 font-semibold text-gray-900 text-base leading-snug">{faq.question}</span>
        <ChevronDown
          size={18}
          className={`text-[#448834] shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="px-6 pb-6 border-t border-gray-50">
          <p className="text-gray-600 leading-relaxed pt-4 whitespace-pre-line">{faq.answer}</p>
        </div>
      )}
    </div>
  )
}

export default function SSS() {
  const [faqs, setFaqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState(null)

  useEffect(() => {
    fetch(`${API}/api/faq`)
      .then((r) => r.json())
      .then(setFaqs)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const toggle = (id) => setOpenId((prev) => (prev === id ? null : id))

  return (
    <>
      <PageHeader title="Sık Sorulan Sorular" />

      <section className="bg-gray-50 border-b border-gray-100 pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-[#448834] font-semibold text-xs uppercase tracking-widest mb-3">S.S.S.</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Sık Sorulan Sorular</h2>
          <p className="text-gray-500 text-base leading-relaxed">
            Güneş enerjisi sistemleri hakkında merak ettiğiniz soruların cevaplarını burada bulabilirsiniz.
          </p>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-6">
          {loading ? (
            <div className="text-center py-20 text-gray-400">Yükleniyor...</div>
          ) : faqs.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p>Henüz soru eklenmemiş.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {faqs.map((faq) => (
                <FaqItem
                  key={faq.id}
                  faq={faq}
                  isOpen={openId === faq.id}
                  onToggle={() => toggle(faq.id)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section
        className="py-16 border-t border-gray-100 relative bg-cover bg-center"
        style={{ backgroundImage: "url('/stats-bg.webp')" }}
      >
        <div className="absolute inset-0 bg-white/50" />
        <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Sorunuzu bulamadınız mı?</h3>
          <p className="text-gray-500 mb-6">Bize doğrudan ulaşın, en kısa sürede yanıt verelim.</p>
          <Link
            to="/iletisim"
            className="inline-flex items-center gap-2 bg-[#448834] hover:bg-[#357228] text-white font-bold px-8 py-4 rounded-xl transition-colors shadow-lg shadow-[#448834]/25"
          >
            İletişime Geç
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </>
  )
}
