// Экран 7 «Карта города» (эталон: S7, UX 2ГИС). Состояния:
// (A) чистая карта: подложка #streets2, пины из bizmap.list, нижний док с поиском,
//     чипы категорий над доком, постоянное меню, FAB геолокации;
// (B) полноэкранный поиск: карточки категорий слайдером, история, реклама;
// (C) результаты: запрос — пилюлей сверху, снизу свайп-шторка со списком и чипами
//     «Фильтры · Открыто · Рядом · Доставка · Круглосуточно», «Фильтры» — свой экран;
// (D) карточка места: тап по пину — мини-шторка, тяга вверх — полная карточка,
//     фото — лайтбоксом. Снапы шторки: скрыта → peek (25%) → cards → full.
import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { api } from '../../api/client'
import { useData } from '../../lib/useData'
import type { MockPlace } from '../../mocks/db'
import { Icon } from '../../ui/Icon'
import { Photo } from '../../ui/kit'
import { TabBar } from '../../ui/TabBar'
import {
  activeFilterCount, applyFilters, CAT_ICON, CAT_ORDER, EMPTY_FILTERS, FilterChip,
  MAP_TABS, MCATS, pinStyle, PlayBadge, ReviewCard, routeHref, telHref, waHref,
  type MapFilters,
} from './shared'

type Snap = '' | 'peek' | 'cards' | 'full'

/** Высоты снапов — в dvh/процентах, не в фиксированных px */
const SNAP_H: Record<Snap, string> = {
  '': '0px',
  peek: '33dvh',
  cards: '61dvh',
  full: 'calc(100dvh - 88px)',
}

const NOSCROLL = ' [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'

interface HistItem { q: string; label: string }

