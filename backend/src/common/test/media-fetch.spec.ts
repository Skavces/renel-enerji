import { assertAllowedMediaHost, fetchAllowedMedia } from '../media-fetch'

const mockFetch = jest.fn()
global.fetch = mockFetch

const okResponse = (fields: Record<string, unknown> = {}) => ({
  status: 200,
  ok: true,
  headers: new Headers(),
  ...fields,
})

describe('assertAllowedMediaHost', () => {
  it("Meta CDN host'lerini kabul eder", () => {
    expect(() => assertAllowedMediaHost('https://scontent.cdninstagram.com/image.jpg')).not.toThrow()
    expect(() => assertAllowedMediaHost('https://video.xx.fbcdn.net/video.mp4')).not.toThrow()
  })

  it("allow-list dışındaki host'ü reddeder (SSRF)", () => {
    expect(() => assertAllowedMediaHost('https://169.254.169.254/latest/meta-data/')).toThrow(
      /İzin verilmeyen medya kaynağı/,
    )
    expect(() => assertAllowedMediaHost('https://evil.com/x')).toThrow(/İzin verilmeyen medya kaynağı/)
  })

  it("benzer görünen ama allow-list dışında olan host'ü reddeder (suffix trick)", () => {
    expect(() => assertAllowedMediaHost('https://cdninstagram.com.evil.com/x')).toThrow(
      /İzin verilmeyen medya kaynağı/,
    )
  })

  it('http (TLS olmayan) protokolü reddeder', () => {
    expect(() => assertAllowedMediaHost('http://scontent.cdninstagram.com/image.jpg')).toThrow(
      /İzin verilmeyen medya kaynağı/,
    )
  })

  it("geçersiz URL'i reddeder", () => {
    expect(() => assertAllowedMediaHost('not-a-url')).toThrow(/Geçersiz medya URL/)
  })
})

describe('fetchAllowedMedia', () => {
  beforeEach(() => jest.clearAllMocks())

  it("allow-list'teki host'a doğrudan istek atar", async () => {
    mockFetch.mockResolvedValue(okResponse())

    await fetchAllowedMedia('https://scontent.cdninstagram.com/image.jpg')

    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it("allow-list dışı host'a hiç istek atmadan reddeder", async () => {
    await expect(fetchAllowedMedia('https://169.254.169.254/latest/meta-data/')).rejects.toThrow(
      /İzin verilmeyen medya kaynağı/,
    )
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("izin verilen bir host'a yönlendiren redirect'i takip edip her hop'u doğrular", async () => {
    mockFetch
      .mockResolvedValueOnce({
        status: 302,
        headers: new Headers({ location: 'https://video.xx.fbcdn.net/video.mp4' }),
        body: { cancel: jest.fn().mockResolvedValue(undefined) },
      })
      .mockResolvedValueOnce(okResponse())

    const res = await fetchAllowedMedia('https://scontent.cdninstagram.com/redirect')

    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(res.ok).toBe(true)
  })

  it("izin verilmeyen bir host'a yönlendiren redirect'i reddeder (allow-list bypass koruması)", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 302,
      headers: new Headers({ location: 'https://evil.com/steal' }),
      body: { cancel: jest.fn().mockResolvedValue(undefined) },
    })

    await expect(fetchAllowedMedia('https://scontent.cdninstagram.com/redirect')).rejects.toThrow(
      /İzin verilmeyen medya kaynağı/,
    )
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it("çok fazla redirect hop'unda pes eder (redirect loop koruması)", async () => {
    mockFetch.mockResolvedValue({
      status: 302,
      headers: new Headers({ location: 'https://scontent.cdninstagram.com/loop' }),
      body: { cancel: jest.fn().mockResolvedValue(undefined) },
    })

    await expect(fetchAllowedMedia('https://scontent.cdninstagram.com/loop')).rejects.toThrow(
      /çok fazla yönlendirme/,
    )
  })
})
