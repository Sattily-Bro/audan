// Карточка специалиста (эталон: S15). Без нижнего меню — внизу только связь:
// WhatsApp, звонок и «Оставить отзыв» (шторка с текстовым полем, локальный стейт).
// API: services.get → { master }.
import { useState } from 'react'
import { useParams } from 'react-router'
import { useData } from '../../lib/useData'
import { Icon } from '../../ui/Icon'
import { SHead, HeadAction } from '../../ui/SHead'
import { MASTER_META, type MasterRow } from './Services'
import { digits, plural, shareLink } from './util'

interface MasterDetail {
  about?: string
  tags: string[]
  price: string
  review?: { name: string; when: string; text: string }
}

/** Подробности анкеты — из эталона S15 (services.specialist); Данибек — дословно */
const DETAILS: Record<number, MasterDetail> = {
  1: {
    about: 'Автодиагност и автоэлектрик. Выезд по Шу и посёлкам. Компьютерная диагностика, поиск обрывов, ремонт проводки, установка сигнализаций.',
    tags: ['Автодиагностика', 'Проводка', 'Сигнализации', 'Стартер и генератор'],
    price: 'Договорная · выезд по району бесплатно',
    review: { name: 'Бекзат', when: '2 недели назад', text: 'Приехал в тот же день, нашёл обрыв за полчаса. Камри завелась. Рекомендую.' },
  },
}

