interface PagedResult {
  page: number
  pageCount: number
}

// Sayfalı sonucu her zaman hemen göster, ama istenen sayfa artık aralık
// dışıysa (silme sonrası azalan toplam, daralan filtre, vb.) son geçerli
// sayfaya dön — aksi halde pager kendini gizler ve admin mahsur kalır.
// Mutlak hedef kullanılır (göreli -1 değil): art arda tetiklenen düzeltmeler
// birbirini ezip sayfayı fazla geri götürmez.
export function applyPagedResult<T extends PagedResult>(
  items: unknown[],
  result: T,
  setPage: (page: number) => void,
  setData: (data: T) => void,
): void {
  setData(result)
  if (items.length === 0 && result.page > result.pageCount) {
    setPage(result.pageCount)
  }
}
