// GET :slug rotalarıyla aynı controller'daki sabit path'ler (admin/*) çakışmasın:
// slug'ı "admin" olan içerik, /api/projects/admin gibi bir URL'de içerik servis
// ederdi. DTO validasyonu (IsNotIn) ve otomatik slug üretimi (uniqueSlug) bu
// listeyi birlikte kullanır.
export const RESERVED_SLUGS = ['admin']
