/** Формат ввода казахстанского номера: «707 902 01 98» (10 цифр после +7). */
export function formatKzPhone(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 10)
  const parts = [d.slice(0, 3), d.slice(3, 6), d.slice(6, 8), d.slice(8, 10)].filter(Boolean)
  return parts.join(' ')
}

/** В API уходит нормализованный вид: 7XXXXXXXXXX (11 цифр, HANDOFF: normalize_phone). */
export function toApiPhone(masked: string): string {
  return '7' + masked.replace(/\D/g, '')
}

export function isCompleteKzPhone(masked: string): boolean {
  return masked.replace(/\D/g, '').length === 10
}
