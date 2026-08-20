// Экран 1 «Главная» (эталон: S0). Сверху вниз: шапка с тегом города и языком,
// поиск, карусель промо, сервисы, карта-карточка, строка активного заказа,
// лента «Новые объявления». API: home.summary.
import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { fmtT } from '../../lib/format'
import { useData } from '../../lib/useData'
import { getLang, langShort, setLang, type Lang } from '../../state/prefs'
import { Icon } from '../../ui/Icon'
import { SecLbl, Photo } from '../../ui/kit'
import { HOME_TABS, TabBar } from '../../ui/TabBar'
import type { MockAd } from '../../mocks/db'

interface HomeSummary {
  banners: { id: number; title: string; sub: string }[]
  activeOrder: { id: number; seq: number; restKey: string; status: string } | null
  freshAds: MockAd[]
  adsTotal: number
}

const SERVICES = [
  { icon: 'svc-market', label: 'Объявления', to: '/market' },
  { icon: 'svc-food', label: 'Еда', to: '/food' },
  { icon: 'svc-jobs', label: 'Работа', to: '/jobs' },
  { icon: 'svc-gigs', label: 'Подработка', to: '/jobs' },
  { icon: 'svc-masters', label: 'Мастера', to: '/services' },
  { icon: 'svc-feed', label: 'Лента', to: '/feed' },
  { icon: 'svc-stories', label: 'Stories', to: '/stories' },
  { icon: 'svc-news', label: 'Новости', to: '/feed' },
]

const ORDER_STATUS: Record<string, string> = {
  pending: 'ждёт заведение',
  accepted: 'счёт выставлен',
  paid: 'оплата отмечена',
  preparing: 'готовится',
  ready: 'готов',
  courier: 'едет к вам',
}

const BANNER_BG = [
  'linear-gradient(120deg,var(--acc-d),var(--acc))',
  'linear-gradient(120deg,#5B3A6E,#8A57A6)',
  'linear-gradient(120deg,#1F6B4A,#2E9E6B)',
]

