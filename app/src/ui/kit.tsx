// Мелкие общие элементы (эталоны: .sec-lbl, .chip, фото по imageId).
import type { ReactNode } from 'react'
import { imageUrl } from '../api/client'

export function SecLbl({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between px-4 pt-1 pb-2.5">
      <h4 className="text-[15.5px] font-bold tracking-tight">{title}</h4>
      {right && <span className="num text-[11.5px] font-medium text-mut">{right}</span>}
    </div>
  )
}

export function Chip({ on, ghost, children, onPress }: {
  on?: boolean
  ghost?: boolean
  children: ReactNode
  onPress?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      className={
        'flex-none rounded-full px-3.5 py-[9px] text-[12.5px] font-bold whitespace-nowrap transition-colors ' +
        (on
          ? 'bg-[var(--acc-sel)] text-white'
          : ghost
            ? 'text-ink shadow-[inset_0_0_0_1.5px_var(--color-line)]'
            : 'bg-card text-ink shadow-[0_1px_3px_rgba(20,20,25,.07)]')
      }
    >
      {children}
    </button>
  )
}

/** Фото из API (r=image) как обложка блока */
export function Photo({ id, className }: { id?: number | null; className?: string }) {
  return (
    <div
      className={'bg-[#EFEAE2] bg-cover bg-center ' + (className ?? '')}
      style={id ? { backgroundImage: `url(${imageUrl(id)})` } : undefined}
    />
  )
}

/** Горизонтальный скролл-ряд без скроллбара */
export function HScroll({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={'flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ' + (className ?? '')}>
      {children}
    </div>
  )
}
