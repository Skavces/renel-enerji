// <input type="date"> yerel (TR) gün verir, backend UTC ISO bekler. Yerel gün
// sınırlarını (00:00 - 23:59:59.999) ISO'ya çevirir; boş/geçersiz girdi atlanır.
export function dayRangeToIso(fromDay?: string, toDay?: string): { from?: string; to?: string } {
  const result: { from?: string; to?: string } = {}
  if (fromDay) {
    const start = new Date(`${fromDay}T00:00:00`)
    if (!isNaN(start.getTime())) result.from = start.toISOString()
  }
  if (toDay) {
    const end = new Date(`${toDay}T23:59:59.999`)
    if (!isNaN(end.getTime())) result.to = end.toISOString()
  }
  return result
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}
