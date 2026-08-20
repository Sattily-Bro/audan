// Уведомления (эталон: S25): группировка по дням, непрочитанные подсвечены,
// тип события — цветной иконкой, «Прочитать все» в шапке, переход по полю go.
// API: notif.list / notif.read.
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { api } from '../../api/client'
import { useData } from '../../lib/useData'
import { Icon } from '../../ui/Icon'
import { SHead, HeadAction } from '../../ui/SHead'
import { HOME_TABS, TabBar } from '../../ui/TabBar'

interface Notif {
  id: number
  icon: string
  title: string
  sub: string
  when: string
  go: string
}

/** Цвет плитки по типу события — как в эталоне S25 */
const ICON_TONE: Record<string, { bg: string; fg: string }> = {
  'svc-food': { bg: '#E6F4EB', fg: '#1E8A4C' },
  courier: { bg: '#E6F4EB', fg: '#1E8A4C' },
  heart: { bg: '#FCE7F0', fg: '#BE3455' },
  chat: { bg: '#EEEAFD', fg: '#5B3FD9' },
  warning: { bg: '#FFF3D6', fg: '#8A6410' },
}
const TONE_DEFAULT = { bg: 'var(--acc-bg)', fg: 'var(--acc-d)' }

function groupOf(when: string): 'Сегодня' | 'Вчера' | 'Ранее' {
  const w = when.toLowerCase()
  if (w.includes('вчера')) return 'Вчера'
  if (/дн|нед|мес/.test(w)) return 'Ранее'
  return 'Сегодня'
}

export default function Notify() {
  const nav = useNavigate()
  const { data, loading } = useData<{ notifications: Notif[] }>('notif.list')
  const [readIds, setReadIds] = useState<Set<number>>(new Set())

  const rows = data?.notifications ?? []
  const groups: ['Сегодня' | 'Вчера' | 'Ранее', Notif[]][] = (['Сегодня', 'Вчера', 'Ранее'] as const)
    .map((g) => [g, rows.filter((n) => groupOf(n.when) === g)] as ['Сегодня' | 'Вчера' | 'Ранее', Notif[]])
    .filter(([, list]) => list.length > 0)

  async function readAll() {
    setReadIds(new Set(rows.map((n) => n.id)))
    try { await api('notif.read') } catch { /* отметим при следующей загрузке */ }
  }

  function open(n: Notif) {
    setReadIds((s) => new Set(s).add(n.id))
    nav(n.go)
  }

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <div className="flex-1 pb-4">
        <SHead
          title="Уведомления"
          backTo="/"
          actions={<HeadAction icon="check-circle" label="Прочитать все" onPress={() => void readAll()} />}
        />

        {groups.map(([g, list]) => (
          <div key={g}>
            <div className="px-4 pt-1 pb-2.5">
              <h4 className="text-[15.5px] font-bold tracking-tight">{g}</h4>
            </div>
            {list.map((n) => {
              const tone = ICON_TONE[n.icon] ?? TONE_DEFAULT
              const unread = !readIds.has(n.id)
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => open(n)}
                  className={
                    'mx-4 mb-2 flex w-[calc(100%-32px)] gap-3 rounded-[15px] px-3.5 py-3 text-left shadow-[0_1px_3px_rgba(20,20,25,.06)] ' +
                    (unread ? 'bg-acc-bg' : 'bg-card')
                  }
                >
                  <span
                    className="flex size-[38px] flex-none items-center justify-center rounded-xl"
                    style={{ background: tone.bg, color: tone.fg }}
                  >
                    <Icon id={n.icon} className="size-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] leading-[1.3] font-extrabold">{n.title}</span>
                    <span className="mt-0.5 block text-[11.5px] leading-[1.4] font-semibold text-mut">{n.sub}</span>
                  </span>
                  <span className="num flex-none text-[10px] font-bold text-faint">{n.when}</span>
                </button>
              )
            })}
          </div>
        ))}

        {!loading && rows.length === 0 && (
          <p className="px-8 py-[26px] text-center text-[12.5px] leading-[1.5] font-semibold text-mut">
            Пока тихо — уведомления о заказах, модерации и ответах появятся здесь.
          </p>
        )}
        {loading && (
          <div className="mx-4 flex flex-col gap-2">
            {[0, 1, 2].map((i) => <div key={i} className="h-[62px] animate-pulse rounded-[15px] bg-line/60" />)}
          </div>
        )}
      </div>

      <TabBar items={HOME_TABS} />
    </div>
  )
}
