// Отзывы заведения (эталон: S19). Отдельная страница: сводка с процентом и
// распределением по звёздам, отзывы привязаны к заказам («заказ №9»),
// заведение может отвечать. «Написать отзыв» — только после доставленного
// заказа (решение владельца). API: food.get + food.reviews.
import { useState } from 'react'
import { useParams } from 'react-router'
import { useData } from '../../lib/useData'
import { Icon } from '../../ui/Icon'
import { SHead } from '../../ui/SHead'
import type { MockRestaurant } from '../../mocks/db'
import type { FoodOrder } from './flow'
import { Sheet, SheetBtn } from './Sheet'

interface RevCard {
  av: string      // цвет аватарки
  l: string       // буква
  n: string       // имя
  dt: string      // «2 дня назад · заказ №9»
  st: number      // звёзды 1..5
  tx: string
  reply?: string  // ответ заведения
}
interface RevData {
  reviews: { pct?: string; s?: string; bars?: number[]; cards?: RevCard[] } | null
}

const stars = (n: number) => '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n)

export default function Reviews() {
  const { rest = '' } = useParams()
  const { data: restData } = useData<{ restaurant: MockRestaurant }>('food.get', { key: rest })
  const { data, loading } = useData<RevData>('food.reviews', { id: rest })
  const { data: my } = useData<{ orders: FoodOrder[] }>('food.my_orders')

  const [sheet, setSheet] = useState(false)
  const [hint, setHint] = useState(false)
  const [myStars, setMyStars] = useState(5)
  const [myText, setMyText] = useState('')
  const [added, setAdded] = useState<RevCard[]>([])  // локально добавленные отзывы

  const r = restData?.restaurant
  const rv = data?.reviews
  const cards = [...added, ...(rv?.cards ?? [])]
  // отзыв можно оставить, только если есть доставленный заказ этого заведения
  const canReview = (my?.orders ?? []).some((o) => o.restKey === rest && o.status === 'delivered')

  function openWrite() {
    if (canReview) { setSheet(true); setHint(false) }
    else setHint(true)
  }

  function submit() {
    const delivered = (my?.orders ?? []).find((o) => o.restKey === rest && o.status === 'delivered')
    setAdded([{
      av: '#8A57A6',
      l: 'А',
      n: 'Аружан С.',
      dt: 'только что' + (delivered ? ` · заказ №${delivered.seq}` : ''),
      st: myStars,
      tx: myText.trim(),
    }, ...added])
    setSheet(false)
    setMyText('')
  }

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <div className="flex-1 pb-2">
        <SHead title={'Отзывы · ' + (r?.name ?? '')} backTo={`/food/${rest}`} />

        {/* сводка: hero-процент + распределение по звёздам */}
        {rv && (
          <div className="mx-4 mt-0.5 mb-3 flex gap-[18px] rounded-[18px] bg-card px-[18px] py-[17px] shadow-[0_1px_3px_rgba(20,20,25,.06)]">
            <div className="flex-none text-center">
              <div className="num text-[34px] leading-none font-extrabold tracking-tight">{rv.pct}</div>
              <div className="mt-[5px] text-[10.5px] leading-[1.35] font-semibold text-mut">
                {(rv.s ?? '').split(' · ').map((line) => <div key={line}>{line}</div>)}
              </div>
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-[5px]">
              {(rv.bars ?? []).map((w, i) => (
                <div key={i} className="flex items-center gap-2 text-[10.5px] font-bold text-mut">
                  <b className="w-2.5 text-right font-bold">{5 - i}</b>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-[3px] bg-field">
                    <i className="block h-full rounded-[3px] bg-warn" style={{ width: `${w}%` }} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* карточки отзывов */}
        {cards.map((c, i) => (
          <div key={i} className="mx-4 mb-2.5 rounded-2xl bg-card px-[15px] py-3.5 shadow-[0_1px_3px_rgba(20,20,25,.06)]">
            <div className="flex items-center gap-2.5">
              <div
                className="flex size-9 flex-none items-center justify-center rounded-full text-[13.5px] font-extrabold text-white"
                style={{ background: c.av }}
              >
                {c.l}
              </div>
              <div className="min-w-0">
                <div className="text-[13.5px] font-bold">{c.n}</div>
                <div className="num mt-px text-[11px] font-semibold text-faint">{c.dt}</div>
              </div>
              <span className="ml-auto flex-none text-[12px] tracking-[1px] text-warn">{stars(c.st)}</span>
            </div>
            <div className="mt-[9px] text-[13px] leading-[1.5] text-[#3A3833]">{c.tx}</div>
            {c.reply && (
              <div className="mt-2.5 rounded-xl bg-acc-bg px-3 py-2.5">
                <div className="text-[11px] font-extrabold text-acc-d">Ответ {r?.name}</div>
                <div className="mt-1 text-[12px] leading-[1.45] text-[#3A3833]">{c.reply}</div>
              </div>
            )}
          </div>
        ))}
        {loading && Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="mx-4 mb-2.5 h-[96px] animate-pulse rounded-2xl bg-line/60" />
        ))}

        {hint && (
          <p className="px-8 pt-1 pb-2 text-center text-[12px] font-semibold text-mut">
            Отзыв можно оставить после доставленного заказа.
          </p>
        )}
      </div>

      {/* кнопка снизу */}
      <div className="sticky bottom-0 border-t border-black/7 bg-card px-4 pt-2.5 pb-[max(env(safe-area-inset-bottom),10px)]">
        <button
          type="button"
          onClick={openWrite}
          className={
            'flex h-12 w-full items-center justify-center gap-2 rounded-[14px] text-[14px] font-bold text-white ' +
            (canReview ? 'bg-acc' : 'bg-[#DDD9D0]')
          }
        >
          <Icon id="star-filled" className="size-[18px]" />
          Написать отзыв
        </button>
      </div>

      {/* шторка написания отзыва */}
      {sheet && (
        <Sheet title="Ваш отзыв" onClose={() => setSheet(false)}>
          <div className="flex justify-center gap-1.5 py-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" aria-label={`${n} звёзд`} onClick={() => setMyStars(n)}>
                <Icon id="star-filled" className={'size-7 ' + (n <= myStars ? 'text-warn' : 'text-line')} />
              </button>
            ))}
          </div>
          <textarea
            value={myText}
            onChange={(e) => setMyText(e.target.value)}
            placeholder="Что понравилось, что привезли, как быстро?"
            className="min-h-[96px] w-full resize-none rounded-[14px] bg-field px-4 py-3 text-[14px] font-medium outline-none placeholder:text-faint"
          />
          <SheetBtn off={!myText.trim()} onPress={submit}>Отправить</SheetBtn>
        </Sheet>
      )}
    </div>
  )
}
