import * as Sentry from '@sentry/nestjs'
import { redactSentryEvent, redactSpanSecrets } from './common/redact'

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 0,
    // SDK v11'de sendDefaultPii yerini `dataCollection`a bırakacak; buraya
    // `dataCollection` eklemek (kısmi bile olsa) tabanı tam-izinli DEFAULTS'a
    // çevirip header/cookie/body toplamayı sessizce açar — bilerek kullanmıyoruz.
    sendDefaultPii: false,
    beforeSend: redactSentryEvent,
    beforeSendTransaction: redactSentryEvent,
    // nativeNodeFetchIntegration (varsayılan açık) her giden fetch'i span'e
    // çevirirken URL'i temizlemeden yazıyor — redactSentryEvent bunu kapsamaz
    // (yalnızca event.request'e bakar), bu yüzden ayrı bir hook gerekiyor.
    beforeSendSpan: redactSpanSecrets,
  })
}
