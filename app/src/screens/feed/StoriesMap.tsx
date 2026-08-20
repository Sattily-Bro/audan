// Экран «Stories на карте» (эталон: S21). Подложка #streets2, фото жителей —
// круглыми метками; у активной — счётчик лайков. Тап по метке поднимает карточку
// снизу → /story/{id}; «Сеткой» → /stories, крестик — выйти. API: geoinsta.list.
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { imageUrl } from '../../api/client'
import { useData } from '../../lib/useData'
import { Icon } from '../../ui/Icon'
import { TabBar } from '../../ui/TabBar'
import { STORIES_TABS, storyBy, type StoryItem } from './lib'

/** Позиции меток в % экрана — из эталона S21 (390×844) */
const POS: Record<string, [number, number]> = {
  field: [19, 31],
  plant: [50, 44.5],
  park: [24.5, 60.5],
  station: [73, 56],
  steppe: [60.5, 70],
  mount: [84, 25],
  tract: [33, 80],
}
const FALLBACK: [number, number][] = [[15, 18], [80, 40], [42, 14], [88, 66]]

export default function StoriesMap() {
  const nav = useNavigate()
  const { data } = useData<{ stories: StoryItem[] }>('geoinsta.list')
  const [cur, setCur] = useState<number | null>(null)

  const stories = data?.stories ?? []
  const hero = stories.reduce<StoryItem | null>((m, s) => (s.likes > (m?.likes ?? -1) ? s : m), null)
  const activeId = cur ?? hero?.id ?? null
  const active = stories.find((s) => s.id === activeId) ?? null
  const idx = stories.findIndex((s) => s.id === activeId)

  function cycle(d: 1 | -1) {
    if (stories.length < 2 || idx < 0) return
    setCur(stories[(idx + d + stories.length) % stories.length].id)
  }

  return (
    <div className="relative h-dvh overflow-hidden bg-paper">
      {/* подложка карты */}
      <svg className="absolute inset-0 size-full"><use href="#streets2" /></svg>

      {/* верх: выйти · пилюля · сеткой (эталон: .stm-top) */}
      <div className="absolute inset-x-0 top-0 z-[6] flex items-center gap-[9px] px-4 pt-[max(env(safe-area-inset-top),12px)]">
        <button
          type="button"
          aria-label="Выйти"
          onClick={() => nav(-1)}
          className="flex size-[38px] flex-none items-center justify-center rounded-full bg-card shadow-[0_2px_8px_rgba(20,20,25,.16)]"
        >
          <Icon id="close" className="size-[18px]" />
        </button>
        <div className="flex-1 rounded-full bg-card py-2.5 text-center text-[13.5px] font-bold shadow-[0_2px_8px_rgba(20,20,25,.12)]">
          Stories на карте
        </div>
        <button
          type="button"
          onClick={() => nav('/stories')}
          className="flex-none rounded-full bg-ink px-[15px] py-2.5 text-[12px] font-bold text-white"
        >
          Сеткой
        </button>
      </div>

      {/* фото-метки (эталон: .stm.avph) */}
      {stories.map((s, i) => {
        const [x, y] = POS[s.key] ?? FALLBACK[i % FALLBACK.length]
        const on = s.id === activeId
        return (
          <button
            key={s.id}
            type="button"
            aria-label={s.title}
            onClick={() => setCur(s.id)}
            style={{
              left: `${x}%`,
              top: `${y}%`,
              backgroundImage: s.imageId != null ? `url(${imageUrl(s.imageId)})` : undefined,
            }}
            className={
              'absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-card bg-cover bg-center shadow-[0_3px_10px_rgba(20,20,25,.25)] ' +
              (on ? 'z-[4] size-[58px] border-[2.5px] border-acc' : 'size-[46px] border-[2.5px] border-white')
            }
          >
            {on && (
              <span className="num absolute -bottom-[7px] left-1/2 -translate-x-1/2 rounded-full bg-ink px-[7px] py-0.5 text-[9px] font-extrabold whitespace-nowrap text-white">
                ❤ {s.likes}
              </span>
            )}
          </button>
        )
      })}

      {/* стрелки ←/→ листают активную метку (эталон: .stm-nav) */}
      <div className="pointer-events-none absolute inset-x-3 bottom-[188px] z-[7] flex justify-between">
        <button
          type="button"
          aria-label="Предыдущая story"
          onClick={() => cycle(-1)}
          className="pointer-events-auto flex size-11 items-center justify-center rounded-full bg-white/95 shadow-[0_3px_12px_rgba(20,20,25,.22)]"
        >
          <Icon id="chevron-right" className="size-5 rotate-180 text-ink" />
        </button>
        <button
          type="button"
          aria-label="Следующая story"
          onClick={() => cycle(1)}
          className="pointer-events-auto flex size-11 items-center justify-center rounded-full bg-white/95 shadow-[0_3px_12px_rgba(20,20,25,.22)]"
        >
          <Icon id="chevron-right" className="size-5 text-ink" />
        </button>
      </div>

      {/* карточка активной story снизу (эталон: .stcard) → /story/{id} */}
      {active && (
        <button
          type="button"
          onClick={() => nav(`/story/${active.id}`)}
          className="absolute inset-x-3 bottom-[96px] z-[6] flex items-center gap-3 rounded-[18px] bg-card p-3 text-left shadow-[0_8px_26px_rgba(20,20,25,.2)]"
        >
          <span
            className="size-16 flex-none rounded-xl bg-[#EFEAE2] bg-cover bg-center"
            style={active.imageId != null ? { backgroundImage: `url(${imageUrl(active.imageId)})` } : undefined}
          />
          <span className="min-w-0 flex-1">
            <span className="block text-[12.5px] leading-[1.3] font-bold">{active.title}</span>
            <span className="block truncate pt-[3px] text-[10.5px] font-semibold text-mut">{storyBy(active.meta)}</span>
            <span className="num flex gap-2.5 pt-[5px] text-[10.5px] font-bold text-[#6C6A62]">
              <span>❤ {active.likes}</span>
              {active.id === hero?.id && <span>Фото дня</span>}
            </span>
          </span>
          <Icon id="chevron-right" className="size-[15px] flex-none text-[#C5C1B7]" />
        </button>
      )}

      {/* постоянное меню раздела */}
      <div className="absolute inset-x-0 bottom-0 z-[5]">
        <TabBar items={STORIES_TABS} />
      </div>
    </div>
  )
}
