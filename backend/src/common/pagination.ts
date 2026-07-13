// Admin liste sayfalaması: geçersiz/eksik ?page= değeri sessizce 1'e düşer
// (admin-panel içi kullanım; katı 400 dönmeye değmez)
export function parsePage(value?: string): number {
  const page = Number(value)
  return Number.isInteger(page) && page >= 1 ? page : 1
}
