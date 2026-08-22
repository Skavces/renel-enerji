# RenEl Enerji — Güvenlik ve Kod Kalitesi Taraması

**Tarih:** 2026-08-21
**Kapsam:** Tüm kod tabanı (backend/NestJS, frontend/React, Docker, nginx, CI/CD, script'ler) statik inceleme + `renelenerji.com` canlı sitesinde pasif/salt-okunur (GET, header, DNS, TLS handshake) kontroller + kod kalitesi/teknik borç envanteri.
**Kapsam DIŞI:** Aktif exploit denemesi, brute-force, fuzzing, DoS, VPS'e doğrudan erişim (bu makineden VPS'e SSH yok).
**Önceki rapor:** [`guvenlik-raporu-2026-08-01.md`](./guvenlik-raporu-2026-08-01.md). Bu raporda o rapora göre **delta** ayrıca işaretlenmiştir.

---

## Yönetici Özeti

2026-08-01 raporundaki Yüksek/Orta öncelikli maddelerin **tamamı kapatılmış** — JSON-LD XSS düzeltmesi (regresyon testiyle birlikte), `sharp` yükseltmesi, Docker imaj pinleme, `/api` port sızıntısı, `.dockerignore`'lar, GitHub Actions SHA pinleme ve `permissions:` bloğu, çakışan header'lar. Bu üç haftalık iyileşme dönemi somut ve doğrulandı.

Bu tarama daha derin bir statik analizle yapıldı ve **daha önce görünmeyen yeni bulgular** ortaya çıkardı. En dikkat çekici olanı, Instagram medya içe aktarma akışındaki **SSRF açığı** (backend, sunucu tarafı istek sahteciliği) — kod tabanındaki tek gerçek "aktif sömürülebilir" zafiyet adayı. Bunun dışında kritik bir açık yok; kalanlar orta/düşük seviyeli sertleştirme önerileri.

Kullanıcı isteği üzerine bu kez **kod kalitesi / teknik borç** boyutu da tarandı. Sonuç: backend disiplinli (sıfır `any`, sıfır TODO, güçlü test kapsamı), ama **frontend'in %89'u (61 `.jsx/.js` dosya, ~9.936 satır) hiçbir tip denetiminden geçmiyor** — bu, kod tabanındaki tek en büyük yapısal risk.

| Kategori | Sayı |
|---|---|
| Güvenlik — Kritik | 0 |
| Güvenlik — Yüksek | 1 |
| Güvenlik — Orta | 8 |
| Güvenlik — Düşük | 7 |
| Kod Kalitesi — Yüksek etki | 3 |
| Kod Kalitesi — Orta etki | 7 |
| Kod Kalitesi — Düşük etki | 5 |
| Doğrulanan/çürütülen şüpheli bulgu | 3 |
| Güçlü yön | 25+ |

---

# BÖLÜM A — GÜVENLİK BULGULARI

## A.1 YÜKSEK ÖNCELİK

### A.1.1 — Instagram medya indirmede SSRF (Sunucu Taraflı İstek Sahteciliği)

**Dosya:** `backend/src/projects/instagram-import.service.ts:210-234`

```ts
if (post.media_type === 'IMAGE' && post.media_url) {
  items.push({ url: post.media_url, type: MediaType.IMAGE })
}
// ...
const r = await fetchWithTimeout(item.url, undefined, 30000)
```

`post.media_url` / `post.thumbnail_url`, Instagram Graph API yanıtından (`instagram-import.service.ts:89,143`) **hiçbir şema/host allow-list'i olmadan** doğrudan `fetchWithTimeout`'a veriliyor. Görsel yanıtı buffer'lanıp `assertMagicBytesFromBuffer` ile kontrol ediliyor (satır 255) — **ama video yanıtı hiçbir içerik kontrolünden geçmeden doğrudan diske akıtılıyor** (satır 236-247, `pipeline(Readable.fromWeb(r.body), createWriteStream(...))`).

**Saldırı senaryosu:** Bu akışı tetiklemek için Instagram API yanıtının `media_url` alanını kontrol edebilmek gerekir. Bunun iki yolu var:
1. **Bağlı Instagram hesabı ele geçirilirse** (token çalınırsa), saldırgan kendi postunu `media_url` olarak istediği bir URL'yle (örn. `http://169.254.169.254/latest/meta-data/` — bulut metadata endpoint'i, veya iç ağdaki `redis:6379`) taklit edemez çünkü `media_url` Meta'nın CDN'inden gelir — **ancak** webhook akışında (`A.2` ile ilişkili) `syncInstagramByMediaId` çağrısı Meta'nın kendi API'sinden veri çeker, yani bu path Meta'nın CDN URL formatına bağımlı kalır. Gerçek risk, **Meta CDN'inin kendisinin bir gün açık yönlendirme/SSRF zincirine izin vermesi veya bu servisin ileride farklı bir "url import" özelliğine genişletilmesi** durumunda ortaya çıkar.
2. Daha gerçekçi zayıf halka: bugün URL doğrulaması **yok** — yarın bu fonksiyona benzer bir "harici URL'den içe aktar" özelliği eklenirse (örn. admin panelden manuel medya URL girişi) aynı fonksiyon tekrar kullanılabilir ve o zaman doğrudan sömürülebilir hale gelir.

**Bugünkü gerçek etki:** Düşük-Orta (kaynak URL'ler Meta CDN'inden geliyor, doğrudan kullanıcı girdisi değil) ama **savunma katmanı sıfır** — defans-derinliği ilkesine aykırı. Video indirmede magic-byte kontrolünün tamamen atlanması ayrıca bağımsız bir sorun: kötü amaçlı/bozuk bir "video" dosyası hiç kontrol edilmeden `/uploads/` altına, herkese açık statik dosya sunumuna yazılabilir.

