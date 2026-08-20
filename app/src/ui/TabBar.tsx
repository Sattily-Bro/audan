// Контекстный нижний таб-бар (правило прототипа: первым пунктом всегда «Главная»,
// у каждого раздела свои 3-4 вкладки, карточки и формы — без бара).
import { NavLink } from 'react-router'
import { Icon } from './Icon'

export interface TabItem {
  icon: string
  label: string
  to: string
  /** точное совпадение пути для подсветки (по умолчанию — префикс) */
  end?: boolean
}

export function TabBar({ items }: { items: TabItem[] }) {
  return (
    <nav className="sticky bottom-0 z-10 border-t border-black/8 bg-card pb-[max(env(safe-area-inset-bottom),8px)]">
      <div className="flex h-[56px] items-stretch px-2.5 pt-2">
        {items.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              'flex min-w-0 flex-1 flex-col items-center gap-[3px] pt-1 text-[10.5px] font-semibold whitespace-nowrap ' +
              (isActive ? 'text-ink' : 'text-[#9B9BA1]')
            }
          >
            {({ isActive }) => (
              <>
                <Icon id={t.icon} className={'size-[23px] ' + (isActive ? 'text-acc' : '')} />
                {t.label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export const HOME_TABS: TabItem[] = [
  { icon: 'home', label: 'Главная', to: '/', end: true },
  { icon: 'svc-market', label: 'Базар', to: '/market' },
  { icon: 'svc-food', label: 'Еда', to: '/food' },
  { icon: 'user', label: 'Профиль', to: '/profile' },
]
