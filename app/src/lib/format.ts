/** Цены: «7 200 000 ₸» — неразрывные пробелы, табличные цифры задаёт класс .num */
export function fmtT(n: number): string {
  return n.toLocaleString('ru-RU') + '\u00A0₸'
}