**Düzeltme:**
```ts
const ALLOWED_MEDIA_HOSTS = [/\.fbcdn\.net$/, /\.cdninstagram\.com$/]
function assertAllowedMediaHost(url: string) {
  const { hostname, protocol } = new URL(url)
  if (protocol !== 'https:' || !ALLOWED_MEDIA_HOSTS.some(h => h.test(hostname))) {
    throw new Error(`İzin verilmeyen medya kaynağı: ${hostname}`)
  }
}
```
Her `item.url` için `fetchWithTimeout` çağrısından önce çağrılmalı. Ayrıca video indirmede de `assertMagicBytes` (dosya yazıldıktan hemen sonra, ilk bayt kontrolü) eklenmeli — eski rapordaki 3.9 maddesinin doğrudan devamı, artık **Yüksek**'e yükseltiliyor çünkü kod okuması hangi satırın tam olarak korumasız olduğunu gösterdi.

---

## A.2 ORTA ÖNCELİK

### A.2.1 — Webhook gövdesi runtime'da doğrulanmıyor (interface vs class)

**Dosya:** `backend/src/webhooks/webhooks.controller.ts:55`, `backend/src/projects/instagram-types.ts:39-47`

```ts
@Body() body: InstagramWebhookBody   // interface, class DEĞİL
```

Global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })` yalnızca `class-validator` dekoratörlü **class**'larda çalışır. `InstagramWebhookBody` bir TypeScript `interface` olduğu için derleme zamanında tip kontrolü yapılır ama **çalışma zamanında hiçbir doğrulama uygulanmaz** — ValidationPipe bu body için tam anlamıyla no-op'tur.

`webhooks.service.ts:41-42`'de `value?.media?.id` doğrudan `mediaId` olarak çıkarılıp `syncInstagramByMediaId(mediaId)`'ye, oradan da Graph API URL path'ine gidiyor (`instagram-import.service.ts:137`).

**Risk sınırlayıcı faktör:** İstek `webhooks.controller.ts:57`'de `timingSafeEqual` ile HMAC-SHA256 imza doğrulamasından geçmeden hiçbir işlem yapmıyor — yani bugün bu body'yi şekillendirebilen tek taraf, `INSTAGRAM_APP_SECRET`'i bilen Meta'nın kendisi. Bu yüzden **doğrudan sömürülebilir değil**, ama tip güvenliğinin runtime karşılığı olmaması, gelecekte imza doğrulaması zayıflatılırsa (ör. hata ayıklama için geçici olarak atlanırsa) hiçbir ikinci savunma katmanı olmadığı anlamına geliyor.

**Düzeltme:** `InstagramWebhookBody`'yi (ve iç içe `entry`/`changes`/`value` tiplerini) `class-validator` dekoratörlü DTO class'larına çevirin; `mediaId` için ek olarak Instagram medya ID formatı (`^\d+$` gibi) regex doğrulaması ekleyin.

### A.2.2 — Redis'ten okunan sohbet geçmişi çalışma zamanında doğrulanmıyor

**Dosya:** `backend/src/chat/chat-history.service.ts:22-27`

```ts
const parsed: unknown = JSON.parse(raw)
return Array.isArray(parsed) ? (parsed as ChatMessage[]) : []
```

Yalnızca dizi olup olmadığı kontrol ediliyor; her elemanın `role`/`content` alanlarının doğru tipte/uzunlukta olduğu doğrulanmıyor. Bu geçmiş doğrudan Groq (LLM) prompt'una giriyor (`chat.controller.ts:55` → `chat.service.ts:83`).

**Risk sınırlayıcı faktör:** Redis'e bu anahtarı yalnızca backend'in kendisi (`save()` metodu, aynı dosya) yazıyor — dışarıdan doğrudan erişim yok, Redis dışarıya kapalı (`docker-compose.yml`'de portu published değil). Yani bugün için sömürü yolu yok; bu bir **iç tutarlılık/gelecek-geçirmezlik** maddesi — Redis'e erişimi olan başka bir servis eklenirse veya bir deserileştirme hatası oluşursa hatanın nerede patlayacağı belirsiz.

**Düzeltme:** `chat.service.ts`'deki `ChatMessage` tipi için basit bir runtime guard (`role in ['user','assistant'] && typeof content === 'string' && content.length < N`) eklenmesi yeterli — zaten `HISTORY_MAX_MESSAGES=20` ile boyut sınırlı, sadece şekil kontrolü eksik.

### A.2.3 — Instagram erişim token'ı URL sorgu dizesinde taşınıyor

**Dosya:** `backend/src/instagram-token/instagram-token.service.ts:51-57`

Token yenileme isteği token'ı query string'e koyuyor; hata durumunda `await res.text()` loglanıyor (satır 57) — bu, hata mesajı içine token'ın sızmış bir kopyasını (URL'i içeren proxy/CDN erişim logları vb.) taşıma riski taşır. `common/redact.ts:11-23`'teki Sentry query-param maskeleme bu **doğrudan `fetch` çağrısını** kapsamıyor (yalnızca uygulama içi HTTP isteklerini/Sentry event'lerini kapsıyor), yani bu belirli hata metni Sentry'ye gitmiyor olsa da sunucu stdout logunda (Docker log sürücüsü, rotasyonsuz — bkz. D.3) düz metin olarak kalabilir.

**Düzeltme:** Instagram Graph API'nin `Authorization: Bearer` header desteği varsa ona geçilmeli; değilse en azından hata logunda `res.text()` çıktısı token deseni için redakte edilmeli.

### A.2.4 — `.env.production` içinde paylaşılan sır ve düz-metin HTTP adresi

**Dosya:** `.env.production` (repo kökü, git-takipsiz)

`JWT_SECRET` ile `UMAMI_APP_SECRET` **birebir aynı değeri** paylaşıyor — bu iki bağımsız sistemin (auth JWT imzalama ve Umami webhook imzalama) tek bir sırrın sızmasıyla birlikte düşmesi anlamına gelir. Ayrıca `FRONTEND_URL`/`VITE_API_URL`/`VITE_UMAMI_URL` düz `http://<çıplak-IP>` olarak ayarlanmış — bu, canlı sitenin `https://renelenerji.com` (Cloudflare + HSTS preload) yapılandırmasıyla **tutarsız**.

