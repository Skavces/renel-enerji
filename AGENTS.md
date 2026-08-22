# RenEl Enerji — Agent Notları

Bu dosya, önceki oturumlarda (Claude Code hafızasından) biriken proje bilgisini
Codex için özetler. Kod davranışını iddia eden notlar zamanla eskiyebilir —
şüphede kalırsan koda bak.

## Proje ve mimari

- Full-stack: React + Vite + Tailwind frontend, NestJS + TypeORM + PostgreSQL
  backend (`backend/` altında).
- Backend VPS'te ayrı çalışır (port 3001); frontend `VITE_API_URL` ile API'ye ulaşır.
- Admin panel var: `src/api/admin.js` (JWT auth), `src/pages/admin/`.
- Projeler dinamik route ile sunuluyor: `/projelerimiz/:slug`
  (`src/pages/projeler/ProjeDetay.jsx`); eski hardcoded proje sayfaları artık kullanılmıyor.
- `backend/src/seed.ts` — `npm run seed` ile DB'yi ilk projelerle doldurur.
- Chatbot v2 (2026-07-05): lead kaydı, huni, tasarruf hesaplayıcı
  (`frontend/src/lib/gesCalc.js`, bilerek maliyet/amortisman yok).
  Konuşma dökümü **6 ay** saklanıyor (`ChatRetentionService`, KVKK.jsx ile senkron
  tutulmalı). Kaçan-lead bildirimi **dış kanala YOK** — admin panelde Loglar
  sayfası (DbLogger, Postgres, 30 gün saklama) tercih edildi; yeni bildirim
  kanalı önerme.

## Domain / canlı ortam

- Site canlı: `renelenerji.com` (VPS'e deploy edilmiş, GitHub Pages değil).
- **Kanonik adres WWW'SUZ**: `www.` → `renelenerji.com`'a 301. curl testlerinde
  www'suz adresi kullan.
- Proje production'da — "henüz gerekli değil" varsayımıyla öneri yapma;
  deploy/migration/config gibi geri dönüşü zor değişikliklerde onay al.

## VPS deploy düzeni

- Repo VPS'te: `/home/deploy/renel-enerji` (root altında değil).
- CI (`.github/workflows/deploy.yml`) main push'ta `deploy` kullanıcısıyla
  SSH'lanıp `git pull + docker compose up -d --build` çalıştırır.
- VPS SSH'ında 2FA var; sadece `deploy` kullanıcısı key-only istisnalı.
- Bu makineden VPS'e doğrudan SSH erişimi yok — kullanıcı komutları elle çalıştırıyor.
- VPS .env'de `OPENWEATHER_API_KEY` eksik (hava durumu widget'ı çalışmıyor, biliniyor).
- `APP_ENCRYPTION_KEY` (64 hex) zorunlu env — eksikse backend boot etmez.

## Kritik kurallar (feedback)

- **`.env` veya secret içeren hiçbir dosyayı asla commit etme.** `git add`
  yaparken dosyaları tek tek belirt, `git add .` / `git add -A` KULLANMA.
  (Geçmişte bu hata yüzünden repo silinip commit geçmişi temizlenmek zorunda kalındı.)
- **Commit mesajlarına Co-Authored-By satırı ekleme.**
- **Commit mesajları İngilizce olmalı** (proje Türkçe içerikli olsa da).
- **Backend'de açık `any` yasak** (prod kod + spec dosyaları dahil).
  `catch (err: any)` yerine `catch (err)` + narrowing (`useUnknownInCatchVariables`
  açık, catch değişkeni zaten `unknown`). Test mock'larında `as any` yerine
  `as unknown as X`. ESLint `@typescript-eslint/no-explicit-any: error` CI'da zorunlu.

## Bilinen tuzaklar

- **tsc incremental cache**: backend'de `tsconfig.tsbuildinfo` eski hataları
  maskeleyebilir (lokalde yeşil, CI'da kırmızı çıkabilir). Tip doğrulamadan önce:
  `rm -f tsconfig.tsbuildinfo && npx tsc --noEmit`.
- **npm lockfile uyuşmazlığı**: lokal npm sürümü lockfile'daki opsiyonel
  `@emnapi/*` girdilerini düşürebiliyor, CI'da `npm ci` EUSAGE ile patlıyor.
  Her install `npx -y npm@11.18.0 install ...` ile yapılmalı (tam sürüm pin'i
  şart — `npx -y npm@11` yetmez). Commit'ten önce doğrulama:
  `npx -y npm@11.18.0 ci --dry-run`.

## Açık işler (son inceleme: 2026-07-20)

Genel skor 84/100. Sırada:
- B.1: LLM çıktısının `as ParsedProject` cast'i yerine class-validator ile doğrulanması
- B.2: project-upload çok-dosya temp sızıntısı
- B.3: `NODE_OPTIONS --max-old-space-size=384`
- B.4: docker log rotasyonu

`ProjectsService` `BaseContentService` hiyerarşisi dışında kalan tek içerik
servisi — `published` kuralını her metotta elle tekrarlıyor (yapısal risk,
kalıcı çözüm: taban sınıfa taşıma). Yeni bir public okuma metodu eklenirse
`published: true` filtresini elle eklemeyi unutma.
