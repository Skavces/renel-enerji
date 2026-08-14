// Veri çekme hatası (ör. sunucu geç uyandı, bağlantı koptu) için "boş içerik"
// yerine gösterilen tekrar dene bileşeni — sessiz başarısızlıkların site
// bozukmuş gibi görünmesini engeller.
export default function LoadError({ message = 'İçerik yüklenemedi.', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center px-6">
      <p className="text-gray-500 max-w-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm font-semibold text-[#448834] hover:text-[#357228] transition-colors"
        >
          Tekrar dene
        </button>
      )}
    </div>
  )
}
