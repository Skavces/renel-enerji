import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.jsx'

const sentryDsn = import.meta.env.VITE_SENTRY_DSN
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: import.meta.env.PROD ? 0.2 : 0,
  })
}

const umamiUrl = import.meta.env.VITE_UMAMI_URL
const umamiId = import.meta.env.VITE_UMAMI_WEBSITE_ID
if (umamiUrl && umamiId) {
  const s = document.createElement('script')
  s.defer = true
  s.src = `${umamiUrl}/script.js`
  s.setAttribute('data-website-id', umamiId)
  document.head.appendChild(s)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Sentry.ErrorBoundary>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
