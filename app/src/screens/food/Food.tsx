// Экран «Еда» (эталон: S5). Анатомия Glovo: адрес доставки в шапке, крупный
// заголовок, поиск по разделу, рейл категорий еды, фильтры-чипы, строка
// активного заказа, «Повторить заказ», большие фото-карточки заведений.
// API: food.restaurants + food.my_orders (активный заказ и «повторить»).
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { fmtT } from '../../lib/format'
import { useData } from '../../lib/useData'
import { Icon } from '../../ui/Icon'
import { SecLbl, Photo, HScroll, Chip } from '../../ui/kit'
import { TabBar } from '../../ui/TabBar'
import type { MockRestaurant } from '../../mocks/db'
import { fillCart, getDelivery, setDelivery } from './cart'
import { FOOD_TABS, ORDER_LABEL, isActiveOrder, type FoodOrder } from './flow'
import { Sheet, SheetOption, SheetBtn } from './Sheet'

/** Рейл категорий еды — иконки и подписи из эталона S5; q — стем для фильтра по меню */
const FOOD_CATS = [
  { icon: 'food-promo', label: 'Акции', q: '' },
  { icon: 'food-doner', label: 'Донер', q: 'донер' },
  { icon: 'food-lagman', label: 'Лагман', q: 'лагман' },
  { icon: 'food-shashlik', label: 'Шашлык', q: 'шашлы' },
  { icon: 'food-manty', label: 'Манты', q: 'мант' },
  { icon: 'food-dessert', label: 'Десерты', q: 'десерт' },
]

const SORTS = [
  { key: '', label: 'По умолчанию' },
  { key: 'rating', label: 'По рейтингу' },
  { key: 'time', label: 'Быстрее доставка' },
  { key: 'fee', label: 'Дешевле доставка' },
]

/** Есть ли в меню заведения блюдо/секция по стему категории */
function hasCat(r: MockRestaurant, q: string): boolean {
  if (!q) return true
  const needle = q.toLowerCase()
  return r.menu.some(
    (m) => m.cat.toLowerCase().includes(needle) || m.items.some((i) => i.name.toLowerCase().includes(needle)),
  )
}

/** Совпадение по живому поиску: имя заведения или название блюда */
function matchQuery(r: MockRestaurant, q: string): boolean {
  const needle = q.trim().toLowerCase()
  if (!needle) return true
  return (
    r.name.toLowerCase().includes(needle) ||
    r.menu.some((m) => m.items.some((i) => i.name.toLowerCase().includes(needle)))
  )
}

