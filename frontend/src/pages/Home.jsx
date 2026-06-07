import Hero from '../components/Hero'
import Stats from '../components/Stats'
import Services from '../components/Services'
import WhyUs from '../components/WhyUs'
import HowItWorks from '../components/HowItWorks'
import LogoMarquee from '../components/LogoMarquee'
import SEO from '../components/SEO'
import { WA_NUMBER } from '../lib/whatsapp'

const homeSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://renelenerji.com/#website',
      name: 'RenEL Enerji Mühendislik',
      url: 'https://renelenerji.com',
      inLanguage: 'tr-TR',
      publisher: { '@id': 'https://renelenerji.com/#organization' },
    },
    {
      '@type': 'Organization',
      '@id': 'https://renelenerji.com/#organization',
      name: 'RenEL Enerji Mühendislik',
      url: 'https://renelenerji.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://renelenerji.com/renel-logo.svg',
      },
      telephone: `+${WA_NUMBER}`,
      email: 'info@renelenerji.com',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Soma',
        addressRegion: 'Manisa',
        addressCountry: 'TR',
      },
      sameAs: ['https://www.renelenerji.com'],
    },
    {
      '@type': 'LocalBusiness',
      '@id': 'https://renelenerji.com/#localbusiness',
      name: 'RenEL Enerji Mühendislik',
      description:
        "Soma/Manisa'da güneş enerjisi mühendislik hizmetleri. Tarımsal sulama GES, çatı ve arazi tipi GES, depolamalı GES, EV şarj istasyonu kurulum ve danışmanlık.",
      url: 'https://renelenerji.com',
      telephone: `+${WA_NUMBER}`,
      email: 'info@renelenerji.com',
      logo: 'https://renelenerji.com/renel-logo.svg',
      image: 'https://renelenerji.com/og-image.webp',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Soma',
        addressLocality: 'Soma',
        addressRegion: 'Manisa',
        addressCountry: 'TR',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 39.188,
        longitude: 27.613,
      },
      openingHoursSpecification: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '18:00',
      },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Güneş Enerjisi Hizmetleri',
        itemListElement: [
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Tarımsal Sulama GES' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Çatı ve Arazi Tipi GES' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Bağ Evi Depolamalı GES' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Elektrikli Araç Şarj İstasyonu' } },
        ],
      },
      areaServed: ['Soma', 'Manisa', 'İzmir', 'Balıkesir'],
    },
  ],
}

export default function Home() {
  return (
    <>
      <SEO jsonLd={homeSchema} />
      <Hero />
      <Stats />
      <Services />
      <WhyUs />
      <HowItWorks />
      <LogoMarquee />
    </>
  )
}
