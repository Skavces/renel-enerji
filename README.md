# RenEL Enerji

Corporate website and admin panel for **RenEL Enerji**, a solar energy solutions company based in Turkey.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 8, Tailwind CSS 4 |
| Backend | NestJS, TypeORM, PostgreSQL |
| Analytics | Umami |
| Deployment | Docker Compose, Nginx |

## Project Structure

```
renel-enerji/
├── frontend/          # React + Vite application
│   ├── src/
│   │   ├── components/    # Shared components
│   │   ├── pages/         # Pages
│   │   │   ├── admin/     # Admin panel pages
│   │   │   ├── projeler/  # Project detail pages
│   │   │   └── neden-biz/ # Why Us detail pages
│   │   ├── api/           # API request functions
│   │   └── contexts/      # React contexts
│   └── public/            # Static assets
├── backend/           # NestJS REST API
│   └── src/
│       ├── auth/          # JWT authentication
│       ├── projects/      # Projects module
│       ├── references/    # References module
│       ├── blog/          # Blog module
│       ├── faq/           # FAQ module
│       ├── chat/          # AI chatbot module
│       ├── analytics/     # Umami analytics integration
│       ├── sitemap/       # Dynamic sitemap generation
│       ├── weather/       # Weather integration
│       └── upload/        # File upload
└── docker-compose.yml # All services
```

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)

### Local Development

```bash
# Install dependencies
cd frontend && npm install
cd ../backend && npm install

# Set up environment variables
cp .env.example .env
cp backend/.env.example backend/.env

# Start the database
docker compose up db -d

# Start the backend (http://localhost:3001)
cd backend && npm run start:dev

# Start the frontend (http://localhost:5173)
cd frontend && npm run dev
```

### Production Deployment

```bash
# Set up environment variables
cp .env.production .env

# Build and start all services
docker compose up -d --build
```

**Required `.env` variables:**

```env
JWT_SECRET=          # Random string, min 32 characters
ADMIN_USERNAME=      # Admin username
ADMIN_PASSWORD=      # Admin password
UMAMI_WEBSITE_ID=    # Website ID from Umami dashboard
UMAMI_USER=          # Umami username
UMAMI_PASS=          # Umami password
UMAMI_APP_SECRET=    # Umami app secret
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| Frontend (Nginx) | 8080 | React application |
| Backend (NestJS) | 3001 | REST API (internal) |
| Umami | 3002 | Analytics dashboard |
| PostgreSQL | 5432 | Main database (internal) |

## Database Backup & Restore

The main PostgreSQL data lives in the `pgdata` Docker volume. To back it up or restore it:

```bash
# Backup (creates a timestamped SQL dump on the host)
docker compose exec -T db pg_dump -U renel renel_enerji > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore (overwrites existing data — stop the backend first to avoid writes mid-restore)
docker compose stop backend
cat backup_20260101_120000.sql | docker compose exec -T db psql -U renel renel_enerji
docker compose start backend
```

Uploaded files (project/blog media) live in the `uploads` volume — back up the host directory it's bound to (or `docker run --rm -v renel-enerji_uploads:/data -v $(pwd):/backup alpine tar czf /backup/uploads.tar.gz -C /data .`) alongside the database dump.

## Admin Panel

Accessible at `/admin`, protected by JWT authentication.

**Features:**
- Project management (create, edit, delete, media upload)
- References management
- Blog management
- FAQ management
- Site analytics (Umami integration)
- Two-factor authentication (2FA)
