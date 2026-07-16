import { describe, expect, it } from 'vitest'
import { WA_NUMBER, waLink } from './whatsapp'

describe('waLink', () => {
  it('doğru numaraya wa.me linki üretir', () => {
    expect(waLink('merhaba')).toBe(`https://wa.me/${WA_NUMBER}?text=merhaba`)
  })

  it('mesajı URL-encode eder', () => {
    const link = waLink('Merhaba, teklif almak istiyorum & detaylı bilgi')
    expect(link).toContain('wa.me/905543796004?text=')
    expect(link).toContain(encodeURIComponent('&'))
    expect(link).not.toContain(' ')
  })

  it('çok satırlı özet mesajını güvenle taşır', () => {
    const message = 'Merhaba,\n\nİlgilendiğim sistem: Çatı GES\nDetaylı teklif almak istiyorum.'
    expect(waLink(message)).toBe(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`)
  })
})