**Not:** Bu dosyanın VPS'teki gerçek `.env` ile aynı olup olmadığı bu makineden doğrulanamadı (SSH erişimi yok). Bare-IP/HTTP değerleri, muhtemelen bu dosyanın domain+Cloudflare kurulumundan (2026-06-07) **önceki bir aşamadan kalma eski/durgun bir yerel kopya** olduğuna işaret ediyor. `DB_PASS`/`UMAMI_DB_PASS` de düşük entropili, yer tutucu görünümlü değerler — gerçek üretim sırları görünmüyor.

**Aksiyon:** (a) Bu dosyanın hâlâ ihtiyaç duyulup duyulmadığını netleştirin — kullanılmıyorsa silin; (b) VPS'teki gerçek `.env`'de `JWT_SECRET` ve `UMAMI_APP_SECRET`'in farklı, yüksek entropili değerler olduğunu doğrulayın, aynıysa rotate edin; (c) yerel makinede sır içeren dosyaları asgaride tutun.

### A.2.5 — `TOTP_BYPASS` ortam değişkeni Joi şemasında tanımlı değil

**Dosya:** `backend/src/auth/auth.service.ts:59-62`, `backend/src/app.module.ts:40-96`

```ts
const bypass = this.cfg.get('TOTP_BYPASS') === '1'
if (bypass && this.cfg.get('NODE_ENV') === 'production') {
  throw new Error('TOTP_BYPASS production ortamında kullanılamaz!')
}
```

Bu, yalnızca `validationOptions: { allowUnknown: true }` (`app.module.ts:97`) sayesinde çalışıyor — değişken Joi şemasında hiç tanımlı olmadığı için boot-time doğrulaması yok, yazım hatası veya yanlışlıkla `TOTP_BYPASS=1` ortam değişkeninin herhangi bir non-production ortamda (staging, CI, geliştirici makinesi paylaşılan bir `.env` ile) bırakılması sessizce 2FA'yı devre dışı bırakır ve bunu fark etmenin tek yolu kodu okumaktır.

**Düzeltme:** Joi şemasına `TOTP_BYPASS: Joi.string().valid('0','1').default('0')` eklenip production kontrolünün Joi seviyesinde (`Joi.when('NODE_ENV', {is:'production', then: Joi.valid('0')})`) yapılması, hatanın deploy anında (boot-time) yakalanmasını sağlar — şu anki haliyle hata yalnızca ilk login denemesinde fırlıyor.

### A.2.6 — Admin sayfalama üst sınırsız

**Dosya:** `backend/src/common/pagination.ts:3-6`

```ts
export function parsePage(value?: string): number {
  const page = Number(value)
  return Number.isInteger(page) && page >= 1 ? page : 1
}
```

Üst sınır yok. `?page=100000000` gibi bir değer, `chat/lead/logs/quote` admin listeleme endpoint'lerinde (6 nokta) TypeORM'e büyük bir `OFFSET` olarak gidiyor. JWT arkasında olduğu için sömürü yüzeyi düşük (yalnızca kimliği doğrulanmış admin bunu tetikleyebilir), ama gereksiz DB yükü/yavaşlık üretebilir.

**Düzeltme:** `Math.min(page, MAX_PAGE)` gibi bir üst sınır veya `WHERE id > lastId` tarzı keyset sayfalamaya geçiş (küçük ölçekte gerekli değil, basit üst sınır yeterli).

### A.2.7 — `sendmail` seviyesinde DMARC hâlâ `p=none`

**DNS (canlı, bu oturumda doğrulandı):**
```
_dmarc.renelenerji.com TXT "v=DMARC1; p=none; rua=mailto:dmarc@ubqx39m8.uriports.com; adkim=r; aspf=r; fo=1; pct=100"
```

2026-08-01 raporundaki 2.2 maddesi hâlâ tam kapanmadı — kayıt artık **var** (önceki durumda hiç yoktu) ve izleme (`rua`) aktif, ama politika hâlâ `p=none` (yalnızca izle, reddetme/karantina yok). Bu, [[dmarc-hardening]] notunda takip edilen kademeli geçişin **Adım 0-1 arası** aşaması; planlandığı gibi devam ediyor, yeni bir bulgu değil.

**Düzeltme:** Mevcut plan dahilinde `p=quarantine`'e geçiş.

### A.2.8 — CAA DNS kaydı yok

**DNS (canlı, bu oturumda doğrulandı):** `dig CAA renelenerji.com` boş döndü.

Herhangi bir CA, domain için sertifika verebilir. Düşük risk (mevcut sertifika sağlayıcısı — Google Trust Services — zaten meşru), ama tek satırlık bir sertleştirme:
```
renelenerji.com. CAA 0 issue "pki.goog"
renelenerji.com. CAA 0 issuewild ";"
```

---

## A.3 DÜŞÜK ÖNCELİK

