// Страница работодателя в духе hh (эталон: S34): лого-буква на фирменном цвете,
// отрасль, фото, метрики (вакансии · сотрудники · % ответов), «О компании»,
// открытые вакансии списком. Данные — из gigs.list (employers + gigs по employerKey).
import { useParams } from 'react-router'
import { useData } from '../../lib/useData'
import { Icon } from '../../ui/Icon'
import { SHead, HeadAction } from '../../ui/SHead'
import { Photo, SecLbl } from '../../ui/kit'
import type { MockEmployer, MockGig } from '../../mocks/db'
import { VacCard } from './Jobs'
import { digits, plural, shareLink } from './util'

interface GigsList {
  gigs: MockGig[]
  employers: MockEmployer[]
}

export default function Employer() {
  const { id } = useParams()
  const { data, loading, error } = useData<GigsList>('gigs.list')

  const emp = data?.employers.find((e) => e.key === id) ?? null
  const vacs = (data?.gigs ?? []).filter((g) => g.employerKey === id)

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <div className="flex-1 pb-3">
        <SHead title="Компания" actions={<HeadAction icon="share" label="Поделиться" onPress={shareLink} />} />

        {loading && (
          <>
            <div className="mx-4 mb-3 h-[86px] animate-pulse rounded-[18px] bg-line/60" />
            <div className="mx-4 mb-3 h-[118px] animate-pulse rounded-2xl bg-line/60" />
          </>
        )}
        {error && <p className="px-5 py-6 text-center text-[12.5px] font-semibold text-mut">{error}</p>}
        {!loading && data && !emp && (
          <p className="px-5 py-6 text-center text-[12.5px] font-semibold text-mut">Работодатель не найден</p>
        )}

        {emp && (
          <>
            {/* шапка компании */}
            <div className="mx-4 mb-3 flex items-center gap-[13px] rounded-[18px] bg-card px-4 py-[15px] shadow-[0_1px_3px_rgba(20,20,25,.06)]">
              <span className="flex size-14 flex-none items-center justify-center rounded-[18px] text-[19px] font-extrabold text-white" style={{ background: emp.color }}>
                {emp.letter}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[16px] font-extrabold tracking-tight">{emp.name}</span>
                <span className="mt-0.5 block text-[12px] font-medium text-mut">{emp.sub}</span>
              </span>
            </div>

            <Photo id={emp.imageId} className="mx-4 mb-3 h-[118px] rounded-2xl shadow-[0_1px_3px_rgba(20,20,25,.06)]" />

            {/* метрики */}
            <div className="mx-4 mb-3.5 flex gap-2">
              {([
                [String(vacs.length), plural(vacs.length, 'вакансия', 'вакансии', 'вакансий')],
                [emp.staff, 'сотрудников'],
                [emp.answerRate, 'отвечают на отклики'],
              ] as const).map(([a, b]) => (
                <div key={b} className="flex-1 rounded-[14px] bg-card px-[13px] py-[11px] shadow-[0_1px_3px_rgba(20,20,25,.05)]">
                  <div className="num text-[15px] font-extrabold tracking-tight">{a}</div>
                  <div className="mt-0.5 text-[10px] font-semibold text-mut">{b}</div>
                </div>
              ))}
            </div>

            {/* о компании */}
            <div className="mx-4 mb-3 rounded-2xl bg-card px-4 py-3.5 shadow-[0_1px_3px_rgba(20,20,25,.06)]">
              <div className="mb-1.5 text-[13.5px] font-extrabold">О компании</div>
              <p className="text-[13px] leading-[1.5] text-[#3A3833]">{emp.about}</p>
            </div>

            <SecLbl title="Открытые вакансии" right={String(vacs.length)} />
            {vacs.map((g) => <VacCard key={g.key} gig={g} />)}
            {vacs.length === 0 && (
              <p className="px-5 py-2 text-center text-[12.5px] font-semibold text-mut">Открытых вакансий сейчас нет</p>
            )}
          </>
        )}
      </div>

      {/* связь с HR */}
      {emp?.phone && (
        <div className="sticky bottom-0 flex gap-2 border-t border-black/8 bg-card px-4 pt-2.5 pb-[max(env(safe-area-inset-bottom),10px)]">
          <a
            href={`https://wa.me/${digits(emp.phone)}`}
            target="_blank"
            rel="noreferrer"
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-[14px] bg-acc text-[14px] font-bold text-white"
          >
            <Icon id="chat" className="size-[18px]" />
            Написать HR в WhatsApp
          </a>
          <a
            href={`tel:+${digits(emp.phone)}`}
            aria-label="Позвонить"
            className="flex size-12 items-center justify-center rounded-[14px] border-[1.5px] border-line bg-card text-ink"
          >
            <Icon id="phone" className="size-[19px]" />
          </a>
        </div>
      )}
    </div>
  )
}
