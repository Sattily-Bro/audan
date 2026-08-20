// Карточка вакансии (эталон: S28). Оплата первой и крупно, чипы условий,
// пары «График/Оформление/…» из extra, описание, строка работодателя → /employer/:key.
// «Откликнуться» → gigs.respond, повторный отклик невозможен.
// API: gigs.get → { gig, employer, responded }.
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { api } from '../../api/client'
import { useData } from '../../lib/useData'
import { Icon } from '../../ui/Icon'
import { SHead, HeadAction } from '../../ui/SHead'
import type { MockEmployer, MockGig } from '../../mocks/db'
import { digits, shareLink } from './util'

interface GigDetail {
  gig: MockGig
  employer: MockEmployer | null
  responded: boolean
}

export default function VacDetail() {
  const { id } = useParams()
  const { data, loading, error } = useData<GigDetail>('gigs.get', { id })
  const [fav, setFav] = useState(false)
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [sendErr, setSendErr] = useState('')

  const gig = data?.gig
  const emp = data?.employer ?? null
  const responded = sent || Boolean(data?.responded)

  function respond() {
    if (!id || responded || busy) return
    setBusy(true)
    setSendErr('')
    api('gigs.respond', { id })
      .then(() => setSent(true))
      .catch(() => setSendErr('Не получилось отправить отклик — попробуйте ещё раз'))
      .finally(() => setBusy(false))
  }

  return (
    <div className="flex min-h-dvh flex-col bg-card">
      <div className="flex-1 pb-3">
        <SHead
          title="Вакансия"
          actions={
            <>
              <HeadAction icon="share" label="Поделиться" onPress={shareLink} />
              <HeadAction icon={fav ? 'heart-filled' : 'heart'} label="В сохранённые" onPress={() => setFav(!fav)} />
            </>
          }
        />

        {loading && (
          <div className="px-[18px] pt-2">
            <div className="h-7 w-40 animate-pulse rounded-lg bg-line/60" />
            <div className="mt-3 h-5 w-64 animate-pulse rounded-lg bg-line/60" />
            <div className="mt-6 h-32 animate-pulse rounded-2xl bg-line/60" />
          </div>
        )}
        {error && <p className="px-5 py-6 text-center text-[12.5px] font-semibold text-mut">{error}</p>}

        {gig && (
          <div className="px-[18px] pt-1">
            <div className="num text-[24px] font-extrabold tracking-tight">{gig.pay}</div>
            <div className="mt-1 text-[17px] leading-snug font-bold">{gig.title}</div>
            <div className="mt-[3px] text-[12.5px] font-medium text-mut">{gig.employerLine}</div>

            {gig.tags.length > 0 && (
              <div className="mt-3.5 flex flex-wrap gap-[7px]">
                {gig.tags.map((t) => (
                  <i key={t} className="rounded-full bg-soft px-3 py-1.5 text-[11.5px] font-semibold text-[#3A3833] not-italic">{t}</i>
                ))}
              </div>
            )}

            {/* пары условий из extra */}
            <div className="mt-3.5 border-t border-[#F0EDE6]">
              {Object.entries(gig.extra).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b border-paper py-[9px] text-[13px]">
                  <span className="font-medium text-mut">{k}</span>
                  <span className="text-right font-semibold">{v}</span>
                </div>
              ))}
            </div>

            <div className="pt-3.5">
              <h6 className="mb-2 text-[13.5px] font-extrabold">Описание</h6>
              <p className="text-[13px] leading-[1.5] text-[#3A3833]">{gig.description}</p>
            </div>

            {/* работодатель — строкой, тап ведёт на его страницу */}
            {emp && (
              <Link to={`/employer/${emp.key}`} className="flex items-center gap-[11px] pt-[13px] pb-1">
                <span className="flex size-10 flex-none items-center justify-center rounded-full text-[14px] font-extrabold text-white" style={{ background: emp.color }}>
                  {emp.letter}
                </span>
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-bold">{emp.name}</span>
                  <span className="mt-px block truncate text-[11.5px] font-medium text-mut">{emp.sub}</span>
                </span>
                <Icon id="chevron-right" className="ml-auto size-4 flex-none text-[#C5C1B7]" />
              </Link>
            )}

            {sendErr && <p className="pt-2 text-[12px] font-semibold text-danger">{sendErr}</p>}
          </div>
        )}
      </div>

      {/* нижняя панель: отклик + звонок */}
      {gig && (
        <div className="sticky bottom-0 flex gap-2 border-t border-black/8 bg-card px-4 pt-2.5 pb-[max(env(safe-area-inset-bottom),10px)]">
          <button
            type="button"
            onClick={respond}
            disabled={responded || busy}
            className={
              'flex h-12 flex-1 items-center justify-center gap-2 rounded-[14px] text-[14px] font-bold text-white transition-colors ' +
              (responded ? 'bg-ok' : 'bg-acc')
            }
          >
            <Icon id={responded ? 'check-circle' : 'document'} className="size-[18px]" />
            {responded ? 'Отклик отправлен' : busy ? 'Отправляем…' : 'Откликнуться'}
          </button>
          {emp?.phone && (
            <a
              href={`tel:+${digits(emp.phone)}`}
              aria-label="Позвонить"
              className="flex size-12 items-center justify-center rounded-[14px] border-[1.5px] border-line text-ink"
            >
              <Icon id="phone" className="size-[19px]" />
            </a>
          )}
        </div>
      )}
    </div>
  )
}