| # | Bulgu | Konum |
|---|---|---|
| A.3.1 | `ParseUUIDPipe` hiçbir yerde kullanılmıyor (0 kullanım tespit edildi) — tüm `:id`/`:projectId`/`:mediaId` route parametreleri ham string olarak TypeORM'e gidiyor, geçersiz UUID → Postgres `22P02` → 500 (400 yerine). Bilgi sızıntısı yok, log gürültüsü var. | `blog/faq/references/projects/quote/chat` controller'ları |
| A.3.2 | DOMPurify config'siz çağrılıyor (`DOMPurify.sanitize(post.content)`, ek parametre yok) — varsayılan profil `target`/`style` niteliklerine izin verir, admin içerikli bir `<a target="_blank">` `rel="noopener"` olmadan geçebilir (ters sekme ele geçirme, düşük etki — admin içeriği zaten güvenilir taraftan geliyor) | `frontend/src/pages/BlogDetay.jsx:114` |
| A.3.3 | Tiptap `Link` eklentisi proje seviyesinde `protocols`/`validate` allow-list'i olmadan yapılandırılmış (`Link.configure({ openOnClick:false, HTMLAttributes:{...} })`) — editör modalindeki "https:// ile başlamalı" uyarısı yalnızca metinsel, JS'te zorlanmıyor | `frontend/src/components/RichTextEditor.jsx:283,341-345` |
| A.3.4 | Dependabot yalnızca `github-actions` ekosistemini izliyor (6 satırlık config) — `npm` (backend+frontend) ve `docker` (5 float-tag temel imaj: `postgres:16-alpine`×2, `redis:7-alpine`, `node:22-alpine`×2, `nginx-unprivileged:alpine`) hiç gözetlenmiyor | `.github/dependabot.yml` |
| A.3.5 | `backup-db.sh`'da `umask` ayarlanmıyor — DB dump'ları ve yedek dizini ambient umask'e (tipik 022) göre 0644/0755 oluşuyor, VPS'te başka bir yerel hesap varsa okunabilir; yedekler rclone'a şifrelenmeden gönderiliyor (2026-08-01 raporundaki 3.10 ile aynı, hâlâ açık) | `scripts/backup-db.sh` |
| A.3.6 | CI deploy script'inde rollback yok — health-check 10 deneme sonunda başarısız olursa başarısız build ayakta kalıyor; ayrıca hata durumunda `docker compose logs --tail=50 backend` public Actions logunun içine dökülüyor (sır sızıntısı riski, backend loglarının içeriğine bağlı) | `.github/workflows/deploy.yml:91-108` |
| A.3.7 | npm bağımlılık açıkları (detay Bölüm C) — hepsi transitif, hiçbiri şu an sömürülebilir yol üzerinde değil | backend 6 paket / frontend 6 paket |

---

## A.4 CANLI ORTAM — DOĞRULANAN İYİ DURUM

Bu oturumda yapılan pasif kontrollerin sonucu:

- **TLS:** `TLSv1.3`, sertifika doğrulaması `0 (ok)` — sağlıklı.
- **`/api` yönlendirmesi:** artık göreli `Location: /api/` dönüyor, iç port sızıntısı yok (eski 2.1 kapalı, doğrulandı).
- **Güvenlik header'ları:** statik dosya (`/uploads/*`) dahil her yanıtta tek ve tutarlı — HSTS, XFO, CSP, COOP, Permissions-Policy hepsi bir kez görünüyor. **Bkz. Bölüm E — bu, önceki bir bulgu adayını çürüttü.**
- **`/api/health`:** servisler ayaktayken yalnızca `{status:'up'}` dönüyor, ham sürücü hatası görünmüyor — ancak servisler *down* olduğundaki davranış bu oturumda test edilemedi (aktif arıza tetikleme kapsam dışı); kaynak kodu (`health.controller.ts:32-40`) hâlâ down durumunda ham hata mesajı döndürüyor, bu yüzden A.3 listesine tekrar girmedi ama izlenmeli.
- **`robots.txt`:** Cloudflare'in AI-bot content-signal bloğu var ve iyi yapılandırılmış; **ama `/rnl-panel` (admin panel) için `Disallow` satırı yok** — admin sayfaları yalnızca sayfa-içi `noindex` meta etiketiyle korunuyor. Düşük risk (arama motoru indekslemesi engellense de tarayıcı erişimi zaten JWT'ye bağlı) ama `Disallow: /rnl-panel` eklemek bedava bir sertleştirme.
- **`/umami/`:** CSP kasıtlı olarak gevşetilmiş (`'unsafe-inline' 'unsafe-eval'`) — nginx config'te dokümante edilmiş bir tasarım kararı, canlıda doğrulandı, bulgu değil.

---

# BÖLÜM B — KOD KALİTESİ / TEKNİK BORÇ

**Genel tablo:** Backend, boyutuna göre alışılmadık derecede temiz — sıfır `any`, sıfır TODO/FIXME, disiplinli `Logger` kullanımı, tutarlı exception taksonomisi, test:kaynak oranı ≈1:1.2 ve CI'da zorunlu. Borç neredeyse tamamen **frontend**'de yoğunlaşıyor: tip kapsamı, kopya-yapıştır admin sayfaları ve tek bir şişmiş API istemci dosyası.

## B.1 YÜKSEK ETKİ

### B.1.1 — Frontend'in %89'u hiçbir tip denetiminden geçmiyor

`frontend/tsconfig.json:9-10` → `allowJs: true`, **`checkJs: false`**. `frontend/eslint.config.js:10` → `files: ['**/*.{js,jsx}']` — yalnızca JS/JSX hedefleniyor, **20 adet `.ts` dosya (1.185 satır) hiçbir ESLint kuralından geçmiyor**.

Net etki: 61 `.jsx`/`.js` dosya, **9.936 satır** (frontend kaynağının ~%89'u) ne `tsc` ne de tip-farkında lint'ten geçiyor. Yalnızca 1.185 satırlık `.ts` kısmı `strict:true` altında. Hiçbir `package.json`'da `typecheck` script'i yok, CI'da (`deploy.yml`) `tsc --noEmit` adımı yok — `vite build` tipleri kontrol etmeden siliyor.

**Neden önemli:** Bu, kod tabanındaki herhangi bir sayıda `any` kullanımından çok daha büyük bir kör nokta — tip sistemi pratikte projenin çoğunda hiç yok.

**Önerilen yaklaşım:** Tek seferde `.jsx→.tsx` dönüşümü yerine kademeli: (1) `checkJs: true` açılıp `// @ts-nocheck` ile mevcut `.jsx` dosyaları geçici muaf tutulur, (2) `eslint.config.js`'e `.ts`/`.tsx` için `typescript-eslint` bloğu eklenir (backend'deki `eslint.config.mjs` desenine benzer), (3) CI'a `tsc --noEmit` adımı eklenir, (4) yeni/değişen dosyalar `.tsx`'e taşınırken muafiyet tek tek kaldırılır.

### B.1.2 — `frontend/src/api/admin.ts` — 427 satır, ~40 fonksiyon, 2 tutarsız hata şekli

