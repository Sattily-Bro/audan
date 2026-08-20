/** Язык интерфейса: ҚАЗ/РУС. Переключатели на главной и в профиле пишут сюда. */
const KEY = 'audan-lang'
export type Lang = 'Қазақша' | 'Русский'

export function getLang(): Lang {
  try { return (localStorage.getItem(KEY) as Lang) || 'Қазақша' } catch { return 'Қазақша' }
}
export function setLang(v: Lang): void {
  try { localStorage.setItem(KEY, v) } catch { /* приватный режим */ }
}
export const langShort = (v: Lang): string => (v === 'Русский' ? 'РУС' : 'ҚАЗ')
