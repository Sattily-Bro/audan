// Экран «Пост с комментариями» (эталон: S27). Пост сверху с голосами вверх/вниз,
// ветка комментариев пузырями, поле ввода снизу. Deep-link старого сайта: post.php → /post/{id}.
// API: feed.get, feed.comments, feed.vote, feed.comment.
import { useState } from 'react'
import { useParams } from 'react-router'
import { api } from '../../api/client'
import { useData } from '../../lib/useData'
import { Icon } from '../../ui/Icon'
import { SecLbl } from '../../ui/kit'
import { HeadAction, SHead } from '../../ui/SHead'
import { applyVote, avColor, PostCard, sharePage, type FeedComment, type FeedPost } from './lib'

export default function Post() {
  const { id } = useParams()
  const pid = Number(id)
  const { data } = useData<{ post: FeedPost }>('feed.get', { id: pid })
  const { data: cd, loading: cmLoading } = useData<{ comments: FeedComment[] }>('feed.comments', { id: pid })

  const [voted, setVoted] = useState<FeedPost | null>(null)
  const [added, setAdded] = useState<FeedComment[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  const post = voted ?? data?.post ?? null
  const comments = [...(cd?.comments ?? []), ...added]

  function vote(p: FeedPost, on: 1 | -1) {
    const next = applyVote(p, on)
    setVoted(next)
    api<{ likes: number; dislikes: number; myVote: 0 | 1 | -1 }>('feed.vote', { id: pid, on })
      .then((r) => setVoted({ ...next, likes: r.likes, dislikes: r.dislikes, myVote: r.myVote }))
      .catch(() => setVoted(p))
  }

  async function send() {
    const t = text.trim()
    if (!t || sending) return
    setSending(true)
    try {
      const r = await api<{ comment: FeedComment }>('feed.comment', { id: pid, text: t })
      setAdded((a) => [...a, r.comment])
      setText('')
    } catch {
      /* поле не очищаем — можно отправить снова */
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <div className="flex-1 pb-3">
        <SHead
          title="Пост"
          actions={<HeadAction icon="share" label="Поделиться" onPress={() => sharePage(post?.text ?? 'Пост')} />}
        />

        {post ? (
          <PostCard post={{ ...post, comments }} onVote={(on) => vote(post, on)} />
        ) : (
          <div className="mx-4 mb-2 h-[120px] animate-pulse rounded-2xl bg-line/60" />
        )}

        <SecLbl title="Комментарии" right={String(comments.length)} />

        {comments.map((c) => (
          <div key={c.id} className="mx-4 mb-2.5 flex gap-2.5">
            <span
              className="flex size-8 flex-none items-center justify-center rounded-full text-[12px] font-extrabold text-white"
              style={{ background: avColor(c.authorName) }}
            >
              {c.authorName[0]}
            </span>
            <div className="min-w-0 flex-1 rounded-[4px_14px_14px_14px] bg-card px-3 py-[9px] shadow-[0_1px_3px_rgba(20,20,25,.05)]">
              <div className="text-[12px] font-bold">{c.authorName}</div>
              <div className="mt-0.5 text-[12.5px] leading-[1.45] text-[#262521]">{c.text}</div>
              <div className="mt-1 text-[10px] font-semibold text-faint">{c.when}</div>
            </div>
          </div>
        ))}

        {cmLoading && <div className="mx-4 h-[52px] animate-pulse rounded-[14px] bg-line/60" />}
        {!cmLoading && comments.length === 0 && (
          <p className="px-8 pt-2 text-center text-[12.5px] font-semibold text-mut">
            Комментариев пока нет — ваш будет первым
          </p>
        )}
      </div>

      {/* поле ввода снизу (эталон: .cbar) */}
      <div className="sticky bottom-0 flex items-center gap-2 border-t border-black/8 bg-card px-4 py-2.5 pb-[max(env(safe-area-inset-bottom),10px)]">
        <div className="flex h-[42px] min-w-0 flex-1 items-center rounded-full bg-paper px-4">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void send() }}
            placeholder="Ваш комментарий…"
            className="w-full min-w-0 bg-transparent text-[13px] font-medium outline-none placeholder:text-faint"
          />
        </div>
        <button
          type="button"
          aria-label="Отправить"
          onClick={() => void send()}
          disabled={!text.trim() || sending}
          className="flex size-[42px] flex-none items-center justify-center rounded-full bg-acc text-white disabled:opacity-45"
        >
          <Icon id="send" className="size-[18px]" />
        </button>
      </div>
    </div>
  )
}
