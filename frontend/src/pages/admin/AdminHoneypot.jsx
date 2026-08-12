import { useState } from 'react'
import { Helmet } from 'react-helmet-async'

const RICKROLL_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'

export default function AdminHoneypot() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    window.location.href = RICKROLL_URL
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e5e5e5', fontFamily: 'Tahoma, Geneva, sans-serif' }}>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>Admin Panel</title>
      </Helmet>
      <form onSubmit={handleSubmit} style={{ background: '#fff', border: '1px solid #ccc', borderRadius: 4, padding: 24, width: 280, boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>
        <h2 style={{ fontSize: 16, margin: '0 0 16px', color: '#333', fontWeight: 'bold' }}>Yönetici Girişi</h2>
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>Kullanıcı Adı</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: '100%', padding: '5px 6px', border: '1px solid #bbb', borderRadius: 2, fontSize: 13, boxSizing: 'border-box' }}
            autoComplete="off"
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
    </div>
  )
}