export default function MapScreen() {
  const nav = useNavigate()
  const { data } = useData<{ places: MockPlace[] }>('bizmap.list')
  const places = useMemo(() => data?.places ?? [], [data])

  /* --- стейт-машина карты --- */
  const [snap, setSnap] = useState<Snap>('')
  const [mode, setMode] = useState<'list' | 'place'>('list')
  const [listActive, setListActive] = useState(false)
  const [query, setQuery] = useState('')
  const [title, setTitle] = useState('')
  const [listItems, setListItems] = useState<MockPlace[]>([])
  const [filters, setFilters] = useState<MapFilters>(EMPTY_FILTERS)
  const [curPlace, setCurPlace] = useState<MockPlace | null>(null)
  const [catOn, setCatOn] = useState<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [locateOpen, setLocateOpen] = useState(false)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [sfin, setSfin] = useState('')
  const [history, setHistory] = useState<HistItem[]>([
    { q: 'аптека', label: 'Аптека' },
    { q: 'чайхана', label: 'Чайхана Бахыт' },
    { q: 'азс', label: 'АЗС' },
  ])
  const [favIds, setFavIds] = useState<ReadonlySet<number>>(new Set())
  const bodyRef = useRef<HTMLDivElement>(null)

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: places.length }
    for (const k of CAT_ORDER) c[k] = places.filter((p) => p.categoryKey === k).length
    return c
  }, [places])

  const shown = useMemo(() => applyFilters(listItems, filters), [listItems, filters])
  const filterN = activeFilterCount(filters)
  const anyHardFilter = filters.open || filters.del || filters.h24 || !!filters.rate

  /* --- переходы --- */
  function go(next: Snap) {
    setSnap(next)
    if (next !== 'full' && bodyRef.current) bodyRef.current.scrollTop = 0
  }
  function showList(items: MockPlace[], t: string) {
    setMode('list')
    setListActive(true)
    setListItems(items)
    setFilters(EMPTY_FILTERS)
    setTitle(t)
    setQuery(t)
    setCurPlace(null)
    go('cards')
  }
  function openPlace(p: MockPlace) {
    setMode('place')
    setCurPlace(p)
    go('peek')
  }
  function backToList() {
    setMode('list')
    setCurPlace(null)
    go('cards')
  }
  function closeSheet() {
    go('')
    setMode('list')
    setListActive(false)
    setCurPlace(null)
    setQuery('')
    setCatOn(null)
  }

  /* --- поиск --- */
  function openSearch(pre: string) {
    setSfin(pre)
    setSearchOpen(true)
  }
  function runSearch(qRaw: string, label?: string) {
    const q = qRaw.trim()
    if (!q) return
    const ql = q.toLowerCase()
    const hits = places.filter((p) =>
      `${p.name} ${p.sub} ${MCATS[p.categoryKey] ?? ''}`.toLowerCase().includes(ql),
    )
    setSearchOpen(false)
    setSfin('')
    let t = label ?? ''
    if (!t) {
      const k = CAT_ORDER.find((c) => MCATS[c].toLowerCase() === ql)
      if (k) t = MCATS[k]
    }
    if (!t) t = q.charAt(0).toUpperCase() + q.slice(1)
    setCatOn(null)
    showList(hits, t)
  }
  function pickCat(k: string) {
    setSearchOpen(false)
    setSfin('')
    setCatOn(k === 'all' ? null : k)
    const items = k === 'all' ? places : places.filter((p) => p.categoryKey === k)
    showList(items, k === 'all' ? 'Все места' : MCATS[k])
  }

  /* --- жесты ручки шторки (Pointer Events; клик — цикл снапов) --- */
  const drag = useRef<{ y: number; idx: number; moved: boolean } | null>(null)
  const order: Snap[] = mode === 'place' ? ['', 'peek', 'full'] : ['', 'peek', 'cards', 'full']
  function grabDown(e: React.PointerEvent) {
    drag.current = { y: e.clientY, idx: Math.max(0, order.indexOf(snap)), moved: false }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function grabMove(e: React.PointerEvent) {
    const d = drag.current
    if (d && Math.abs(d.y - e.clientY) > 6) d.moved = true
  }
  function grabUp(e: React.PointerEvent) {
    const d = drag.current
    if (!d) return
    drag.current = null
    const dy = d.y - e.clientY
    let i = d.idx
    if (d.moved) i = dy > 0 ? Math.min(order.length - 1, i + 1) : Math.max(0, i - 1)
    else i = i >= order.length - 1 ? 1 : i + 1
    if (i === 0) {
      if (mode === 'place' && listActive) backToList()
      else closeSheet()
    } else go(order[i])
  }

  /* --- ручка дока: тап или свайп вверх — «Все места» --- */
  const dockY = useRef<number | null>(null)

  /* --- избранное --- */
  async function toggleFav(p: MockPlace) {
    const r = await api<{ on: boolean }>('favs.toggle', { kind: 'place', id: p.id })
    setFavIds((prev) => {
      const next = new Set(prev)
      if (r.on) next.add(p.id); else next.delete(p.id)
      return next
    })
  }

  const berek = places.find((p) => p.key === 'bereke')

  return (
    <div className="relative h-dvh overflow-hidden bg-paper">
      {/* (A) карта на весь экран + пины */}
      <div className="absolute inset-0">
        <svg className="size-full"><use href="#streets2" /></svg>
      </div>
      {places.map((p) => {
        const on = mode === 'place' && snap !== '' && curPlace?.id === p.id
        return (
          <button
            key={p.id}
            type="button"
            aria-label={p.name}
            onClick={() => openPlace(p)}
            style={pinStyle(p.x, p.y)}
            className={
              'absolute z-[6] flex -translate-x-1/2 -translate-y-full items-center justify-center rounded-full shadow-[0_3px_10px_rgba(20,20,25,.24)] ' +
              (on ? 'size-[42px] bg-acc text-white' : 'size-[34px] bg-card text-acc')
            }
          >
            <Icon id="location" className={on ? 'size-[21px]' : 'size-[18px]'} />
          </button>
        )
      })}

      {/* пилюля запроса сверху (тап — назад в поиск) */}
      {query !== '' && (
        <div className="absolute inset-x-0 top-0 z-[8] pt-[env(safe-area-inset-top)]">
          <button
            type="button"
            onClick={() => openSearch(query)}
            className="mx-4 mt-1.5 flex h-12 w-[calc(100%-32px)] items-center gap-2.5 rounded-[14px] bg-card px-3.5 shadow-[0_2px_12px_rgba(20,20,25,.16)]"
          >
            <Icon id="search" className="size-[18px] flex-none text-mut" />
            <span className="min-w-0 flex-1 truncate text-left text-[14.5px] font-bold">{query}</span>
          </button>
        </div>
      )}

      {/* FAB геолокации */}
      {(snap === '' || snap === 'peek') && (
        <button
          type="button"
          aria-label="Моё местоположение"
          onClick={() => setLocateOpen(true)}
          style={{ bottom: snap === 'peek' ? 'calc(33dvh + 20px)' : '218px' }}
          className="absolute right-4 z-[7] flex size-11 items-center justify-center rounded-full bg-card shadow-[0_3px_12px_rgba(20,20,25,.2)] transition-[bottom] duration-200"
        >
          <Icon id="locate-me" className="size-5" />
        </button>
      )}

      {/* нижний док: чипы категорий + поиск (как в 2ГИС) */}
      {snap === '' && (
        <div className="absolute inset-x-0 bottom-0 z-[9]">
          <div className={'flex gap-2 overflow-x-auto px-4 pb-2.5' + NOSCROLL}>
            {CAT_ORDER.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => pickCat(k)}
                className={
                  'flex-none rounded-full px-3.5 py-[9px] text-[12.5px] font-bold whitespace-nowrap shadow-[0_2px_8px_rgba(20,20,25,.14)] ' +
                  (catOn === k ? 'bg-[var(--acc-sel)] text-white' : 'bg-card text-ink')
                }
              >
                {MCATS[k]}
              </button>
            ))}
          </div>
          <div className="rounded-t-[22px] bg-card px-4 pb-24 shadow-[0_-8px_28px_rgba(20,20,25,.12)]">
            <div
              className="flex cursor-grab touch-none justify-center pt-[9px] pb-[7px]"
              onPointerDown={(e) => { dockY.current = e.clientY; e.currentTarget.setPointerCapture(e.pointerId) }}
              onPointerUp={(e) => {
                if (dockY.current === null) return
                if (dockY.current - e.clientY > -6) { setCatOn(null); showList(places, 'Все места') }
                dockY.current = null
              }}
            >
              <i className="h-1 w-10 rounded-sm bg-[#DDD9D0]" />
            </div>
            <button
              type="button"
              onClick={() => openSearch('')}
              className="flex w-full items-center gap-2.5 rounded-[14px] bg-paper px-3.5 py-3"
            >
              <Icon id="search" className="size-[18px] flex-none text-mut" />
              <span className="text-[14.5px] font-medium text-faint">Найти место в городе</span>
            </button>
          </div>
        </div>
      )}

      {/* (C)/(D) свайп-шторка: список результатов / карточка места */}
      <div
        style={{ height: SNAP_H[snap] }}
        className="absolute inset-x-0 bottom-0 z-[9] flex flex-col overflow-hidden rounded-t-[22px] bg-card shadow-[0_-8px_30px_rgba(20,20,25,.16)] transition-[height] duration-[240ms] ease-[cubic-bezier(.2,.7,.2,1)]"
      >
        <div
          className="relative z-[3] flex flex-none cursor-grab touch-none justify-center rounded-t-[22px] bg-card pt-[9px] pb-1.5"
          onPointerDown={grabDown}
          onPointerMove={grabMove}
          onPointerUp={grabUp}
        >
          <i className="h-1 w-10 rounded-sm bg-[#DDD9D0]" />
        </div>

        {mode === 'list' && (
          <>
            <div className="flex flex-none items-center gap-2.5 pr-3 pb-1 pl-4">
              <b className="min-w-0 flex-1 truncate text-[17px] font-extrabold tracking-tight">{title}</b>
              <button
                type="button"
                aria-label="Закрыть"
                onClick={closeSheet}
                className="flex size-[30px] flex-none items-center justify-center rounded-full bg-field"
              >
                <Icon id="close" className="size-3.5 text-[#3A3833]" />
              </button>
            </div>
            <div className="flex-none pt-0.5 pb-2.5">
              <div className={'flex gap-2 overflow-x-auto px-4' + NOSCROLL}>
                <FilterChip on={filterN > 0} onPress={() => setFiltersOpen(true)}>
                  <Icon id="filter" className="size-[13px]" />
                  {filterN ? `Фильтры · ${filterN}` : 'Фильтры'}
                </FilterChip>
                <FilterChip on={filters.open} onPress={() => setFilters((f) => ({ ...f, open: !f.open }))}>Открыто</FilterChip>
                <FilterChip on={filters.sort === 'near'} onPress={() => setFilters((f) => ({ ...f, sort: f.sort === 'near' ? 'def' : 'near' }))}>Рядом</FilterChip>
                <FilterChip on={filters.del} onPress={() => setFilters((f) => ({ ...f, del: !f.del }))}>Доставка</FilterChip>
                <FilterChip on={filters.h24} onPress={() => setFilters((f) => ({ ...f, h24: !f.h24 }))}>Круглосуточно</FilterChip>
              </div>
            </div>
          </>
        )}

        <div ref={bodyRef} className={'min-h-0 flex-1 overflow-y-auto pb-[92px]' + NOSCROLL}>
          {mode === 'list' ? (
            shown.length ? (
              shown.map((p) => <ResultCard key={p.id} p={p} onOpen={() => openPlace(p)} />)
            ) : (
              <div className="px-8 py-[26px] text-center text-[12.5px] leading-relaxed font-semibold text-mut">
                {anyHardFilter ? 'По фильтрам ничего нет — снимите один из них' : 'Ничего не нашли — попробуйте изменить запрос'}
              </div>
            )
          ) : (
            curPlace && (
              <PlaceSheetCard
                p={curPlace}
                expanded={snap === 'cards' || snap === 'full'}
                fav={favIds.has(curPlace.id)}
                onFav={() => void toggleFav(curPlace)}
                onPhoto={(id) => setLightbox(id)}
              />
            )
          )}
        </div>
      </div>

      {/* постоянное меню */}
      <div className="absolute inset-x-0 bottom-0 z-10">
        <TabBar items={MAP_TABS} />
      </div>

      {/* (B) полноэкранный поиск */}
      {searchOpen && (
        <div className="absolute inset-0 z-30 flex flex-col bg-paper">
          <div className="flex flex-none items-center gap-[11px] bg-card px-4 pt-[calc(env(safe-area-inset-top)+10px)] pb-3 shadow-[0_1px_3px_rgba(20,20,25,.06)]">
            <Icon id="search" className="size-[19px] flex-none text-mut" />
            <input
              autoFocus
              value={sfin}
              onChange={(e) => setSfin(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') runSearch(sfin) }}
              placeholder="Найти место в городе"
              className="min-w-0 flex-1 bg-transparent text-[15.5px] font-medium outline-none placeholder:text-faint"
            />
            <button
              type="button"
              aria-label="Закрыть поиск"
              onClick={() => { setSearchOpen(false); setSfin('') }}
              className="flex size-[30px] flex-none items-center justify-center rounded-full bg-field"
            >
              <Icon id="close" className="size-3.5 text-[#3A3833]" />
            </button>
          </div>
          <div className={'min-h-0 flex-1 overflow-y-auto pb-5' + NOSCROLL}>
            <div className={'flex gap-2.5 overflow-x-auto px-4 pt-3.5 pb-1' + NOSCROLL}>
              {[...CAT_ORDER, 'all'].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => pickCat(k)}
                  className="flex size-[104px] flex-none flex-col justify-between rounded-xl bg-card p-[11px] pt-3 text-left shadow-[0_1px_3px_rgba(20,20,25,.06)]"
                >
                  <i className="flex size-9 items-center justify-center rounded-[11px] bg-acc-bg">
                    <Icon id={CAT_ICON[k]} className="size-[19px] text-acc-d" />
                  </i>
                  <span className="text-[12.5px] leading-tight font-bold">{k === 'all' ? 'Все места' : MCATS[k]}</span>
                  <b className="num text-[11px] font-semibold text-faint">{counts[k] ?? 0}</b>
                </button>
              ))}
            </div>

            {history.length > 0 && (
              <>
                <div className="px-4 pt-[18px] pb-[9px] text-[11px] font-extrabold tracking-widest text-mut uppercase">Вы искали</div>
                <div className="bg-card">
                  {history.map((h) => (
                    <div key={h.label} className="flex items-center gap-3 border-t border-soft px-4 first:border-t-0">
                      <Icon id="clock" className="size-[17px] flex-none text-faint" />
                      <button
                        type="button"
                        onClick={() => runSearch(h.q, h.label)}
                        className="min-w-0 flex-1 truncate py-[13px] text-left text-[14px] font-semibold"
                      >
                        {h.label}
                      </button>
                      <button
                        type="button"
                        aria-label={`Убрать «${h.label}»`}
                        onClick={() => setHistory((x) => x.filter((y) => y !== h))}
                        className="flex size-8 flex-none items-center justify-center"
                      >
                        <Icon id="close" className="size-3.5 text-[#C5C1B7]" />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* рекламное место (2ГИС) */}
            <button
              type="button"
              onClick={() => { setSearchOpen(false); if (berek) nav(`/place/${berek.id}`) }}
              className="mx-4 mt-4 flex w-[calc(100%-32px)] items-center gap-3 rounded-2xl bg-card p-[11px] text-left shadow-[0_1px_3px_rgba(20,20,25,.06)]"
            >
              <Photo id={berek?.imageIds[0]} className="size-16 flex-none rounded-xl" />
              <span className="min-w-0 flex-1">
                <span className="block text-[9px] font-extrabold tracking-widest text-faint">РЕКЛАМА</span>
                <span className="mt-0.5 block text-[13.5px] font-bold">Береке Строймаркет</span>
                <span className="mt-0.5 block text-[11px] leading-snug font-semibold text-mut">Цемент и профлист со склада · доставка в день заказа</span>
              </span>
              <Icon id="chevron-right" className="size-[15px] flex-none text-[#C5C1B7]" />
            </button>
          </div>
        </div>
      )}

      {/* экран «Фильтры»: Сбросить · Готово */}
      {filtersOpen && (
        <div className="absolute inset-0 z-40 flex flex-col bg-paper">
          <div className="flex flex-none items-center justify-between border-b border-soft bg-card px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-[13px]">
            <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className="text-[13.5px] font-semibold text-mut">Сбросить</button>
            <b className="text-[16px] font-extrabold tracking-tight">Фильтры</b>
            <button type="button" onClick={() => setFiltersOpen(false)} className="text-[13.5px] font-extrabold text-acc-d">Готово</button>
          </div>
          <div className={'min-h-0 flex-1 overflow-y-auto pb-[26px]' + NOSCROLL}>
            <FSec>Важное</FSec>
            <div className="bg-card">
              <FRow label="Открыто сейчас" on={filters.open} onPress={() => setFilters((f) => ({ ...f, open: !f.open }))} />
              <FRow label="Доставка" on={filters.del} onPress={() => setFilters((f) => ({ ...f, del: !f.del }))} />
              <FRow label="Круглосуточно" on={filters.h24} onPress={() => setFilters((f) => ({ ...f, h24: !f.h24 }))} />
            </div>
            <FSec>Рейтинг</FSec>
            <div className="bg-card">
              <FRow label="Лучшее" sub="★ 4,9 и выше" on={filters.rate === 4.9} onPress={() => setFilters((f) => ({ ...f, rate: f.rate === 4.9 ? 0 : 4.9 }))} />
              <FRow label="Превосходно" sub="★ 4,5 и выше" on={filters.rate === 4.5} onPress={() => setFilters((f) => ({ ...f, rate: f.rate === 4.5 ? 0 : 4.5 }))} />
              <FRow label="Хорошо" sub="★ 4 и выше" on={filters.rate === 4} onPress={() => setFilters((f) => ({ ...f, rate: f.rate === 4 ? 0 : 4 }))} />
            </div>
            <FSec>Сортировка</FSec>
            <div className="bg-card">
              <FRow label="По умолчанию" on={filters.sort === 'def'} onPress={() => setFilters((f) => ({ ...f, sort: 'def' }))} />
              <FRow label="Сначала ближайшие" on={filters.sort === 'near'} onPress={() => setFilters((f) => ({ ...f, sort: 'near' }))} />
              <FRow label="Сначала с высоким рейтингом" on={filters.sort === 'rate'} onPress={() => setFilters((f) => ({ ...f, sort: 'rate' }))} />
            </div>
          </div>
        </div>
      )}

      {/* шторка геолокации (вместо системного диалога) */}
      {locateOpen && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/45" onClick={() => setLocateOpen(false)}>
          <div className="rounded-t-[22px] bg-card px-4 pt-2 pb-[max(env(safe-area-inset-bottom),16px)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center pb-1.5"><i className="h-1 w-10 rounded-sm bg-line" /></div>
            <b className="block pb-2 text-[17px] font-extrabold tracking-tight">Моё местоположение</b>
            <button
              type="button"
              onClick={() => setLocateOpen(false)}
              className="flex w-full items-center gap-3 rounded-[13px] bg-paper px-3.5 py-3 text-left"
            >
              <Icon id="locate-me" className="size-[18px] flex-none text-acc-d" />
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-bold">Шу қаласы, ул. Желтоқсан 12</span>
                <span className="block text-[11.5px] font-semibold text-mut">определено по GPS</span>
              </span>
            </button>
            <p className="mt-2.5 mb-0 text-center text-[12px] font-semibold text-mut">Центрируем карту…</p>
          </div>
        </div>
      )}

      {/* лайтбокс фото */}
      {lightbox !== null && (
        <div
          className="absolute inset-0 z-[70] flex items-center justify-center bg-[rgba(15,13,10,.93)] px-3.5 py-6"
          onClick={() => setLightbox(null)}
        >
          <Photo id={lightbox} className="aspect-square w-full max-w-[340px] rounded-[18px]" />
        </div>
      )}
    </div>
  )
}

