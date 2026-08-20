// Экран «Гео-фото» (эталон: S29). Снимок на весь верх, стрелки ←/→ по краям фото
// листают по списку stories, сердце-лайк с optimistic-счётчиком, крестик — выход.
// API: geoinsta.get, geoinsta.list (соседи), geoinsta.vote.
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { api } from '../../api/client'
import { useData } from '../../lib/useData'
import { Icon } from '../../ui/Icon'
import { Photo } from '../../ui/kit'
import { FtBtn, sharePage, type StoryItem } from './lib'

export default function Story() {
  const { id } = useParams()
  // key сбрасывает локальный лайк/счётчик при листании между stories
  return <StoryView key={id} id={Number(id)} />
}

function StoryView({ id }: { id: number }) {
  const nav = useNavigate()
  const { data } = useData<{ story: StoryItem }>('geoinsta.get', { id })
  const { data: ld } = useData<{ stories: StoryItem[] }>('geoinsta.list')
  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState<number | null>(null)

  const story = data?.story ?? null
  const list = ld?.stories ?? []
  const idx = list.findIndex((s) => s.id === id)

  function go(d: 1 | -1) {
    if (list.length < 2 || idx < 0) return
    const t = list[(idx + d + list.length) % list.length]
    nav(`/story/${t.id}`, { replace: true })
  }

  function like() {
    if (!story || liked) return
    setLiked(true)
    setLikes(story.likes + 1)
    api<{ likes: number }>('geoinsta.vote', { id })
      .then((r) => setLikes(r.likes))
      .catch(() => { setLiked(false); setLikes(null) })
  }

  return (
    <div className="flex min-h-dvh flex-col bg-card">
      {/* фото на весь верх, поверх — крестик и стрелки ←/→ */}
      <div className="relative h-[52dvh] min-h-[300px] flex-none bg-[#1A1916]">
        <Photo id={story?.imageId} className="absolute inset-0" />
        <button
          type="button"
          aria-label="Выйти"
          onClick={() => nav(-1)}
          className="absolute top-[max(env(safe-area-inset-top),14px)] left-4 flex size-[38px] items-center justify-center rounded-full bg-white/95 shadow-[0_1px_3px_rgba(20,20,25,.12)]"
        >
          <Icon id="close" className="size-[18px]" />
        </button>
        <button
          type="button"
          aria-label="Предыдущее фото"
          onClick={() => go(-1)}
          className="absolute top-1/2 left-3 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 shadow-[0_3px_12px_rgba(20,20,25,.22)]"
        >
          <Icon id="chevron-right" className="size-5 rotate-180" />
        </button>
        <button
          type="button"
          aria-label="Следующее фото"
          onClick={() => go(1)}
          className="absolute top-1/2 right-3 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 shadow-[0_3px_12px_rgba(20,20,25,.22)]"
        >
          <Icon id="chevron-right" className="size-5" />
        </button>
      </div>

      <div className="flex-1 px-4 pt-3.5 pb-[max(env(safe-area-inset-bottom),16px)]">
        {story ? (
          <>
            <div className="text-[19px] leading-tight font-extrabold tracking-tight">{story.title}</div>
            <div className="mt-1 text-[12px] font-semibold text-mut">{story.meta}</div>
          </>
        ) : (
          <div className="h-[46px] animate-pulse rounded-lg bg-line/60" />
        )}

        <div className="mt-3 flex gap-1">
          <FtBtn icon={liked ? 'heart-filled' : 'heart'} label="Нравится" on={liked} onPress={like}>
            {likes ?? story?.likes ?? 0}
          </FtBtn>
          <FtBtn icon="location" label="На карте" onPress={() => nav('/stories/map')}>На карте</FtBtn>
          <FtBtn
            icon="share"
            label="Поделиться"
            className="ml-auto"
            onPress={() => sharePage(story?.title ?? 'Audan Stories')}
          />
        </div>
      </div>
    </div>
  )
}
