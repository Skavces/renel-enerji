import { join } from 'path'
import { unlink } from 'fs/promises'

// Upload yollarının tek gerçeği: multer hedefi, SEO rename ve silme hep buradan
// çözülür (Docker'da /app/uploads). upload.utils.ts'ten ayrı tutulur: oradaki
// file-type importu ESM-only olduğundan bu sabiti kullanan servisleri o
// bağımlılığa zincirlememek gerekir (bağımlılık yönü utils -> bu dosya).
export const UPLOADS_DIR = join(process.cwd(), 'uploads')

// DB'deki src değeri (/uploads/dosya.webp) üzerinden fiziksel dosyayı siler.
// Yalnızca tek segmentli /uploads/ yollarını kabul eder (path traversal engeli);
// dosya zaten yoksa veya silinemiyorsa sessizce geçer — DB kaydı esastır.
export async function deleteUploadedFile(src: string | null | undefined): Promise<void> {
  if (!src) return
  const match = /^\/uploads\/([\w][\w\-.]*)$/.exec(src)
  if (!match) return
  await unlink(join(UPLOADS_DIR, match[1])).catch(() => {})
}
