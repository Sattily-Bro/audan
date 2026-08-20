// Экран «Работа» (эталон: S8). Сегмент Вакансии/Подработка, плитки крупных
// работодателей (biotech/depo/agro — со страницей), список вакансий .vac.
// API: gigs.list → { gigs, employers }.
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useData } from '../../lib/useData'
import { Icon } from '../../ui/Icon'
import { SHead } from '../../ui/SHead'
import { SecLbl } from '../../ui/kit'
import { TabBar, type TabItem } from '../../ui/TabBar'
import type { MockEmployer, MockGig } from '../../mocks/db'
import { plural } from './util'

interface GigsList {
  gigs: MockGig[]
  employers: MockEmployer[]
}

const JOBS_TABS: TabItem[] = [
  { icon: 'home', label: 'Главная', to: '/', end: true },
  { icon: 'svc-jobs', label: 'Вакансии', to: '/jobs', end: true },
  { icon: 'document', label: 'Мои заявки', to: '/jobs/my' },
]

/** Работодатели со своей страницей в духе hh */
const LINKED = new Set(['biotech', 'depo', 'agro'])

export default function Jobs() {
  const [params] = useSearchParams()
  const [kind, setKind] = useState<'vacancy' | 'gig'>(params.get('kind') === 'gig' ? 'gig' : 'vacancy')
  const [allEmps, setAllEmps] = useState(false)
  const { data, loading, error } = useData<GigsList>('gigs.list')

  const gigs = (data?.gigs ?? []).filter((g) => g.kind === kind)
  const employers = data?.employers ?? []
  const shown = allEmps ? employers : employers.slice(0, 3)
  const rest = employers.length - shown.length

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <div className="flex-1 pb-3">
        <SHead
          title="Работа"
          actions={<Link to="/favs" aria-label="Сохранённые" className="flex size-[38px] items-center justify-center rounded-full bg-card shadow-[0_1px_3px_rgba(20,20,25,.08)]"><Icon id="heart" className="size-[17px]" /></Link>}
        />

        {/* сегмент Вакансии / Подработка */}
        <div className="mx-4 mb-3.5 flex rounded-[13px] bg-[#EAE7DF] p-[3px]">
          {([['vacancy', 'Вакансии'], ['gig', 'Подработка']] as const).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={
                'flex-1 rounded-[10px] py-[9px] text-center text-[12.5px] font-bold transition-colors ' +
                (kind === k ? 'bg-card text-ink shadow-[0_1px_3px_rgba(20,20,25,.10)]' : 'text-[#6C6A62]')
              }
            >
              {label}
            </button>
          ))}
        </div>

        {/* крупные работодатели */}
        <SecLbl
          title="Крупные работодатели"
          right={employers.length > 3 && (
            <button type="button" onClick={() => setAllEmps(!allEmps)} className="text-[12px] font-bold text-acc">
              {allEmps ? 'Свернуть' : 'Все'}
            </button>
          )}
        />
        <div className="mb-3 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {shown.map((e) => <EmpTile key={e.key} emp={e} gigs={data?.gigs ?? []} />)}
          {!allEmps && rest > 0 && (
            <button
              type="button"
              onClick={() => setAllEmps(true)}
              className="w-[104px] flex-none rounded-[14px] bg-card px-2.5 py-3 text-center shadow-[0_1px_3px_rgba(20,20,25,.06)]"
            >
              <span className="mx-auto mb-[7px] flex size-10 items-center justify-center rounded-xl bg-[#7A4A96] text-[15px] font-extrabold text-white">+</span>
              <span className="block text-[11px] leading-tight font-bold">Ещё {rest}</span>
              <span className="mt-0.5 block text-[10px] font-medium text-mut">{plural(rest, 'работодатель', 'работодателя', 'работодателей')}</span>
            </button>
          )}
          {loading && Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-[92px] w-[104px] flex-none animate-pulse rounded-[14px] bg-line/60" />
          ))}
        </div>

        {/* список вакансий / подработок */}
        {gigs.map((g) => <VacCard key={g.key} gig={g} />)}
        {loading && Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="mx-4 mb-2 h-[96px] animate-pulse rounded-2xl bg-line/60" />
        ))}
        {error && <p className="px-5 py-3 text-center text-[12.5px] font-semibold text-mut">{error}</p>}
      </div>

      <TabBar items={JOBS_TABS} />
    </div>
  )
}

function EmpTile({ emp, gigs }: { emp: MockEmployer; gigs: MockGig[] }) {
  const vacs = gigs.filter((g) => g.employerKey === emp.key && g.kind === 'vacancy').length
  const tasks = gigs.filter((g) => g.employerKey === emp.key && g.kind === 'gig').length
  const count = vacs > 0
    ? `${vacs} ${plural(vacs, 'вакансия', 'вакансии', 'вакансий')}`
    : `${tasks} ${plural(tasks, 'задание', 'задания', 'заданий')}`
  const body = (
    <>
      <span className="mx-auto mb-[7px] flex size-10 items-center justify-center rounded-xl text-[15px] font-extrabold text-white" style={{ background: emp.color }}>
        {emp.letter}
      </span>
      <span className="block text-[11px] leading-tight font-bold">{emp.name}</span>
      <span className="num mt-0.5 block text-[10px] font-medium text-mut">{count}</span>
    </>
  )
  const cls = 'w-[104px] flex-none rounded-[14px] bg-card px-2.5 py-3 text-center shadow-[0_1px_3px_rgba(20,20,25,.06)]'
  return LINKED.has(emp.key)
    ? <Link to={`/employer/${emp.key}`} className={cls}>{body}</Link>
    : <div className={cls}>{body}</div>
}

/** Карточка вакансии .vac — используется и на странице работодателя */
export function VacCard({ gig }: { gig: MockGig }) {
  return (
    <Link to={`/vacancy/${gig.key}`} className="mx-4 mb-2 block rounded-2xl bg-card px-[15px] py-[13px] shadow-[0_1px_3px_rgba(20,20,25,.06)]">
      <div className="num text-[15.5px] font-extrabold tracking-tight text-acc-d">{gig.pay}</div>
      <div className="mt-[3px] text-[13.5px] leading-[1.3] font-bold">{gig.title}</div>
      <div className="mt-0.5 text-[11.5px] font-medium text-mut">{gig.employerLine}</div>
      {gig.tags.length > 0 && (
        <div className="mt-[9px] flex flex-wrap gap-1.5">
          {gig.tags.map((t) => (
            <i key={t} className="rounded-full bg-paper px-[9px] py-1 text-[10.5px] font-semibold text-[#3A3833] not-italic">{t}</i>
          ))}
        </div>
      )}
    </Link>
  )
}
