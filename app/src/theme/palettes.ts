// 13 кандидатов палитры (финальный выбор за владельцем — CLAUDE.md).
// applyPalette() переключает акцент во всём приложении одной операцией.
export interface Palette {
  id: string
  name: string
  acc: string
  d: string
  l: string
  bg: string
  h: string
  sel: string
  rgb: string
}

export const PALETTES: Palette[] = [
  { id: 'cobalt', name: 'Кобальт', acc: '#2450D8', d: '#1B3EA8', l: '#6E8FF0', bg: '#E7EDFD', h: '#2E5CE8', sel: '#1A2440', rgb: '36,80,216' },
  { id: 'steel', name: 'Стальной', acc: '#334D86', d: '#263B68', l: '#7A90C0', bg: '#EAEEF6', h: '#3C5A9B', sel: '#1A2136', rgb: '51,77,134' },
  { id: 'slate', name: 'Сине-серый', acc: '#49619D', d: '#374B7C', l: '#8C9CC6', bg: '#ECEFF7', h: '#546EAF', sel: '#1D2438', rgb: '73,97,157' },
  { id: 'indigo', name: 'Индиго', acc: '#5B3FD9', d: '#4530A8', l: '#9481EE', bg: '#EEEAFD', h: '#6949E8', sel: '#241E3D', rgb: '91,63,217' },
  { id: 'petrol', name: 'Петроль', acc: '#0D7A75', d: '#095E5A', l: '#46B3AC', bg: '#E0F2F1', h: '#0F8C86', sel: '#16302E', rgb: '13,122,117' },
  { id: 'green', name: 'Зелёный', acc: '#0E9E54', d: '#0B7A41', l: '#4CC383', bg: '#E3F4EA', h: '#12AF60', sel: '#1C2E23', rgb: '14,158,84' },
  { id: 'orange', name: 'Оранжевый', acc: '#D0682A', d: '#A4501C', l: '#EDA06A', bg: '#FCEFE4', h: '#E07733', sel: '#332318', rgb: '208,104,42' },
  { id: 'orange0', name: 'Оранжевый яркий', acc: '#E8630A', d: '#B54B06', l: '#F49A55', bg: '#FDEEE1', h: '#F6720F', sel: '#35251A', rgb: '232,99,10' },
  { id: 'terra', name: 'Терракота', acc: '#B2593E', d: '#8B442F', l: '#DA9179', bg: '#FAEDE7', h: '#C46448', sel: '#302019', rgb: '178,89,62' },
  { id: 'amber', name: 'Янтарь', acc: '#A97516', d: '#855A10', l: '#D9AC55', bg: '#FBF1DD', h: '#BC841D', sel: '#2E2612', rgb: '169,117,22' },
  { id: 'brick', name: 'Кирпич', acc: '#C4503A', d: '#9A3C2B', l: '#E68B78', bg: '#FCEBE7', h: '#D45C45', sel: '#331D18', rgb: '196,80,58' },
  { id: 'crimson', name: 'Алый', acc: '#E23D28', d: '#B22D1B', l: '#F4816F', bg: '#FDEAE7', h: '#F04A33', sel: '#33201C', rgb: '226,61,40' },
  { id: 'bordo', name: 'Бордо', acc: '#A8123C', d: '#820D2E', l: '#DB5F80', bg: '#FCE7ED', h: '#BD1544', sel: '#33141F', rgb: '168,18,60' },
]

const KEY = 'audan-pal'

export function applyPalette(p: Palette): void {
  const r = document.documentElement.style
  r.setProperty('--acc', p.acc)
  r.setProperty('--acc-d', p.d)
  r.setProperty('--acc-l', p.l)
  r.setProperty('--acc-bg', p.bg)
  r.setProperty('--acc-h', p.h)
  r.setProperty('--acc-sel', p.sel)
  r.setProperty('--acc-rgb', p.rgb)
  try { localStorage.setItem(KEY, p.id) } catch { /* приватный режим */ }
}

export function restorePalette(): void {
  let saved: string | null = null
  try { saved = localStorage.getItem(KEY) } catch { /* приватный режим */ }
  const p = PALETTES.find((x) => x.id === saved)
  if (p) applyPalette(p)
}
