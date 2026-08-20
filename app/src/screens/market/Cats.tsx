// Экран 2 «Базар — категории» (эталон: S1). Плоская сетка 3×3 без групп,
// чипы «Все 9» и «Сохранённые», контекстный таб-бар раздела.
// «Живой скот» открывает субкатегории того же дизайна (/market/livestock-sub).
import { Link, useNavigate } from 'react-router'
import { Icon } from '../../ui/Icon'
import { Chip } from '../../ui/kit'
import { HeadAction, SHead } from '../../ui/SHead'
import { TabBar } from '../../ui/TabBar'
import { CATS, MARKET_TABS, type MarketCat } from './sections'

export default function Cats() {
  const nav = useNavigate()
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <div className="flex-1">
        <SHead
          title="Объявления"
          backTo="/"
          actions={
            <>
              <HeadAction icon="search" label="Поиск" onPress={() => nav('/search')} />
              <HeadAction icon="heart" label="Сохранённые" onPress={() => nav('/favs')} />
            </>
          }
        />
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Chip on>Все {CATS.length}</Chip>
          <Chip onPress={() => nav('/favs')}>Сохранённые</Chip>
        </div>
        <CatGrid cats={CATS} className="pb-[22px]" />
      </div>
      <TabBar items={MARKET_TABS} />
    </div>
  )
}

/** Сетка плиток категорий 3 в ряд (эталон .cgrid3/.c3) — общая для S1 и S11 */
export function CatGrid({ cats, className }: { cats: MarketCat[]; className?: string }) {
  return (
    <div className={'grid grid-cols-3 gap-2 px-4 pb-4 ' + (className ?? '')}>
      {cats.map((c) => (
        <Link
          key={c.kind}
          to={c.to}
          className="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-2xl bg-card px-2 pt-4 pb-[13px] text-center shadow-[0_1px_3px_rgba(20,20,25,.06)]"
        >
          <Icon id={c.icon} className="size-6 text-acc" />
          <span className="text-[12px] leading-[1.2] font-bold">{c.title}</span>
        </Link>
      ))}
    </div>
  )
}
