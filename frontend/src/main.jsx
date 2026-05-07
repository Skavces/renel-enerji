import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

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
    <App />
  </StrictMode>,
)
