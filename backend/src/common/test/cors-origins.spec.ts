import { resolveCorsOrigins } from '../cors-origins'

describe('resolveCorsOrigins', () => {
  describe('CORS_ORIGINS dolu (açık liste)', () => {
    it('virgüllü listeyi aynen kullanır, www türetmez', () => {
      expect(resolveCorsOrigins('https://www.renelenerji.com,https://renelenerji.com', 'https://renelenerji.com'))
        .toEqual(['https://www.renelenerji.com', 'https://renelenerji.com'])
    })

    it('tek origin verilirse yalnızca onu döndürür (FRONTEND_URL devre dışı)', () => {
      expect(resolveCorsOrigins('https://renelenerji.com', 'http://localhost:5173'))
        .toEqual(['https://renelenerji.com'])
    })

    it("boşlukları trim'ler, boş parçaları atar, trailing slash'ı kırpar", () => {
      expect(resolveCorsOrigins(' https://a.com/ , , https://b.com ', 'https://x.com'))
        .toEqual(['https://a.com', 'https://b.com'])
    })

    it("tekrarları uniq'ler", () => {
      expect(resolveCorsOrigins('https://a.com,https://a.com/', 'https://x.com'))
        .toEqual(['https://a.com'])
    })
  })

  describe('CORS_ORIGINS boş (FRONTEND_URL fallback)', () => {
    it("apex domain'e www'lu varyantı ekler", () => {
      expect(resolveCorsOrigins(undefined, 'https://renelenerji.com'))
        .toEqual(['https://renelenerji.com', 'https://www.renelenerji.com'])
    })

    it("www'lu FRONTEND_URL'de apex EKLENMEZ (bilinen sınırlama — açık liste bunun için var)", () => {
      expect(resolveCorsOrigins('', 'https://www.renelenerji.com'))
        .toEqual(['https://www.renelenerji.com'])
    })

    it("IP adresinde www türetmez", () => {
      expect(resolveCorsOrigins('', 'http://192.168.1.10:5173'))
        .toEqual(['http://192.168.1.10:5173'])
    })

    it("localhost'ta www türetir (mevcut davranış korunur)", () => {
      expect(resolveCorsOrigins(undefined, 'http://localhost:5173'))
        .toEqual(['http://localhost:5173', 'http://www.localhost:5173'])
    })
  })
})
