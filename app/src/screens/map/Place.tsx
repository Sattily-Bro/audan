// Экран 9б «Объект карты — страница» (эталон: S20, deep-link obj.php → /place/{id}).
// Фото-галерея, статус с графиком, рейтинг → отзывы, адрес с мини-картой и маршрутом,
// чипы возможностей; внизу — WhatsApp · звонок · поделиться · сердце (favs.toggle).
import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { api } from '../../api/client'
import { useData } from '../../lib/useData'
import type { MockPlace } from '../../mocks/db'
import { Icon } from '../../ui/Icon'
import { Photo } from '../../ui/kit'
import { ReviewCard, routeHref, telHref, waHref } from './shared'

const NOSCROLL = ' [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'

export default function Place() {
  const nav = useNavigate()
  const { id } = useParams()
  const { data, loading, error } = useData<{ place: MockPlace; fav: boolean }>('bizmap.get', { id: Number(id) })
  const p = data?.place

  const [gi, setGi] = useState(0)
  const [schedOpen, setSchedOpen] = useState(false)
  const [favOv, setFavOv] = useState<boolean | null>(null)
  const [copied, setCopied] = useState(false)
  const revRef = useRef<HTMLDivElement>(null)
  const fav = favOv ?? data?.fav ?? false

  async function toggleFav() {
    if (!p) return
    const r = await api<{ on: boolean }>('favs.toggle', { kind: 'place', id: p.id })
    setFavOv(r.on)
  }
  async function share() {
    if (!p) return
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: p.name, url })
      else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 1600)
      }
    } catch { /* отменили шаринг — ничего не делаем */ }
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-card">
        <div className="h-[218px] animate-pulse bg-line/60" />
        <div className="p-[18px]">
          <div className="h-6 w-2/3 animate-pulse rounded-lg bg-line/60" />
          <div className="mt-3 h-4 w-1/2 animate-pulse rounded-lg bg-line/60" />
        </div>
      </div>
    )
  }
  if (!p) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-paper px-8 text-center">
        <div className="text-[17px] font-extrabold">Объект не найден</div>
        <p className="m-0 text-[13px] font-medium text-mut">{error || 'Возможно, место сняли с карты.'}</p>
        <button type="button" onClick={() => nav('/map')} className="mt-2 rounded-full bg-acc-bg px-5 py-2.5 text-[13px] font-bold text-acc-d">
          К карте
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-card">
      <div className="flex-1">
        {/* галерея */}
        <div className="relative h-[218px]">
          <div
            onScroll={(e) => {
              const el = e.currentTarget
              setGi(Math.round(el.scrollLeft / el.clientWidth))
            }}
            className={'flex h-full snap-x snap-mandatory overflow-x-auto' + NOSCROLL}
          >
            {p.imageIds.map((imgId) => (
              <Photo key={imgId} id={imgId} className="h-full w-full flex-none snap-start" />
            ))}
          </div>
          <button
            type="button"
            aria-label="Назад"
            onClick={() => nav(-1)}
            className="absolute top-3.5 left-4 flex size-[38px] items-center justify-center rounded-full bg-white/95 shadow-[0_1px_3px_rgba(20,20,25,.12)]"
          >
            <Icon id="arrow-left" className="size-[17px]" />
          </button>
          <span className="num absolute top-3 right-3 rounded-full bg-[rgba(20,20,25,.55)] px-2.5 py-1 text-[11px] font-bold text-white">
            {gi + 1} / {p.imageIds.length}
          </span>
          <span className="absolute inset-x-0 bottom-2.5 flex justify-center gap-[5px]">
            {p.imageIds.map((imgId, i) => (
              <i key={imgId} className={'size-1.5 rounded-full ' + (i === gi ? 'bg-white' : 'bg-white/55')} />
            ))}
          </span>
        </div>

        <div className="relative -mt-4 rounded-t-[20px] bg-card px-[18px] pt-4 pb-2.5">
          <div className="text-[21px] font-extrabold tracking-tight">{p.name}</div>
          <div className="mt-[3px] text-[12.5px] font-medium text-mut">{p.sub}</div>

          {/* статус и график */}
          <button type="button" onClick={() => setSchedOpen(!schedOpen)} className="mt-2.5 flex items-center gap-[7px] text-left text-[13px] font-bold">
            <span className="size-2 flex-none rounded-full" style={{ background: p.open ? '#1E8A4C' : '#C5C1B7' }} />
            <span style={{ color: p.open ? '#1E8A4C' : '#8B887F' }}>{p.open ? 'Открыто' : 'Закрыто'}</span>
            <span className="font-semibold text-mut">· {p.hours} · график {schedOpen ? '▴' : '▾'}</span>
          </button>
          {schedOpen && (
            <div className="mt-2 rounded-xl bg-paper px-3.5 py-2.5 text-[12.5px] font-semibold text-[#3A3833]">
              {p.h24 ? 'Ежедневно · круглосуточно' : `Ежедневно · ${p.hours}`}
            </div>
          )}

          {/* рейтинг → отзывы */}
          <button
            type="button"
            onClick={() => revRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="mt-3 flex w-full items-center gap-2 rounded-[13px] bg-paper px-[13px] py-[11px] text-left"
          >
            <Icon id="star-filled" className="size-4 flex-none text-warn" />
            <b className="text-[14px] font-extrabold">{p.rating}</b>
            <span className="num text-[12px] font-bold text-mut">{p.reviews} отзывов · читать</span>
            <Icon id="chevron-right" className="ml-auto size-3.5 flex-none text-[#C5C1B7]" />
          </button>

          {/* адрес с мини-картой */}
          <div className="mt-3.5 flex items-center gap-3">
            <div className="relative h-[76px] w-24 flex-none overflow-hidden rounded-xl">
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
              className="flex-none rounded-[10px] bg-acc-bg px-[13px] py-[9px] text-[12px] font-bold text-acc-d"
            >
              Маршрут
            </a>
          </div>

          {/* возможности */}
          <div className="mt-3.5 flex flex-wrap gap-[7px]">
            {p.feat.map((ft) => (
              <i key={ft} className="rounded-full bg-soft px-3 py-1.5 text-[11.5px] font-semibold text-[#3A3833] not-italic">{ft}</i>
            ))}
          </div>

          {/* отзывы */}
          <div ref={revRef} className="flex items-baseline justify-between pt-5 pb-2.5">
            <h4 className="m-0 text-[15.5px] font-bold tracking-tight">Отзывы</h4>
            <span className="num text-[11.5px] font-medium text-mut">{p.reviews}</span>
          </div>
          {p.reviewCards.map((r, i) => (
            <ReviewCard key={r.name + r.when} r={r} i={i} className="mb-2.5 bg-paper shadow-none" />
          ))}
        </div>
      </div>

      {/* низ: связь, как на карточке объявления */}
      <div className="sticky bottom-0 flex gap-2 border-t border-black/7 bg-card px-4 pt-2.5 pb-[max(env(safe-area-inset-bottom),10px)]">
        <a
          href={waHref(p.phone)}
          target="_blank"
          rel="noreferrer"
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-[14px] bg-acc text-[14px] font-bold text-white"
        >
          <Icon id="chat" className="size-[18px]" />
          WhatsApp
        </a>
        <a href={telHref(p.phone)} aria-label="Позвонить" className="flex size-12 items-center justify-center rounded-[14px] border-[1.5px] border-line text-ink">
          <Icon id="phone" className="size-[19px]" />
        </a>
        <button type="button" aria-label="Поделиться" onClick={() => void share()} className="flex size-12 items-center justify-center rounded-[14px] border-[1.5px] border-line text-ink">
          <Icon id={copied ? 'check' : 'share'} className="size-[19px]" />
        </button>
        <button
          type="button"
          aria-label={fav ? 'Убрать из сохранённых' : 'В сохранённые'}
          onClick={() => void toggleFav()}
          className={'flex size-12 items-center justify-center rounded-[14px] border-[1.5px] ' + (fav ? 'border-acc bg-acc-bg text-acc' : 'border-line text-ink')}
        >
          <Icon id={fav ? 'heart-filled' : 'heart'} className="size-[19px]" />
        </button>
      </div>
    </div>
  )
}