/* ---- карточка результата в шторке (.mc): квадратные фото 110×110 ---- */
function ResultCard({ p, onOpen }: { p: MockPlace; onOpen: () => void }) {
  return (
    <div className="mx-4 mb-[9px] overflow-hidden rounded-[14px] bg-card shadow-[0_1px_3px_rgba(20,20,25,.07)]">
      <div className={'flex gap-1.5 overflow-x-auto px-[9px] pt-[9px]' + NOSCROLL}>
        {p.imageIds.map((id, i) => (
          <button key={id} type="button" onClick={onOpen} className="relative flex-none">
            <Photo id={id} className="size-[110px] rounded-xl" />
            {p.video && i === 1 && <PlayBadge />}
          </button>
        ))}
      </div>
      <button type="button" onClick={onOpen} className="block w-full px-3 pt-[9px] pb-[11px] text-left">
        <span className="flex items-baseline gap-2">
          <span className="min-w-0 flex-1 truncate text-[14.5px] font-extrabold tracking-tight">{p.name}</span>
          <span className="flex flex-none items-center gap-[3px] text-[12.5px] font-extrabold">
            <Icon id="star-filled" className="size-[13px] text-warn" />
            {p.rating}
          </span>
        </span>
        <span className="mt-[3px] block text-[11.5px] font-semibold text-mut">{p.sub}</span>
        <span className="mt-1.5 flex items-center gap-1.5 text-[11.5px] font-semibold">
          <span className="size-[7px] flex-none rounded-full" style={{ background: p.open ? '#1E8A4C' : '#C5C1B7' }} />
          <span style={{ color: p.open ? '#1E8A4C' : '#8B887F' }}>{p.h24 ? 'Круглосуточно' : p.open ? 'Открыто' : 'Закрыто'}</span>
          <span className="num ml-auto text-[10.5px] font-semibold text-faint">{p.far}</span>
        </span>
      </button>
    </div>
  )
}

