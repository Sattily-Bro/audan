// Кабинет заведения (эталон: S17): заказы по срочности с таймерами, сегменты
// Новые · Ждут оплаты · Готовятся · У курьера, тумблер «Принимаем заказы».
// Статусы гоняются по флоу Kaspi-счёта (HANDOFF §6):
// pending → accepted → paid → preparing → courier → delivered.
import { useEffect, useRef, useState } from 'react'
import { api, ApiError } from '../../api/client'
import type { FoodOrderStatus } from '../../api/types'
import { fmtT } from '../../lib/format'
import { useData } from '../../lib/useData'
import { Icon } from '../../ui/Icon'
import { SHead } from '../../ui/SHead'

interface OwnerOrder {
  id: number
  seq: number
  status: FoodOrderStatus
  items: { id: string; name: string; price: number; qty: number }[]
  subtotal: number
  delivery_fee: number
  total: number
  kaspi: string
  district: string
  address: string
  customer_name: string
  customer_phone: string
}
interface OwnerData { orders: OwnerOrder[]; open: boolean }

type Seg = 'new' | 'wait' | 'cook' | 'way' | 'all'
const SEGS: { key: Seg; label: string }[] = [
  { key: 'new', label: 'Новые' },
  { key: 'wait', label: 'Ждут оплаты' },
  { key: 'cook', label: 'Готовятся' },
  { key: 'way', label: 'У курьера' },
  { key: 'all', label: 'Все' },
]

function segOf(s: FoodOrderStatus): Seg | null {
  if (s === 'pending') return 'new'
  if (s === 'accepted') return 'wait'
  if (s === 'paid' || s === 'preparing') return 'cook'
  if (s === 'courier') return 'way'
  return null // delivered / cancelled — из операционного списка уходят
}

const SEG_RANK: Record<Seg, number> = { new: 0, wait: 1, cook: 2, way: 3, all: 9 }
const BAR: Record<Seg, string> = { new: '#E8A317', wait: '#F14635', cook: 'var(--acc)', way: '#8B887F', all: '' }

/** Следующий шаг флоу: подпись кнопки и целевой статус */
const NEXT: Partial<Record<FoodOrderStatus, { label: string; to: FoodOrderStatus; icon?: string }>> = {
  pending: { label: 'Принять', to: 'accepted' },
  accepted: { label: 'Оплата пришла', to: 'paid', icon: 'tenge' },
  paid: { label: 'Готовим', to: 'preparing' },
  preparing: { label: 'Передать курьеру', to: 'courier', icon: 'courier' },
  courier: { label: 'Доставлен', to: 'delivered' },
}

function maskPhone(p: string): string {
  const d = p.replace(/\D/g, '')
  if (d.length < 11) return '+' + d
  return `+7 ${d.slice(1, 4)} ••• ${d.slice(7, 9)} ${d.slice(9, 11)}`
}

function mmss(sec: number): string {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
}

function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10, m100 = n % 100
  if (m10 === 1 && m100 !== 11) return one
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few
  return many
}

const SPARK = [18, 26, 14, 38, 52, 44, 30, 46, 62, 78, 100, 66]

