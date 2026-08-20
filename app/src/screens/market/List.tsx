// Экран 2 «Базар — список раздела» (эталон: S2). Карточки .adrow, чипы фильтров
// по словарю раздела (SECTION_FIELDS) и сортировка Kaspi-шторкой: новые/дешевле/дороже.
// API: market.list, сердце — favs.toggle с optimistic-обновлением.
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { api } from '../../api/client'
import { SECTION_FIELDS, type SectionField } from '../../lib/sections.gen'
import { useData } from '../../lib/useData'
import type { MockAd } from '../../mocks/db'
import { Chip } from '../../ui/kit'
import { HeadAction, SHead } from '../../ui/SHead'
import { TabBar } from '../../ui/TabBar'
import { AdRow } from './AdRow'
import { KIND_SECTION, KIND_TITLES, LIVESTOCK_SUBCATS, MARKET_TABS } from './sections'
import { Sheet, SheetOpt } from './Sheet'

type Sort = 'new' | 'cheap' | 'exp'
const SORT_LABEL: Record<Sort, string> = {
  new: 'Сначала новые',
  cheap: 'Сначала дешевле',
  exp: 'Сначала дороже',
}

export default function List() {
  const nav = useNavigate()
  const { section: kind = '' } = useParams()
  const { data, loading, error } = useData<{ ads: MockAd[]; total: number }>('market.list', { kind })

  const [sort, setSort] = useState<Sort>('new')
  const [withPhoto, setWithPhoto] = useState(false)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [sheet, setSheet] = useState<'sort' | string | null>(null)
  const [favIds, setFavIds] = useState<ReadonlySet<number>>(new Set())

  // 1-2 селекта из словаря раздела — как чипы фильтров
  const fields = (SECTION_FIELDS[KIND_SECTION[kind] ?? ''] ?? [])
    .filter((f) => f.type === 'select' && f.options)
    .slice(0, 2)

  const isLivestock = LIVESTOCK_SUBCATS.some((c) => c.kind === kind)

  function toggleFav(id: number) {
    // optimistic: переключаем сразу, при ошибке откатываем обратно
    const flip = () => setFavIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
    flip()
    api('favs.toggle', { kind: 'ad', id }).catch(flip)
  }

  let ads = data?.ads ?? []
  if (withPhoto) ads = ads.filter((a) => a.imageIds.length > 0)
  for (const [key, val] of Object.entries(filters)) {
    if (val) ads = ads.filter((a) => String(a.extra[key] ?? '') === val)
  }
  if (sort === 'cheap') ads = [...ads].sort((a, b) => a.price - b.price)
  if (sort === 'exp') ads = [...ads].sort((a, b) => b.price - a.price)

  const openField = fields.find((f) => f.key === sheet)

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <div className="flex-1 pb-2">
        <SHead
          title={KIND_TITLES[kind] ?? 'Объявления'}
          backTo={isLivestock ? '/market/livestock-sub' : '/market'}
          actions={<HeadAction icon="search" label="Поиск" onPress={() => nav('/search')} />}
        />
        {/* чипы: сортировка · фильтры раздела · «С фото» */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Chip on onPress={() => setSheet('sort')}>{SORT_LABEL[sort]} ▾</Chip>
          {fields.map((f) => (
            <Chip key={f.key} ghost={!filters[f.key]} on={Boolean(filters[f.key])} onPress={() => setSheet(f.key)}>
              {filters[f.key] || shortLabel(f)} ▾
            </Chip>
          ))}
          <Chip ghost={!withPhoto} on={withPhoto} onPress={() => setWithPhoto(!withPhoto)}>С фото</Chip>
        </div>

        {ads.map((a) => (
          <AdRow key={a.id} ad={a} fav={favIds.has(a.id)} onFav={() => toggleFav(a.id)} />
        ))}
        {loading && Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="mx-4 mb-2 h-[107px] animate-pulse rounded-2xl bg-line/60" />
        ))}
        {!loading && !error && ads.length === 0 && (
          <p className="px-8 pt-14 text-center text-[13px] font-semibold text-mut">
            Пока нет объявлений — попробуйте убрать фильтры или загляните позже.
          </p>
        )}
        {error && <p className="px-8 pt-14 text-center text-[13px] font-semibold text-danger">{error}</p>}
      </div>

      <TabBar items={MARKET_TABS} />

      {sheet === 'sort' && (
        <Sheet title="Сортировка" onClose={() => setSheet(null)}>
          {(Object.keys(SORT_LABEL) as Sort[]).map((s) => (
            <SheetOpt key={s} on={sort === s} onPress={() => { setSort(s); setSheet(null) }}>
              {SORT_LABEL[s]}
            </SheetOpt>
          ))}
        </Sheet>
      )}
      {openField && (
        <Sheet title={openField.label} onClose={() => setSheet(null)}>
          <SheetOpt
            on={!filters[openField.key]}
            onPress={() => { setFilters({ ...filters, [openField.key]: '' }); setSheet(null) }}
          >
            Не важно
          </SheetOpt>
          {(openField.options ?? []).map((o) => (
            <SheetOpt
              key={o}
              on={filters[openField.key] === o}
              onPress={() => { setFilters({ ...filters, [openField.key]: o }); setSheet(null) }}
            >
              {o}
            </SheetOpt>
          ))}
        </Sheet>
      )}
    </div>
  )
}

/** Короткий лейбл чипа: «Коробка передач» → без уточнения после запятой */
function shortLabel(f: SectionField): string {
  return f.label.split(',')[0]
}
