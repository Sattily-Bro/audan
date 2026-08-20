// Отслеживание заказа (эталон: S13, спека: design/FOOD-ORDER-FLOW.md).
// Оплата по счёту Kaspi: на «Счёт выставлен» — панель с суммой, номером
// заведения и кнопкой «Я оплатил». Кнопки «отменить» НЕТ (решение владельца,
// 19.08.2026) — только звонок заведению. API: food.order_status (поллинг 5 с),
// food.mark_paid, food.restaurants (телефон и имя заведения).
import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { api } from '../../api/client'
import { fmtT } from '../../lib/format'
import { useData } from '../../lib/useData'
import { Icon } from '../../ui/Icon'
import { SHead } from '../../ui/SHead'
import { SecLbl } from '../../ui/kit'
import { TabBar } from '../../ui/TabBar'
import type { MockRestaurant } from '../../mocks/db'
import { FOOD_TABS, ORDER_STEPS, orderRank, telHref, waHref, type FoodOrder } from './flow'

/** Курьер — из эталона S13 (данных о курьерах в API пока нет) */
const COURIER = { name: 'Ержан Т.', about: 'Курьер · Honda Dio, белый', phone: '+7 747 662 09 14' }

/** Заголовок и подпись тёмной карточки по статусу */
function hero(status: string, restName: string): { t: string; s: string } {
  switch (status) {
    case 'pending': return { t: 'Ждёт подтверждения', s: `${restName} получил заказ — обычно отвечают за пару минут` }
    case 'accepted': return { t: 'Счёт выставлен', s: 'Оплатите в Kaspi и нажмите «Я оплатил»' }
    case 'paid': return { t: 'Оплата отмечена', s: 'Заведение подтвердит перевод и начнёт готовить' }
    case 'preparing': return { t: 'Готовится', s: 'Кухня взяла заказ в работу' }
    case 'ready': return { t: 'Готовится', s: 'Заказ готов — передаём курьеру' }
    case 'courier': return { t: 'Едет к вам', s: 'Курьер уже в пути — можно написать или позвонить' }
    case 'delivered': return { t: 'Доставлен', s: 'Приятного аппетита! Оцените заказ' }
    case 'cancelled': return { t: 'Отменён', s: 'Если есть вопросы — позвоните в заведение' }
    default: return { t: status, s: '' }
  }
}

/** Подпись «Оплата» в мета-блоке */
const PAY_META: Record<string, string> = {
  pending: 'Kaspi · счёт после принятия заказа',
  accepted: 'Kaspi · счёт выставлен',
  paid: 'Kaspi · перевод отмечен',
}

