// Экран 3 «Карточка объявления» (эталон: S3). Галерея свайпом со счётчиком «N/M»,
// цена, характеристики с лейблами SECTION_FIELDS, продавец; кнопки — WhatsApp ·
// Позвонить · Поделиться · Сохранить (WhatsApp главная). API: market.get.
import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { api } from '../../api/client'
import { fmtT } from '../../lib/format'
import { SECTION_FIELDS } from '../../lib/sections.gen'
import { useData } from '../../lib/useData'
import type { MockAd } from '../../mocks/db'
import { Icon } from '../../ui/Icon'
import { Photo } from '../../ui/kit'

// Номера продавца в моках нет — контакты демо-продавца
const SELLER_PHONE = '+77051834692'
const SELLER_WA = 'https://wa.me/77051834692'

export default function AdDetail() {
  const nav = useNavigate()
  const { id = '' } = useParams()
  const { data, loading, error } = useData<{ ad: MockAd; fav: boolean }>('market.get', { id })

  const [slide, setSlide] = useState(0)
  const [favLocal, setFavLocal] = useState<boolean | null>(null)
  const galRef = useRef<HTMLDivElement>(null)

  const ad = data?.ad
  const fav = favLocal ?? data?.fav ?? false

  function toggleFav() {
    // optimistic: рисуем сразу, при ошибке откатываем
    setFavLocal(!fav)
    api('favs.toggle', { kind: 'ad', id: Number(id) }).catch(() => setFavLocal(fav))
  }

  function share() {
    const url = location.href
    if (navigator.share) {
      navigator.share({ title: ad?.title, url }).catch(() => undefined)
    } else {
      void navigator.clipboard?.writeText(url)
    }
  }

  const photos = ad?.imageIds ?? []
  // лейблы характеристик — из словаря раздела; неизвестные ключи показываем как есть
  const labelOf = (key: string): string =>
    SECTION_FIELDS[ad?.section ?? '']?.find((f) => f.key === key)?.label ?? key

  return (
    <div className="flex min-h-dvh flex-col bg-card">
      <div className="flex-1">
        {/* галерея: горизонтальный snap-скролл, счётчик, точки, кнопка «назад» */}
        <div className="relative h-[250px]">
          {photos.length > 0 ? (
            <div
              ref={galRef}
              onScroll={() => {
                const el = galRef.current
                if (el) setSlide(Math.round(el.scrollLeft / el.clientWidth))
              }}
              className="flex h-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {photos.map((p) => (
                <Photo key={p} id={p} className="h-full w-full flex-none snap-start" />
              ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center bg-[linear-gradient(140deg,#EFEAE2,#DFD5C4)] text-[#BDB6A8]">
              <Icon id="camera" className="size-9" />
            </div>
          )}
          <button
            type="button"
            aria-label="Назад"
            onClick={() => nav(-1)}
            className="absolute top-3.5 left-4 flex size-[38px] items-center justify-center rounded-full bg-white/94 shadow-[0_1px_3px_rgba(20,20,25,.12)]"
          >
            <Icon id="arrow-left" className="size-[18px]" />
          </button>
          {photos.length > 1 && (
            <>
              <div className="num absolute top-3 right-3 rounded-full bg-[rgba(20,20,25,.55)] px-[9px] py-1 text-[11px] font-bold text-white">
                {slide + 1} / {photos.length}
              </div>
              <div className="absolute right-0 bottom-2.5 left-0 flex justify-center gap-[5px]">
                {photos.map((p, i) => (
                  <i key={p} className={'size-1.5 rounded-full ' + (i === slide ? 'bg-white' : 'bg-white/55')} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* тело карточки поверх фото */}
        <div className="relative -mt-4 rounded-t-[20px] bg-card px-[18px] pt-4 pb-2.5">
          {loading && <div className="h-40 animate-pulse rounded-2xl bg-line/60" />}
          {error && <p className="pt-6 text-center text-[13px] font-semibold text-danger">{error}</p>}
          {ad && (
            <>
              <div className="num text-[24px] font-extrabold tracking-[-0.02em]">{fmtT(ad.price)}</div>
              <div className="mt-1 text-[14.5px] font-semibold text-[#3A3833]">{ad.title}</div>
              <div className="num mt-[3px] text-[12.5px] font-semibold text-mut">
                {ad.subtitle} · {ad.district} · {ad.createdAt}
              </div>
              <Link
                to="/map"
                className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-paper px-[13px] py-2 text-[12px] font-bold"
              >
                <Icon id="location" className="size-3.5 text-acc" />
                Показать на карте
              </Link>

              {/* таблица характеристик из extra */}
              <div className="mt-3.5 border-t border-[#F0EDE6]">
                {Object.entries(ad.extra).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 border-b border-paper py-[9px] text-[13px]">
                    <span className="font-semibold text-mut">{labelOf(k)}</span>
                    <span className="num text-right font-bold">{v}</span>
                  </div>
                ))}
              </div>

              {/* продавец */}
              <div className="flex items-center gap-[11px] pt-[13px] pb-1">
                <span className="flex size-10 items-center justify-center rounded-full bg-[#F0E4D8] text-[14px] font-extrabold text-[#9A6432]">
                  {ad.sellerName}
                </span>
                <span>
                  <span className="block text-[13.5px] font-bold">{ad.sellerSince}</span>
                  <span className="mt-px block text-[11.5px] font-semibold text-mut">на Аудане с июля 2026</span>
                </span>
                <Icon id="chevron-right" className="ml-auto size-4 text-[#C5C1B7]" />
              </div>
            </>
          )}
        </div>
      </div>

      {/* нижняя панель связи */}
      <div className="sticky bottom-0 flex gap-2 border-t border-black/7 bg-card px-4 pt-2.5 pb-[max(env(safe-area-inset-bottom),10px)]">
        <a
          href={SELLER_WA}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-[14px] bg-acc text-[14px] font-bold text-white"
        >
          <Icon id="chat" className="size-[18px]" />
          WhatsApp
        </a>
        <a href={`tel:${SELLER_PHONE}`} aria-label="Позвонить" className="flex size-12 items-center justify-center rounded-[14px] border-[1.5px] border-line text-ink">
          <Icon id="phone" className="size-[19px]" />
        </a>
        <button type="button" aria-label="Поделиться" onClick={share} className="flex size-12 items-center justify-center rounded-[14px] border-[1.5px] border-line text-ink">
          <Icon id="share" className="size-[19px]" />
        </button>
        <button
          type="button"
          aria-label={fav ? 'Убрать из сохранённых' : 'Сохранить'}
          onClick={toggleFav}
          className={'flex size-12 items-center justify-center rounded-[14px] border-[1.5px] border-line ' + (fav ? 'text-[#E23D28]' : 'text-ink')}
        >
          <Icon id={fav ? 'heart-filled' : 'heart'} className="size-[19px]" />
        </button>
      </div>
    </div>
  )
}
