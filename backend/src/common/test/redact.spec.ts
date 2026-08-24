import { redactSecretValue, redactSentryEvent, redactSpanSecrets, redactUrlSecrets } from '../redact'

describe('redactUrlSecrets', () => {
  it('access_token parametresini maskeler', () => {
    expect(redactUrlSecrets('/api/instagram?access_token=IGQWabc123')).toBe(
      '/api/instagram?access_token=[REDACTED]',
    )
  })

  it('hub.verify_token parametresini maskeler', () => {
    expect(redactUrlSecrets('/api/webhooks/instagram?hub.mode=subscribe&hub.verify_token=gizli')).toBe(
      '/api/webhooks/instagram?hub.mode=subscribe&hub.verify_token=[REDACTED]',
    )
  })

  it('birden fazla sır parametresini aynı anda maskeler', () => {
    expect(redactUrlSecrets('/x?token=abc&secret=def&password=123')).toBe(
      '/x?token=[REDACTED]&secret=[REDACTED]&password=[REDACTED]',
    )
  })

  it('büyük/küçük harf duyarsız çalışır', () => {
    expect(redactUrlSecrets('/x?ACCESS_TOKEN=abc')).toBe('/x?ACCESS_TOKEN=[REDACTED]')
  })

  it('sır içermeyen URL değişmeden döner', () => {
    expect(redactUrlSecrets('/api/faq?page=2')).toBe('/api/faq?page=2')
  })

  it('appid ve api_key parametrelerini maskeler', () => {
    expect(redactUrlSecrets('/weather?appid=abc123&city=izmir')).toBe(
      '/weather?appid=[REDACTED]&city=izmir',
    )
    expect(redactUrlSecrets('/x?api_key=abc123')).toBe('/x?api_key=[REDACTED]')
  })
})

describe('redactSecretValue', () => {
  it('metinde yankılanan sır değerini söker', () => {
    expect(redactSecretValue('Error validating access token IGQWReallyLiveToken: expired', 'IGQWReallyLiveToken')).toBe(
      'Error validating access token [REDACTED]: expired',
    )
  })

  it('sır metinde birden çok kez geçse hepsini söker', () => {
    expect(redactSecretValue('tokenABCDEFGH ... tokenABCDEFGH', 'tokenABCDEFGH')).toBe('[REDACTED] ... [REDACTED]')
  })

  it('çok kısa/boş sırla metni bozmaz', () => {
    expect(redactSecretValue('merhaba dünya', '')).toBe('merhaba dünya')
    expect(redactSecretValue('merhaba dünya', 'ab')).toBe('merhaba dünya')
  })

  it('sır metinde geçmiyorsa metin değişmeden döner', () => {
    expect(redactSecretValue('merhaba dünya', 'IGQWReallyLiveToken')).toBe('merhaba dünya')
  })
})

describe('redactSpanSecrets', () => {
  function makeSpan(data: Record<string, unknown>, description?: string) {
    return { data, description }
  }

  it('url.full attribute\'ündeki tokenı maskeler', () => {
    const span = makeSpan({
      'url.full': 'https://graph.instagram.com/refresh_access_token?access_token=IGQWReallyLiveToken',
    })

    const result = redactSpanSecrets(span)

    expect(result.data['url.full']).not.toContain('IGQWReallyLiveToken')
    expect(result.data['url.full']).toContain('access_token=[REDACTED]')
  })

  it('description alanındaki tokenı maskeler', () => {
    const span = makeSpan({}, 'GET https://graph.instagram.com/x?access_token=IGQWReallyLiveToken')

    const result = redactSpanSecrets(span)

    expect(result.description).not.toContain('IGQWReallyLiveToken')
  })

  it('sır içermeyen span\'i değiştirmeden döner', () => {
    const span = makeSpan({ 'http.status_code': 200 }, 'GET https://renelenerji.com/api/health')

    const result = redactSpanSecrets(span)

    expect(result.data['http.status_code']).toBe(200)
    expect(result.description).toBe('GET https://renelenerji.com/api/health')
  })

  it('data alanı yokken patlamaz', () => {
    expect(() => redactSpanSecrets({})).not.toThrow()
  })
})

describe('redactSentryEvent', () => {
  it('request.headers, cookies ve data alanlarını siler', () => {
    const event = {
      request: {
        headers: { cookie: 'admin_jti=abc', authorization: 'Bearer x' },
        cookies: { admin_jti: 'abc' },
        data: { password: 'hunter2' },
        url: 'https://renelenerji.com/api/auth/login',
      },
    }

    const result = redactSentryEvent(event)

    expect(result.request?.headers).toBeUndefined()
    expect(result.request?.cookies).toBeUndefined()
    expect(result.request?.data).toBeUndefined()
  })

  it('request.url içindeki tokenı maskeler', () => {
    const event = {
      request: {
        url: 'https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=IGQWReallyLiveToken',
      },
    }

    const result = redactSentryEvent(event)

    expect(result.request?.url).not.toContain('IGQWReallyLiveToken')
    expect(result.request?.url).toContain('access_token=[REDACTED]')
  })

  it('string query_string alanını maskeler', () => {
    const event = {
      request: {
        query_string: 'hub.verify_token=gizli-dogrulama',
      },
    }

    const result = redactSentryEvent(event)

    expect(result.request?.query_string).toBe('hub.verify_token=[REDACTED]')
  })

  it('event.request yokken patlamaz', () => {
    const event = {}
    expect(() => redactSentryEvent(event)).not.toThrow()
    expect(redactSentryEvent(event)).toBe(event)
  })

  it('breadcrumb data\'sındaki http.query alanını maskeler', () => {
    const event = {
      breadcrumbs: [
        {
          category: 'http',
          data: {
            url: 'https://graph.instagram.com/refresh_access_token',
            'http.query': '?grant_type=ig_refresh_token&access_token=IGQWReallyLiveToken',
            'http.method': 'GET',
          },
        },
      ],
    }

    const result = redactSentryEvent(event)

    expect(JSON.stringify(result)).not.toContain('IGQWReallyLiveToken')
    expect(result.breadcrumbs?.[0]?.data?.['http.query']).toContain('access_token=[REDACTED]')
  })

  it('data\'sız breadcrumb\'da patlamaz', () => {
    const event = { breadcrumbs: [{ category: 'http' }] }
    expect(() => redactSentryEvent(event)).not.toThrow()
  })
})