export default function Order() {
  const { id = '' } = useParams()
  const { data, reload } = useData<{ order: FoodOrder }>('food.order_status', { id })
  const { data: rests } = useData<{ restaurants: MockRestaurant[] }>('food.restaurants')
  const [times, setTimes] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  const order = data?.order
  const rest = rests?.restaurants.find((x) => x.key === order?.restKey)
  const rank = order ? orderRank(order.status) : 0

  /* поллинг статуса каждые 5 секунд */
  useEffect(() => {
    const t = setInterval(reload, 5000)
    return () => clearInterval(t)
  }, [reload])

  /* время шагов: запоминаем момент, когда увидели статус (в прототипе — 18:42…) */
  useEffect(() => {
    if (!order) return
    const key = `audan-order-times-${order.id}`
    let saved: Record<string, string> = {}
    try { saved = JSON.parse(localStorage.getItem(key) ?? '{}') as Record<string, string> } catch { /* битый JSON */ }
    const stepKey = order.status === 'ready' ? 'preparing' : order.status
    if (!saved[stepKey]) {
      saved[stepKey] = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
      try { localStorage.setItem(key, JSON.stringify(saved)) } catch { /* приватный режим */ }
    }
    setTimes(saved)
  }, [order])

  async function markPaid() {
    if (!order || busy) return
    setBusy(true)
    try {
      await api('food.mark_paid', { id: order.id })
      reload()
    } finally {
      setBusy(false)
    }
  }

  /** Подпись у шага таймлайна: время, подсказка или «—» */
  function stepTime(stepKey: string, i: number): string {
    if (times[stepKey]) return times[stepKey]
    if (i <= rank) return '—'
    if (stepKey === 'paid') return 'ждём вашу оплату'
    if (stepKey === 'preparing') return 'после оплаты'
    return '—'
  }

  const h = order ? hero(order.status, rest?.name ?? '') : null

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <div className="flex-1 pb-2">
        <SHead title={order ? `Заказ №${order.seq}` : 'Заказ'} backTo="/orders" />

        {/* тёмная карточка статуса */}
        {order && h && (
          <div className="relative mx-4 mt-0.5 mb-3.5 overflow-hidden rounded-[20px] bg-ink px-[18px] pt-[18px] pb-4 text-white">
            <svg className="absolute top-1/2 right-3.5 box-content size-[46px] -translate-y-1/2 rounded-full bg-white/9 p-[11px]" viewBox="0 0 64 64">
              <g stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="16" cy="49" r="6.5" />
                <circle cx="48" cy="49" r="6.5" />
                <path d="M16 49h17l7-15h8" />
                <path d="M42 24h7v7" />
              </g>
              <rect x="22" y="19" width="15" height="12" rx="3.5" fill="#FFD166" />
            </svg>
            <div className="text-[11px] font-extrabold tracking-[.08em] text-acc-l uppercase">{rest?.name}</div>
            <div className="mt-[7px] mb-1 max-w-[75%] text-[21px] font-extrabold tracking-tight">{h.t}</div>
            <p className="max-w-[75%] text-[12.5px] font-semibold text-[#A5A29A]">{h.s}</p>
          </div>
        )}

        {/* панель счёта Kaspi — только на «Счёт выставлен» */}
        {order && rest && order.status === 'accepted' && (
          <div className="mx-4 mb-4 rounded-[18px] border-[1.5px] border-acc bg-card px-4 py-[15px] shadow-[0_1px_3px_rgba(20,20,25,.06)]">
            <div className="flex items-center gap-3">
              <span className="flex size-[42px] flex-none items-center justify-center rounded-[13px] bg-[#F14635] text-[20px] font-extrabold text-white">K</span>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-extrabold tracking-tight">Счёт на <b className="num">{fmtT(order.total)}</b></div>
                <div className="mt-[3px] text-[11.5px] leading-[1.4] font-semibold text-mut">
                  {rest.name} · перевод на <b className="num font-bold text-ink">{rest.phone}</b>
                </div>
              </div>
            </div>
            <div className="mt-[13px] flex gap-2">
              <a
                href="https://kaspi.kz/pay"
                target="_blank"
                rel="noreferrer"
                className="flex h-11 flex-1 items-center justify-center gap-[7px] rounded-[13px] bg-[#F14635] text-[13px] font-extrabold text-white"
              >
                Открыть Kaspi
              </a>
              <button
                type="button"
                disabled={busy}
                onClick={markPaid}
                className="flex h-11 flex-1 items-center justify-center gap-[7px] rounded-[13px] border-[1.5px] border-line text-[13px] font-extrabold disabled:opacity-60"
              >
                <Icon id="check-circle" className="size-4" />
                Я оплатил
              </button>
            </div>
          </div>
        )}

        {/* таймлайн статусов */}
        {order && order.status !== 'cancelled' && (
          <div className="mx-4 mb-4 rounded-[18px] bg-card px-[18px] py-4 shadow-[0_1px_3px_rgba(20,20,25,.06)]">
            {ORDER_STEPS.map((st, i) => {
              const done = i < rank
              const now = i === rank
              return (
                <div key={st.key} className="relative flex gap-3 pb-4 last:pb-0">
                  <div className="relative flex w-5 flex-none justify-center">
                    <i className={
                      'z-[2] mt-[3px] size-[11px] rounded-full ' +
                      (done || now ? 'bg-acc' : 'bg-[#DDD9D0]') +
                      (now ? ' shadow-[0_0_0_5px_rgba(var(--acc-rgb),.18)]' : '')
                    } />
                    {i < ORDER_STEPS.length - 1 && (
                      <span className={'absolute top-3 -bottom-4 w-0.5 ' + (done ? 'bg-acc' : 'bg-[#EAE7DF]')} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={'text-[13.5px] ' + (done || now ? 'font-bold' : 'font-semibold text-faint')}>{st.label}</div>
                    <div className="num mt-px text-[11px] font-semibold text-mut">{stepTime(st.key, i)}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* курьер — на «Едет к вам» */}
        {order?.status === 'courier' && (
          <div className="mx-4 mb-4 rounded-[18px] bg-card px-4 py-3.5 shadow-[0_1px_3px_rgba(20,20,25,.06)]">
            <div className="flex items-center gap-3">
              <div className="flex size-[46px] flex-none items-center justify-center rounded-full bg-[#EFE4D6] text-[16px] font-extrabold text-[#8A6432]">
                {COURIER.name.split(' ').map((w) => w[0]).join('')}
              </div>
              <div className="flex-1">
                <div className="text-[14px] font-bold">{COURIER.name}</div>
                <div className="mt-0.5 text-[11.5px] font-semibold text-mut">{COURIER.about}</div>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <a
                href={waHref(COURIER.phone)}
                target="_blank"
                rel="noreferrer"
                className="flex h-[42px] flex-1 items-center justify-center gap-[7px] rounded-xl bg-acc text-[12.5px] font-bold text-white"
              >
                <Icon id="whatsapp" className="size-4" />
                WhatsApp
              </a>
              <a
                href={telHref(COURIER.phone)}
                className="flex h-[42px] flex-1 items-center justify-center gap-[7px] rounded-xl border-[1.5px] border-line text-[12.5px] font-bold"
              >
                <Icon id="phone" className="size-4" />
                Позвонить
              </a>
            </div>
          </div>
        )}

        {/* состав заказа */}
        {order && (
          <>
            <SecLbl title="Состав заказа" />
            <div className="mx-4 mb-4 rounded-[18px] bg-card px-4 pt-1.5 pb-3.5 shadow-[0_1px_3px_rgba(20,20,25,.06)]">
              {order.items.map((i) => (
                <div key={i.name} className="flex items-center gap-2.5 border-b border-soft py-2.5">
                  <span className="num flex size-6 flex-none items-center justify-center rounded-lg bg-acc-bg text-[11px] font-extrabold text-acc-d">{i.qty}</span>
                  <span className="min-w-0 flex-1 text-[13px] font-semibold">{i.name}</span>
                  <span className="num text-[13px] font-bold">{fmtT(i.price * i.qty)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 text-[12.5px] font-semibold text-[#6C6A62]">
                <span>Сумма заказа</span><span className="num">{fmtT(order.subtotal)}</span>
              </div>
              <div className="flex justify-between pt-2 text-[12.5px] font-semibold text-[#6C6A62]">
                <span>Доставка</span><span className="num">{order.delivery_fee === 0 ? 'бесплатно' : fmtT(order.delivery_fee)}</span>
              </div>
              <div className="flex justify-between pt-2.5 text-[15px] font-extrabold">
                <span>Итого</span><span className="num">{fmtT(order.total)}</span>
              </div>
            </div>

            <div className="mx-4 mb-3 rounded-[18px] bg-card px-4 py-3.5 shadow-[0_1px_3px_rgba(20,20,25,.06)]">
              <div className="flex gap-2.5 py-[7px] text-[12.5px]">
                <span className="w-[76px] flex-none font-semibold text-mut">Адрес</span>
                <span className="font-semibold">{order.district}, {order.address}</span>
              </div>
              <div className="flex gap-2.5 py-[7px] text-[12.5px]">
                <span className="w-[76px] flex-none font-semibold text-mut">Kaspi</span>
                <span className="num font-semibold">{order.kaspi}</span>
              </div>
              <div className="flex gap-2.5 py-[7px] text-[12.5px]">
                <span className="w-[76px] flex-none font-semibold text-mut">Оплата</span>
                <span className="font-semibold">{PAY_META[order.status] ?? 'Kaspi · оплачен'}</span>
              </div>
            </div>

            {/* отмена — только звонком в заведение (кнопки «отменить» нет) */}
            {rest && (
              <a href={telHref(rest.phone)} className="mx-4 mb-5 block py-3 text-center text-[12.5px] font-bold text-acc-d">
                Позвонить в заведение
              </a>
            )}
          </>
        )}
        {!order && (
          <div className="px-4">
            <div className="h-[120px] animate-pulse rounded-[20px] bg-line/60" />
          </div>
        )}
      </div>

      <TabBar items={FOOD_TABS} />
    </div>
  )
}
