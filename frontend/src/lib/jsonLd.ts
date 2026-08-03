const SCRIPT_ESCAPES: Record<string, string> = {
  '<': '\\u003c',
  '>': '\\u003e',
  '&': '\\u0026',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
}

const UNSAFE_CHARS = /[<>&\u2028\u2029]/g

/**
 * JSON-LD'yi <script> icine gomulmek icin guvenli hale getirir.
 * react-helmet-async, script icerigini innerHTML uzerinden yaziyor ve
 * JSON.stringify `<` karakterini kacislamiyor; bu yuzden admin/Instagram
 * kaynakli bir deger `</script><img onerror=...>` icerirse script tag'inden
 * cikip DOM'a enjekte olabilir. Bu escape'ler gecerli JSON string escape'leri
 * oldugundan JSON-LD parser'lari degeri aynen cozer, cikti bozulmaz.
 */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(
    UNSAFE_CHARS,
    (char) => SCRIPT_ESCAPES[char],
  )
}