export default function Food() {
  const nav = useNavigate()
  const { data, loading } = useData<{ restaurants: MockRestaurant[] }>('food.restaurants')
  const { data: my } = useData<{ orders: FoodOrder[] }>('food.my_orders')

  const [q, setQ] = useState('')
  const [searching, setSearching] = useState(false)
  const [cat, setCat] = useState('')            // выбранная категория рейла (label)
  const [onlyOpen, setOnlyOpen] = useState(false)
  const [pickup, setPickup] = useState(false)
  const [sort, setSort] = useState('')
  const [sheet, setSheet] = useState<'' | 'type' | 'sort' | 'addr'>('')
  const [favs, setFavs] = useState<Set<string>>(new Set())
  const [addr, setAddr] = useState(getDelivery())
  const [addrDraft, setAddrDraft] = useState('')

  const catQ = FOOD_CATS.find((c) => c.label === cat)?.q ?? ''
  let rests = (data?.restaurants ?? [])
    .filter((r) => matchQuery(r, q))
    .filter((r) => hasCat(r, catQ))
    .filter((r) => !onlyOpen || r.open)
  if (sort === 'rating') rests = [...rests].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
  if (sort === 'time') rests = [...rests].sort((a, b) => parseInt(a.time) - parseInt(b.time))
  if (sort === 'fee') rests = [...rests].sort((a, b) => a.deliveryFee - b.deliveryFee)

  const openCount = (data?.restaurants ?? []).filter((r) => r.open).length
  const active = (my?.orders ?? []).find((o) => isActiveOrder(o.status))
  const last = (my?.orders ?? []).find((o) => o.status === 'delivered')
  const lastRest = last ? data?.restaurants.find((r) => r.key === last.restKey) : undefined

  function toggleFav(key: string) {
    setFavs((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }

  /** «Повторить заказ» — тот же состав в корзину и в меню заведения */
  function repeat() {
    if (!last || !lastRest) return
    fillCart(lastRest.key, lastRest.name, last.items)
    nav(`/food/${lastRest.key}`)
  }

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <div className="flex-1 pb-2">
        {/* шапка: назад + пилюля адреса доставки */}
        <div className="relative flex min-h-[56px] items-center justify-center px-4 pt-2.5 pb-3.5">
          <button
            type="button"
            aria-label="Назад"
            onClick={() => nav('/')}
            className="absolute left-4 flex size-[38px] items-center justify-center rounded-full bg-card shadow-[0_1px_3px_rgba(20,20,25,.08)]"
          >
            <Icon id="arrow-left" className="size-[18px]" />
          </button>
          <button
            type="button"
            onClick={() => { setAddrDraft(addr.address); setSheet('addr') }}
            className="flex items-center gap-1.5 rounded-full bg-card px-3.5 py-[9px] text-[12.5px] font-bold shadow-[0_1px_3px_rgba(20,20,25,.08)]"
          >
            {addr.district}, {addr.address.replace(/,\s*кв.*/i, '')}
            <Icon id="chevron-down" className="size-2.5 text-mut" />
          </button>
        </div>

        <h1 className="px-5 pt-2 pb-2.5 text-[26px] font-extrabold tracking-tight">Еда</h1>

        {/* контекстный живой поиск: в Еде ищет еду */}
        <div className="mx-5 mb-3.5 flex items-center gap-2.5 rounded-[14px] bg-card px-4 py-[13px] text-[14.5px] shadow-[0_1px_3px_rgba(20,20,25,.06)]">
          <Icon id="search" className="size-[19px] text-mut" />
          {searching ? (
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onBlur={() => { if (!q) setSearching(false) }}
              placeholder="Поиск в Еде"
              className="min-w-0 flex-1 bg-transparent font-medium outline-none placeholder:text-mut"
            />
          ) : (
            <button type="button" onClick={() => setSearching(true)} className="flex-1 text-left font-medium text-mut">
              Поиск в Еде
            </button>
          )}
          {q && (
            <button type="button" aria-label="Очистить" onClick={() => { setQ(''); setSearching(false) }}>
              <Icon id="close" className="size-3.5 text-mut" />
            </button>
          )}
        </div>

        {/* рейл категорий еды */}
        <HScroll className="px-5 pb-3">
          {FOOD_CATS.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={() => setCat(cat === c.label ? '' : c.label)}
              className="flex w-[66px] flex-none flex-col items-center gap-1.5"
            >
              <i className={
                'flex size-[56px] items-center justify-center rounded-[18px] transition-colors ' +
                (cat === c.label ? 'bg-[var(--acc-sel)] text-white' : 'bg-card text-acc shadow-[0_1px_3px_rgba(20,20,25,.07)]')
              }>
                <Icon id={c.icon} className="size-[26px]" />
              </i>
              <span className="text-[10.5px] font-semibold">{c.label}</span>
            </button>
          ))}
        </HScroll>

        {/* фильтры-чипы */}
        <HScroll className="px-5 pb-3">
          <Chip on={onlyOpen} onPress={() => setOnlyOpen(!onlyOpen)}>Открыто</Chip>
          <Chip on={!!cat} onPress={() => setSheet('type')}>{cat ? `${cat} ▾` : 'Тип еды ▾'}</Chip>
          <Chip on={pickup} onPress={() => setPickup(!pickup)}>Самовывоз</Chip>
          <Chip on={!!sort} onPress={() => setSheet('sort')}>Сортировать ▾</Chip>
        </HScroll>

        {/* активный заказ — строкой со статусом */}
        {active && (
          <button
            type="button"
            onClick={() => nav(`/order/${active.id}`)}
            className="mx-5 mb-3.5 flex w-[calc(100%-40px)] items-center gap-2.5 rounded-[14px] bg-ink px-3.5 py-[11px] text-white"
          >
            <span className="size-2 flex-none rounded-full bg-acc-l shadow-[0_0_0_4px_rgba(var(--acc-rgb),.25)]" />
            <span className="num min-w-0 flex-1 truncate text-left text-[12.5px] font-bold">
              Заказ №{active.seq} · {data?.restaurants.find((r) => r.key === active.restKey)?.name ?? ''}
            </span>
            <span className="flex-none rounded-full bg-[rgba(var(--acc-rgb),.22)] px-2 py-1 text-[10.5px] font-bold text-acc-l">
              {ORDER_LABEL[active.status] ?? active.status}
            </span>
            <Icon id="chevron-right" className="size-3.5 opacity-70" />
          </button>
        )}

        {/* повторить последний доставленный заказ */}
        {last && lastRest && !q && !cat && (
          <>
            <SecLbl title="Повторить заказ" />
            <button type="button" onClick={repeat} className="mx-5 mb-4 block w-[calc(100%-40px)] text-left">
              <Photo id={lastRest.imageId} className="h-[148px] rounded-2xl" />
              <div className="mt-2 flex items-center justify-between gap-2.5 text-[15.5px] font-extrabold tracking-tight">
                {last.items[0]?.name} · {lastRest.name}
              </div>
              <div className="num mt-1 flex flex-wrap items-center gap-[7px] text-[12px] font-semibold text-[#3A3833]">
                <span>{fmtT(last.total)}</span>
                <span className="text-[#C5C1B7]">·</span>
                {lastRest.time.replace('′', ' мин')}
                <span className="text-[#C5C1B7]">·</span>
                {pickup ? 'самовывоз' : `доставка ${fmtT(lastRest.deliveryFee)}`}
              </div>
            </button>
          </>
        )}

        {/* заведения */}
        <SecLbl title={q ? 'Найдено' : 'Заведения рядом'} right={q ? `${rests.length}` : `${openCount} открыто`} />
        {rests.map((r) => (
          <div key={r.key} className={'mx-5 mb-4 ' + (r.open ? '' : 'opacity-55')}>
            <button type="button" onClick={() => nav(`/food/${r.key}`)} className="block w-full text-left">
              <Photo id={r.imageId} className="h-[148px] rounded-2xl" />
            </button>
            <div className="mt-[9px] flex items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => nav(`/food/${r.key}`)}
                className="min-w-0 flex-1 truncate text-left text-[15.5px] font-extrabold tracking-tight"
              >
                {r.name}
              </button>
              <button type="button" aria-label="В избранное" onClick={() => toggleFav(r.key)}>
                <Icon
                  id={favs.has(r.key) ? 'heart-filled' : 'heart'}
                  className={'size-[18px] flex-none ' + (favs.has(r.key) ? 'text-acc' : 'text-mut')}
                />
              </button>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-[7px] text-[12px] font-semibold text-[#3A3833]">
              <span className="font-extrabold text-acc-d">{r.rating}</span>
              <span className="text-[#C5C1B7]">·</span>
              <span>{r.ratingCount}</span>
              <span className="text-[#C5C1B7]">·</span>
              {r.time.replace('′', ' мин')}
              <span className="text-[#C5C1B7]">·</span>
              <span className="num">{pickup ? 'самовывоз' : `доставка ${fmtT(r.deliveryFee)}`}</span>
            </div>
          </div>
        ))}
        {!loading && rests.length === 0 && (
          <p className="px-8 py-6 text-center text-[13px] font-medium text-mut">
            Ничего не нашли — попробуйте снять фильтры или изменить запрос.
          </p>
        )}
        {loading && Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="mx-5 mb-4 h-[190px] animate-pulse rounded-2xl bg-line/60" />
        ))}
      </div>

      <TabBar items={FOOD_TABS} />

      {/* шторка «Тип еды» */}
      {sheet === 'type' && (
        <Sheet title="Тип еды" onClose={() => setSheet('')}>
          {FOOD_CATS.filter((c) => c.q).map((c) => (
            <SheetOption key={c.label} on={cat === c.label} onPress={() => { setCat(cat === c.label ? '' : c.label); setSheet('') }}>
              {c.label}
            </SheetOption>
          ))}
        </Sheet>
      )}

      {/* шторка «Сортировать» */}
      {sheet === 'sort' && (
        <Sheet title="Сортировать" onClose={() => setSheet('')}>
          {SORTS.map((s) => (
            <SheetOption key={s.key} on={sort === s.key} onPress={() => { setSort(s.key); setSheet('') }}>
              {s.label}
            </SheetOption>
          ))}
        </Sheet>
      )}

      {/* шторка адреса доставки */}
      {sheet === 'addr' && (
        <Sheet title="Адрес доставки" onClose={() => setSheet('')}>
          <div className="flex gap-1.5 pb-3">
            {['Шу қаласы', 'Төле би', 'Бірлік'].map((d) => (
              <Chip key={d} on={addr.district === d} onPress={() => setAddr(setDelivery({ district: d }))}>{d}</Chip>
            ))}
          </div>
          <input
            value={addrDraft}
            onChange={(e) => setAddrDraft(e.target.value)}
            placeholder="Улица, дом, квартира"
            className="w-full rounded-[14px] bg-field px-4 py-[13px] text-[14px] font-medium outline-none placeholder:text-faint"
          />
          <SheetBtn off={!addrDraft.trim()} onPress={() => { setAddr(setDelivery({ address: addrDraft.trim() })); setSheet('') }}>
            Готово
          </SheetBtn>
        </Sheet>
      )}
    </div>
  )
}