export default function Home() {
  const nav = useNavigate()
  const { data, loading } = useData<HomeSummary>('home.summary')
  const [lang, setLangState] = useState<Lang>(getLang)
  const [ddOpen, setDdOpen] = useState(false)
  const [dot, setDot] = useState(0)
  const stripRef = useRef<HTMLDivElement>(null)

  function pickLang(v: Lang) {
    setLang(v)
    setLangState(v)
    setDdOpen(false)
  }

  return (
    <div className="flex min-h-dvh flex-col bg-paper" onClick={() => ddOpen && setDdOpen(false)}>
      <div className="flex-1 pb-2">
        {/* шапка: логотип · тег города · колокольчик · язык */}
        <header className="flex items-center gap-2 px-5 pt-3 pb-2.5">
          <div className="text-[19px] font-extrabold tracking-tight">
            Audan<span className="text-acc">.</span>kz
          </div>
          <span className="ml-1 rounded-lg bg-acc px-2.5 py-[5px] text-[12.5px] font-extrabold text-white">Shu</span>
          <Link
            to="/notify"
            aria-label="Уведомления"
            className="relative ml-auto flex size-[38px] items-center justify-center rounded-full bg-card shadow-[0_1px_3px_rgba(20,20,25,.08)]"
          >
            <Icon id="bell" className="size-[18px]" />
            <i className="absolute top-2 right-2 size-2 rounded-full border-2 border-card bg-acc" />
          </Link>
          <div className="relative">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setDdOpen(!ddOpen) }}
              className="flex h-[38px] items-center gap-1 rounded-full bg-card px-3 text-[11.5px] font-extrabold tracking-wider shadow-[0_1px_3px_rgba(20,20,25,.08)]"
            >
              {langShort(lang)}
              <Icon id="chevron-down" className="size-[11px] text-mut" />
            </button>
            {ddOpen && (
              <div className="absolute top-11 right-0 z-40 min-w-[112px] rounded-[13px] bg-card p-[5px] shadow-[0_8px_28px_rgba(20,20,25,.18)]">
                {(['Қазақша', 'Русский'] as Lang[]).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); pickLang(v) }}
                    className={
                      'flex w-full items-center gap-3 rounded-[9px] px-3 py-2.5 text-[12px] font-extrabold tracking-wider ' +
                      (v === lang ? 'bg-acc-bg' : '')
                    }
                  >
                    {langShort(v)}
                    <Icon id="check" className={'ml-auto size-3.5 text-acc-d ' + (v === lang ? '' : 'opacity-0')} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* поиск */}
        <Link
          to="/search"
          className="mx-5 mb-3 flex items-center gap-2.5 rounded-[14px] bg-card px-4 py-[13px] text-[14.5px] font-medium text-mut shadow-[0_1px_3px_rgba(20,20,25,.06)]"
        >
          <Icon id="search" className="size-[18px]" />
          Поиск: iPhone, электрик, самса…
        </Link>

        {/* промо-карусель */}
        <div
          ref={stripRef}
          onScroll={() => {
            const el = stripRef.current
            if (el) setDot(Math.round(el.scrollLeft / 310))
          }}
          className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {(data?.banners ?? []).map((b, i) => (
            <div
              key={b.id}
              className="relative flex h-[132px] w-[300px] flex-none snap-start flex-col justify-end overflow-hidden rounded-2xl p-4"
              style={{ background: BANNER_BG[i % BANNER_BG.length] }}
            >
              <BannerArt i={i} />
              <div className="max-w-[78%] text-[16.5px] leading-tight font-extrabold text-white">{b.title}</div>
              <div className="mt-1 text-[11.5px] font-semibold text-white/85">{b.sub}</div>
            </div>
          ))}
          {loading && <div className="h-[132px] w-[300px] flex-none animate-pulse rounded-2xl bg-line/60" />}
        </div>
        <div className="flex justify-center gap-[5px] pt-2.5 pb-0.5">
          {[0, 1, 2].map((i) => (
            <i
              key={i}
              className={'h-[5px] rounded-full transition-all ' + (i === dot ? 'w-4 bg-acc' : 'w-[5px] bg-[#CFCBC1]')}
            />
          ))}
        </div>

        {/* сервисы */}
        <div className="grid grid-cols-4 gap-x-1.5 gap-y-3.5 px-4 pt-2.5 pb-1.5">
          {SERVICES.map((s) => (
            <Link key={s.label} to={s.to} className="flex flex-col items-center gap-1.5">
              <i className="flex size-[52px] items-center justify-center rounded-2xl bg-card shadow-[0_1px_3px_rgba(20,20,25,.07)]">
                <Icon id={s.icon} className="size-[25px] text-acc" />
              </i>
              <span className="text-[10.5px] font-semibold">{s.label}</span>
            </Link>
          ))}
        </div>

        {/* карта-карточка */}
        <Link to="/map" className="relative mx-5 my-3 block h-[132px] overflow-hidden rounded-[18px] shadow-[0_1px_3px_rgba(20,20,25,.06)]">
          <svg className="absolute inset-0 size-full"><use href="#streets" /></svg>
          <div className="absolute top-3 right-3 left-3 flex items-center gap-2 rounded-[11px] bg-card px-3 py-2.5 text-[12.5px] font-medium text-mut shadow-[0_2px_8px_rgba(20,20,25,.12)]">
            <Icon id="search" className="size-[15px]" />
            Найти место в городе
            <b className="ml-auto flex items-center gap-1 font-bold text-ink">
              Шу
              <Icon id="chevron-down" className="size-[9px]" />
            </b>
          </div>
          <div className="absolute bottom-3 left-3 flex gap-1.5">
            {['Кафе', 'Аптеки', 'АЗС', 'Магазины'].map((c) => (
              <i key={c} className="rounded-full bg-card px-3 py-[7px] text-[11px] font-bold not-italic shadow-[0_1px_4px_rgba(20,20,25,.14)]">{c}</i>
            ))}
          </div>
        </Link>

        {/* активный заказ еды */}
        {data?.activeOrder && (
          <button
            type="button"
            onClick={() => nav(`/order/${data.activeOrder!.id}`)}
            className="mx-5 mb-3.5 flex w-[calc(100%-40px)] items-center gap-2.5 rounded-[14px] bg-ink px-3.5 py-[11px] text-white"
          >
            <span className="size-2 flex-none rounded-full bg-acc-l shadow-[0_0_0_4px_rgba(var(--acc-rgb),.25)]" />
            <span className="num min-w-0 flex-1 truncate text-left text-[12.5px] font-bold">
              Заказ №{data.activeOrder.seq} · Шу-Пюре
            </span>
            <span className="flex-none rounded-full bg-[rgba(var(--acc-rgb),.22)] px-2 py-1 text-[10.5px] font-bold text-acc-l">
              {ORDER_STATUS[data.activeOrder.status] ?? data.activeOrder.status}
            </span>
            <Icon id="chevron-right" className="size-3.5 opacity-70" />
          </button>
        )}

        {/* лента объявлений */}
        <SecLbl title="Новые объявления" right={data ? `${data.adsTotal} объявлений` : ''} />
        <div className="grid grid-cols-2 gap-2.5 px-5 pb-2">
          {(data?.freshAds ?? []).slice(0, 4).map((a) => <GCard key={a.id} ad={a} />)}
          <Link to="/place/1" className="col-span-2 flex items-center gap-3 rounded-[15px] bg-card p-3.5 shadow-[0_1px_3px_rgba(20,20,25,.06)]">
            <span className="flex size-[46px] flex-none items-center justify-center rounded-xl bg-soft text-[22px]">🏗️</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[9px] font-extrabold tracking-widest text-faint">РЕКЛАМА</span>
              <span className="block truncate text-[12.5px] font-bold">Береке Строймаркет — цемент и профлист со склада в Шу</span>
              <span className="block text-[11px] font-medium text-mut">Доставка по району в день заказа</span>
            </span>
            <Icon id="chevron-right" className="size-[15px] text-[#C5C1B7]" />
          </Link>
          {(data?.freshAds ?? []).slice(4, 8).map((a) => <GCard key={a.id} ad={a} />)}
          {loading && Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-[180px] animate-pulse rounded-[15px] bg-line/60" />
          ))}
        </div>
        <p className="px-5 pt-1.5 pb-1 text-center text-[12px] font-semibold text-mut">Листайте — подгрузим ещё</p>
      </div>

      <TabBar items={HOME_TABS} />
    </div>
  )
}

