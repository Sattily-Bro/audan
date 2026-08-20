// Меню заведения (эталон: S6). Glovo-структура: фото-шапка с плавающими
// кнопками и логотипом, имя, три метрики (рейтинг · время · доставка с порогом
// бесплатной), табы-якоря по секциям меню, блюда со степперами, блок отзывов
// с процентом, корзина закреплена снизу. API: food.get.
import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { fmtT } from '../../lib/format'
import { useData } from '../../lib/useData'
import { Icon } from '../../ui/Icon'
import { SecLbl, Photo } from '../../ui/kit'
import type { MockMenuItem, MockRestaurant } from '../../mocks/db'
import { addItem, cartCount, cartTotal, qtyOf, removeItem, useCart } from './cart'

export default function Menu() {
  const nav = useNavigate()
  const { rest = '' } = useParams()
  const { data, loading, error } = useData<{ restaurant: MockRestaurant }>('food.get', { key: rest })
  const cart = useCart()

  const [fav, setFav] = useState(false)
  const [activeCat, setActiveCat] = useState('')
  const [searching, setSearching] = useState(false)
  const [q, setQ] = useState('')
  const secRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const r = data?.restaurant
  const mine = r ? cart.rest === r.key : false
  const count = mine ? cartCount(cart) : 0

  function goCat(cat: string) {
    setActiveCat(cat)
    secRefs.current[cat]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-paper px-8 text-center">
        <div className="text-[17px] font-extrabold">Заведение не найдено</div>
        <Link to="/food" className="mt-2 rounded-full bg-acc-bg px-5 py-2.5 text-[13px] font-bold text-acc-d">К заведениям</Link>
      </div>
    )
  }

  const needle = q.trim().toLowerCase()
  const found = needle && r
    ? r.menu.flatMap((m) => m.items).filter((i) => i.name.toLowerCase().includes(needle))
    : []

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <div className="flex-1 pb-24">
        {/* фото-шапка с плавающими кнопками и логотипом */}
        <div className="relative h-[178px]">
          <Photo id={r?.imageId} className="absolute inset-0" />
          <div className="absolute top-3.5 right-4 left-4 flex gap-2">
            <button
              type="button"
              aria-label="Назад"
              onClick={() => nav('/food')}
              className="flex size-[38px] items-center justify-center rounded-full bg-card shadow-[0_2px_8px_rgba(20,20,25,.18)]"
            >
              <Icon id="arrow-left" className="size-[17px]" />
            </button>
            <div className="flex-1" />
            <button
              type="button"
              aria-label="Поиск по меню"
              onClick={() => { setSearching(!searching); setQ('') }}
              className="flex size-[38px] items-center justify-center rounded-full bg-card shadow-[0_2px_8px_rgba(20,20,25,.18)]"
            >
              <Icon id="search" className="size-[17px]" />
            </button>
            <button
              type="button"
              aria-label="В избранное"
              onClick={() => setFav(!fav)}
              className="flex size-[38px] items-center justify-center rounded-full bg-card shadow-[0_2px_8px_rgba(20,20,25,.18)]"
            >
              <Icon id={fav ? 'heart-filled' : 'heart'} className={'size-[17px] ' + (fav ? 'text-acc' : '')} />
            </button>
          </div>
          <div className="absolute -bottom-4 left-4 z-[3] flex size-[56px] items-center justify-center rounded-2xl bg-card text-[26px] shadow-[0_3px_10px_rgba(20,20,25,.15)]">
            {r?.logo}
          </div>
        </div>

        <h1 className="px-5 pt-[26px] pb-0.5 text-[22px] font-extrabold tracking-tight">{r?.name}</h1>

        {/* три метрики */}
        {r && (
          <div className="grid grid-cols-3 px-3.5 pt-3 pb-3.5">
            <button type="button" onClick={() => nav(`/food/${r.key}/reviews`)} className="flex flex-col items-center gap-[3px] px-1 text-center">
              <span className="text-[15px] font-extrabold whitespace-nowrap text-acc-d">{r.rating}</span>
              <span className="text-[10.5px] leading-[1.25] font-semibold text-mut">{r.ratingCount}</span>
            </button>
            <div className="flex flex-col items-center gap-[3px] px-1 text-center">
              <span className="text-[15px] font-extrabold whitespace-nowrap">{r.time}</span>
              <span className="text-[10.5px] leading-[1.25] font-semibold text-mut">доставка</span>
            </div>
            <div className="flex flex-col items-center gap-[3px] px-1 text-center">
              <span className="num text-[15px] font-extrabold whitespace-nowrap">{fmtT(r.deliveryFee)}</span>
              <span className="num text-[10.5px] leading-[1.25] font-semibold text-mut">от {fmtT(r.freeFrom)} — 0 ₸</span>
            </div>
          </div>
        )}

        {/* поиск по меню (контекстный) */}
        {searching && (
          <div className="mx-4 mb-3 flex items-center gap-2.5 rounded-[14px] bg-card px-4 py-[11px] text-[14px] shadow-[0_1px_3px_rgba(20,20,25,.06)]">
            <Icon id="search" className="size-4 text-mut" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={'Поиск в ' + (r?.name ?? 'меню')}
              className="min-w-0 flex-1 bg-transparent font-medium outline-none placeholder:text-mut"
            />
            <button type="button" aria-label="Закрыть поиск" onClick={() => { setSearching(false); setQ('') }}>
              <Icon id="close" className="size-3.5 text-mut" />
            </button>
          </div>
        )}

        {/* табы-якоря секций меню */}
        {r && !needle && (
          <div className="sticky top-0 z-10 flex gap-1.5 overflow-x-auto bg-paper px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {r.menu.map((m) => (
              <button
                key={m.cat}
                type="button"
                onClick={() => goCat(m.cat)}
                className={
                  'flex-none rounded-full px-3.5 py-[8px] text-[12.5px] font-bold whitespace-nowrap transition-colors ' +
                  ((activeCat || r.menu[0]?.cat) === m.cat
                    ? 'bg-[var(--acc-sel)] text-white'
                    : 'bg-card shadow-[0_1px_3px_rgba(20,20,25,.07)]')
                }
              >
                {m.cat}
              </button>
            ))}
          </div>
        )}

        {/* результат поиска по меню */}
        {r && needle && (
          <div className="mx-4 mb-4 overflow-hidden rounded-2xl shadow-[0_1px_3px_rgba(20,20,25,.06)]">
            {found.map((i) => <DishRow key={i.name} rest={r} item={i} qty={qtyOf(cart, i.name)} mine={mine} />)}
            {found.length === 0 && (
              <p className="bg-card px-5 py-6 text-center text-[13px] font-medium text-mut">В меню такого нет.</p>
            )}
          </div>
        )}

        {/* секции меню */}
        {r && !needle && r.menu.map((m, mi) => (
          <div key={m.cat} ref={(el) => { secRefs.current[m.cat] = el }} className="scroll-mt-12">
            <SecLbl title={m.cat} />
            {mi === 0 ? (
              /* первая секция («Популярное») — плитками 2×N */
              <div className="grid grid-cols-2 gap-2.5 px-5 pb-2">
                {m.items.map((i) => <DishTile key={i.name} rest={r} item={i} qty={qtyOf(cart, i.name)} mine={mine} />)}
              </div>
            ) : (
              <div className="mx-4 mb-4 overflow-hidden rounded-2xl shadow-[0_1px_3px_rgba(20,20,25,.06)]">
                {m.items.map((i) => <DishRow key={i.name} rest={r} item={i} qty={qtyOf(cart, i.name)} mine={mine} />)}
              </div>
            )}
            {/* блок отзывов — после первой секции, как в эталоне */}
            {mi === 0 && r.reviews && (
              <Link
                to={`/food/${r.key}/reviews`}
                className="mx-4 mt-2 mb-4 flex items-center gap-3.5 rounded-2xl bg-card px-4 py-3.5 shadow-[0_1px_3px_rgba(20,20,25,.06)]"
              >
                <span className="num text-[22px] font-extrabold tracking-tight text-acc-d">{r.reviews.pct}</span>
                <span className="min-w-0 flex-1 text-[12.5px] font-semibold">
                  {r.reviews.s} <span className="text-mut">· читать все</span>
                </span>
                <Icon id="chevron-right" className="size-[15px] flex-none text-[#C5C1B7]" />
              </Link>
            )}
          </div>
        ))}
        {loading && (
          <div className="px-5 pt-4">
            {Array.from({ length: 4 }, (_, i) => <div key={i} className="mb-3 h-[92px] animate-pulse rounded-2xl bg-line/60" />)}
          </div>
        )}
      </div>

      {/* корзина закреплена снизу */}
      {r && mine && count > 0 && (
        <div className="fixed right-0 bottom-0 left-0 z-20 px-4 pb-[max(env(safe-area-inset-bottom),10px)]">
          <button
            type="button"
            onClick={() => nav('/checkout')}
            className="flex h-[52px] w-full items-center gap-2.5 rounded-[15px] bg-acc px-[17px] text-white shadow-[0_6px_16px_rgba(var(--acc-rgb),.35)]"
          >
            <span className="num rounded-lg bg-white/25 px-2 py-[3px] text-[12px] font-extrabold">{count}</span>
            <span className="min-w-0 flex-1 truncate text-left text-[14px] font-bold">Корзина · {r.name}</span>
            <span className="num text-[15px] font-extrabold">{fmtT(cartTotal(cart))}</span>
          </button>
        </div>
      )}
    </div>
  )
}

