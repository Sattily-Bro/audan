// Экран «Лента города» (эталон: S9). Композер-строка → /compose, фильтры-чипы,
// посты с лайком И дизлайком (post_votes хранит оба), тап по посту → /post/{id}.
// API: feed.list, feed.vote (optimistic).
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { api } from '../../api/client'
import { useData } from '../../lib/useData'
import { Icon } from '../../ui/Icon'
import { Chip } from '../../ui/kit'
import { HeadAction, SHead } from '../../ui/SHead'
import { TabBar } from '../../ui/TabBar'
import { applyVote, FEED_TABS, PostCard, postTag, type FeedPost } from './lib'

const FILTERS = ['Все', '#новости', '#безтемы', 'Понравившиеся'] as const

export default function Feed() {
  const nav = useNavigate()
  const { data, loading } = useData<{ posts: FeedPost[] }>('feed.list')
  const [override, setOverride] = useState<Record<number, FeedPost>>({})
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('Все')

  const posts = (data?.posts ?? []).map((p) => override[p.id] ?? p)
  const shown = posts.filter((p) => {
    if (filter === 'Все') return true
    if (filter === 'Понравившиеся') return p.myVote === 1
    return postTag(p) === filter
  })

  function vote(p: FeedPost, on: 1 | -1) {
    const next = applyVote(p, on)
    setOverride((o) => ({ ...o, [p.id]: next }))
    api<{ likes: number; dislikes: number; myVote: 0 | 1 | -1 }>('feed.vote', { id: p.id, on })
      .then((r) => setOverride((o) => ({ ...o, [p.id]: { ...next, likes: r.likes, dislikes: r.dislikes, myVote: r.myVote } })))
      .catch(() => setOverride((o) => ({ ...o, [p.id]: p })))
  }

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <div className="flex-1 pb-2">
        <SHead
          title="Лента города"
          actions={<HeadAction icon="bell" label="Уведомления" onPress={() => nav('/notify')} />}
        />

        {/* композер-строка (эталон: .composer) */}
        <Link
          to="/compose"
          className="mx-4 mb-3 flex items-center gap-2.5 rounded-[15px] bg-card px-3.5 py-[11px] shadow-[0_1px_3px_rgba(20,20,25,.06)]"
        >
          <span className="flex size-[34px] flex-none items-center justify-center rounded-full bg-[#F0E4D8] text-[13px] font-extrabold text-[#9A6432]">
            АС
          </span>
          <span className="flex-1 text-[13px] font-medium text-mut">Что нового в Шу?</span>
          <Icon id="camera" className="size-5 text-acc" />
        </Link>

        {/* фильтры */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTERS.map((f) => (
            <Chip key={f} on={f === filter} onPress={() => setFilter(f)}>{f}</Chip>
          ))}
        </div>

        {shown.map((p) => (
          <PostCard key={p.id} post={p} onVote={(on) => vote(p, on)} onOpen={() => nav(`/post/${p.id}`)} />
        ))}

        {!loading && shown.length === 0 && (
          <p className="px-8 pt-8 text-center text-[13px] font-semibold text-mut">
            Пока нет постов — напишите первым
          </p>
        )}

        {loading && Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="mx-4 mb-2 h-[120px] animate-pulse rounded-2xl bg-line/60" />
        ))}
      </div>

      <TabBar items={FEED_TABS} />
    </div>
  )
}