function GCard({ ad }: { ad: MockAd }) {
  return (
    <Link to={`/ad/${ad.id}`} className="overflow-hidden rounded-[15px] bg-card shadow-[0_1px_3px_rgba(20,20,25,.06)]">
      <Photo id={ad.imageIds[0]} className="h-[104px]" />
      <div className="px-3 pt-2 pb-2.5">
        <div className="num text-[14.5px] font-extrabold tracking-tight">{fmtT(ad.price)}</div>
        <div className="mt-[3px] h-[30px] overflow-hidden text-[11.5px] leading-[1.32] text-[#6C6A62]">{ad.title}</div>
        <div className="num mt-[5px] text-[10px] font-semibold text-faint">{ad.district} · {ad.createdAt}</div>
      </div>
    </Link>
  )
}

/** Иллюстрации промо-баннеров — перенесены из прототипа как есть */
function BannerArt({ i }: { i: number }) {
  if (i === 0) return (
    <svg className="absolute top-1/2 right-3 size-[58px] -translate-y-1/2" viewBox="0 0 64 64">
      <g fill="#fff" opacity=".92">
        <ellipse cx="22" cy="47" rx="14" ry="5" />
        <ellipse cx="22" cy="40" rx="14" ry="5" opacity=".75" />
        <ellipse cx="22" cy="33" rx="14" ry="5" opacity=".55" />
      </g>
      <path d="M46 38V17m0 0-8 8m8-8 8 8" stroke="#FFD166" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
  if (i === 1) return (
    <svg className="absolute top-1/2 right-3 size-[58px] -translate-y-1/2" viewBox="0 0 64 64">
      <g stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="16" cy="49" r="6.5" />
        <circle cx="48" cy="49" r="6.5" />
        <path d="M16 49h17l7-15h8" />
        <path d="M42 24h7v7" />
      </g>
      <rect x="22" y="19" width="15" height="12" rx="3.5" fill="#FFD166" />
    </svg>
  )
  return (
    <svg className="absolute top-1/2 right-3 size-[58px] -translate-y-1/2" viewBox="0 0 64 64">
      <g fill="#fff" opacity=".93">
        <rect x="7" y="31" width="50" height="24" rx="2.5" />
        <rect x="13" y="15" width="7" height="16" rx="1" />
        <rect x="30" y="9" width="7" height="22" rx="1" />
      </g>
      <g fill="rgba(0,0,0,.28)">
        <rect x="14" y="37" width="9" height="9" rx="1.5" />
        <rect x="28" y="37" width="9" height="9" rx="1.5" />
        <rect x="42" y="37" width="9" height="9" rx="1.5" />
      </g>
    </svg>
  )
}
