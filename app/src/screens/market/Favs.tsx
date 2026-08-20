// Экран 33 «Сохранённые» (эталон: S32). Сегменты «Объявления» и «Места»;
// сердце убирает из списка сразу (optimistic + favs.toggle). API: favs.list.
import { useState } from 'react'
import { Link } from 'react-router'
import { api } from '../../api/client'
import { useData } from '../../lib/useData'
import type { MockAd, MockPlace } from '../../mocks/db'
import { Icon } from '../../ui/Icon'
import { Photo } from '../../ui/kit'
import { SHead } from '../../ui/SHead'
import { HOME_TABS, TabBar } from '../../ui/TabBar'
import { AdRow } from './AdRow'

type Seg = 'ads' | 'places'

export default function Favs() {
  const { data, loading, error } = useData<{ ads: MockAd[]; places: MockPlace[] }>('favs.list')
  const [seg, setSeg] = useState<Seg>('ads')
  const [removed, setRemoved] = useState<ReadonlySet<string>>(new Set())

  // сердце убирает карточку сразу; при ошибке API возвращаем обратно
  function remove(kind: 'ad' | 'place', id: number) {
    const key = `${kind}:${id}`
    const flip = () => setRemoved((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
    flip()
    api('favs.toggle', { kind, id }).catch(flip)
  }

  const ads = (data?.ads ?? []).filter((a) => !removed.has(`ad:${a.id}`))
  const places = (data?.places ?? []).filter((p) => !removed.has(`place:${p.id}`))

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <div className="flex-1 pb-2">
        <SHead title="Сохранённые" />

        {/* сегменты (эталон .seg) */}
        <div className="mx-4 mb-3.5 flex rounded-[13px] bg-[#EAE7DF] p-[3px]">
          {([['ads', 'Объявления'], ['places', 'Места']] as [Seg, string][]).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setSeg(k)}
              className={
                'flex-1 rounded-[10px] py-[9px] text-center text-[12.5px] font-bold ' +
                (seg === k ? 'bg-card text-ink shadow-[0_1px_3px_rgba(20,20,25,.10)]' : 'text-[#6C6A62]')
              }
            >
              {label}
            </button>
          ))}
        </div>

        {loading && Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="mx-4 mb-2 h-[107px] animate-pulse rounded-2xl bg-line/60" />
        ))}
        {error && <p className="px-8 pt-14 text-center text-[13px] font-semibold text-danger">{error}</p>}

        {seg === 'ads' && !loading && !error && (
          ads.length > 0 ? (
            ads.map((a) => <AdRow key={a.id} ad={a} fav onFav={() => remove('ad', a.id)} />)
          ) : (
            <div className="px-8 pt-16 text-center">
              <p className="text-[15px] font-bold">Здесь пока пусто</p>
              <p className="mt-1.5 text-[12.5px] font-medium text-mut">
                Нажимайте сердце в объявлениях — они соберутся в этот список.
              </p>
              <Link
                to="/market"
                className="mx-auto mt-5 inline-flex h-12 items-center justify-center rounded-[14px] bg-acc px-6 text-[14px] font-bold text-white"
              >
                К объявлениям
              </Link>
            </div>
          )
        )}

        {seg === 'places' && !loading && !error && (
          places.length > 0 ? (
            places.map((p) => <PlaceRow key={p.id} place={p} onRemove={() => remove('place', p.id)} />)
          ) : (
            <div className="px-8 pt-16 text-center">
              <p className="text-[15px] font-bold">Мест пока нет</p>
              <p className="mt-1.5 text-[12.5px] font-medium text-mut">
                Сердце в карточке места на карте положит его сюда.
              </p>
              <Link
                to="/map"
                className="mx-auto mt-5 inline-flex h-12 items-center justify-center rounded-[14px] bg-acc px-6 text-[14px] font-bold text-white"
              >
                Открыть карту
              </Link>
            </div>
          )
        )}
      </div>

      <TabBar items={HOME_TABS} />
    </div>
  )
}

/** Карточка места попроще: фото + имя + подстрока, сердце убирает из списка */
function PlaceRow({ place, onRemove }: { place: MockPlace; onRemove: () => void }) {
  return (
    <Link
      to={`/place/${place.id}`}
      className="mx-4 mb-2 flex gap-[11px] rounded-2xl bg-card p-2.5 shadow-[0_1px_3px_rgba(20,20,25,.06)]"
    >
      {place.imageIds.length > 0 ? (
        <Photo id={place.imageIds[0]} className="h-[86px] w-[104px] flex-none rounded-[11px]" />
      ) : (
        <span className="flex h-[86px] w-[104px] flex-none items-center justify-center rounded-[11px] bg-[linear-gradient(140deg,#EFEAE2,#DFD5C4)] text-[#BDB6A8]">
          <Icon id="store" className="size-6" />
        </span>
      )}
      <span className="min-w-0 flex-1 pt-1">
        <span className="flex items-baseline gap-2">
          <span className="min-w-0 flex-1 truncate text-[14.5px] font-bold tracking-tight">{place.name}</span>
          <span className="num flex flex-none items-center gap-[3px] text-[12.5px] font-extrabold">
            <Icon id="star-filled" className="size-[13px] text-warn" />
            {place.rating}
          </span>
        </span>
        <span className="mt-0.5 block truncate text-[11.5px] font-semibold text-mut">{place.sub}</span>
        <span className="mt-[5px] flex items-center gap-1.5 text-[11.5px] font-bold">
          <i className={'size-[7px] flex-none rounded-full ' + (place.open ? 'bg-ok' : 'bg-[#8B887F]')} />
          <span className={place.open ? 'text-ok' : 'text-mut'}>{place.open ? 'Открыто' : 'Закрыто'}</span>
          <span className="num ml-auto text-[10.5px] font-semibold text-faint">{place.far}</span>
        </span>
      </span>
      <button
        type="button"
        aria-label="Убрать из сохранённых"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove() }}
        className="self-start p-0.5 text-[#E23D28]"
      >
        <Icon id="heart-filled" className="size-[18px]" />
      </button>
    </Link>
  )
}
