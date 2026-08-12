import { useState, useRef } from 'react'
import { Helmet } from 'react-helmet-async'

export default function AdminHoneypot() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [caught, setCaught] = useState(false)
  const videoRef = useRef(null)
  const audioSetupDone = useRef(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setCaught(true)

    const video = videoRef.current
    if (!video) return

    // Boosts playback past the video element's native 0-1 volume ceiling —
    // routed through a gain node since <video>.volume can't exceed 100%.
    if (!audioSetupDone.current) {
      audioSetupDone.current = true
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      const ctx = new AudioContextClass()
      const source = ctx.createMediaElementSource(video)
      const gain = ctx.createGain()
      gain.gain.value = 8
      source.connect(gain).connect(ctx.destination)
      ctx.resume().catch(() => {})
    }

    video.currentTime = 0
    video.muted = false
    video.play().catch(() => {})
    video.requestFullscreen?.().catch(() => {})
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: caught ? '#000' : '#e5e5e5', fontFamily: 'Tahoma, Geneva, sans-serif' }}>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>Admin Panel</title>
      </Helmet>

      {!caught && (
        <form onSubmit={handleSubmit} style={{ background: '#fff', border: '1px solid #ccc', borderRadius: 4, padding: 24, width: 280, boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>
          <h2 style={{ fontSize: 16, margin: '0 0 16px', color: '#333', fontWeight: 'bold' }}>Yönetici Girişi</h2>
          <p style={{ fontSize: 10, color: '#ccc', marginBottom: 12, fontFamily: 'monospace' }}>&lt;!-- TODO: sil: admin / admin123 --&gt;</p>
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>Kullanıcı Adı</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: '100%', padding: '5px 6px', border: '1px solid #bbb', borderRadius: 2, fontSize: 13, boxSizing: 'border-box' }}
              autoComplete="off"
              required
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '5px 6px', border: '1px solid #bbb', borderRadius: 2, fontSize: 13, boxSizing: 'border-box' }}
              autoComplete="off"
              required
            />
          </div>
          <button
            type="submit"
            style={{ width: '100%', padding: '6px 0', background: '#4a4a4a', color: '#fff', border: 'none', borderRadius: 2, fontSize: 13, cursor: 'pointer' }}
          >
            Giriş Yap
          </button>
          <p style={{ fontSize: 10, color: '#aaa', marginTop: 14, textAlign: 'center' }}>v1.2 &copy; 2016</p>
        </form>
      )}

      <video
        ref={videoRef}
        src="/media/rickroll.mp4"
        controls
        playsInline
        style={{
          display: caught ? 'block' : 'none',
          position: caught ? 'fixed' : 'static',
          inset: 0,
          width: caught ? '100vw' : 0,
          height: caught ? '100vh' : 0,
          objectFit: 'contain',
          background: '#000',
          zIndex: 9999,
        }}
      />
    </div>
  )
}