İki paralel hata-işleme şablonu tekrarlanıyor: "Shape A" (`admin.ts:53-56` vb., ~24 site) sunucu mesajını tamamen atıp sabit bir string gösteriyor; "Shape B" (`admin.ts:58-71` vb., ~18 site) `json.message`'ı doğrudan ekrana basıyor. Nest'in `ValidationPipe`'ı doğrulama hatalarında `message`'ı **dizi** olarak döndürür (`api/quote.ts:30`'daki tek yer bunu doğru işliyor: `Array.isArray(json.message) ? json.message[0] : json.message`) — Shape B'nin diğer ~17 sitesi bu durumda kullanıcıya `[object Object]`'e yakın bir çıktı gösterir.

Ek iç tekrarlar aynı dosyada: filtre-sorgu builder'ı (`page,status,from,to` → `URLSearchParams`) 3 kez birebir kopyalanmış (`fetchChatLeads:354-357`, `fetchQuoteRequests:392-395`, `fetchLogs:420-423`); multipart upload mantığı 3 kez (`uploadMedia`, `uploadReferenceLogo`, `uploadBlogCover`); `login`/`verify2FA` `authOptions()` helper'ını çağırmak yerine onun ürettiği objeyi elle yazıyor.

**Önerilen yaklaşım:** Tek bir `apiRequest(path, opts)` sarmalayıcısı — hata şeklini (dizi/string) normalize eden, `authOptions()`'ı her zaman kullanan, filtre-query builder'ını ve multipart mantığını parametreleştiren. Backend tarafında zaten bu düzeyde bir merkezileştirme var (`common/fetch-with-timeout.ts`) — frontend'de eşdeğeri yok.

### B.1.3 — 4 admin liste sayfası kopya-yapıştır (~90 ortak satır × 4)

`BlogAdmin.jsx` (186), `SSSAdmin.jsx` (177), `ReferanslarAdmin.jsx` (178), `ProjelerAdmin.jsx` (250) — import bloğu, `SortableRow` iskeleti, `load()` (401→logout→navigate dahil), `handleDelete`, header bloğu **satır satır aynı**. `useEffect(() => { load() }, [])` + aynı `eslint-disable-line react-hooks/exhaustive-deps` **6 kez** tekrarlanıyor (bunlardan 4'ü bu sayfalarda).

**Olumlu taraf:** `useDndReorder` hook'u (`frontend/src/hooks/useDndReorder.ts`, 32 satır) zaten bu 4 sayfada ortak kullanılıyor — yani ortak çıkarım deseni proje içinde zaten var, sadece kalan ~90 satır/sayfa için uygulanmamış.

**Önerilen yaklaşım:** `useDndReorder`'ın yanına bir `useAdminList({ fetchFn, deleteFn })` hook'u eklenip `load`/`handleDelete`/401-guard mantığı oraya taşınabilir.

## B.2 ORTA ETKİ

| # | Bulgu | Konum |
|---|---|---|
| B.2.1 | `ProjectsService`, `BaseContentService`'i (3 diğer servisin kullandığı ortak CRUD taban sınıfı) baypas ediyor — 8 metot elle tekrarlanmış, `cache.bust('projects')` 4×, unique-violation→409 dönüşümü 2× tekrar | `backend/src/projects/projects.service.ts` vs `backend/src/common/base-content.service.ts` |
| B.2.2 | Backend `tsconfig.json` `strict:true` değil — `strictBindCallApply`/`noFallthroughCasesInSwitch`/`forceConsistentCasingInFileNames` açıkça kapalı; `strictFunctionTypes`/`noUncheckedIndexedAccess` hiç tanımlı değil. ESLint tek kurallı (`no-explicit-any`) ve `extends`/`parserOptions.project` yok — tip-farkında kurallar (`no-unsafe-assignment` vb.) çalışamıyor, bu da B.2.6'daki I/O cast'lerini yakalayamıyor | `backend/tsconfig.json`, `backend/eslint.config.mjs` |
| B.2.3 | `PAGE_SIZE = 50` 4 ayrı serviste bağımsız tanımlı (`chat-rating.service.ts:13`, `chat-lead.service.ts:18`, `logs.service.ts:12`, `quote.service.ts:17`); `findAllWithStats` sorgu şekli (where→dateRange→Promise.all([find,count,count])→pageCount) 4 serviste neredeyse birebir tekrar | backend, 4 servis |
| B.2.4 | 3 farklı `slugify`/`toSlug` implementasyonu — backend (`projects.service.ts:117-126`), `ProjeForm.jsx:22-29`, `BlogForm.jsx:13-22` — üçü de aynı 6 Türkçe karakter dönüşümüyle başlıyor ama sonrası ayrışıyor: **BlogForm'da uzunluk sınırı yok**, backend 60 karakterde kesiyor. Frontend'in önizlemede ürettiği slug, backend'in kaydettiğiyle farklı olabilir | backend + 2 frontend dosyası |
| B.2.5 | Test boşlukları — sıfır test: `sitemap.service.ts` (100 satır), **`common/encryption.service.ts`** (40 satır, AES-256-GCM şifreleme, hiç test yok), `projects/media.service.ts` (62), `chat/chat-stats.service.ts` (47), `quote/quote-retention.service.ts` (40 — kardeşi `chat-retention` test edilmişken bu edilmemiş). Frontend'de component/hook/context seviyesinde **hiç test altyapısı yok** (`vite.config.js`'te `test` bloğu, `@testing-library/*` bağımlılığı yok) — yalnızca 4 saf fonksiyon dosyası test ediliyor | backend 5 dosya, frontend altyapı eksikliği |
| B.2.6 | 7 doğrulanmamış `res.json()` cast'i — Instagram Graph API (`instagram-import.service.ts:89,143`), Groq/LLM çıktısı (`groq.service.ts:85`), Umami (`analytics.service.ts:62-63,82`), IG token yenileme (`instagram-token.service.ts:61,63,75`). **Karşı-örnek proje içinde zaten var ve doğru desen:** `instagram-parse.service.ts:60-90`, LLM çıktısını `as ParsedProject` yerine `plainToInstance` + `class-validator` ile gerçekten doğruluyor (satır 67'deki yorum bunu bilinçli bir tercih olarak açıklıyor) | 4 backend dosyası |
| B.2.7 | 19 `alert()`/`confirm()` çağrısı 7 admin sayfasında tek hata/onay kanalı olarak kullanılıyor — tutarlı bir toast/modal bileşeni yok | `ChatDegerlendirme`, `ProjelerAdmin`, `TeklifTalepleri`, `BlogAdmin`, `ProjeForm`, `ReferanslarAdmin`, `SSSAdmin` |

