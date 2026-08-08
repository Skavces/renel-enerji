import * as Sentry from '@sentry/nestjs'
import { redactSentryEvent } from './common/redact'

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
  })
}
