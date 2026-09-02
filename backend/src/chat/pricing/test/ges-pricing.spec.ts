import { formatQuoteMessage, resolveQuote } from '../ges-pricing'

describe('resolveQuote — çatı tipi GES (konut)', () => {
  it('returns the correct band for a mid-range bill', () => {
    const quote = resolveQuote({ kategori: 'cati_konut', aylikFatura: 3200 })
    expect(quote).toMatchObject({ minTl: 200_000, maxTl: 330_000 })
    expect(quote?.aciklama).toContain('5-7')
  })

  it('resolves the exact 2.500 boundary to the upper band (2.500-4.000)', () => {
    const quote = resolveQuote({ kategori: 'cati_konut', aylikFatura: 2500 })
    expect(quote).toMatchObject({ minTl: 200_000, maxTl: 330_000 })
  })

  it('resolves the exact 4.000 boundary to the upper band (4.000-6.000)', () => {
    const quote = resolveQuote({ kategori: 'cati_konut', aylikFatura: 4000 })
    expect(quote).toMatchObject({ minTl: 300_000, maxTl: 480_000 })
  })

  it('resolves 1.500 (lowest inclusive bound) to the first band', () => {
    const quote = resolveQuote({ kategori: 'cati_konut', aylikFatura: 1500 })
    expect(quote).toMatchObject({ minTl: 160_000, maxTl: 240_000 })
  })

  it('resolves 10.000 (highest inclusive bound) to the last band', () => {
    const quote = resolveQuote({ kategori: 'cati_konut', aylikFatura: 10_000 })
    expect(quote).toMatchObject({ minTl: 400_000, maxTl: 700_000 })
  })

  it('returns null below the lowest band', () => {
    expect(resolveQuote({ kategori: 'cati_konut', aylikFatura: 1000 })).toBeNull()
  })

  it('returns null above the highest band', () => {
    expect(resolveQuote({ kategori: 'cati_konut', aylikFatura: 12_000 })).toBeNull()
  })

  it('returns null when the bill is missing', () => {
    expect(resolveQuote({ kategori: 'cati_konut' })).toBeNull()
  })
})

describe('resolveQuote — tarımsal sulama GES', () => {
  it('resolves 5 HP to the first band', () => {
    expect(resolveQuote({ kategori: 'tarimsal_sulama', pompaHp: 5 })).toMatchObject({
      minTl: 120_000,
      maxTl: 200_000,
    })
  })

  it('resolves 6 HP to the second band', () => {
    expect(resolveQuote({ kategori: 'tarimsal_sulama', pompaHp: 6 })).toMatchObject({
      minTl: 210_000,
      maxTl: 340_000,
    })
  })

  it('resolves 30 HP to the last band', () => {
    expect(resolveQuote({ kategori: 'tarimsal_sulama', pompaHp: 30 })).toMatchObject({
      minTl: 600_000,
      maxTl: 850_000,
    })
  })

  it('returns null above 30 HP (proje bazlı)', () => {
    expect(resolveQuote({ kategori: 'tarimsal_sulama', pompaHp: 31 })).toBeNull()
  })

  it('includes the IPARD/TKDK grant note without a percentage', () => {
    const quote = resolveQuote({ kategori: 'tarimsal_sulama', pompaHp: 10 })
    expect(quote?.not).toContain('IPARD')
    expect(quote?.not).not.toMatch(/%\d/)
  })
})

describe('resolveQuote — bağ evi / off-grid (Mertcan onayı, 2026-09-02)', () => {
  it('resolves 3 kW to the temel band', () => {
    expect(resolveQuote({ kategori: 'bag_evi', kw: 3 })).toMatchObject({ minTl: 50_000, maxTl: 100_000 })
  })

  it('resolves 4 kW to the orta band', () => {
    expect(resolveQuote({ kategori: 'bag_evi', kw: 4 })).toMatchObject({ minTl: 100_000, maxTl: 180_000 })
  })

  it('resolves 7 kW to the orta band (gap-closing extension)', () => {
    expect(resolveQuote({ kategori: 'bag_evi', kw: 7 })).toMatchObject({ minTl: 100_000, maxTl: 180_000 })
  })

  it('resolves 8 kW to the tam konfor band', () => {
    expect(resolveQuote({ kategori: 'bag_evi', kw: 8 })).toMatchObject({ minTl: 180_000, maxTl: 450_000 })
  })

  it('returns null above 12 kW', () => {
    expect(resolveQuote({ kategori: 'bag_evi', kw: 13 })).toBeNull()
  })
})

describe('resolveQuote — EV şarj istasyonu', () => {
  it('resolves the monofaze home type', () => {
    expect(resolveQuote({ kategori: 'ev_sarj', sarjTipi: 'ac_mono_7_4' })).toMatchObject({
      minTl: 35_000,
      maxTl: 70_000,
    })
  })

  it('returns null when the charger type is missing', () => {
    expect(resolveQuote({ kategori: 'ev_sarj' })).toBeNull()
  })
})

describe('resolveQuote — kapsam dışı kategoriler', () => {
  it('returns null for unsupported categories (arazi GES, ticari çatı, hibrit, bakım, danışmanlık)', () => {
    // @ts-expect-error kasıtlı olarak PricingCategory dışı bir değer
    expect(resolveQuote({ kategori: 'arazi_ges' })).toBeNull()
  })
})

describe('formatQuoteMessage', () => {
  it('formats amounts with tr-TR thousand separators and includes the WhatsApp handoff', () => {
    const quote = resolveQuote({ kategori: 'cati_konut', aylikFatura: 3200 })!
    const message = formatQuoteMessage(quote)
    expect(message).toContain('200.000 - 330.000 TL')
    expect(message).toContain('Kesin rakam keşif sonrası netleşiyor.')
    expect(message).toContain("WhatsApp'tan Teklif Al")
  })

  it('never mentions KDV (kararlaştırılan davranış, 2026-09-02)', () => {
    const quote = resolveQuote({ kategori: 'bag_evi', kw: 5 })!
    expect(formatQuoteMessage(quote)).not.toMatch(/kdv/i)
  })

  it('appends the grant note only for tarımsal sulama quotes', () => {
    const tarimsal = resolveQuote({ kategori: 'tarimsal_sulama', pompaHp: 10 })!
    expect(formatQuoteMessage(tarimsal)).toContain('IPARD')

    const catiKonut = resolveQuote({ kategori: 'cati_konut', aylikFatura: 3200 })!
    expect(formatQuoteMessage(catiKonut)).not.toContain('IPARD')
  })
})