export default function Owner() {
  const { data, loading, reload } = useData<OwnerData>('owner.orders')
  const [seg, setSeg] = useState<Seg>('new')
  const [open, setOpen] = useState(true)
  const [busyId, setBusyId] = useState(0)
  const [error, setError] = useState('')
  const [, setTick] = useState(0)
  const seenAt = useRef(new Map<number, number>())

  useEffect(() => {
    if (data) setOpen(data.open)
  }, [data])

  // секундный тик для таймеров ожидания
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const active = (data?.orders ?? []).filter((o) => segOf(o.status) !== null)
  const now = Date.now()
  for (const o of active) {
    if (!seenAt.current.has(o.id)) seenAt.current.set(o.id, now)
  }
  const waitSec = (o: OwnerOrder) => Math.floor((now - (seenAt.current.get(o.id) ?? now)) / 1000)

  const counts: Record<Seg, number> = { new: 0, wait: 0, cook: 0, way: 0, all: active.length }
  for (const o of active) counts[segOf(o.status)!]++

  const shown = active
    .filter((o) => seg === 'all' || segOf(o.status) === seg)
    .sort((a, b) => SEG_RANK[segOf(a.status)!] - SEG_RANK[segOf(b.status)!] || a.id - b.id)

  const oldestWait = active
    .filter((o) => o.status === 'pending')
    .reduce((m, o) => Math.max(m, waitSec(o)), 0)

  async function toggleOpen() {
    const next = !open
    setOpen(next) // оптимистично — тумблер должен отвечать мгновенно
    try {
      const r = await api<{ open: boolean }>('owner.toggle_open', { open: next })
      setOpen(r.open)
    } catch {
      setOpen(!next)
    }
  }

  async function setStatus(o: OwnerOrder, to: FoodOrderStatus) {
    if (busyId) return
    setBusyId(o.id)
    setError('')
    try {
      await api('owner.set_status', { id: o.id, status: to })
      reload()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Нет связи — попробуйте ещё раз')
    } finally {
      setBusyId(0)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-paper pb-6">
      <SHead
        title="Шу-Пюре"
        backTo="/profile"
        actions={
          <button
            type="button"
            role="switch"
            aria-checked={open}
            aria-label="Принимаем заказы"
            onClick={() => void toggleOpen()}
            className={
              'relative h-[29px] w-[50px] flex-none rounded-full shadow-[inset_0_1px_3px_rgba(0,0,0,.15)] transition-colors ' +
              (open ? 'bg-ok' : 'bg-[#CFCBC1]')
            }
          >
            <i
              className={
                'absolute top-[2.5px] size-6 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.25)] transition-all ' +
                (open ? 'left-[23.5px]' : 'left-[2.5px]')
              }
            />
          </button>
        }
      />
      <div className={'-mt-1.5 flex items-center justify-center gap-1.5 px-4 pb-3 text-[11.5px] font-bold ' + (open ? 'text-ok' : 'text-danger')}>
        <i className={'size-[7px] rounded-full ' + (open ? 'bg-ok' : 'bg-danger')} />
        {open ? 'Принимаем заказы · до 22:00' : 'Приём заказов приостановлен'}
      </div>

      {/* «N заказов ждут ответа» */}
      {counts.new > 0 && (
        <div className="mx-4 mb-3.5 flex items-center gap-[13px] rounded-[18px] bg-ink px-[17px] py-[15px] text-white">
          <span className="flex size-[38px] flex-none items-center justify-center rounded-full bg-[rgba(255,209,102,.16)]">
            <i className="size-[11px] rounded-full bg-[#FFD166] shadow-[0_0_0_5px_rgba(255,209,102,.22)]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14.5px] font-extrabold tracking-tight">
              {counts.new} {plural(counts.new, 'заказ ждёт', 'заказа ждут', 'заказов ждут')} ответа
            </span>
            <span className="mt-[3px] block text-[11.5px] font-semibold text-[#B3AFA5]">
              Самый ранний ждёт <b className="num font-extrabold text-[#FFD166]">{mmss(oldestWait)}</b> — клиент видит таймер
            </span>
          </span>
          <button
            type="button"
            onClick={() => setSeg('new')}
            className="flex-none rounded-[10px] bg-white px-[13px] py-[9px] text-[12px] font-extrabold text-ink"
          >
            К ним
          </button>
        </div>
      )}

      {/* выручка */}
      <div className="mx-4 mb-3 rounded-[18px] bg-card px-[17px] pt-[15px] pb-3 shadow-[0_1px_3px_rgba(20,20,25,.06)]">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11.5px] font-bold text-mut">Выручка сегодня</div>
            <div className="num mt-0.5 text-[26px] font-extrabold tracking-tight">48 700 ₸</div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#E6F4EB] px-[9px] py-1 text-[11.5px] font-extrabold text-ok">
            ▲ 18% ко вчера
          </span>
        </div>
        <div className="mt-3 flex h-[38px] items-end gap-[3px]">
          {SPARK.map((h, i) => (
            <i
              key={i}
              className={'flex-1 rounded-t-[2px] ' + (i >= SPARK.length - 2 ? 'bg-acc' : 'bg-[#EAE7DF]')}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <div className="mt-[5px] flex justify-between text-[9.5px] font-bold text-faint">
          <span>10:00</span><span>14:00</span><span>18:00</span><span>сейчас</span>
        </div>
      </div>
      <div className="mx-4 mb-3.5 flex gap-2">
        {[['12', 'заказов за день'], ['4 058 ₸', 'средний чек'], ['92%', 'принято вовремя']].map(([a, b]) => (
          <div key={b} className="flex-1 rounded-[14px] bg-card px-[13px] py-[11px] shadow-[0_1px_3px_rgba(20,20,25,.05)]">
            <div className="num text-[15px] font-extrabold tracking-tight">{a}</div>
            <div className="mt-0.5 text-[10px] font-bold text-mut">{b}</div>
          </div>
        ))}
      </div>

      {/* сегменты */}
      <div className="mb-3 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SEGS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSeg(s.key)}
            className={
              'flex flex-none items-center gap-1.5 rounded-full px-3.5 py-[9px] text-[12.5px] font-bold whitespace-nowrap ' +
              (seg === s.key ? 'bg-ink text-white' : 'bg-card text-[#3A3833] shadow-[0_1px_3px_rgba(20,20,25,.05)]')
            }
          >
            {s.label}
            <b
              className={
                'num rounded-full px-[7px] py-px text-[11px] font-extrabold ' +
                (seg === s.key
                  ? 'bg-white/20 text-white'
                  : s.key === 'new' && counts.new > 0
                    ? 'bg-[#FFF0CC] text-[#8A6410]'
                    : 'bg-field text-[#6C6A62]')
              }
            >
              {counts[s.key]}
            </b>
          </button>
        ))}
      </div>

      {error && <p className="px-5 pb-2 text-[12.5px] font-semibold text-danger">{error}</p>}

      {/* заказы */}
      {shown.map((o) => (
        <OrderCard key={o.id} o={o} waitSec={waitSec(o)} busy={busyId === o.id} onStatus={(to) => void setStatus(o, to)} />
      ))}

      {!loading && active.length === 0 && (
        <div className="mx-4 rounded-[18px] bg-card px-6 py-8 text-center shadow-[0_1px_3px_rgba(20,20,25,.06)]">
          <div className="text-[14.5px] font-extrabold">Пока нет заказов</div>
          <p className="mt-1.5 text-[12.5px] leading-[1.5] font-medium text-mut">
            Новые заказы появятся здесь сразу после оформления — с таймером ожидания клиента.
          </p>
        </div>
      )}
      {!loading && active.length > 0 && shown.length === 0 && (
        <p className="px-5 py-6 text-center text-[12.5px] font-semibold text-mut">В этой колонке пусто</p>
      )}
      {loading && <div className="mx-4 h-[150px] animate-pulse rounded-[18px] bg-line/60" />}
    </div>
  )
}

