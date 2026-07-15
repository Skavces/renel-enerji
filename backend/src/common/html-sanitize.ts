import sanitizeHtml from 'sanitize-html'

// Blog içeriği için allowlist — frontend'deki tiptap editörünün (RichTextEditor.jsx)
// üretebildiği çıktıyla birebir: StarterKit (h1-h3), Underline, TextStyle+Color,
// FontFamily, TextAlign, Link. Editöre yeni extension eklenirse burası da güncellenmeli,
// yoksa meşru içerik yazma anında budanır. Render tarafındaki DOMPurify (BlogDetay.jsx)
// ikinci savunma katmanı olarak kalır.
const RICH_TEXT_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'hr',
    'h1', 'h2', 'h3',
    'strong', 'b', 'em', 'i', 'u', 's', 'strike',
    'a', 'span',
    'ul', 'ol', 'li',
    'blockquote', 'code', 'pre',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    p: ['style'],
    h1: ['style'],
    h2: ['style'],
    h3: ['style'],
    span: ['style'],
  },
  allowedStyles: {
    '*': {
      color: [/^#[0-9a-f]{3,8}$/i, /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/],
      'font-family': [/^[\w\s,'"-]+$/],
      'text-align': [/^(left|right|center|justify)$/],
    },
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }, true),
  },
}

export function sanitizeRichHtml(html: string): string {
  return sanitizeHtml(html, RICH_TEXT_OPTIONS)
}

// Düz metin alanları (örn. excerpt) için: tüm tag'leri söker
export function stripHtml(html: string): string {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).trim()
}
