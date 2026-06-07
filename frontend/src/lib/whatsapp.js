export const WA_NUMBER = '905543796004'

export function waLink(message) {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`
}