function OrderCard({ o, waitSec, busy, onStatus }: {
  o: OwnerOrder
  waitSec: number
  busy: boolean
  onStatus: (to: FoodOrderStatus) => void
}) {
  const sg = segOf(o.status)!
  const next = NEXT[o.status]
  const at = new Date(Date.now() - waitSec * 1000)
  const atStr = `${at.getHours()}:${String(at.getMinutes()).padStart(2, '0')}`
  const nPos = o.items.length

  let timer: { cls: string; icon?: string; text: string }
  if (o.status === 'pending') {
    timer = waitSec >= 120
      ? { cls: 'bg-[#FBE5E1] text-[#B03A2A]', icon: 'bell', text: `ждёт ${mmss(waitSec)}` }
      : { cls: 'bg-[#FFF0CC] text-[#8A6410]', icon: 'bell', text: `ждёт ${mmss(waitSec)}` }
  } else if (o.status === 'accepted') {
    timer = { cls: 'bg-[#FFF0CC] text-[#8A6410]', icon: 'clock', text: 'ждёт оплаты' }
  } else if (o.status === 'paid' || o.status === 'preparing') {
    timer = { cls: 'bg-field text-[#6C6A62]', icon: 'clock', text: `${Math.max(1, Math.floor(waitSec / 60))} мин на кухне` }
  } else {
    timer = { cls: 'bg-field text-[#6C6A62]', text: 'в пути' }
  }

  const paid = o.status === 'paid' || o.status === 'preparing' || o.status === 'courier'

  return (
    <div className="mx-4 mb-2.5 flex overflow-hidden rounded-[18px] bg-card shadow-[0_1px_3px_rgba(20,20,25,.06)]">
      <div className="w-1 flex-none" style={{ background: BAR[sg] }} />
      <div className="flex min-w-0 flex-1 flex-col gap-[9px] py-[13px] pr-3.5 pl-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="num flex-none text-[15px] font-extrabold tracking-tight">№{o.seq}</span>
          <span className="num flex-none text-[11.5px] font-semibold text-mut">{atStr}</span>
          <span className={'num ml-auto inline-flex flex-none items-center gap-[5px] rounded-full px-2.5 py-1 text-[11.5px] font-extrabold whitespace-nowrap ' + timer.cls}>
            {timer.icon && <Icon id={timer.icon} className="size-3 flex-none" />}
            {timer.text}
          </span>
        </div>

        <div className="-mt-[3px] min-w-0 truncate text-[12.5px] font-bold text-[#3A3833]">
          {o.customer_name} <span className="num font-semibold text-mut">· {maskPhone(o.customer_phone)}</span>
        </div>

        {(o.district || o.address) && (
          <div className="flex min-w-0 items-start gap-1.5 rounded-[10px] bg-acc-bg px-2.5 py-[7px] text-[11.5px] leading-[1.35] font-bold text-acc-d">
            <Icon id="location" className="mt-px size-[13px] flex-none" />
            Доставка · {[o.district, o.address].filter(Boolean).join(', ')}
          </div>
        )}

        <div className="flex flex-col gap-[3px]">
          {o.items.slice(0, 3).map((it) => (
            <div key={it.id} className="flex min-w-0 items-baseline gap-[9px] text-[12.5px]">
              <span className="num w-6 flex-none font-extrabold text-acc-d">{it.qty}×</span>
              <span className="min-w-0 flex-1 leading-[1.35] font-semibold text-[#3A3833]">{it.name}</span>
            </div>
          ))}
          {o.items.length > 3 && (
            <div className="pl-[33px] text-[11.5px] font-bold text-mut">
              и ещё {o.items.length - 3} {plural(o.items.length - 3, 'позиция', 'позиции', 'позиций')}
            </div>
          )}
        </div>

        <div className="mt-px flex items-baseline gap-[9px] border-t border-soft pt-2.5">
          <span className="num flex-none text-[17px] font-extrabold tracking-tight whitespace-nowrap">{fmtT(o.total)}</span>
          {paid ? (
            <span className="flex-none rounded-[7px] bg-[#E6F4EB] px-[7px] py-[3px] text-[10px] font-extrabold text-ok whitespace-nowrap">Kaspi оплачен</span>
          ) : o.status === 'accepted' ? (
            <span className="flex-none rounded-[7px] bg-[#FFF0CC] px-[7px] py-[3px] text-[10px] font-extrabold text-[#8A6410] whitespace-nowrap">счёт выставлен</span>
          ) : null}
          <span className="num ml-auto flex-none text-[11px] font-semibold text-faint whitespace-nowrap">
            {nPos} {plural(nPos, 'позиция', 'позиции', 'позиций')}
          </span>
        </div>

        {next && (
          <div className={'grid gap-2 ' + (o.status === 'pending' ? 'grid-cols-[1fr_1.5fr]' : 'grid-cols-1')}>
            {o.status === 'pending' && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onStatus('cancelled')}
                className="flex h-11 min-w-0 items-center justify-center rounded-xl border-[1.5px] border-line bg-card text-[13px] font-extrabold text-[#3A3833] disabled:opacity-50"
              >
                Отклонить
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => onStatus(next.to)}
              className={
                'flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-xl text-[13px] font-extrabold text-white disabled:opacity-50 ' +
                (o.status === 'pending' ? 'bg-acc shadow-[0_2px_8px_rgba(var(--acc-rgb),.28)]' : 'bg-ink')
              }
            >
              {next.icon && <Icon id={next.icon} className="size-4 flex-none" />}
              {busy ? '…' : next.label}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
