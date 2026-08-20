// Экран 2а «Субкатегории раздела» (эталон: S11): «Живой скот» — те же плитки
// 3 в ряд, что и корневые категории. Виды скота — фильтры extra.kind (LS_TILES).
import { useNavigate } from 'react-router'
import { HeadAction, SHead } from '../../ui/SHead'
import { TabBar } from '../../ui/TabBar'
import { CatGrid } from './Cats'
import { LIVESTOCK_SUBCATS, MARKET_TABS } from './sections'

export default function Subcats() {
  const nav = useNavigate()
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <div className="flex-1">
        <SHead
          title="Живой скот"
          backTo="/market"
          actions={<HeadAction icon="search" label="Поиск" onPress={() => nav('/search')} />}
        />
        <CatGrid cats={LIVESTOCK_SUBCATS} className="pt-1.5" />
      </div>
      <TabBar items={MARKET_TABS} />
    </div>
  )
}