## B.3 DÜŞÜK ETKİ

| # | Bulgu | Konum |
|---|---|---|
| B.3.1 | Ölü kod: `TwoFactorSetup.jsx` (229 satır, hiçbir route/import tarafından referanslanmıyor — `Guvenlik.jsx` aynı işi görüyor), `Spinner.jsx` (6 satır, sıfır referans), ölü export `linkMedia`/`reorderMedia` (`api/admin.ts:179-201`, backend endpoint'i var ama frontend çağıran yok) | `frontend/src/pages/admin/`, `frontend/src/components/` |
| B.3.2 | Marka rengi `#448834` 299 kez, 46 dosyada hardcoded (yalnızca 4'ü `index.css`'te); Tailwind theme token'ı yok. Eşlik eden `#357228`/`#2d6124` tonları da aynı şekilde | frontend geneli |
| B.3.3 | `.vite/deps/_metadata.json` + `.vite/deps/package.json` git'te **takipli** — tek takipli build-cache artefaktı (boş `optimized:{}`); `.gitignore`'daki 2 yeni kural (`*.rdb`, `*-tarama-*.txt`) henüz commit'lenmemiş | repo kökü |
| B.3.4 | `@types/dompurify` gereksiz bağımlılık — `dompurify` v3 kendi tip tanımlarını taşıyor, stub paket sıfır referanslı | `frontend/package.json:38` |
| B.3.5 | 6 bileşen 200+ satır: `ProjeForm.jsx` (572), `RichTextEditor.jsx` (507), `Guvenlik.jsx` (476), `ChatDegerlendirme.jsx` (460), `TeklifChatbot.jsx` (289), `ProjeDetay.jsx` (260) — backend'de **hiçbir dosya 400 satırı geçmiyor**, borç tek taraflı frontend'de | frontend |

## B.4 İYİ UYGULANAN DESENLER (dokunulmaması gereken)

Sıfır `any` (backend, ESLint zorunlu), sıfır `@ts-ignore`/`@ts-expect-error`, sıfır TODO/FIXME/HACK, sıfır frontend `console.*`, sıfır yorum satırına alınmış kod, sıfır `eval`/`child_process`/dinamik `require`, boş `catch` bloklarının ikisi de gerekçeli yorumla, `fetchWithTimeout`/`BaseContentService`/`useDndReorder`/`useLatestFetch`/`AdminPager` merkezi soyutlamaları, `instagram-parse.service.ts`'nin LLM çıktısını gerçekten doğrulaması (bkz. B.2.6), backend test:kaynak oranı ≈1:1.2 ve CI'da (`npm test && npm run test:e2e`) zorunlu.

---

# BÖLÜM C — BAĞIMLILIKLAR

## C.1 npm audit — backend

| Paket | Şiddet | Not |
|---|---|---|
| `brace-expansion` | Yüksek | ReDoS/OOM — `typeorm`'un transitive bağımlılığı |
| `fast-uri` | Yüksek | Joi'nin transitive bağımlılığı |
| `js-yaml` | Yüksek | `@nestjs/swagger`'ın transitive bağımlılığı, CVE-2026-59870 |
| `nanoid` | Yüksek | Sonsuz döngü riski (negatif/sıfır size) |
| `postcss` | Orta | Kaynak-map path traversal |
| `typeorm` | Orta | `<0.3.31`, migration template-literal code injection (geliştirici ortamı, prod saldırı yüzeyi değil) |

`npm audit fix` çoğunu otomatik çözer; `typeorm` güncellemesi (`0.3.30→0.3.31+`) minör versiyon içi, düşük riskli.

## C.2 npm audit — frontend

| Paket | Şiddet | Not |
|---|---|---|
| `brace-expansion` | Yüksek | — |
| `js-yaml` | Yüksek | — |
| `nanoid` | Yüksek | — |
| `postcss` | Yüksek | Kaynak-map path traversal (frontend'de moderate değil high olarak işaretli — build tooling zinciri farklı) |
| `react-router` | Yüksek | RSC modu CSRF-bypass (GHSA-qwww-vcr4-c8h2) — proje `BrowserRouter`/RSC kullanmıyor, **şu an sömürülemez** ama yükseltilmeli |
| `dompurify` | Orta | `CUSTOM_ELEMENT_HANDLING` bypass — proje config'siz `sanitize()` çağırdığı için (bkz. A.3.2) bypass tetiklenmiyor |

## C.3 Sürüm ayrışması

- **TypeScript:** backend `5.9.3` (pinli) vs frontend `6.0.3` (pinli) — aynı monorepo'da iki majör-benzeri sürüm. Ortak bir tip paylaşılmadığı için pratik risk düşük, ama gelecekte paylaşılan bir `types/` paketi düşünülürse engel olur.
- **`@types/node`:** backend `20.19.43` — Docker runtime `node:22-alpine` ile 2 majör geride. Fonksiyonel sorun yaratmıyor (API'ler geriye uyumlu) ama yeni Node 22 API'leri için tip desteği yok.
- **Dependabot kapsamı** (A.3.4 ile aynı madde, burada bağımlılık bağlamında): yalnızca `github-actions` izleniyor.

---

# BÖLÜM D — ALTYAPI / CI / DEPLOY

## D.1 Docker

- `docker-compose.yml`: `prerender` ve `umami` imajları **digest'e pinli** (`@sha256:...`), 2026-08-01 raporunun doğrudan sonucu. `postgres:16-alpine` (×2), `redis:7-alpine` hâlâ float tag — bu üçü resmi/güvenilir kaynaklardan geldiği için risk düşük ama Dependabot docker ekosistemi izlemediği için (A.3.4) sessizce eskiyorlar.
- `backend`/`frontend` Dockerfile'ları `node:22-alpine` build-time float tag kullanıyor; `frontend/Dockerfile`'ın runtime tabanı `nginxinc/nginx-unprivileged:alpine` — repodaki en gevşek pin.
- Her iki Dockerfile'da da `.dockerignore` mevcut ve `.env*` hariç tutuyor (2026-08-01 raporunun sonucu, doğrulandı).
- Hiçbir serviste `logging:` (rotasyon) tanımı yok — varsayılan `json-file` sürücüsü sınırsız büyür. Hiçbir serviste `read_only`/`cap_drop`/`security_opt` yok (backend/frontend container'ları zaten non-root kullanıcıyla çalışıyor, bu ek bir katman olurdu).
- `redis` healthcheck'i `redis-cli -a $REDIS_PASS ping` — parola `docker inspect`/`ps aux` üzerinden container process argümanlarında görünür oluyor. `REDISCLI_AUTH` ortam değişkenine geçmek bunu gizler (2026-08-01 raporunun 14. maddesiyle aynı, hâlâ açık).

## D.2 nginx

- Sunucu seviyesinde tek bir `security-headers.conf` snippet'i + 6 `proxy_hide_header` — canlıda doğrulandı, `/uploads/` dahil hiçbir location'da **duplicate header yok** (bkz. Bölüm E.1, önceki bir bulgu adayı çürütüldü).
- `/umami/` location'ı CSP'yi kasıtlı gevşetiyor (`unsafe-inline`/`unsafe-eval`) — dokümante edilmiş, canlıda doğrulandı, tasarım kararı.
- `geo $cloudflare` bloğu tanımlı ama hiçbir yerde referans edilmiyor — ölü nginx değişkeni, zararsız ama temizlenebilir.
- 22 satırlık `set_real_ip_from` listesi Cloudflare CIDR'lerini elle tutuyor; yorum satırı bunun elle güncellenmesi gerektiğini belirtiyor (son kontrol 2026-07) — Cloudflare CIDR aralıkları nadiren değişse de bu bir drift kaynağı.

## D.3 CI/CD

- `deploy.yml`: `permissions: contents: read` (kök seviye, doğru), 3 action tam commit SHA'sına pinli, deploy `needs: test` ile gated. **Frontend `npm run lint` CI'da hiç çalışmıyor** (script `package.json`'da var ama workflow'da yok) — backend'de lint zorunluyken frontend'de değil.
- Rollback yok, health-check hata logu Actions public log'una dökülüyor (A.3.6).
- `test` job'ında Postgres/Redis servis container'ları `postgres`/`test` gibi sabit test parolaları kullanıyor — yalnızca CI runner içinde yaşıyor, gerçek risk yok.

## D.4 Yedekleme

`scripts/backup-db.sh` genel olarak sağlam (`set -euo pipefail`, boyut sağlaması, rotasyon, opsiyonel off-VPS kopya) ama `umask` eksikliği (A.3.5) hâlâ açık — tek satırlık düzeltme (`umask 077` script başına).

---

# BÖLÜM E — DOĞRULANMIŞ / ÇÜRÜTÜLMÜŞ ŞÜPHELİ BULGULAR

- **`/uploads/*` nginx location'ında çift güvenlik header'ı şüphesi:** Keşif aşamasında, bu location'ın kendi `proxy_hide_header` listesini tekrar etmediği için backend Helmet header'larının sızıp snippet'inkilerle çakışabileceği düşünüldü. **Canlıda test edildi** (`curl -I` gerçek bir `/uploads/*.webp` dosyasına): her güvenlik header'ı (CSP, HSTS, XFO, COOP dahil) **tam olarak bir kez** görünüyor, snippet'in CSP değeri (Sentry/Cloudflare domain'leriyle) çıkıyor, Helmet'in varsayılan CSP'sinden iz yok. **Sonuç: bulgu çürütüldü** — nginx, sunucu seviyesindeki `proxy_hide_header`'ı bu location'a doğru şekilde miras bırakıyor (location kendi `proxy_hide_header`'ını tanımlamadığı için üst seviyeden devralıyor); duplicate header riski yok.
- **`/api/health`'in düşük durumda hata sızdırması:** Kaynak kod (`health.controller.ts:32-40`) hâlâ ham sürücü hatasını döndürüyor gibi görünüyor, ama servisler ayaktayken (canlı durum) yalnızca `{status:'up'}` dönüyor — **düşük durum canlıda test edilemedi** (aktif arıza tetikleme kapsam dışı). Statüsü "doğrulanamadı, kaynak koda göre hâlâ olası" — A.3 listesine tam bulgu olarak girmedi, izleme notu olarak bırakıldı.
- **CSRF (yükleme endpoint'leri):** `sameSite: 'strict'` cookie ayarı (`auth.controller.ts`) doğrulandı — bu, cookie'nin hiçbir cross-site isteğe eklenmemesini garanti eder. 2026-08-01 raporunda zaten kapalı/etkisiz olarak işaretlenmişti, bu oturumda tekrar teyit edildi, yeniden test edilmedi.

---

# BÖLÜM F — GÜÇLÜ YÖNLER

**Backend:** TOTP/IG-token sırları AES-256-GCM şifreli; JWT httpOnly+secure+sameSite:strict, Redis tabanlı jti blacklist, tokenVersion ile toplu iptal; bcrypt cost 12 + her zaman çalışan `compare` (timing-attack koruması); TOTP replay koruması; webhook imzası `timingSafeEqual`; upload pipeline'ında magic-byte + SVG reddi + WEBP dönüşümü (video hariç, bkz. A.1.1); ham SQL yok denecek kadar az ve tamamı parametrize; çift katmanlı XSS koruması (`sanitize-html` + `DOMPurify`); katmanlı rate limiting; chatbot prompt-injection filtreleri + LLM-judge; KVKK uyumlu otomatik veri temizleme; `ValidationPipe({whitelist,forbidNonWhitelisted})`; container non-root; sıfır hardcoded secret.

**Frontend:** Admin JWT hiçbir zaman JS'e dokunmuyor (yalnızca httpOnly cookie); route guard'lar auth tamamlanmadan render etmiyor; tüm `target="_blank"` linklerde `rel="noopener noreferrer"` (blog içeriği hariç, bkz. A.3.2); açık yönlendirme yok; token/secret hiçbir web storage'a dokunmuyor; JSON-LD kaçışlaması merkezi ve regresyon testli.

**Canlı site:** TLS 1.3, geçerli sertifika; güçlü ve tekil CSP/HSTS/XFO/COOP; DNS SPF+DMARC(izleme) mevcut; `/api` port sızıntısı yok; rate limiting aktif.

**CI/CD:** Deploy yalnızca `push:main`'de, fork PR vektörü yok; prod sırları hiç Actions'tan geçmiyor; action'lar SHA'ya pinli; deploy testler geçmeden tetiklenmiyor; container portları asgari (`db`/`redis` host'a açık değil).

**Mühendislik disiplini (yeni bu oturumda tespit edildi):** sıfır `any`/`@ts-ignore`/TODO backend genelinde; `instagram-parse.service.ts`'nin LLM çıktısını `as` yerine gerçek doğrulamayla işlemesi — kod tabanının geri kalanına örnek olabilecek bir desen; backend test:kaynak oranı ≈1:1.2 ve CI'da zorunlu; yoğun ve isabetli Türkçe açıklama yorumları (özellikle "neden naif bir cast reddedildi" türünden gerekçe yorumları).

---

# BÖLÜM G — ÖNCELİKLENDİRİLMİŞ AKSİYON LİSTESİ

| # | Madde | Öncelik | Tahmini efor | Not |
|---|---|---|---|---|
| 1 | Instagram medya indirmede host/şema allow-list + video'da magic-byte kontrolü (A.1.1) | **Yüksek** | Düşük | Tek dosya, ~15 satır |
| 2 | Webhook body'sini class-validator DTO'suna çevir (A.2.1) | Orta | Düşük-Orta | `instagram-types.ts` + yeni DTO dosyası |
| 3 | `TOTP_BYPASS`'ı Joi şemasına ekle (A.2.5) | Orta | Çok düşük | Tek satır |
| 4 | `.env.production`'ın güncelliğini/gerekliliğini netleştir; gerekiyorsa sırları rotate et (A.2.4) | Orta | Düşük | Kullanıcı kararı gerektirir |
| 5 | Chat geçmişi Redis okuma guard'ı ekle (A.2.2) | Orta | Çok düşük | ~5 satır |
| 6 | IG token yenilemede hata logunu redakte et / Authorization header'a geç (A.2.3) | Orta | Düşük | |
| 7 | Sayfalamaya üst sınır ekle (A.2.6) | Orta | Çok düşük | |
| 8 | DMARC'ı planlı şekilde `p=quarantine`'e geçir (A.2.7) | Orta | — | Zaten takip ediliyor ([[dmarc-hardening]]) |
| 9 | CAA kaydı ekle (A.2.8) | Düşük | Çok düşük | Tek DNS kaydı |
| 10 | `robots.txt`'e `Disallow: /rnl-panel` ekle | Düşük | Çok düşük | |
| 11 | `backup-db.sh`'a `umask 077` ekle, redis healthcheck'i `REDISCLI_AUTH`'a geçir (A.3.5) | Düşük | Çok düşük | |
| 12 | Dependabot'a `npm` (backend+frontend) ve `docker` ekosistemlerini ekle (A.3.4) | Düşük | Çok düşük | Config dosyası |
| 13 | npm audit fix (backend+frontend, bkz. Bölüm C) | Düşük | Düşük | Test edip planlı uygula |
| 14 | DOMPurify'a `ALLOWED_ATTR`/link-hardening hook'u ver (A.3.2/3.3) | Düşük | Düşük | |
| 15 | **`frontend/tsconfig.json` `checkJs:true` + CI'da `tsc --noEmit`** (B.1.1) | **Yüksek (kod kalitesi)** | Yüksek | Kademeli yaklaşım öner (bkz. B.1.1) |
| 16 | `api/admin.ts`'i tek bir `apiRequest` sarmalayıcısına indir (B.1.2) | Yüksek (kod kalitesi) | Orta | |
| 17 | 4 admin liste sayfasını `useAdminList` hook'una indir (B.1.3) | Yüksek (kod kalitesi) | Orta | |
| 18 | `ProjectsService`'i `BaseContentService`'e taşı (B.2.1) | Orta | Orta | `relations`/`coverOnly` için base'e hook eklemek gerekir |
| 19 | `encryption.service.ts` + `sitemap.service.ts` için birim test ekle (B.2.5) | Orta | Düşük | En yüksek "kritiklik/test yok" oranı |
| 20 | 3 `slugify` implementasyonunu tek yere indir (B.2.4) | Orta | Düşük | Frontend↔backend slug tutarsızlığını önler |
| 21 | Ölü kod temizliği: `TwoFactorSetup.jsx`, `Spinner.jsx`, ölü export'lar (B.3.1) | Düşük | Çok düşük | |
| 22 | `.vite/deps/*`'i `git rm --cached` ile çıkar, bekleyen 2 `.gitignore` kuralını commit'le (B.3.3) | Düşük | Çok düşük | |
| 23 | `#448834` için Tailwind theme token'ı tanımla (B.3.2) | Düşük | Orta (299 site) | |

---

*Bu rapor statik kod incelemesi ve canlı sitede yalnızca pasif/salt-okunur (GET, header, DNS, TLS handshake) kontrollere dayanmaktadır. Aktif exploit denemesi, brute-force veya DoS testi yapılmamıştır. Kod kalitesi bölümü, yapısal/istatistiksel envanterdir; her madde ilgili dosyalar okunarak spot-check doğrulaması yapılmıştır. `.env.production` içeriği (§A.2.4) okunmuş ancak hiçbir gerçek sır değeri bu raporda yer almamaktadır.*
