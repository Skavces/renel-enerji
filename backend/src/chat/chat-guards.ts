export const INJECTION_PATTERNS = [
  // English instruction override
  /ignore\s+(previous|all|your)\s+(instructions?|prompts?|rules?)/i,
  /forget\s+(your|all|previous)\s+(instructions?|rules?|context)/i,
  /you\s+are\s+now\s+(a|an)\s+/i,
  /act\s+as\s+(a|an)\s+/i,
  /pretend\s+(to\s+be|you\s+are)/i,
  /your\s+new\s+instructions?\s+(are|is)/i,
  /from\s+now\s+on\s+(you|ignore|forget)/i,
  /\bdan\b.*mode/i,
  /jailbreak/i,
  // Turkish instruction override
  /talimatlar[iı]\s*(unut|yoksay|görmezden)/i,
  /kural(lar[iı])?\s*(unut|yoksay|geç|değiştir)/i,
  /sistem\s*(talimat|mesaj|prompt)/i,
  /rol\s*oyna/i,
  /yeni\s*kimli[gğ]/i,
  /[şs]imdi\s+sen\s+(bir|artık)/i,
  /art[iı]k\s+sen\s+(bir|[a-züçşğıöA-ZÜÇŞĞİÖ])/i,
  /yeni\s+rol/i,
  // Llama 3 / ChatML separator token injection
  /<\|[a-z_]+\|>/i,
  /\[INST\]/i,
  /\[\/INST\]/i,
  /<s>|<\/s>/i,
  // NOT: Markdown ayraçları (###, ----, ====) burada ENGELLENMEZ, sanitizeContent'te
  // temizlenir. Model cevabında ayraç üretirse geçmişteki o mesaj sonraki tüm
  // istekleri 400'e düşürüyordu (konuşma kalıcı kilitleniyordu).
]

// Model "yalnızca Türkçe" kuralını deldiğinde (Kiril/CJK/Arap alfabesi vb.) yanıtı
// kullanıcıya göstermemek için harf bazında Latin dışı oran ölçülür
export function nonLatinLetterRatio(text: string): number {
  const letters: string[] = text.match(/\p{L}/gu) ?? []
  if (letters.length === 0) return 0
  const nonLatin = letters.filter(ch => !/\p{Script=Latin}/u.test(ch)).length
  return nonLatin / letters.length
}

const NON_LATIN_THRESHOLD = 0.3

// Türkçe metinde geçmesi normal olan Latin kökenli terimler (marka/birim/jargon)
const ALLOWED_FOREIGN_WORDS = new Set([
  'whatsapp', 'web', 'www', 'wp', 'kw', 'kwp', 'kwh', 'watt', 'wi', 'fi', 'off', 'grid', 'on',
])

// Sadece q/w/x içermeyen yaygın İngilizce kelimeler; Türkçe eş yazılışlılar
// (on, can, her, not, but, is...) bilinçli olarak listede YOK.
// 4.2: liste DONDURULDU — yeni sızıntı türlerini ChatService'teki LLM judge yakalar,
// buraya ekleme yapma (liste yalnızca judge çağrısını atlatan ucuz ön-filtredir).
const COMMON_ENGLISH_WORDS = new Set([
  'the', 'and', 'you', 'your', 'please', 'monthly', 'daily', 'yearly', 'about', 'thanks',
  'thank', 'hello', 'could', 'should', 'have', 'are', 'this', 'that', 'these', 'those',
  'price', 'cost', 'system', 'energy', 'install', 'installation', 'roof', 'contact', 'help',
  'sorry', 'here', 'there', 'from', 'also', 'very', 'more', 'most', 'need', 'like', 'good',
  'best', 'our', 'their', 'for',
])

// Model kelimeyi Türkçe kelimeye bitişik de üretebiliyor ("içinmonthly");
// 5+ harfli İngilizce kelimeler önek/sonek olarak da aranır (kısa kelimelerde
// yanlış pozitif riski yüksek olduğundan onlar yalnızca tam eşleşmeyle bakılır)
const LONG_ENGLISH_WORDS = [...COMMON_ENGLISH_WORDS].filter(w => w.length >= 5)

// nonLatinLetterRatio farklı alfabeleri yakalar ama Latin alfabeli sızıntıları
// ("monthly", "tentang" vb.) göremez; bu kontrol o boşluğu kapatır.
// q/w/x harfleri Türkçe alfabede yoktur — beyaz listede olmayan her q/w/x'li kelime sızıntıdır.
export function hasForeignWordLeak(text: string): boolean {
  // Açık tip şart: match() ?? [] birleşimi ES2017 lib'inde never[]'a daralıyor
  const words: string[] = text.toLowerCase().match(/[a-zçğıöşüâîû]+/g) ?? []
  return words.some(w => {
    if (ALLOWED_FOREIGN_WORDS.has(w)) return false
    if (/[qwx]/.test(w) || COMMON_ENGLISH_WORDS.has(w)) return true
    return LONG_ENGLISH_WORDS.some(ew => w.startsWith(ew) || w.endsWith(ew))
  })
}

// Chat yanıtı için tam kirlilik kontrolü: farklı alfabe VEYA Latin alfabeli sızıntı
export function isContaminated(text: string): boolean {
  return nonLatinLetterRatio(text) > NON_LATIN_THRESHOLD || hasForeignWordLeak(text)
}

// Özet için yalnızca alfabe kontrolü; özet kasıtlı olarak foreign-word
// kontrolüne girmez (WhatsApp mesaj şablonu markalı terimler içerir)
export function hasNonLatinLeak(text: string): boolean {
  return nonLatinLetterRatio(text) > NON_LATIN_THRESHOLD
}

export function sanitizeContent(text: string): string {
  return text
    // null bytes and non-printable control chars (keep newline/tab)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // strip Llama/ChatML special tokens that survive printable-char filter
    .replace(/<\|[^|>]{1,30}\|>/g, '')
    // strip markdown separators used to fake prompt boundaries (###, ----, ====)
    .replace(/#{3,}|-{4,}|={4,}/g, '')
    // collapse excessive whitespace/newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
