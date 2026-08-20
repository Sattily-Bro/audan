// Общее для раздела «Карта» (эталон: S7/S12/S20/S36/S37): словарь категорий,
// фильтры результатов, ссылки WhatsApp/tel/маршрут, мелкие компоненты.
// Живёт только внутри src/screens/map/ — общие файлы приложения не трогаем.
import type { CSSProperties, ReactNode } from 'react'
import type { MockPlace } from '../../mocks/db'
import { Icon } from '../../ui/Icon'
import type { TabItem } from '../../ui/TabBar'

/* ---- категории карты (ключи — categoryKey из bizmap.list) ---- */
export const MCATS: Record<string, string> = {
  cafe: 'Кафе',
  shop: 'Магазины',
  pharm: 'Аптеки',
  azs: 'АЗС',
  beauty: 'Красота',
}
export const CAT_ORDER = ['cafe', 'shop', 'pharm', 'azs', 'beauty'] as const
/** Иконки квадратных карточек полноэкранного поиска (.sf-cats) */
export const CAT_ICON: Record<string, string> = {
  cafe: 'svc-food',
  pharm: 'city-pharmacy',
  azs: 'cat-car',
  shop: 'store',
  beauty: 'm-beauty',
  all: 'grid',
}

/* ---- таб-бары раздела (S7 и S12) ---- */
export const MAP_TABS: TabItem[] = [
  { icon: 'home', label: 'Главная', to: '/', end: true },
  { icon: 'location', label: 'Карта', to: '/map', end: true },
  { icon: 'heart', label: 'Избранные', to: '/favs' },
  { icon: 'plus', label: 'Добавить', to: '/map/new' },
]
export const LIST_TABS: TabItem[] = [
  { icon: 'home', label: 'Главная', to: '/', end: true },
  { icon: 'location', label: 'Карта', to: '/map', end: true },
  { icon: 'list', label: 'Списком', to: '/map/list' },
  { icon: 'plus', label: 'Добавить', to: '/map/new' },
]

/* ---- фильтры результатов: чипы шторки и экран «Фильтры» — одно состояние ---- */
export interface MapFilters {
  open: boolean
  del: boolean
  h24: boolean
  /** порог рейтинга: 0 (нет) | 4 | 4.5 | 4.9 */
  rate: number
  sort: 'def' | 'near' | 'rate'
}
export const EMPTY_FILTERS: MapFilters = { open: false, del: false, h24: false, rate: 0, sort: 'def' }

export function ratingNum(p: MockPlace): number {
  return parseFloat(p.rating.replace(',', '.')) || 0
}

export function activeFilterCount(f: MapFilters): number {
  return (f.open ? 1 : 0) + (f.del ? 1 : 0) + (f.h24 ? 1 : 0) + (f.rate ? 1 : 0) + (f.sort !== 'def' ? 1 : 0)
}

export function applyFilters(items: MockPlace[], f: MapFilters): MockPlace[] {
  let out = items.filter((p) => {
    if (f.open && !p.open) return false
    if (f.del && !p.delivery) return false
    if (f.h24 && !p.h24) return false
    if (f.rate && ratingNum(p) < f.rate) return false
    return true
  })
  if (f.sort === 'near') out = [...out].sort((a, b) => (a.farM || 9e9) - (b.farM || 9e9))
  if (f.sort === 'rate') out = [...out].sort((a, b) => ratingNum(b) - ratingNum(a))
  return out
}

/* ---- позиции пинов: x/y из данных — в процентах кадра прототипа 372×800 ---- */
export function pinStyle(x: number, y: number): CSSProperties {
  return { left: `${(x / 372) * 100}%`, top: `${(y / 800) * 100}%` }
}

/* ---- связь с местом ---- */
export function waHref(phone: string): string {
  return `https://wa.me/${phone.replace(/\D/g, '')}`
}
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`
}
export function routeHref(p: MockPlace): string {
  return `https://2gis.kz/search/${encodeURIComponent(`${p.name}, ${p.address}`)}`
}

