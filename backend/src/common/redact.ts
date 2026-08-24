import type { Event } from '@sentry/nestjs'

// hub.verify_token/access_token/token/secret/password/appid/api_key query param'larını
// maskeler; logging.middleware.ts ile aynı desen, tek kaynaktan.
export function redactUrlSecrets(url: string): string {
  return url.replace(/(hub\.verify_token|access_token|token|secret|password|appid|api_?key)=[^&]*/gi, '$1=[REDACTED]')
}

// Sorgu-parametre biçimine uymayan durumlar için (ör. Meta'nın hata gövdesinde
// token'ı olduğu gibi yankılaması): bilinen sır değerini metinden söker. Kısa/boş
// bir secret tüm metni parçalayıp bozmasın diye asgari uzunluk şartı var.
const MIN_SECRET_LENGTH = 8

export function redactSecretValue(text: string, secret: string): string {
  if (secret.length < MIN_SECRET_LENGTH) return text
  return text.split(secret).join('[REDACTED]')
}

function redactStringValues(bag: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(bag)) {
    if (typeof value === 'string') {
      bag[key] = redactUrlSecrets(value)
    }
  }
}

// Sentry'nin gerçek SpanJSON tipi yalnızca @sentry/core'dan (dolaylı bağımlılık,
// package.json'da doğrudan listelenmiyor) erişilebilir; onu import etmek yerine
// yalnızca kullandığımız alanları tarif eden yapısal bir tip yeterli — beforeSendSpan'e
// atanırken TypeScript SpanJSON'ın buna yapısal olarak uyduğunu zaten çıkarsıyor.
interface RedactableSpan {
  data?: Record<string, unknown>
  description?: string
}

// Sentry beforeSendSpan hook'u: nativeNodeFetchIntegration her giden fetch'i
// span'e çevirirken URL'i (query string dahil) hiç temizlemeden data/description
// alanlarına yazıyor — instagram-token.service.ts'teki gibi token taşıyan bir URL
// buradan Sentry'ye düz metin gidebilir. Alan adlarını (url.full/url.query/http.url)
// tek tek hedeflemek yerine tüm string attribute'ları ve description'ı tarıyoruz.
export function redactSpanSecrets<T extends RedactableSpan>(span: T): T {
  if (typeof span.description === 'string') {
    span.description = redactUrlSecrets(span.description)
  }
  if (span.data) redactStringValues(span.data)
  return span
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
  // nativeNodeFetchIntegration her giden fetch için bir breadcrumb da üretir ve
  // data['http.query']'e sorgu dizesini ham yazar (span'lerin aksine bu,
  // tracesSampleRate'e tabi değil — her ortamda, her zaman çalışır). Breadcrumb'lar
  // sonraki herhangi bir hata event'ine binip Sentry'ye gidebilir.
  for (const breadcrumb of event.breadcrumbs ?? []) {
    if (breadcrumb.data) redactStringValues(breadcrumb.data)
  }
  return event
}