export default function Master() {
  const { id } = useParams()
  const { data, loading, error } = useData<{ master: MasterRow }>('services.get', { id: Number(id) })
  const [fav, setFav] = useState(false)
  const [sheet, setSheet] = useState(false)
  const [text, setText] = useState('')
  const [reviewSent, setReviewSent] = useState(false)

  const m = data?.master ?? null
  const meta = m ? (MASTER_META[m.id] ?? {}) : {}
  const detail: MasterDetail = m ? (DETAILS[m.id] ?? { tags: [m.spec], price: 'Договорная' }) : { tags: [], price: '' }

  function sendReview() {
    if (!text.trim()) return
    setReviewSent(true)
    setSheet(false)
    setText('')
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#F0EDE6]">
      <div className="flex-1 pb-3.5">
        <div className="bg-card pb-1.5">
          <SHead
            title="Мастер"
            actions={
              <>
                <HeadAction icon="share" label="Поделиться" onPress={shareLink} />
                <HeadAction icon={fav ? 'heart-filled' : 'heart'} label="В сохранённые" onPress={() => setFav(!fav)} />
              </>
            }
          />
        </div>

        {loading && <div className="m-4 h-48 animate-pulse rounded-2xl bg-line/60" />}
        {error && <p className="px-5 py-6 text-center text-[12.5px] font-semibold text-mut">{error}</p>}

        {m && (
          <>
            {/* герой: аватар, имя, роль, статистика */}
            <div className="bg-card px-5 pt-[18px] pb-4 text-center">
              <span className="mx-auto mb-[11px] flex size-[78px] items-center justify-center rounded-[26px] bg-[#EFE4D6] text-[27px] font-extrabold text-[#8A6432]">
                {m.name[0]}
              </span>
              <h5 className="text-[20px] font-extrabold tracking-tight">{m.name}</h5>
              <div className="mt-[3px] text-[13px] font-semibold text-[#6C6A62]">{m.spec} · {m.district}</div>
              <div className="mt-3.5 flex justify-center gap-[26px]">
                {([
                  [m.rating, 'рейтинг'],
                  [String(m.jobs), plural(m.jobs, 'работа', 'работы', 'работ')],
                  meta.online ? ['Онлайн', 'сейчас'] : [m.district, 'район'],
                ] as const).map(([a, b]) => (
                  <div key={b} className="text-center">
                    <div className="num text-[15px] font-extrabold">{a}</div>
                    <div className="mt-px text-[10.5px] font-semibold text-mut">{b}</div>
                  </div>
                ))}
              </div>
            </div>

            {detail.about && (
              <div className="mt-2.5 bg-card px-5 py-[15px]">
                <h6 className="mb-[9px] text-[13.5px] font-extrabold">О себе</h6>
                <p className="text-[13px] leading-[1.5] text-[#3A3833]">{detail.about}</p>
              </div>
            )}

            <div className="mt-2.5 bg-card px-5 py-[15px]">
              <h6 className="mb-[9px] text-[13.5px] font-extrabold">Специализации</h6>
              <div className="flex flex-wrap gap-[7px]">
                {detail.tags.map((t) => (
                  <i className="rounded-full bg-acc-bg px-3 py-1.5 text-[11.5px] font-semibold text-acc-d not-italic" key={t}>{t}</i>
                ))}
              </div>
            </div>

            <div className="mt-2.5 bg-card px-5 py-[15px]">
              <h6 className="mb-[9px] text-[13.5px] font-extrabold">Цена</h6>
              <p className="text-[13px] font-bold text-[#3A3833]">{detail.price}</p>
              {detail.review && (
                <div className="mt-3 border-t border-[#F0EDE6] pt-3">
                  <div className="flex items-center gap-[9px]">
                    <i className="flex size-[30px] items-center justify-center rounded-full bg-[#E4EBF5] text-[12px] font-extrabold text-[#3E6B8E] not-italic">
                      {detail.review.name[0]}
                    </i>
                    <div>
                      <div className="text-[12.5px] font-bold">{detail.review.name}</div>
                      <div className="text-[10.5px] font-semibold text-mut">{detail.review.when}</div>
                    </div>
                    <span className="ml-auto text-[11.5px] font-bold text-warn">★★★★★</span>
                  </div>
                  <p className="mt-[7px] text-[12.5px] leading-[1.45] text-[#3A3833]">{detail.review.text}</p>
                </div>
              )}
              {reviewSent ? (
                <div className="mt-3 flex items-center justify-center gap-2 rounded-[13px] bg-[#E6F4EB] py-3 text-[13px] font-bold text-ok">
                  <Icon id="check-circle" className="size-[17px]" />
                  Отзыв отправлен
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setSheet(true)}
                  className="mt-3 w-full rounded-[13px] py-3 text-[13px] font-bold text-ink shadow-[inset_0_0_0_1.5px_var(--color-line)]"
                >
                  Оставить отзыв
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* связь с мастером */}
      {m && (
        <div className="sticky bottom-0 flex gap-2 border-t border-black/8 bg-card px-4 pt-2.5 pb-[max(env(safe-area-inset-bottom),10px)]">
          <a
            href={`https://wa.me/${digits(m.phone)}`}
            target="_blank"
            rel="noreferrer"
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-[14px] bg-acc text-[14px] font-bold text-white"
          >
            <Icon id="chat" className="size-[18px]" />
            WhatsApp
          </a>
          <a
            href={`tel:+${digits(m.phone)}`}
            aria-label="Позвонить"
            className="flex size-12 items-center justify-center rounded-[14px] border-[1.5px] border-line bg-card text-ink"
          >
            <Icon id="phone" className="size-[19px]" />
          </a>
          <button
            type="button"
            aria-label="Оставить отзыв"
            onClick={() => setSheet(true)}
            className="flex size-12 items-center justify-center rounded-[14px] border-[1.5px] border-line bg-card text-ink"
          >
            <Icon id="star-filled" className="size-[19px]" />
          </button>
        </div>
      )}

      {/* шторка отзыва */}
      {sheet && m && (
        <div className="fixed inset-0 z-50 flex items-end" role="dialog" aria-label="Оставить отзыв">
          <button type="button" aria-label="Закрыть" onClick={() => setSheet(false)} className="absolute inset-0 bg-black/40" />
          <div className="relative w-full rounded-t-[22px] bg-card px-5 pt-3 pb-[max(env(safe-area-inset-bottom),18px)]">
            <i className="mx-auto mb-3.5 block h-1 w-9 rounded-full bg-line" />
            <div className="text-[16px] font-extrabold tracking-tight">Отзыв о мастере</div>
            <div className="mt-0.5 text-[12px] font-semibold text-mut">{m.name} · {m.spec}</div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Расскажите, как прошла работа…"
              className="mt-3.5 min-h-[110px] w-full resize-none rounded-[13px] bg-field p-3.5 text-[13.5px] font-medium text-ink outline-none placeholder:text-faint"
            />
            <button
              type="button"
              onClick={sendReview}
              disabled={!text.trim()}
              className="mt-3 flex h-12 w-full items-center justify-center rounded-[14px] bg-acc text-[14px] font-bold text-white disabled:opacity-40"
            >
              Отправить отзыв
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
