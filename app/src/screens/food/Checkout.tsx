// Оформление заказа (эталон: S30, спека: design/FOOD-ORDER-FLOW.md).
// Оплата по счёту Kaspi: клиент указывает номер, счёт заведение выставит после
// принятия заказа — списания при оформлении НЕТ, поэтому кнопка «Оформить
// заказ», а не «Оплатить». API: food.get (тариф доставки) + food.order.
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { api } from '../../api/client'
import { fmtT } from '../../lib/format'
import { useData } from '../../lib/useData'
import { Icon } from '../../ui/Icon'
import { SHead } from '../../ui/SHead'
import { Chip } from '../../ui/kit'
import type { MockRestaurant } from '../../mocks/db'
import { cartTotal, clearCart, getDelivery, setDelivery, useCart } from './cart'
import type { FoodOrder } from './flow'
import { Sheet, SheetOption, SheetBtn } from './Sheet'

const DISTRICTS = ['Шу қаласы', 'Төле би', 'Бірлік']
const TIMES = ['Как можно скорее', 'Через час', 'Через два часа']

export default function Checkout() {
  const nav = useNavigate()
  const cart = useCart()
  const { data } = useData<{ restaurant: MockRestaurant }>('food.get', { key: cart.rest })

  const [dlv, setDlv] = useState(getDelivery())
  const [when, setWhen] = useState(TIMES[0])
  const [sheet, setSheet] = useState<'' | 'address' | 'time' | 'kaspi'>('')
  const [addrDraft, setAddrDraft] = useState('')
  const [kaspiDraft, setKaspiDraft] = useState('')
  const [cashNote, setCashNote] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  // после отправки корзина чистится — держим заказ и имя заведения в стейте
  const [done, setDone] = useState<{ order: FoodOrder; restName: string } | null>(null)

  const r = data?.restaurant
  const subtotal = cartTotal(cart)
  const fee = r ? (subtotal >= r.freeFrom ? 0 : r.deliveryFee) : 0
  const total = subtotal + fee

  async function submit() {
    if (!r || busy) return
    setBusy(true)
    setErr('')
    try {
      const { order } = await api<{ order: FoodOrder }>('food.order', {
        rest: cart.rest,
        items: cart.items,
        kaspi: dlv.kaspi,
        district: dlv.district,
        address: dlv.address,
      })
      setDone({ order, restName: r.name })
      clearCart()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Не получилось отправить заказ')
    } finally {
      setBusy(false)
    }
  }

  /* экран «Заказ отправлен» — поверх всего, как co-done в эталоне */
  if (done) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-paper px-[34px] text-center">
        <div className="mb-[18px] flex size-[86px] items-center justify-center rounded-full bg-acc-bg text-acc">
          <Icon id="check-circle" className="size-11" />
        </div>
        <h2 className="mb-2 text-[21px] font-extrabold tracking-tight">Заказ отправлен</h2>
        <p className="mb-[22px] text-[13px] leading-[1.5] font-semibold text-[#6C6A62]">
          {done.restName} получил заказ — обычно отвечают за пару минут. Как только заведение примет заказ,
          вам придёт счёт на Kaspi.
        </p>
        <button
          type="button"
          onClick={() => nav(`/order/${done.order.id}`, { replace: true })}
          className="flex h-[52px] w-full items-center justify-center rounded-[14px] bg-acc text-[15px] font-bold text-white"
        >
          Следить за заказом
        </button>
      </div>
    )
  }

  if (cart.items.length === 0) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-paper px-8 text-center">
        <div className="text-[17px] font-extrabold">Корзина пуста</div>
        <p className="text-[13px] font-medium text-mut">Соберите заказ в меню заведения — и возвращайтесь сюда.</p>
        <Link to="/food" className="mt-2 rounded-full bg-acc-bg px-5 py-2.5 text-[13px] font-bold text-acc-d">К заведениям</Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <div className="flex-1 pb-2">
        <SHead title="Оформление" />

        {/* доставка: адрес и время — редактируемые строки */}
        <section className="mx-4 mb-3 rounded-2xl bg-card px-4 py-[13px] shadow-[0_1px_3px_rgba(20,20,25,.06)]">
          <h6 className="pb-1 text-[13.5px] font-extrabold">Доставка</h6>
          <button
            type="button"
            onClick={() => { setAddrDraft(dlv.address); setSheet('address') }}
            className="flex w-full items-center gap-[11px] py-[9px] text-left text-[13px] font-semibold"
          >
            <Icon id="location" className="size-[18px] flex-none text-acc" />
            <span className="min-w-0 flex-1">
              {dlv.district}, {dlv.address}
              <span className="mt-0.5 block text-[11px] font-medium text-mut">2 подъезд · позвонить у двери</span>
            </span>
            <Icon id="chevron-right" className="size-[13px] flex-none text-[#C5C1B7]" />
          </button>
          <button
            type="button"
            onClick={() => setSheet('time')}
            className="flex w-full items-center gap-[11px] border-t border-soft py-[9px] text-left text-[13px] font-semibold"
          >
            <Icon id="clock" className="size-[18px] flex-none text-acc" />
            <span className="min-w-0 flex-1">
              {when}
              <span className="mt-0.5 block text-[11px] font-medium text-mut">примерно {r?.time.replace('′', ' минут') ?? '30–45 минут'}</span>
            </span>
            <Icon id="chevron-right" className="size-[13px] flex-none text-[#C5C1B7]" />
          </button>
        </section>

        {/* оплата по счёту Kaspi — списания при оформлении нет */}
        <section className="mx-4 mb-3 rounded-2xl bg-card px-4 py-[13px] shadow-[0_1px_3px_rgba(20,20,25,.06)]">
          <h6 className="pb-1 text-[13.5px] font-extrabold">Оплата через Kaspi</h6>
          <button
            type="button"
            onClick={() => { setKaspiDraft(dlv.kaspi); setSheet('kaspi') }}
            className="flex w-full items-center gap-[11px] py-[9px] text-left text-[13px] font-semibold"
          >
            <span className="flex size-[34px] flex-none items-center justify-center rounded-[10px] bg-[#F14635] text-[16px] font-extrabold text-white">K</span>
            <span className="min-w-0 flex-1">
              Номер Kaspi: <b className="num font-bold">{dlv.kaspi}</b>
              <span className="mt-0.5 block text-[11px] font-medium text-mut">на этот номер заведение выставит счёт</span>
            </span>
            <Icon id="chevron-right" className="size-[13px] flex-none text-[#C5C1B7]" />
          </button>
          <div className="flex items-start gap-2 py-1 pb-2 text-[11.5px] leading-[1.45] font-semibold text-mut">
            <Icon id="info" className="mt-px size-3.5 flex-none text-acc" />
            Счёт придёт после того, как заведение примет заказ. Деньги спишутся только когда вы подтвердите перевод в Kaspi.
          </div>
          <button
            type="button"
            onClick={() => setCashNote(!cashNote)}
            className="flex w-full items-center gap-[11px] border-t border-soft py-[9px] text-left text-[13px] font-semibold text-mut"
          >
            <Icon id="cash" className="size-[18px] flex-none" />
            <span className="min-w-0 flex-1">Наличными при получении</span>
            <span className="size-5 flex-none rounded-full border-[1.8px] border-[#D4D0C6]" />
          </button>
          {cashNote && (
            <p className="pb-1 text-[11px] font-semibold text-mut">Пока принимаем только оплату по счёту Kaspi.</p>
          )}
        </section>

        {/* состав и суммы */}
        <section className="mx-4 mb-3 rounded-2xl bg-card px-4 py-[13px] shadow-[0_1px_3px_rgba(20,20,25,.06)]">
          <h6 className="pb-1 text-[13.5px] font-extrabold">Состав · {r?.name ?? cart.restName}</h6>
          {cart.items.map((i) => (
            <div key={i.name} className="flex items-center gap-2.5 border-b border-soft py-2.5">
              <span className="num flex size-6 flex-none items-center justify-center rounded-lg bg-acc-bg text-[11px] font-extrabold text-acc-d">{i.qty}</span>
              <span className="min-w-0 flex-1 text-[13px] font-semibold">{i.name}</span>
              <span className="num text-[13px] font-bold">{fmtT(i.price * i.qty)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2 text-[12.5px] font-semibold text-[#6C6A62]">
            <span>Сумма заказа</span><span className="num">{fmtT(subtotal)}</span>
          </div>
          <div className="flex justify-between pt-2 text-[12.5px] font-semibold text-[#6C6A62]">
            <span>Доставка</span>
            <span className="num">{fee === 0 ? 'бесплатно' : fmtT(fee)}</span>
          </div>
          {r && fee > 0 && (
            <div className="pt-1 text-[11px] font-semibold text-mut">бесплатно от {fmtT(r.freeFrom)}</div>
          )}
          <div className="flex justify-between pt-2.5 text-[15px] font-extrabold">
            <span>Итого</span><span className="num">{fmtT(total)}</span>
          </div>
        </section>

        {err && <p className="px-8 pb-2 text-center text-[12px] font-bold text-danger">{err}</p>}
      </div>

      {/* кнопка «Оформить заказ» — списания в этот момент нет */}
      <div className="sticky bottom-0 border-t border-black/7 bg-card px-4 pt-2.5 pb-[max(env(safe-area-inset-bottom),10px)]">
        <button
          type="button"
          disabled={busy}
          onClick={submit}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-acc text-[14px] font-bold text-white disabled:opacity-60"
        >
          <Icon id="check-circle" className="size-[18px]" />
          {busy ? 'Отправляем…' : <>Оформить заказ · <span className="num">{fmtT(total)}</span></>}
        </button>
      </div>

      {/* шторка адреса: район + адрес */}
      {sheet === 'address' && (
        <Sheet title="Адрес доставки" onClose={() => setSheet('')}>
          <div className="flex gap-1.5 pb-3">
            {DISTRICTS.map((d) => (
              <Chip key={d} on={dlv.district === d} onPress={() => setDlv(setDelivery({ district: d }))}>{d}</Chip>
            ))}
          </div>
          <input
            value={addrDraft}
            onChange={(e) => setAddrDraft(e.target.value)}
            placeholder="Улица, дом, квартира"
            className="w-full rounded-[14px] bg-field px-4 py-[13px] text-[14px] font-medium outline-none placeholder:text-faint"
          />
          <SheetBtn off={!addrDraft.trim()} onPress={() => { setDlv(setDelivery({ address: addrDraft.trim() })); setSheet('') }}>
            Готово
          </SheetBtn>
        </Sheet>
      )}

      {/* шторка времени */}
      {sheet === 'time' && (
        <Sheet title="Когда привезти" onClose={() => setSheet('')}>
          {TIMES.map((t) => (
            <SheetOption key={t} on={when === t} onPress={() => { setWhen(t); setSheet('') }}>{t}</SheetOption>
          ))}
        </Sheet>
      )}

      {/* шторка номера Kaspi для счёта */}
      {sheet === 'kaspi' && (
        <Sheet title="Номер Kaspi" onClose={() => setSheet('')}>
          <input
            value={kaspiDraft}
            onChange={(e) => setKaspiDraft(e.target.value)}
            inputMode="tel"
            placeholder="+7 ___ ___ __ __"
            className="num w-full rounded-[14px] bg-field px-4 py-[13px] text-[15px] font-semibold outline-none placeholder:text-faint"
          />
          <p className="pt-2 text-[11.5px] font-semibold text-mut">На этот номер заведение выставит счёт после принятия заказа.</p>
          <SheetBtn off={kaspiDraft.replace(/\D/g, '').length < 11} onPress={() => { setDlv(setDelivery({ kaspi: kaspiDraft.trim() })); setSheet('') }}>
            Готово
          </SheetBtn>
        </Sheet>
      )}
    </div>
  )
}
