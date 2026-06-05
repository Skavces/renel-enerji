import PageHeader from '../components/PageHeader'
import References from '../components/References'
import SEO from '../components/SEO'

const referanslarJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Referanslar | RenEL Enerji Mühendislik',
  url: 'https://renelenerji.com/referanslar',
  description: 'RenEL Enerji\'nin tamamlanan güneş enerjisi projelerinden referanslar. Manisa, Soma ve çevre illerde kurulan GES sistemleri ve memnun müşterilerimiz.',
  about: { '@type': 'Organization', name: 'RenEL Enerji Mühendislik', url: 'https://renelenerji.com' },
}

export default function Referanslar() {
  return (
    <>
      <SEO
        title="Referanslar"
        description="RenEL Enerji'nin tamamlanan güneş enerjisi projelerinden referanslar. Manisa, Soma ve çevre illerde kurulan GES sistemleri ve memnun müşterilerimiz."
        jsonLd={referanslarJsonLd}
      />
      <PageHeader title="Referanslar" />
      <References />
    </>
  )
}