/** Степпер −/qty/+ или кнопка «+» поверх фото блюда */
function Stepper({ rest, item, qty }: { rest: MockRestaurant; item: MockMenuItem; qty: number }) {
  if (qty === 0) {
    return (
      <button
        type="button"
        aria-label={'Добавить ' + item.name}
        onClick={() => addItem(rest.key, rest.name, item)}
        className="flex size-[30px] items-center justify-center rounded-full bg-card shadow-[0_2px_8px_rgba(20,20,25,.16)]"
      >
        <Icon id="plus" className="size-3.5" />
      </button>
    )
  }
  return (
    <div className="flex h-[30px] items-center gap-0.5 rounded-full bg-card px-1 shadow-[0_2px_8px_rgba(20,20,25,.16)]">
      <button type="button" aria-label="Убрать порцию" onClick={() => removeItem(item.name)} className="flex size-6 items-center justify-center">
        <Icon id="minus" className="size-3" />
      </button>
      <span className="num min-w-3.5 text-center text-[12.5px] font-extrabold">{qty}</span>
      <button type="button" aria-label="Ещё порцию" onClick={() => addItem(rest.key, rest.name, item)} className="flex size-6 items-center justify-center">
        <Icon id="plus" className="size-3" />
      </button>
    </div>
  )
}

