// Экран 9а «Карта — список объектов» (эталон: S12). Те же данные bizmap.list
// вертикальным списком карточек; чипы категорий и быстрых фильтров;
// FAB «Показать картой» возвращает на /map. Карточка → /place/{id}.
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useData } from '../../lib/useData'
import type { MockPlace } from '../../mocks/db'
import { Icon } from '../../ui/Icon'
import { Chip, Photo } from '../../ui/kit'
import { SHead, HeadAction } from '../../ui/SHead'
import { TabBar } from '../../ui/TabBar'
import { CAT_ORDER, LIST_TABS, MCATS, openLabel } from './shared'

const NOSCROLL = ' [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'

export default function MapList() {
  const nav = useNavigate()
  const { data, loading } = useData<{ places: MockPlace[] }>('bizmap.list')
  const places = useMemo(() => data?.places ?? [], [data])

  const [cat, setCat] = useState('all')
  const [f, setF] = useState({ open: false, del: false, h24: false })

  const shown = places.filter((p) =>
    (cat === 'all' || p.categoryKey === cat) &&
    (!f.open || p.open) &&
    (!f.del || p.delivery) &&
    (!f.h24 || p.h24),
  )
  const anyF = f.open || f.del || f.h24

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <div className="flex-1 pb-24">
        <div className="flex justify-center pt-2 pb-0.5">
          <i className="h-1 w-10 rounded-sm bg-line" />
        </div>
        <SHead
          title="Места в Шу"
          backTo="/map"
          actions={<HeadAction icon="search" label="Поиск по карте" onPress={() => nav('/map')} />}
        />

        {/* категории */}
        <div className={'flex gap-2 overflow-x-auto px-4 pb-3' + NOSCROLL}>
          <Chip on={cat === 'all'} onPress={() => setCat('all')}>
            {data ? `Все ${places.length}` : 'Все'}
          </Chip>
          {CAT_ORDER.map((k) => (
            <Chip key={k} on={cat === k} onPress={() => setCat(cat === k ? 'all' : k)}>{MCATS[k]}</Chip>
          ))}
        </div>
        {/* быстрые фильтры */}
        <div className={'flex gap-2 overflow-x-auto px-4 pb-2' + NOSCROLL}>
          <Chip ghost on={f.open} onPress={() => setF((x) => ({ ...x, open: !x.open }))}>Открыто сейчас</Chip>
          <Chip ghost on={f.del} onPress={() => setF((x) => ({ ...x, del: !x.del }))}>Доставка</Chip>
          <Chip ghost on={f.h24} onPress={() => setF((x) => ({ ...x, h24: !x.h24 }))}>Круглосуточно</Chip>
        </div>

        {loading && Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="mx-4 mb-2.5 h-[170px] animate-pulse rounded-2xl bg-line/60" />
        ))}
        {!loading && !shown.length && (
          <div className="px-8 py-[26px] text-center text-[12.5px] leading-relaxed font-semibold text-mut">
            {anyF ? 'По фильтрам ничего нет — снимите один из них' : 'Ничего не нашли — попробуйте изменить запрос'}
          </div>
        )}
        {shown.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => nav(`/place/${p.id}`)}
            className="mx-4 mb-2.5 block w-[calc(100%-32px)] rounded-2xl bg-card p-2.5 pb-[11px] text-left shadow-[0_1px_3px_rgba(20,20,25,.06)]"
          >
            <span className={'flex gap-1.5 overflow-x-auto' + NOSCROLL}>
              {p.imageIds.slice(0, 3).map((id) => (
                <Photo key={id} id={id} className="h-[94px] w-[138px] flex-none rounded-[11px]" />
              ))}
            </span>
            <span className="block px-[5px] pt-2.5">
              <span className="flex items-baseline gap-2">
                <span className="min-w-0 flex-1 truncate text-[14.5px] font-bold tracking-tight">{p.name}</span>
                <span className="flex flex-none items-center gap-[3px] text-[12.5px] font-extrabold">
                  <Icon id="star-filled" className="size-[13px] text-warn" />
                  {p.rating}
                </span>
              </span>
              <span className="mt-0.5 block text-[11.5px] font-semibold text-mut">{p.sub}</span>
              <span className="mt-[5px] flex items-center gap-1.5 text-[11.5px] font-semibold">
                <span className="size-[7px] flex-none rounded-full" style={{ background: p.open ? '#1E8A4C' : '#C5C1B7' }} />
                <span style={{ color: p.open ? '#1E8A4C' : '#8B887F' }}>{openLabel(p)}</span>
                <span className="num ml-auto text-[10.5px] font-semibold text-faint">{p.far}</span>
              </span>
            </span>
          </button>
        ))}
      </div>

      {/* FAB — переключение режимов, а не отдельный раздел */}
      <button
        type="button"
        onClick={() => nav('/map')}
        className="fixed bottom-[86px] left-1/2 z-[6] flex -translate-x-1/2 items-center gap-[7px] rounded-full bg-ink px-[18px] py-[11px] text-[12.5px] font-bold text-white shadow-[0_6px_18px_rgba(20,20,25,.28)]"
      >
        <Icon id="location" className="size-[15px]" />
        Показать картой
      </button>

      <TabBar items={LIST_TABS} />
    </div>
  )
}
