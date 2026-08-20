// Экран «Новый пост» (эталон: S33). Текст, тег, медиа до 30 секунд (плейсхолдер),
// «Опубликовать» активна при непустом тексте → feed.create → в ленту.
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { api } from '../../api/client'
import { Icon } from '../../ui/Icon'
import { SHead } from '../../ui/SHead'

const MAX = 500
const TAGS = ['#безтемы', '#вопрос', '#продам']

export default function Compose() {
  const nav = useNavigate()
  const [text, setText] = useState('')
  const [tag, setTag] = useState(TAGS[0])
  const [busy, setBusy] = useState(false)

  const ready = text.trim().length > 0 && !busy

  async function publish() {
    if (!ready) return
    setBusy(true)
    try {
      await api('feed.create', { text: text.trim() })
      nav('/feed')
    } catch {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-paper pb-[max(env(safe-area-inset-bottom),8px)]">
      <SHead title="Новый пост" backTo="/feed" />

      {/* текст (эталон: .cp-area) + счётчик символов */}
      <div className="mx-4 mb-3 rounded-2xl bg-card px-[15px] py-3.5 shadow-[0_1px_3px_rgba(20,20,25,.06)]">
        <textarea
          value={text}
          maxLength={MAX}
          onChange={(e) => setText(e.target.value)}
          placeholder="Что нового в Шу?"
          className="min-h-[120px] w-full resize-none bg-transparent text-[14.5px] leading-6 font-medium outline-none placeholder:text-faint"
        />
        <div className="num text-right text-[10.5px] font-semibold text-faint">
          {text.length} / {MAX}
        </div>
      </div>

      {/* тег поста (эталон: .cp-tag) */}
      <div className="flex gap-[7px] px-4 pb-3">
        {TAGS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTag(t)}
            className={
              'rounded-full px-3.5 py-2 text-[12px] font-bold transition-colors ' +
              (t === tag ? 'bg-ink text-white' : 'bg-card shadow-[0_1px_3px_rgba(20,20,25,.06)]')
            }
          >
            {t}
          </button>
        ))}
      </div>

      {/* медиа — плейсхолдер, ограничение из старого кода */}
      <div className="px-4 pb-3">
        <div className="pb-2 text-[12.5px] font-bold">
          Фото или видео <span className="font-medium text-faint">— до 30 сек</span>
        </div>
        <div className="flex size-[72px] flex-col items-center justify-center gap-[3px] rounded-xl border-[1.5px] border-dashed border-[#D4D4D8] bg-card text-[9.5px] font-semibold text-mut">
          <Icon id="plus" className="size-[18px] text-acc" />
          добавить
        </div>
      </div>

      <button
        type="button"
        onClick={() => void publish()}
        disabled={!ready}
        className="mx-4 mt-auto mb-5 flex h-[50px] items-center justify-center rounded-[14px] bg-acc text-[14.5px] font-bold text-white transition-opacity disabled:opacity-45"
      >
        {busy ? 'Публикуем…' : 'Опубликовать'}
      </button>
    </div>
  )
}