/* ---- карточка места в шторке: мини (peek) → полная (тяга вверх) ---- */
function PlaceSheetCard({ p, expanded, fav, onFav, onPhoto }: {
  p: MockPlace
  expanded: boolean
  fav: boolean
  onFav: () => void
  onPhoto: (imageId: number) => void
}) {
  return (
    <div className="px-4 pb-2">
      {/* фото — самым верхом полной карточки; при скролле уезжают под липкую шапку */}
      {expanded && (
        <div className="-mx-4 mb-3">
          <div className={'flex gap-1.5 overflow-x-auto px-4' + NOSCROLL}>
            {p.imageIds.map((id, i) => (
              <button key={id} type="button" aria-label="Открыть фото" onClick={() => onPhoto(id)} className="relative flex-none">
                <Photo id={id} className="size-[148px] rounded-xl" />
                {p.video && i === 1 && <PlayBadge />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* мини-часть: видна на четверти экрана */}
      <div className="sticky top-0 z-[2] flex items-start gap-2.5 bg-card pb-1.5">
        <div className="min-w-0 flex-1">
          <div className="text-[19px] font-extrabold tracking-tight">{p.name}</div>
          <div className="mt-[3px] text-[12px] font-semibold text-mut">{p.sub}</div>
        </div>
        <button
          type="button"
          aria-label={fav ? 'Убрать из сохранённых' : 'В сохранённые'}
          onClick={onFav}
          className={
            'flex size-9 flex-none items-center justify-center rounded-full ' +
            (fav ? 'bg-acc-bg text-acc' : 'bg-paper text-[#C5C1B7]')
          }
        >
          <Icon id={fav ? 'heart-filled' : 'heart'} className="size-[18px]" />
        </button>
      </div>
      <div className="mt-2 flex items-center gap-[5px] text-[12.5px] font-bold">
        <Icon id="star-filled" className="size-3.5 text-warn" />
        {p.rating}
        <span className="num font-semibold text-mut">{p.reviews} отзывов</span>
      </div>
      <div className="mt-[9px] flex items-center gap-[7px] text-[12.5px] font-bold">
        <span className="size-2 flex-none rounded-full" style={{ background: p.open ? '#1E8A4C' : '#C5C1B7' }} />
        <span style={{ color: p.open ? '#1E8A4C' : '#8B887F' }}>{p.open ? 'Открыто' : 'Закрыто'}</span>
        <span className="min-w-0 truncate font-semibold text-mut">· {p.hours}</span>
      </div>
      <div className="mt-3 flex gap-2">
        <a
          href={waHref(p.phone)}
          target="_blank"
          rel="noreferrer"
          className="flex h-11 flex-1 items-center justify-center gap-[7px] rounded-[13px] bg-acc text-[12.5px] font-bold text-white"
        >
          <Icon id="chat" className="size-4" />
          WhatsApp
        </a>
        <a
          href={telHref(p.phone)}
          className="flex h-11 flex-1 items-center justify-center gap-[7px] rounded-[13px] border-[1.5px] border-line text-[12.5px] font-bold text-ink"
        >
          <Icon id="phone" className="size-4" />
          Позвонить
        </a>
        <a
          href={routeHref(p)}
          target="_blank"
          rel="noreferrer"
          className="flex h-11 flex-1 items-center justify-center gap-[7px] rounded-[13px] border-[1.5px] border-line text-[12.5px] font-bold text-ink"
        >
          <Icon id="route" className="size-4" />
          Маршрут
        </a>
      </div>

      {/* полная версия целиком в шторке — экран /place остаётся эталоном deep-link */}
      {expanded && (
        <>
          <div className="mt-3.5 flex flex-wrap gap-[7px]">
            {p.feat.map((f) => (
              <i key={f} className="rounded-full bg-soft px-3 py-1.5 text-[11.5px] font-semibold text-[#3A3833] not-italic">{f}</i>
            ))}
          </div>
          <div className="mt-3.5 flex items-center gap-3">
            <div className="relative h-[66px] w-[86px] flex-none overflow-hidden rounded-xl">
              <svg className="absolute inset-0 size-full"><use href="#streets" /></svg>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] leading-snug font-bold">{p.address}</div>
              <div className="num mt-[3px] text-[11.5px] font-semibold text-mut">{p.far} от вас</div>
            </div>
            <a
              href={routeHref(p)}
              target="_blank"
              rel="noreferrer"
              className="flex-none rounded-[10px] bg-acc-bg px-3 py-[9px] text-[12px] font-bold text-acc-d"
            >
              Маршрут
            </a>
          </div>
          <h4 className="mt-4 mb-2 text-[15.5px] font-bold tracking-tight">Контакты</h4>
          <div className="rounded-[13px] bg-paper px-[13px] py-1">
            <a href={telHref(p.phone)} className="flex items-center gap-2.5 py-[11px] text-[13px] font-bold">
              <Icon id="phone" className="size-4 flex-none text-acc-d" />
              <span className="num">{p.phone}</span>
            </a>
            <a
              href={waHref(p.phone)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 border-t border-[#ECE9E1] py-[11px] text-[13px] font-bold"
            >
              <Icon id="chat" className="size-4 flex-none text-acc-d" />
              Написать в WhatsApp
              <span className="num ml-auto text-[11.5px] font-semibold text-mut">{p.phone}</span>
            </a>
          </div>
          <div className="flex items-baseline justify-between pt-4 pb-2">
            <h4 className="m-0 text-[15.5px] font-bold tracking-tight">Отзывы</h4>
            <span className="num text-[11.5px] font-medium text-mut">{p.reviews}</span>
          </div>
          {p.reviewCards.map((r, i) => (
            <ReviewCard key={r.name + r.when} r={r} i={i} className="mb-2.5" />
          ))}
        </>
      )}
    </div>
  )
}

/* ---- экран «Фильтры»: секция и строка с галочкой ---- */
function FSec({ children }: { children: string }) {
  return <div className="px-4 pt-[18px] pb-[9px] text-[11px] font-extrabold tracking-widest text-mut uppercase">{children}</div>
}

function FRow({ label, sub, on, onPress }: { label: string; sub?: string; on: boolean; onPress: () => void }) {
  return (
    <button
      type="button"
      onClick={onPress}
      className="flex w-full items-center gap-2 border-t border-soft px-4 py-3.5 text-left text-[14px] font-bold first:border-t-0"
    >
      {label}
      {sub && <i className="text-[12px] font-semibold text-mut not-italic">{sub}</i>}
      <Icon id="check" className={'ml-auto size-[18px] flex-none text-acc-d ' + (on ? '' : 'opacity-0')} />
    </button>
  )
}
