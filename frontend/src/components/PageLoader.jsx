// Marka renkleriyle dönen halka + logo — sayfa/route geçişlerinde ve veri
// yüklenirken kullanılan tek tip yükleme göstergesi.
// overlay: tam ekranı kaplayan beyaz perde olarak gösterir — navigasyon
// geçişi ve sayfa içi veri yüklemesi birebir aynı görünümü kullanır.
// show: verildiğinde overlay hiç unmount edilmez, görünürlük opacity
// transition'ıyla kontrol edilir (bkz. App.jsx). Art arda hızlı gelen
// navigasyonlarda (örn. bir linke tıklayıp 250ms içinde başka birine
// tıklamak) overlay tam kapanıp yeniden mount olursa, arada gerçek
// içeriğin 1 kare görünüp ardından animasyonun sıfırdan tekrar başladığı
// bir "flaş" oluşuyordu — sürekli mount edip sadece opacity'yi
// değiştirmek bu boşluğu ortadan kaldırıyor.
export default function PageLoader({ label = 'Yükleniyor...', fullScreen = false, overlay = false, show }) {
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

  if (show === undefined) {
    return (
      <div className="backdrop-enter fixed inset-0 z-[100] bg-white flex items-center justify-center pointer-events-none">
        {spinner}
      </div>
    )
  }

  return (
    <div
      className={`fixed inset-0 z-[100] bg-white flex items-center justify-center pointer-events-none transition-opacity duration-200 ease-out ${show ? 'opacity-100' : 'opacity-0'}`}
      aria-hidden={!show}
    >
      {spinner}
    </div>
  )
}