/** «Открыто до 23:00» / «Закрыто · откроется в 09:00» — из строки hours */
export function openLabel(p: MockPlace): string {
  if (p.h24) return 'Круглосуточно'
  const m = p.hours.match(/(\d{2}:\d{2})–(\d{2}:\d{2})/)
  if (p.open) return m ? `Открыто до ${m[2]}` : 'Открыто'
  return m ? `Закрыто · откроется в ${m[1]}` : 'Закрыто'
}

export function stars(n: number): string {
  return '★'.repeat(n) + '☆'.repeat(Math.max(0, 5 - n))
}

/* ---- мелкие компоненты ---- */

/** Метка видео на фото (.play из .mc/.pl-topgal) */
export function PlayBadge() {
  return (
    <span className="absolute top-1/2 left-1/2 flex size-[30px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[rgba(20,18,14,.55)]">
      <i className="ml-[3px] block size-0 border-y-[6px] border-y-transparent border-l-[9px] border-l-white" />
    </span>
  )
}

const AV_COLORS = ['#5B8DEF', '#8A63D2', '#3E9E6B', '#C7743C']

/** Карточка отзыва (.rv-card) — в шторке места и на странице /place */
export function ReviewCard({ r, i, className }: {
  r: MockPlace['reviewCards'][number]
  i: number
  className?: string
}) {
  return (
    <div className={'rounded-2xl bg-card px-[15px] py-3.5 shadow-[0_1px_3px_rgba(20,20,25,.06)] ' + (className ?? '')}>
      <div className="flex items-center gap-2.5">
        <span
          className="flex size-9 flex-none items-center justify-center rounded-full text-[13.5px] font-extrabold text-white"
          style={{ background: AV_COLORS[i % AV_COLORS.length] }}
        >
          {r.name[0]}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13.5px] font-bold">{r.name}</span>
          <span className="mt-px block text-[11px] font-semibold text-faint">{r.when}</span>
        </span>
        <span className="flex-none text-[12px] tracking-[1px] text-warn">{stars(r.stars)}</span>
      </div>
      <p className="mt-2 mb-0 text-[13px] leading-normal text-[#3A3833]">{r.text}</p>
    </div>
  )
}

/** Чип строки фильтров шторки (.sh-chips .chip): контурный, активный — тёмный */
export function FilterChip({ on, onPress, children }: { on: boolean; onPress: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onPress}
      className={
        'flex flex-none items-center gap-1.5 rounded-full px-3.5 py-[9px] text-[12.5px] font-bold whitespace-nowrap transition-colors ' +
        (on ? 'bg-[var(--acc-sel)] text-white' : 'text-ink shadow-[inset_0_0_0_1.5px_var(--color-line)]')
      }
    >
      {children}
    </button>
  )
}

/** Шторка-пикер вместо системного диалога (правило прототипа) */
export function PickerSheet({ title, options, value, onPick, onClose }: {
  title: string
  options: string[]
  value: string
  onPick: (v: string) => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/45" onClick={onClose}>
      <div
        className="rounded-t-[22px] bg-card pb-[max(env(safe-area-inset-bottom),12px)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-[9px] pb-1.5"><i className="h-1 w-10 rounded-sm bg-line" /></div>
        <div className="flex items-center gap-2.5 pr-3 pb-1 pl-4">
          <b className="min-w-0 flex-1 truncate text-[17px] font-extrabold tracking-tight">{title}</b>
          <button
            type="button"
            aria-label="Закрыть"
            onClick={onClose}
            className="flex size-[30px] flex-none items-center justify-center rounded-full bg-field"
          >
            <Icon id="close" className="size-3.5 text-[#3A3833]" />
          </button>
        </div>
        <div className="px-1.5 pt-1">
          {options.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => { onPick(o); onClose() }}
              className={'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[14px] font-bold ' + (o === value ? 'bg-acc-bg' : '')}
            >
              {o}
              <Icon id="check" className={'ml-auto size-[18px] flex-none text-acc-d ' + (o === value ? '' : 'opacity-0')} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
