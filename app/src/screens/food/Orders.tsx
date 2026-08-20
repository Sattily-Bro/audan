// Мои заказы (эталон: S22). Текущий заказ закреплён сверху тёмной карточкой
// с прогрессом — тап открывает отслеживание. Ниже история: состав одной
// строкой, сумма, статус, «Повторить» кладёт те же позиции в корзину.
// API: food.my_orders + food.restaurants (имена и логотипы заведений).
import { useNavigate } from 'react-router'
import { fmtT } from '../../lib/format'
import { useData } from '../../lib/useData'
import { Icon } from '../../ui/Icon'
import { SHead } from '../../ui/SHead'
import { SecLbl, Photo } from '../../ui/kit'
import { TabBar } from '../../ui/TabBar'
import type { MockRestaurant } from '../../mocks/db'
import { fillCart } from './cart'
import { FOOD_TABS, ORDER_LABEL, ORDER_STEPS, isActiveOrder, orderRank, type FoodOrder } from './flow'

/** Подсказка в подвале тёмной карточки по статусу */
const CUR_HINT: Record<string, string> = {
  pending: 'ждём подтверждение заведения',
  accepted: 'оплатите счёт в Kaspi',
  paid: 'заведение подтверждает перевод',
  preparing: 'кухня готовит заказ',
  ready: 'заказ готов · ждёт курьера',
  courier: 'курьер Ержан Т. · ~15 мин',
}

export default function Orders() {
  const nav = useNavigate()
  const { data, loading } = useData<{ orders: FoodOrder[] }>('food.my_orders')
  const { data: rests } = useData<{ restaurants: MockRestaurant[] }>('food.restaurants')

  const orders = data?.orders ?? []
  const current = orders.filter((o) => isActiveOrder(o.status))
  const past = orders.filter((o) => !isActiveOrder(o.status))
  const restOf = (key: string) => rests?.restaurants.find((r) => r.key === key)

  /** «Повторить» — тот же состав в корзину и сразу в оформление */
  function repeat(o: FoodOrder) {
    const r = restOf(o.restKey)
    fillCart(o.restKey, r?.name ?? '', o.items)
    nav('/checkout')
  }

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <div className="flex-1 pb-2">
        <SHead title="Мои заказы" backTo="/food" />

        {/* пусто — дружелюбный экран с кнопкой в еду */}
        {!loading && orders.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-8 pt-24 text-center">
            <span className="flex size-[72px] items-center justify-center rounded-3xl bg-card shadow-[0_1px_3px_rgba(20,20,25,.07)]">
              <Icon id="svc-food" className="size-9 text-acc" />
            </span>
            <div className="text-[17px] font-extrabold">Пока нет заказов</div>
            <p className="text-[13px] leading-[1.5] font-medium text-mut">
              Загляните в «Еду» — 6 заведений Шу привезут горячее прямо к двери.
            </p>
            <button
              type="button"
              onClick={() => nav('/food')}
              className="mt-2 rounded-full bg-acc px-6 py-3 text-[13.5px] font-bold text-white"
            >
              К заведениям
            </button>
          </div>
        )}

        {/* текущие заказы — тёмными карточками с прогрессом */}
        {current.length > 0 && <SecLbl title="Сейчас" />}
        {current.map((o) => {
          const rank = orderRank(o.status)
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => nav(`/order/${o.id}`)}
              className="mx-4 mb-3.5 block w-[calc(100%-32px)] rounded-[18px] bg-ink px-4 py-[15px] text-left text-white"
            >
              <div className="flex items-center gap-2">
                <span className="num text-[14.5px] font-extrabold">№{o.seq} · {restOf(o.restKey)?.name ?? ''}</span>
                <span className="ml-auto flex-none rounded-full bg-white/14 px-2.5 py-1 text-[10.5px] font-bold text-acc-l">
                  {ORDER_LABEL[o.status] ?? o.status}
                </span>
              </div>
              <div className="mt-3 flex gap-[5px]">
                {ORDER_STEPS.map((st, i) => (
                  <i key={st.key} className={'h-1 flex-1 rounded-sm ' + (i <= rank ? 'bg-acc-l' : 'bg-white/16')} />
                ))}
              </div>
              <div className="mt-2.5 flex items-center gap-2 text-[11.5px] font-semibold text-[#B3AFA5]">
                <span>{CUR_HINT[o.status] ?? ''}</span>
                <span className="num ml-auto font-bold text-white">{fmtT(o.total)}</span>
                <Icon id="chevron-right" className="size-[15px] flex-none opacity-70" />
              </div>
            </button>
          )
        })}

        {/* история */}
        {past.length > 0 && <SecLbl title="Ранее" />}
        {past.map((o) => {
          const r = restOf(o.restKey)
          return (
            <div key={o.id} className="mx-4 mb-2.5 flex gap-3 rounded-2xl bg-card px-3.5 py-[13px] shadow-[0_1px_3px_rgba(20,20,25,.06)]">
              {r?.imageId ? (
                <Photo id={r.imageId} className="size-11 flex-none rounded-[13px]" />
              ) : (
                <span className="flex size-11 flex-none items-center justify-center rounded-[13px] bg-soft text-[20px]">{r?.logo ?? '🍽'}</span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2 text-[13.5px] font-bold">
                  <button type="button" onClick={() => nav(`/order/${o.id}`)} className="truncate text-left">{r?.name ?? ''}</button>
                  <span className="flex-none text-[11px] font-semibold text-faint">сегодня</span>
                </div>
                <div className="mt-0.5 truncate text-[11.5px] font-semibold text-mut">
                  {o.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="num text-[13.5px] font-extrabold">{fmtT(o.total)}</span>
                  <span className={
                    'rounded-[7px] px-2 py-[3px] text-[10px] font-bold ' +
                    (o.status === 'delivered' ? 'bg-[#E6F4EB] text-ok' : 'bg-[#FBE5E1] text-[#B03A2A]')
                  }>
                    {o.status === 'delivered' ? 'Доставлен' : 'Отменён'}
                  </span>
                  <button
                    type="button"
                    onClick={() => repeat(o)}
                    className="ml-auto flex-none rounded-[10px] bg-acc-bg px-[13px] py-2 text-[11.5px] font-bold text-acc-d"
                  >
                    Повторить
                  </button>
                </div>
              </div>
            </div>
          )
        })}

        {loading && (
          <div className="px-4 pt-2">
            {Array.from({ length: 3 }, (_, i) => <div key={i} className="mb-2.5 h-[88px] animate-pulse rounded-2xl bg-line/60" />)}
          </div>
        )}
      </div>

      <TabBar items={FOOD_TABS} />
    </div>
  )
}