/** Плитка блюда в «Популярном» (фото сверху, «+» на фото) */
function DishTile({ rest, item, qty, mine }: { rest: MockRestaurant; item: MockMenuItem; qty: number; mine: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-[15px] bg-card shadow-[0_1px_3px_rgba(20,20,25,.06)]">
      <Photo id={item.imageId} className="h-[100px]" />
      <div className="absolute top-[74px] right-2">
        <Stepper rest={rest} item={item} qty={mine ? qty : 0} />
      </div>
      <div className="px-[11px] pt-[9px] pb-[11px]">
        <div className="text-[12.5px] leading-[1.25] font-bold">{item.name}</div>
        <div className="num mt-1 text-[13.5px] font-extrabold">{fmtT(item.price)}</div>
      </div>
    </div>
  )
}

/** Строка блюда в секции (текст слева, фото и «+» справа) */
function DishRow({ rest, item, qty, mine }: { rest: MockRestaurant; item: MockMenuItem; qty: number; mine: boolean }) {
  return (
    <div className="flex gap-3 border-b border-soft bg-card px-5 py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="flex justify-between gap-2.5 text-[13.5px] font-bold">
          {item.name}
          <b className="num font-extrabold whitespace-nowrap">{fmtT(item.price)}</b>
        </div>
        {item.desc && <div className="mt-1 text-[11.5px] leading-[1.4] text-[#6C6A62]">{item.desc}</div>}
      </div>
      <div className="relative flex-none">
        <Photo id={item.imageId} className="size-[76px] rounded-xl" />
        <div className="absolute -right-1.5 -bottom-1.5">
          <Stepper rest={rest} item={item} qty={mine ? qty : 0} />
        </div>
      </div>
    </div>
  )
}
