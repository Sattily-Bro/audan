// Нижняя шторка в стиле Kaspi (эталон: .sheet-wrap/.sheet/.sh-opt из audan-screens.html):
// затемнение, снизу приклеенная скруглённая панель, grab-полоска, строки-радио с галочкой.
import type { ReactNode } from 'react'

export function Sheet({ title, onClose, children }: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-end bg-[rgba(20,18,14,.42)]" onClick={onClose}>
      <div
        className="max-h-[76%] w-full overflow-y-auto rounded-t-[22px] bg-paper px-4 pt-2.5 pb-[max(env(safe-area-inset-bottom),18px)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-[2px] bg-[#DDD9D0]" />
        <h5 className="mx-0.5 mt-0.5 mb-3 text-[16.5px] font-extrabold tracking-tight">{title}</h5>
        {children}
      </div>
    </div>
  )
}

/** Строка-опция шторки с круглой радио-галочкой (эталон .sh-opt) */
export function SheetOpt({ on, sub, children, onPress }: {
  on?: boolean
  sub?: string
  children: ReactNode
  onPress?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      className="mb-2 flex w-full items-center gap-[11px] rounded-[13px] bg-card px-3.5 py-3 text-left text-[13.5px] font-bold shadow-[0_1px_3px_rgba(20,20,25,.05)]"
    >
      <span className="min-w-0 flex-1">
        {children}
        {sub && <span className="mt-0.5 block text-[11px] font-semibold text-mut">{sub}</span>}
      </span>
      <span
        className={
          'relative size-5 flex-none rounded-full ' +
          (on ? 'bg-acc' : 'border-[1.8px] border-[#D4D0C6]')
        }
      >
        {on && (
          <span className="absolute top-[3px] left-1.5 h-[9px] w-[5px] rotate-[43deg] border-r-2 border-b-2 border-white" />
        )}
      </span>
    </button>
  )
}
