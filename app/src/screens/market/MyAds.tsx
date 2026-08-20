// Экран 32 «Мои объявления» (эталон: S31). Состояния из HANDOFF §6: активно
// (просмотры и сердца), на проверке, архив; фильтры-чипы. API: market.my.
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useData } from '../../lib/useData'
import type { MockAd } from '../../mocks/db'
import { Icon } from '../../ui/Icon'
import { Chip } from '../../ui/kit'
import { HeadAction, SHead } from '../../ui/SHead'
import { TabBar } from '../../ui/TabBar'
import { AdRow } from './AdRow'
import { MARKET_TABS_MY } from './sections'

interface MyAd extends MockAd {
  views: number
  favs: number
}

type MyFilter = 'all' | 'act' | 'mod' | 'arch'
const FILTER_LABEL: Record<Exclude<MyFilter, 'all'>, string> = {
  act: 'Активные',
  mod: 'На проверке',
  arch: 'Архив',
}

/** Статус объявления → группа фильтра (HANDOFF §6) */
function groupOf(ad: MyAd): Exclude<MyFilter, 'all'> {
  if (ad.status === 'На проверке') return 'mod'
  if (ad.status === 'Опубликовано') return 'act'
  return 'arch'
}

export default function MyAds() {
  const nav = useNavigate()
  const { data, loading, error } = useData<{ ads: MyAd[] }>('market.my')
  const [filter, setFilter] = useState<MyFilter>('all')

  const all = data?.ads ?? []
  const ads = filter === 'all' ? all : all.filter((a) => groupOf(a) === filter)

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <div className="flex-1 pb-2">
        <SHead
          title="Мои объявления"
          backTo="/market"
          actions={<HeadAction icon="plus" label="Подать объявление" onPress={() => nav('/market/new')} />}
        />
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Chip on={filter === 'all'} onPress={() => setFilter('all')}>Все {all.length}</Chip>
          {(Object.keys(FILTER_LABEL) as Exclude<MyFilter, 'all'>[]).map((f) => (
            <Chip key={f} on={filter === f} onPress={() => setFilter(f)}>{FILTER_LABEL[f]}</Chip>
          ))}
        </div>

        {ads.map((a) => {
          const g = groupOf(a)
          return (
            <AdRow
              key={a.id}
              ad={a}
              chevron
              className={g === 'arch' ? 'opacity-[.72]' : ''}
              stats={
                <span className="mt-1.5 flex items-center gap-2.5 text-[10.5px] font-bold text-mut">
                  {g === 'act' && <span className="rounded-[7px] bg-[#E6F4EB] px-2 py-[3px] text-[10px] font-bold text-ok">Активно</span>}
                  {g === 'mod' && <span className="rounded-[7px] bg-[#FFF0CC] px-2 py-[3px] text-[10px] font-bold text-[#8A6410]">На проверке</span>}
                  {g === 'arch' && <span className="rounded-[7px] bg-field px-2 py-[3px] text-[10px] font-bold text-[#6C6A62]">Снято</span>}
                  {g !== 'mod' && (
                    <>
                      <span className="num flex items-center gap-1"><Icon id="eye" className="size-3" />{a.views}</span>
                      <span className="num flex items-center gap-1"><Icon id="heart" className="size-3" />{a.favs}</span>
                    </>
                  )}
                </span>
              }
              meta={
                g === 'act' ? 'истекает через 26 дней'
                  : g === 'mod' ? 'обычно проверяем до 2 часов'
                    : 'в архиве'
              }
            />
          )
        })}

        {loading && Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="mx-4 mb-2 h-[107px] animate-pulse rounded-2xl bg-line/60" />
        ))}
        {error && <p className="px-8 pt-14 text-center text-[13px] font-semibold text-danger">{error}</p>}

        {/* пустые состояния: совсем пусто / пусто в выбранном фильтре */}
        {!loading && !error && all.length === 0 && (
          <div className="px-8 pt-16 text-center">
            <p className="text-[15px] font-bold">У вас пока нет объявлений</p>
            <p className="mt-1.5 text-[12.5px] font-medium text-mut">
              Подайте первое — покупатели в Шу уже ищут.
            </p>
            <button
              type="button"
              onClick={() => nav('/market/new')}
              className="mx-auto mt-5 flex h-12 items-center justify-center rounded-[14px] bg-acc px-6 text-[14px] font-bold text-white"
            >
              Подать объявление
            </button>
          </div>
        )}
        {!loading && !error && all.length > 0 && ads.length === 0 && (
          <p className="px-8 pt-14 text-center text-[13px] font-semibold text-mut">
            В этом списке пока пусто.
          </p>
        )}
      </div>

      <TabBar items={MARKET_TABS_MY} />
    </div>
  )
}
