// Мелкие помощники раздела «Работа/Мастера» (только для src/screens/jobs).

/** Русские склонения: plural(3, 'вакансия', 'вакансии', 'вакансий') */
export function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return one
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few
  return many
}

/** «+7 776 254 08 31» → «77762540831» — для tel: и wa.me */
export function digits(phone: string): string {
  return phone.replace(/\D/g, '')
}

/** Единственная кнопка «поделиться» приложения: системная шторка либо копия ссылки */
export function shareLink(): void {
  const url = window.location.href
  if (typeof navigator.share === 'function') {
    navigator.share({ url }).catch(() => {})
  } else {
    void navigator.clipboard?.writeText(url)
  }
}
