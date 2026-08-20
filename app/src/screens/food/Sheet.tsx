// Шторка-пикер раздела «Еда» (правило прототипа: вместо системных диалогов —
// Kaspi-шторки: шапка с заголовком и крестиком, контент, кнопка снизу).
import type { ReactNode } from 'react'
import { Icon } from '../../ui/Icon'

export function Sheet({ title, onClose, children }: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button type="button" aria-label="Закрыть" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div className="relative rounded-t-[22px] bg-card px-4 pt-2.5 pb-[max(env(safe-area-inset-bottom),14px)]">
        <div className="mx-auto mb-2.5 h-1 w-9 rounded-full bg-line" />
        <div className="flex items-center justify-between pb-2">
          <div className="text-[16px] font-extrabold tracking-tight">{title}</div>
          <button
            type="button"
            aria-label="Закрыть"
            onClick={onClose}
            className="flex size-[30px] items-center justify-center rounded-full bg-soft"
          >
            <Icon id="close" className="size-3" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

/** Строка-вариант в шторке: текст + галочка у выбранного */
export function SheetOption({ on, children, onPress }: {
  on?: boolean
  children: ReactNode
  onPress: () => void
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      className="flex w-full items-center gap-3 border-b border-soft py-3.5 text-left text-[14px] font-semibold last:border-b-0"
    >
      <span className="min-w-0 flex-1">{children}</span>
      <Icon id="check" className={'size-4 flex-none text-acc-d ' + (on ? '' : 'opacity-0')} />
    </button>
  )
}

/** Большая кнопка внизу шторки («Готово») */
export function SheetBtn({ children, onPress, off }: {
  children: ReactNode
  onPress: () => void
  off?: boolean
}) {
  return (
    <button
      type="button"
      disabled={off}
      onClick={onPress}
      className={
        'mt-3 flex h-[52px] w-full items-center justify-center rounded-[14px] text-[15px] font-bold text-white ' +
        (off ? 'bg-[#DDD9D0]' : 'bg-acc')
      }
    >
      {children}
    </button>
  )
}
