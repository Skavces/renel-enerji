# RenEL Enerji

Güneş enerjisi çözümleri sunan **RenEL Enerji** firmasının kurumsal web sitesi ve yönetim paneli.

## Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| Frontend | React 19, Vite 8, Tailwind CSS 4 |
| Backend | NestJS, TypeORM, PostgreSQL |
| Analytics | Umami |
| Deployment | Docker Compose, Nginx |

## Proje Yapısı

```
renel-enerji/
├── frontend/          # React + Vite uygulaması
│   ├── src/
│   │   ├── components/    # Ortak bileşenler
│   │   ├── pages/         # Sayfalar
│   │   │   ├── admin/     # Yönetim paneli sayfaları
│   │   │   └── projeler/  # Proje detay sayfaları
│   │   ├── api/           # API istek fonksiyonları
│   │   └── contexts/      # React context'leri
│   └── public/            # Statik dosyalar
├── backend/           # NestJS API
│   └── src/
│       ├── auth/          # JWT kimlik doğrulama
│       ├── projects/      # Projeler modülü
│       ├── references/    # Referanslar modülü
│       ├── analytics/     # Umami analytics entegrasyonu
│       └── upload/        # Dosya yükleme
└── docker-compose.yml # Tüm servisler
```

## Kurulum

### Gereksinimler
- Docker & Docker Compose
- Node.js 20+ (yerel geliştirme için)

### Yerel Geliştirme

```bash
# Bağımlılıkları yükle
cd frontend && npm install
cd ../backend && npm install

# Ortam değişkenlerini ayarla
cp .env.example .env              # proje kök dizini
cp backend/.env.example backend/.env

# Veritabanını başlat
docker compose up db -d

# Backend'i başlat (http://localhost:3001)
cd backend && npm run start:dev

# Frontend'i başlat (http://localhost:5173)
cd frontend && npm run dev
```

### Production Deploy

```bash
# Ortam değişkenlerini ayarla
cp .env.production .env   # .env.production dosyasını oluştur (aşağıya bak)

# Tüm servisleri build edip başlat
docker compose up -d --build
```

**Gerekli `.env` değişkenleri:**

```env
JWT_SECRET=          # En az 32 karakter rastgele string
ADMIN_USERNAME=      # Admin kullanıcı adı
ADMIN_PASSWORD=      # Admin şifresi
UMAMI_WEBSITE_ID=    # Umami dashboard'dan alınan website ID
UMAMI_USER=          # Umami kullanıcı adı
UMAMI_PASS=          # Umami şifresi
UMAMI_APP_SECRET=    # Umami uygulama secret'ı
```

## Servisler

| Servis | Port | Açıklama |
|--------|------|----------|
| Frontend (Nginx) | 8080 | React uygulaması |
| Backend (NestJS) | 3001 | REST API (internal) |
| Umami | 3002 | Analytics paneli |
| PostgreSQL | 5432 | Ana veritabanı (internal) |

## Admin Paneli

`/admin` rotasından erişilir. JWT ile korumalıdır.

**Özellikler:**
- Proje yönetimi (ekleme, düzenleme, silme, medya yükleme)
- Referans yönetimi
- Site analitikleri (Umami entegrasyonu)
- İki faktörlü doğrulama (2FA)
