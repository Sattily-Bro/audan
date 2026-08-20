// Экран «Audan Stories» — сетка гео-фото (эталон: S18). «Фото дня» героем, дальше
// сетка 2 колонки с лайками. Иконка карты в шапке → /stories/map (решение владельца:
// вход в раздел с главной открывает сначала карту, сюда ведёт кнопка «Сеткой»).
// API: geoinsta.list.
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useData } from '../../lib/useData'
import { Icon } from '../../ui/Icon'
import { Chip, Photo } from '../../ui/kit'
import { HeadAction, SHead } from '../../ui/SHead'
import { TabBar } from '../../ui/TabBar'
import { STORIES_TABS, storyBy, type StoryItem } from './lib'

const SORTS = [
  { key: 'all', label: 'Все' },
  { key: 'new', label: 'Новые' },
  { key: 'pop', label: 'Популярные' },
] as const

export default function Stories() {
  const nav = useNavigate()
  const { data, loading } = useData<{ stories: StoryItem[] }>('geoinsta.list')
  const [sort, setSort] = useState<(typeof SORTS)[number]['key']>('all')

  const stories = data?.stories ?? []
  const hero = stories.reduce<StoryItem | null>((m, s) => (s.likes > (m?.likes ?? -1) ? s : m), null)
  const rest = stories.filter((s) => s.id !== hero?.id)
  const grid =
    sort === 'new'
      ? [...rest].sort((a, b) => b.id - a.id)
      : sort === 'pop'
        ? [...rest].sort((a, b) => b.likes - a.likes)
        : rest

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <div className="flex-1 pb-3">
        <SHead
          title="Audan Stories"
          actions={<HeadAction icon="location" label="Картой" onPress={() => nav('/stories/map')} />}
        />

        {/* фото дня (эталон: .st-hero) */}
        {hero && (
          <Link to={`/story/${hero.id}`} className="relative block h-[230px]">
            <Photo id={hero.imageId} className="absolute inset-0" />
            <div className="absolute inset-x-0 bottom-0 bg-linear-to-b from-transparent to-[rgba(20,18,14,.82)] px-4 pt-10 pb-3.5 text-white">
              <div className="text-[10.5px] font-extrabold tracking-[.08em] text-[#FFD98A]">ФОТО ДНЯ</div>
              <div className="mt-1 text-[16px] font-extrabold">{hero.title}</div>
              <div className="mt-0.5 text-[11.5px] font-semibold opacity-85">
                {storyBy(hero.meta)} · ❤ {hero.likes}
              </div>
            </div>
          </Link>
        )}
        {loading && !hero && <div className="h-[230px] animate-pulse bg-line/60" />}

        <div className="flex gap-2 overflow-x-auto px-4 pt-3 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SORTS.map((s) => (
            <Chip key={s.key} on={s.key === sort} onPress={() => setSort(s.key)}>{s.label}</Chip>
          ))}
        </div>

        {/* сетка снимков (эталон: .st-grid / .st-c) */}
        <div className="grid grid-cols-2 gap-2 px-4">
          {grid.map((s) => (
            <Link
              key={s.id}
              to={`/story/${s.id}`}
              className="relative overflow-hidden rounded-[14px] bg-card shadow-[0_1px_3px_rgba(20,20,25,.06)]"
            >
              <Photo id={s.imageId} className="h-[118px]" />
              <span className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-[rgba(20,18,14,.55)] px-2 py-[3px] text-[10.5px] font-bold text-white">
                <Icon id="heart" className="size-[11px]" />
                {s.likes}
              </span>
              <div className="px-2.5 pt-2 pb-2.5">
                <div className="truncate text-[11.5px] font-bold">{s.title}</div>
                <div className="mt-0.5 truncate text-[10px] font-semibold text-mut">{storyBy(s.meta)}</div>
              </div>
            </Link>
          ))}
          {loading && Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-[164px] animate-pulse rounded-[14px] bg-line/60" />
          ))}
        </div>
      </div>

      <TabBar items={STORIES_TABS} />
    </div>
  )
}
