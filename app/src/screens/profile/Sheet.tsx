// Шторка-пикер в стиле приложения (эталон: .sheet-wrap/.sheet прототипа).
// Локальный компонент экранов профиля/авторизации — общий ui не трогаем.
import type { ReactNode } from 'react'
import { Icon } from '../../ui/Icon'

export function Sheet({ open, title, onClose, children }: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-[rgba(20,18,14,.42)]"
      onClick={onClose}
    >
      <div
        className="max-h-[76%] w-full overflow-y-auto rounded-t-[22px] bg-paper px-4 pt-2.5 pb-[max(env(safe-area-inset-bottom),18px)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#DDD9D0]" />
        <h5 className="mx-0.5 mb-3 text-[16.5px] font-extrabold tracking-tight">{title}</h5>
        {children}
      </div>
    </div>
  )
}

/** Ряд-опция внутри шторки: текст, необязательный подзаголовок, галка выбора */
export function SheetOption({ label, sub, on, onPress }: {
  label: string
  sub?: string
  on?: boolean
  onPress: () => void
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      className="mb-2 flex w-full items-center gap-3 rounded-[14px] bg-card px-4 py-3.5 text-left shadow-[0_1px_3px_rgba(20,20,25,.05)]"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-bold">{label}</span>
        {sub && <span className="block text-[11.5px] font-medium text-mut">{sub}</span>}
      </span>
      <Icon id="check" className={'size-4 flex-none text-acc-d ' + (on ? '' : 'opacity-0')} />
    </button>
  )
}
