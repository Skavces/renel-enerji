#!/usr/bin/env bash
# Günlük veritabanı yedeği: pg_dump | gzip → ~/backups, 14 gün rotasyon,
# rclone remote tanımlıysa VPS dışına kopya.
#
# VPS kurulumu (deploy kullanıcısı):
#   crontab -e
#   0 2 * * * /home/deploy/renel-enerji/scripts/backup-db.sh >> /home/deploy/backups/backup.log 2>&1
#
# VPS dışına kopya için (kesinlikle önerilir — tek kopya VPS diskinde kalmasın):
#   rclone config          # bir remote tanımla (örn. B2/S3/Drive), adı: renel-backup
#   RCLONE_REMOTE ortam değişkeni ya da aşağıdaki varsayılan ile eşleşmeli
set -euo pipefail

COMPOSE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$HOME/backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"
# rclone remote adı (boş bırakılırsa uzak kopya atlanır ve uyarı yazılır)
RCLONE_REMOTE="${RCLONE_REMOTE:-renel-backup:renel-enerji-db}"

STAMP="$(date +%Y-%m-%d_%H%M)"
mkdir -p "$BACKUP_DIR"

cd "$COMPOSE_DIR"

echo "[$(date '+%F %T')] Yedek başlıyor: renel_enerji"
DB_FILE="$BACKUP_DIR/renel_${STAMP}.sql.gz"
docker compose exec -T db pg_dump -U renel renel_enerji | gzip > "$DB_FILE"

# Umami analitik DB'si (varsa) — kritik değil, hata toplam yedeği düşürmesin
UMAMI_FILE="$BACKUP_DIR/umami_${STAMP}.sql.gz"
if ! docker compose exec -T umami-db pg_dump -U umami umami | gzip > "$UMAMI_FILE"; then
  echo "UYARI: umami-db yedeği alınamadı (servis kapalı olabilir)" >&2
  rm -f "$UMAMI_FILE"
fi

# Boş/güdük dump'ı başarı sanma: gzip'li dosya en az birkaç KB olmalı
if [ "$(stat -c%s "$DB_FILE")" -lt 1024 ]; then
  echo "HATA: $DB_FILE şüpheli derecede küçük, yedek başarısız sayıldı" >&2
  exit 1
fi

# Rotasyon: KEEP_DAYS'ten eski yerel yedekleri sil
find "$BACKUP_DIR" -name '*.sql.gz' -mtime "+$KEEP_DAYS" -delete

# VPS dışına kopya
if [ -n "$RCLONE_REMOTE" ] && command -v rclone >/dev/null 2>&1 \
   && rclone listremotes 2>/dev/null | grep -q "^${RCLONE_REMOTE%%:*}:$"; then
  rclone copy "$DB_FILE" "$RCLONE_REMOTE" --no-traverse
  [ -f "$UMAMI_FILE" ] && rclone copy "$UMAMI_FILE" "$RCLONE_REMOTE" --no-traverse
  echo "[$(date '+%F %T')] Uzak kopya tamam: $RCLONE_REMOTE"
else
  echo "UYARI: rclone remote'u yok — yedek yalnızca VPS diskinde ($DB_FILE)." >&2
  echo "       'rclone config' ile bir remote tanımlayın; tek kopya disk arızasında kaybolur." >&2
fi

echo "[$(date '+%F %T')] Yedek tamam: $DB_FILE"
