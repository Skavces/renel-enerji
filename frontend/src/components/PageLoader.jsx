// Marka renkleriyle dönen halka + logo — sayfa/route geçişlerinde ve veri
// yüklenirken kullanılan tek tip yükleme göstergesi.
export default function PageLoader({ label = 'Yükleniyor...', fullScreen = false }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${fullScreen ? 'min-h-screen' : 'py-24'}`}>
      <div className="brand-loader-ring w-14 h-14 rounded-full p-[3px]">
        <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
          <img src="/renel-logo.svg" alt="" className="w-7 h-7" />
        </div>
      </div>
      {label && <p className="text-gray-400 text-sm">{label}</p>}
    </div>
  )
}
