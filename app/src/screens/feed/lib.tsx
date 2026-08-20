// Общее для раздела «Лента»/«Stories»: типы контракта, таб-бары, карточка поста,
// голосование лайк+дизлайк (post_votes хранит оба — правило старого кода).
import type { MouseEvent, ReactNode } from 'react'
import { Icon } from '../../ui/Icon'
import { Photo } from '../../ui/kit'
import type { TabItem } from '../../ui/TabBar'

/* ---- контракт мок-API (handlers.ts: feed.*, geoinsta.*) ---- */
export interface FeedComment {
  id: number
  authorName: string
  when: string
  text: string
  likes: number
}

export interface FeedPost {
  id: number
  authorName: string
  when: string
  text: string
  imageId: number | null
  likes: number
  dislikes: number
  myVote: 0 | 1 | -1
  comments: FeedComment[]
}

export interface StoryItem {
  id: number
  key: string
  title: string
  meta: string
  imageId: number | null
  likes: number
}

/* ---- таб-бары раздела (эталоны S9 и S18) ---- */
export const FEED_TABS: TabItem[] = [
  { icon: 'home', label: 'Главная', to: '/', end: true },
  { icon: 'chat', label: 'Лента', to: '/feed' },
  { icon: 'plus', label: 'Написать', to: '/compose' },
]

export const STORIES_TABS: TabItem[] = [
  { icon: 'home', label: 'Главная', to: '/', end: true },
  { icon: 'grid', label: 'Stories', to: '/stories' },
  { icon: 'plus', label: 'Добавить фото', to: '/compose' },
]

/* ---- аватар-буква: фиксированная палитра прототипа, цвет — по имени ---- */
const AV_COLORS = ['#5B8DEF', '#3E6B8E', '#E08A3C', '#3E8E6B', '#8A57A6']

export function avColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997
  return AV_COLORS[h % AV_COLORS.length]
}

/* ---- локальный пересчёт голосов — зеркало логики feed.vote бэка ---- */
export function applyVote(p: FeedPost, on: 1 | -1): FeedPost {
  let { likes, dislikes, myVote } = p
  if (myVote === on) {
    myVote = 0
    if (on === 1) likes--
    else dislikes--
  } else {
    if (p.myVote === 1) likes--
    if (p.myVote === -1) dislikes--
    myVote = on
    if (on === 1) likes++
    else dislikes++
  }
  return { ...p, likes, dislikes, myVote }
}

/** Кнопка «поделиться» — одна на всё приложение (#share) */
export function sharePage(text: string): void {
  const url = window.location.href
  if (typeof navigator.share === 'function') {
    void navigator.share({ text, url }).catch(() => {})
  } else {
    void navigator.clipboard?.writeText(url)
  }
}

export function postTag(p: FeedPost): string {
  return p.authorName.includes('Новости') ? '#новости' : '#безтемы'
}

/* ---- пилюля футера поста (.post .ft i) ---- */
export function FtBtn({ icon, on, label, className, children, onPress }: {
  icon: string
  on?: boolean
  label?: string
  className?: string
  children?: ReactNode
  onPress?: (e: MouseEvent<HTMLButtonElement>) => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onPress}
      className={
        'flex items-center gap-[5px] rounded-full px-[11px] py-1.5 text-[12px] font-bold transition-colors ' +
        (on ? 'bg-acc-bg text-acc-d ' : 'bg-paper text-[#6C6A62] ') +
        (className ?? '')
      }
    >
      <Icon id={icon} className="size-3.5" />
      {children}
    </button>
  )
}

/* ---- пост (.post, эталон S9): аватар-буква, текст, лайк И дизлайк, комменты ---- */
export function PostCard({ post, onVote, onOpen }: {
  post: FeedPost
  onVote: (on: 1 | -1) => void
  onOpen?: () => void
}) {
  const tag = postTag(post)
  const news = tag === '#новости'
  const nl = news ? post.text.indexOf('\n') : -1
  return (
    <article
      onClick={onOpen}
      className={
        'mx-4 mb-2 rounded-2xl bg-card px-[15px] py-[13px] shadow-[0_1px_3px_rgba(20,20,25,.06)]' +
        (onOpen ? ' cursor-pointer' : '')
      }
    >
      <div className="flex items-center gap-[9px]">
        <span
          className="flex size-9 flex-none items-center justify-center rounded-full text-[14px] font-extrabold text-white"
          style={{ background: avColor(post.authorName) }}
        >
          {post.authorName[0]}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[13.5px] font-bold">{post.authorName}</span>
          <span className="block text-[11px] font-medium text-faint">{post.when}</span>
        </span>
        <span className="ml-auto flex-none text-[12.5px] font-bold text-acc">{tag}</span>
      </div>

      {/* правило из feed.jsx: у «Новостей Шу» первая строка — заголовок жирным */}
      <p className="mt-[9px] text-[13.5px] leading-[1.45] text-[#262521]">
        {nl >= 0 ? (
          <>
            <b className="font-bold">{post.text.slice(0, nl)}</b>
            <br />
            {post.text.slice(nl + 1)}
          </>
        ) : (
          post.text
        )}
      </p>

      {post.imageId != null && <Photo id={post.imageId} className="mt-2.5 h-[150px] rounded-xl" />}

      <div className="mt-[11px] flex gap-1">
        <FtBtn
          icon="heart"
          label="Нравится"
          on={post.myVote === 1}
          onPress={(e) => { e.stopPropagation(); onVote(1) }}
        >
          {post.likes}
        </FtBtn>
        <FtBtn
          icon="thumb-down"
          label="Не нравится"
          on={post.myVote === -1}
          onPress={(e) => { e.stopPropagation(); onVote(-1) }}
        >
          {post.dislikes}
        </FtBtn>
        <FtBtn icon="chat" label="Комментарии">{post.comments.length}</FtBtn>
        <FtBtn
          icon="share"
          label="Поделиться"
          className="ml-auto"
          onPress={(e) => { e.stopPropagation(); sharePage(post.text) }}
        />
      </div>
    </article>
  )
}

/** «Автор · дата» из meta вида «Автор · дата · место» (эталон S18: .st-c .b) */
export function storyBy(meta: string): string {
  return meta.split(' · ').slice(0, 2).join(' · ')
}
