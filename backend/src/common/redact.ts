import type { Event } from '@sentry/nestjs'

// hub.verify_token/access_token/token/secret/password query param'larını maskeler;
// logging.middleware.ts ile aynı desen, tek kaynaktan.
export function redactUrlSecrets(url: string): string {
  return url.replace(/(hub\.verify_token|access_token|token|secret|password)=[^&]*/gi, '$1=[REDACTED]')
}

// Sentry beforeSend/beforeSendTransaction hook'u: header/cookie/body hiçbir
// koşulda üçüncü tarafa gitmesin, query string'deki sırlar maskelensin.
export function redactSentryEvent<T extends Event>(event: T): T {
  if (event.request) {
    delete event.request.headers
    delete event.request.cookies
    delete event.request.data
    if (typeof event.request.url === 'string') {
      event.request.url = redactUrlSecrets(event.request.url)
    }
    if (typeof event.request.query_string === 'string') {
      event.request.query_string = redactUrlSecrets(event.request.query_string)
    }
  }
  return event
}
