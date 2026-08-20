// Экран «Мастера и услуги» (эталон: S14): чипы-фильтры, категории рядами .sv-row
// (тап — фильтр списка ниже), свободные мастера карточками .sp-card → /master/:id.
// API: services.list → { masters }.
import { useState } from 'react'
import { Link } from 'react-router'
import { useData } from '../../lib/useData'
import { Icon } from '../../ui/Icon'
import { SHead } from '../../ui/SHead'
import { Chip, HScroll, SecLbl } from '../../ui/kit'
import { TabBar, type TabItem } from '../../ui/TabBar'
import { plural } from './util'

export interface MasterRow {
  id: number
  name: string
  spec: string
  district: string
  rating: string
  jobs: number
  phone: string
}

const SERVICES_TABS: TabItem[] = [
  { icon: 'home', label: 'Главная', to: '/', end: true },
  { icon: 'grid', label: 'Мастера', to: '/services', end: true },
  { icon: 'plus', label: 'Анкета', to: '/services/new' },
  { icon: 'document', label: 'Мои', to: '/services/my' },
]

/** Справочник категорий — из эталона S14 (services.categories) */
const GROUPS: { title: string; cats: { icon: string; name: string; desc: string; count: number; specs: string[] }[] }[] = [
  {
    title: 'Инженерные работы',
    cats: [
      { icon: 'm-electric', name: 'Электрик', desc: 'проводка, розетки, щитки', count: 6, specs: ['Электрик'] },
      { icon: 'm-plumber', name: 'Ремонт сантехники', desc: 'трубы, смесители, отопление', count: 4, specs: ['Сантехник'] },
      { icon: 'm-drill', name: 'Бурение скважин', desc: 'вода на участке', count: 2, specs: ['Бурильщик'] },
    ],
  },
  {
    title: 'Авто и транспорт',
    cats: [
      { icon: 'm-auto', name: 'Авто электрик', desc: 'диагностика, проводка', count: 3, specs: ['Авто-электрик'] },
    ],
  },
]

/** Онлайн/проверен — как в эталоне (data-online / data-verified на .sp-card) */
export const MASTER_META: Record<number, { online?: boolean; verified?: boolean }> = {
  1: { online: true, verified: true },
  2: { verified: true },
  3: { online: true },
}

const CHIPS = ['Все', 'Онлайн', 'Проверенные', 'Мой район'] as const
type ChipKind = (typeof CHIPS)[number]

export default function Services() {
  const { data, loading, error } = useData<{ masters: MasterRow[] }>('services.list')
  const [chip, setChip] = useState<ChipKind>('Все')
  const [cat, setCat] = useState<string | null>(null)

  const masters = (data?.masters ?? []).filter((m) => {
    if (cat) {
      const c = GROUPS.flatMap((g) => g.cats).find((x) => x.name === cat)
      if (c && !c.specs.includes(m.spec)) return false
    }
    if (chip === 'Онлайн') return Boolean(MASTER_META[m.id]?.online)
    if (chip === 'Проверенные') return Boolean(MASTER_META[m.id]?.verified)
    if (chip === 'Мой район') return m.district === 'Төле би'
    return true
  })

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <div className="flex-1 pb-3">
        <SHead
          title="Мастера и услуги"
          actions={<Link to="/search" aria-label="Поиск" className="flex size-[38px] items-center justify-center rounded-full bg-card shadow-[0_1px_3px_rgba(20,20,25,.08)]"><Icon id="search" className="size-[17px]" /></Link>}
        />

        <HScroll className="pb-3">
          {CHIPS.map((c) => (
            <Chip key={c} on={chip === c} onPress={() => setChip(c)}>{c}</Chip>
          ))}
        </HScroll>

        {/* категории — тап фильтрует список мастеров ниже */}
        {GROUPS.map((g) => (
          <div key={g.title}>
            <div className="px-4 pt-0.5 pb-2 text-[12.5px] font-extrabold tracking-wider text-mut uppercase">{g.title}</div>
            {g.cats.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => setCat(cat === c.name ? null : c.name)}
                className={
                  'mx-4 mb-2 flex w-[calc(100%-32px)] items-center gap-3 rounded-[15px] bg-card px-[15px] py-[13px] text-left shadow-[0_1px_3px_rgba(20,20,25,.06)] ' +
                  (cat === c.name ? 'shadow-[inset_0_0_0_1.5px_var(--acc)]' : '')
                }
              >
                <span className="flex size-[38px] flex-none items-center justify-center rounded-xl bg-acc-bg text-acc-d">
                  <Icon id={c.icon} className="size-[19px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-bold">{c.name}</span>
                  <span className="block truncate text-[11px] font-semibold text-mut">{c.desc}</span>
                </span>
                <span className="num flex-none text-[12px] font-bold text-mut">{c.count}</span>
                <Icon id="chevron-right" className="size-[15px] flex-none text-[#C5C1B7]" />
              </button>
            ))}
          </div>
        ))}

        {/* свободные мастера */}
        <SecLbl
          title="Свободны сейчас"
          right={data ? `${masters.length} ${plural(masters.length, 'мастер', 'мастера', 'мастеров')}` : ''}
        />
        {masters.map((m) => <MasterCard key={m.id} m={m} />)}
        {!loading && data && masters.length === 0 && (
          <p className="px-5 py-2 text-center text-[12.5px] font-semibold text-mut">По этому фильтру свободных мастеров пока нет</p>
        )}
        {loading && Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="mx-4 mb-2 h-[86px] animate-pulse rounded-2xl bg-line/60" />
        ))}
        {error && <p className="px-5 py-3 text-center text-[12.5px] font-semibold text-mut">{error}</p>}
      </div>

      <TabBar items={SERVICES_TABS} />
    </div>
  )
}

function MasterCard({ m }: { m: MasterRow }) {
  const meta = MASTER_META[m.id] ?? {}
  return (
    <Link to={`/master/${m.id}`} className="mx-4 mb-2 flex gap-3 rounded-2xl bg-card px-3.5 py-[13px] shadow-[0_1px_3px_rgba(20,20,25,.06)]">
      <span className="relative flex size-[52px] flex-none items-center justify-center rounded-2xl bg-[#EFE4D6] text-[18px] font-extrabold text-[#8A6432]">
        {m.name[0]}
        {meta.online && <i className="absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full border-[2.5px] border-card bg-ok" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-[14.5px] font-bold">
          {m.name}
          <span className="num flex items-center gap-[3px] text-[12.5px] font-extrabold">
            <Icon id="star-filled" className="size-[13px] text-warn" />
            {m.rating}
          </span>
        </span>
        <span className="mt-0.5 block text-[12px] font-semibold text-[#6C6A62]">{m.spec} · {m.district}</span>
        <span className="mt-[7px] flex flex-wrap gap-1.5">
          <i className="num rounded-full bg-soft px-[9px] py-1 text-[10.5px] font-semibold text-[#3A3833] not-italic">
            {m.jobs} {plural(m.jobs, 'работа', 'работы', 'работ')}
          </i>
          <i className="rounded-full bg-soft px-[9px] py-1 text-[10.5px] font-semibold text-[#3A3833] not-italic">договорная</i>
          {meta.online && <i className="rounded-full bg-soft px-[9px] py-1 text-[10.5px] font-semibold text-[#3A3833] not-italic">онлайн</i>}
        </span>
      </span>
    </Link>
  )
}
