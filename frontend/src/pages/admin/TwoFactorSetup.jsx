import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, ShieldOff, CheckCircle } from 'lucide-react'
import { generate2FASetup, confirm2FASetup, get2FAStatus, remove2FA } from '../../api/admin'

export default function TwoFactorSetup() {
  const navigate = useNavigate()
  const [status, setStatus] = useState(null) // { enabled: bool }
  const [setup, setSetup] = useState(null)   // { secret, qrCodeUrl }
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [removeMode, setRemoveMode] = useState(false)
  const [removeCode, setRemoveCode] = useState('')

  useEffect(() => {
    get2FAStatus().then(setStatus).catch(() => navigate('/admin'))
  }, [])

  const startSetup = async () => {
    setError('')
    setLoading(true)
    try {
      const data = await generate2FASetup()
      setSetup(data)
    } catch {
      setError('QR kodu üretilemedi.')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await confirm2FASetup(setup.secret, code)
      setSuccess('2FA başarıyla etkinleştirildi!')
      setSetup(null)
      setCode('')
      setStatus({ enabled: true })
    } catch (err) {
      setError(err.message)
      setCode('')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await remove2FA(removeCode)
      setStatus({ enabled: false })
      setSetup(null)
      setRemoveMode(false)
      setRemoveCode('')
      setSuccess('2FA devre dışı bırakıldı.')
    } catch (err) {
      setError(err.message || '2FA kaldırılamadı.')
      setRemoveCode('')
    } finally {
      setLoading(false)
    }
  }

  if (!status) return <div className="text-center py-20 text-gray-400">Yükleniyor...</div>

  return (
    <main className="max-w-lg mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">İki Faktörlü Doğrulama</h1>
        <p className="text-sm text-gray-400 mt-0.5">Hesabınızı authenticator uygulamasıyla koruyun</p>
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-3 rounded-xl mb-6 text-sm">
          <CheckCircle size={16} />
          {success}
        </div>
      )}

      {/* Mevcut durum */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {status.enabled
            ? <ShieldCheck size={20} className="text-[#448834]" />
            : <ShieldOff size={20} className="text-gray-400" />
          }
          <div>
            <p className="text-sm font-medium text-gray-800">
              {status.enabled ? '2FA Aktif' : '2FA Devre Dışı'}
            </p>
            <p className="text-xs text-gray-400">
              {status.enabled ? 'Giriş yaparken kod gerekiyor' : 'Hesabınız ek koruma olmadan açık'}
            </p>
          </div>
        </div>
        {status.enabled ? (
          <button
            onClick={() => { setRemoveMode(true); setError('') }}
            disabled={loading}
            className="text-sm text-red-500 hover:text-red-600 font-medium disabled:opacity-40"
          >
            Devre Dışı Bırak
          </button>
        ) : !setup && (
          <button
            onClick={startSetup}
            disabled={loading}
            className="text-sm text-[#448834] hover:text-[#357228] font-medium disabled:opacity-40"
          >
            {loading ? 'Yükleniyor...' : 'Etkinleştir'}
          </button>
        )}
      </div>

      {/* 2FA kaldırma — kod doğrulama */}
      {removeMode && (
        <div className="bg-white border border-red-100 rounded-xl p-6 space-y-4 mb-6">
          <p className="text-sm font-semibold text-gray-800">2FA'yı devre dışı bırakmak için authenticator kodunuzu girin</p>
          <form onSubmit={handleRemove} className="space-y-3">
            <input
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={removeCode}
              onChange={(e) => setRemoveCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-center text-xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400"
              required
              autoFocus
            />
            {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setRemoveMode(false); setRemoveCode(''); setError('') }}
                className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={loading || removeCode.length !== 6}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg transition-colors text-sm"
              >
                {loading ? 'Kaldırılıyor...' : 'Devre Dışı Bırak'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Setup akışı */}
      {setup && (
        <div className="bg-white border border-gray-100 rounded-xl p-6 space-y-5">
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-1">1. QR kodu tarayın</p>
            <p className="text-xs text-gray-400 mb-4">Google Authenticator, Authy veya benzeri bir uygulama kullanın</p>
            <div className="flex justify-center">
              <img src={setup.qrCodeUrl} alt="QR Code" className="w-48 h-48 rounded-xl border border-gray-100" />
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-800 mb-1">Manuel giriş kodu</p>
            <p className="font-mono text-sm bg-gray-50 px-3 py-2 rounded-lg text-gray-700 tracking-widest text-center select-all">
              {setup.secret}
            </p>
          </div>

          <form onSubmit={handleConfirm} className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-1">2. Uygulamadaki kodu girin</p>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-center text-xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-[#448834]/30 focus:border-[#448834]"
                required
                autoFocus
              />
            </div>

            {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setSetup(null); setError(''); setCode('') }}
                className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="flex-1 bg-[#448834] hover:bg-[#357228] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg transition-colors text-sm"
              >
                {loading ? 'Doğrulanıyor...' : 'Onayla'}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  )
}
