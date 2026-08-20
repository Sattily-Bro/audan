// Шапка экрана: назад · заголовок(+подзаголовок) · действия. Эталон: .shead прототипа.
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { Icon } from './Icon'

export function SHead({ title, sub, actions, backTo }: {
  title: string
  sub?: string
  actions?: ReactNode
  backTo?: string
}) {
  const nav = useNavigate()
  return (
    <header className="flex items-center gap-2.5 px-4 pt-3 pb-2.5">
      <button
        type="button"
        aria-label="Назад"
        onClick={() => (backTo ? nav(backTo) : nav(-1))}
        className="flex size-[38px] items-center justify-center rounded-full bg-card shadow-[0_1px_3px_rgba(20,20,25,.08)]"
      >
        <Icon id="arrow-left" className="size-[17px]" />
      </button>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[16px] font-extrabold tracking-tight">{title}</div>
        {sub && <div className="truncate text-[11px] font-semibold text-mut">{sub}</div>}
      </div>
      {actions && <div className="flex flex-none items-center gap-2">{actions}</div>}
    </header>
  )
}

/** Круглая кнопка-действие в шапке */
export function HeadAction({ icon, label, onPress }: { icon: string; label: string; onPress?: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onPress}
      className="flex size-[38px] items-center justify-center rounded-full bg-card shadow-[0_1px_3px_rgba(20,20,25,.08)]"
    >
      <Icon id={icon} className="size-[17px]" />
    </button>
  )
}
