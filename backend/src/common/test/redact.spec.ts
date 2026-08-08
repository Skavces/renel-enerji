import { redactSentryEvent, redactUrlSecrets } from '../redact'

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
})
