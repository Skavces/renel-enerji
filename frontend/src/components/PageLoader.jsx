// Marka renkleriyle dönen halka + logo — sayfa/route geçişlerinde ve veri
// yüklenirken kullanılan tek tip yükleme göstergesi.
// overlay: tam ekranı kaplayan beyaz perde olarak gösterir (navigasyon
// geçişindeki markalı ekranla birebir aynı görünüm).
// animated: sadece App.jsx'teki zorunlu 2sn'lik geçiş perdesi için — sabit
// süreli fade in/out. Veri yüklenirken (süresi belirsiz) kullanılmaz.
export default function PageLoader({ label = 'Yükleniyor...', fullScreen = false, overlay = false, animated = false }) {
  const ringSize = fullScreen ? 'w-24 h-24' : 'w-14 h-14'
  const logoSize = fullScreen ? 'w-12 h-12' : 'w-7 h-7'

  const spinner = (
    <div className={`flex flex-col items-center justify-center gap-5 ${fullScreen ? 'min-h-screen' : 'py-24'}`}>
      <div className={`brand-loader-ring ${ringSize} rounded-full p-[3px]`}>
        <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
          <img src="/renel-logo.svg" alt="" className={logoSize} />
        </div>
      </div>
      {label && <p className={`text-gray-400 ${fullScreen ? 'text-base' : 'text-sm'}`}>{label}</p>}
    </div>
  )

  if (!overlay) return spinner

  return (
    <div
      className={`fixed inset-0 z-[100] bg-white flex items-center justify-center pointer-events-none ${animated ? 'route-overlay' : ''}`}
    >
      {spinner}
    </div>
  )
}
