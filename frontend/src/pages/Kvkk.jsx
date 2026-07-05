import PageHeader from '../components/PageHeader'
import SEO from '../components/SEO'

const SECTIONS = [
  {
    title: '1. Veri Sorumlusu',
    body: `6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca kişisel verileriniz, veri sorumlusu sıfatıyla RenEl Enerji Mühendislik ("Şirket") tarafından aşağıda açıklanan kapsamda işlenmektedir.

İletişim: mertcan.yilmaz@renelenerji.com`,
  },
  {
    title: '2. İşlenen Kişisel Veriler',
    body: `Web sitemizi kullandığınızda aşağıdaki veriler işlenebilir:

• Dijital danışman (chatbot) görüşme kayıtları: Sohbet sırasında yazdığınız mesajlar, talebinizin durumu ve görüşme sonunda verdiğiniz değerlendirme puanı. Mesajlarınızda paylaşmayı tercih ettiğiniz bilgiler (ör. konum, elektrik tüketimi) bu kapsamdadır.
• Teknik veriler: IP adresi ve sunucu erişim kayıtları (güvenlik amacıyla).
• Anonim ziyaret istatistikleri: Sayfa görüntüleme sayıları gibi kimliğinizle ilişkilendirilmeyen kullanım verileri.

Sitemizde üyelik veya iletişim formu bulunmamaktadır; WhatsApp üzerinden kurduğunuz iletişim WhatsApp'ın kendi gizlilik politikasına tabidir.`,
  },
  {
    title: '3. İşleme Amaçları ve Hukuki Sebep',
    body: `Görüşme kayıtları ve değerlendirme puanları, danışmanlık hizmetinin sunulması, teklif taleplerinizin takip edilebilmesi ve hizmet kalitesinin ölçülüp iyileştirilmesi amacıyla; teknik veriler ise sitenin güvenliğinin sağlanması amacıyla, KVKK md. 5/2-f kapsamındaki meşru menfaat hukuki sebebine dayanılarak işlenir. Verileriniz pazarlama amacıyla kullanılmaz ve üçüncü kişilerle paylaşılmaz.`,
  },
  {
    title: '4. Saklama Süresi',
    body: `Chatbot görüşme dökümleri (mesaj içerikleri), kaydedildikleri tarihten itibaren 6 ay sonra otomatik olarak silinir; geriye yalnızca kimliğinizle ilişkilendirilemeyen istatistiksel veriler (puan ortalaması, talep sayısı gibi) kalır. Sunucu erişim kayıtları ilgili mevzuattaki sürelere uygun olarak silinir.`,
  },
  {
    title: '5. Haklarınız',
    body: `KVKK'nın 11. maddesi uyarınca; kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse buna ilişkin bilgi talep etme, işlenme amacını öğrenme, eksik veya yanlış işlenmişse düzeltilmesini isteme, silinmesini veya yok edilmesini talep etme ve işlemenin sonuçlarına itiraz etme haklarına sahipsiniz.

Taleplerinizi mertcan.yilmaz@renelenerji.com adresine iletebilirsiniz; başvurunuz en geç 30 gün içinde sonuçlandırılır.`,
  },
]

export default function Kvkk() {
  return (
    <>
      <SEO
        title="KVKK Aydınlatma Metni"
        description="RenEl Enerji Mühendislik kişisel verilerin korunması ve gizlilik aydınlatma metni."
      />
      <PageHeader title="KVKK Aydınlatma Metni" />

      <section className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-8 sm:p-10 space-y-8">
            {SECTIONS.map(({ title, body }) => (
              <section key={title}>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">{title}</h2>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{body}</p>
              </section>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
