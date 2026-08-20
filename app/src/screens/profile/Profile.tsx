// Экран «Профиль» (эталон: S10): карточка пользователя, «Рабочий кабинет»
// (ресторан, объекты карты, объявления), аккаунт, настройки, выход.
// Язык — шторка-пикер, пишет в prefs. Без сессии — приглашение войти.
import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { api } from '../../api/client'
import { useData } from '../../lib/useData'
import { getLang, setLang, type Lang } from '../../state/prefs'
import { useSession } from '../../state/session'
import { Icon } from '../../ui/Icon'
import { SHead } from '../../ui/SHead'
import { HOME_TABS, TabBar } from '../../ui/TabBar'
import { Sheet, SheetOption } from './Sheet'

function maskPhone(p: string): string {
  const d = p.replace(/\D/g, '')
  if (d.length < 11) return '+' + d
  return `+7 ${d.slice(1, 4)} ••• ${d.slice(7, 9)} ${d.slice(9, 11)}`
}

function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10, m100 = n % 100
  if (m10 === 1 && m100 !== 11) return one
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few
  return many
}

function SecLabel({ children }: { children: string }) {
  return (
    <div className="px-4 pt-1 pb-2.5">
      <h4 className="text-[15.5px] font-bold tracking-tight">{children}</h4>
    </div>
  )
}

function PList({ children }: { children: ReactNode }) {
  return (
    <div className="mx-4 mb-3 divide-y divide-soft overflow-hidden rounded-2xl bg-card shadow-[0_1px_3px_rgba(20,20,25,.06)]">
      {children}
    </div>
  )
}

function PRow({ icon, name, value, badge, muted, onPress }: {
  icon: string
  name: string
  value?: string
  badge?: string
  muted?: boolean
  onPress: () => void
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      className="flex w-full items-center gap-3 px-[15px] py-[13px] text-left"
    >
      <span className="flex size-9 flex-none items-center justify-center rounded-[11px] bg-paper">
        <Icon id={icon} className={'size-[17px] ' + (muted ? 'text-mut' : 'text-acc')} />
      </span>
      <span className={'min-w-0 flex-1 truncate text-[13.5px] font-bold ' + (muted ? 'text-mut' : '')}>{name}</span>
      {value && <span className="flex-none text-[12px] font-medium text-mut">{value}</span>}
      {badge && (
        <span className="flex-none rounded-full bg-acc-bg px-[9px] py-[3px] text-[10.5px] font-extrabold text-acc-d">{badge}</span>
      )}
      {!muted && <Icon id="chevron-right" className="size-3.5 flex-none text-[#C5C1B7]" />}
    </button>
  )
}

interface OwnerSummary { orders: { status: string }[]; open: boolean }
interface NotifSummary { notifications: { id: number }[] }

export default function Profile() {
  const nav = useNavigate()
  const { user, loading, setUser } = useSession()
  const { data: owner } = useData<OwnerSummary>('owner.orders')
  const { data: notif } = useData<NotifSummary>('notif.list')
  const [lang, setLangState] = useState<Lang>(getLang)
  const [sheet, setSheet] = useState<'' | 'lang' | 'contacts' | 'docs'>('')

  const newOrders = (owner?.orders ?? []).filter((o) => o.status === 'pending').length
  const notifCount = notif?.notifications.length ?? 0

  async function logout() {
    try { await api('auth.logout') } catch { /* сессии уже нет */ }
    setUser(null)
    nav('/login')
  }

  function pickLang(v: Lang) {
    setLang(v)
    setLangState(v)
    setSheet('')
  }

  if (!loading && !user) {
    return (
      <div className="flex min-h-dvh flex-col bg-paper">
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
          <div className="flex size-16 items-center justify-center rounded-[20px] bg-card shadow-[0_1px_3px_rgba(20,20,25,.07)]">
            <Icon id="user" className="size-7 text-acc" />
          </div>
          <div className="text-[17px] font-extrabold tracking-tight">Войдите в Audan.kz</div>
          <p className="text-[13px] leading-[1.45] font-medium text-mut">
            Профиль, объявления, заказы и уведомления — после входа по номеру телефона.
          </p>
          <button
            type="button"
            onClick={() => nav('/login')}
            className="mt-2 flex h-[48px] w-full max-w-[260px] items-center justify-center rounded-[14px] bg-acc text-[15px] font-bold text-white"
          >
            Войти
          </button>
        </div>
        <TabBar items={HOME_TABS} />
      </div>
    )
  }

  const initials = (user?.name ?? '')
    .split(/\s+/).slice(0, 2).map((w) => w[0] ?? '').join('').toUpperCase()

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <div className="flex-1 pb-2">
        <SHead title="Профиль" backTo="/" />

        {/* карточка пользователя */}
        <div className="mx-4 mb-3 flex items-center gap-[13px] rounded-[18px] bg-card px-4 py-[15px] shadow-[0_1px_3px_rgba(20,20,25,.06)]">
          <span className="flex size-14 flex-none items-center justify-center rounded-[18px] bg-[#F0E4D8] text-[19px] font-extrabold text-[#9A6432]">
            {initials || '·'}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[16px] font-extrabold tracking-tight">{user?.name}</span>
            <span className="num mt-0.5 block text-[12px] font-medium text-mut">
              {user ? maskPhone(user.phone) : ''} · Шу қаласы
            </span>
          </span>
          <button type="button" onClick={() => setSheet('contacts')} className="flex-none text-[12px] font-bold text-acc">
            Изменить
          </button>
        </div>

        <SecLabel>Рабочий кабинет</SecLabel>
        <PList>
          <PRow
            icon="svc-food"
            name="Ресторан «Шу-Пюре»"
            badge={newOrders > 0 ? `${newOrders} ${plural(newOrders, 'новый заказ', 'новых заказа', 'новых заказов')}` : undefined}
            value={newOrders === 0 ? 'заказы и меню' : undefined}
            onPress={() => nav('/owner')}
          />
          <PRow icon="store" name="Мои объекты на карте" value="2 · один на проверке" onPress={() => nav('/map/my')} />
          <PRow icon="svc-market" name="Мои объявления" value="1 активно" onPress={() => nav('/market/my')} />
        </PList>

        <SecLabel>Аккаунт</SecLabel>
        <PList>
          <PRow
            icon="bell"
            name="Уведомления"
            badge={notifCount > 0 ? String(notifCount) : undefined}
            onPress={() => nav('/notify')}
          />
          <PRow icon="heart" name="Сохранённые" onPress={() => nav('/favs')} />
          <PRow icon="receipt" name="Мои заказы" onPress={() => nav('/orders')} />
          <PRow icon="phone" name="Телефон и WhatsApp" onPress={() => setSheet('contacts')} />
        </PList>

        <SecLabel>Настройки</SecLabel>
        <PList>
          <PRow icon="globe" name="Язык" value={lang} onPress={() => setSheet('lang')} />
          <PRow icon="document" name="Юридические документы" onPress={() => setSheet('docs')} />
          <PRow icon="logout" name="Выйти" muted onPress={() => void logout()} />
        </PList>
      </div>

      <TabBar items={HOME_TABS} />

      {/* шторка: язык */}
      <Sheet open={sheet === 'lang'} title="Язык интерфейса" onClose={() => setSheet('')}>
        {(['Қазақша', 'Русский'] as Lang[]).map((v) => (
          <SheetOption key={v} label={v} on={v === lang} onPress={() => pickLang(v)} />
        ))}
      </Sheet>

      {/* шторка: контакты */}
      <Sheet open={sheet === 'contacts'} title="Телефон и WhatsApp" onClose={() => setSheet('')}>
        <div className="mb-2 flex items-center gap-3 rounded-[14px] bg-card px-4 py-3.5 shadow-[0_1px_3px_rgba(20,20,25,.05)]">
          <Icon id="phone" className="size-[17px] flex-none text-acc" />
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-bold text-mut">Номер телефона</span>
            <span className="num block text-[13.5px] font-bold">{user ? maskPhone(user.phone) : ''}</span>
          </span>
        </div>
        <div className="mb-2 flex items-center gap-3 rounded-[14px] bg-card px-4 py-3.5 shadow-[0_1px_3px_rgba(20,20,25,.05)]">
          <Icon id="whatsapp" className="size-[17px] flex-none text-ok" />
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-bold text-mut">Номер WhatsApp</span>
            <span className="num block text-[13.5px] font-bold">{user ? maskPhone(user.whatsapp ?? user.phone) : ''}</span>
          </span>
        </div>
        <p className="px-1 pt-1 text-[11px] leading-[1.45] font-semibold text-faint">
          Смена номера — через поддержку: номер и есть ваш аккаунт.
        </p>
      </Sheet>

      {/* шторка: юридические документы */}
      <Sheet open={sheet === 'docs'} title="Юридические документы" onClose={() => setSheet('')}>
        {['Публичная оферта', 'Правила сервиса', 'Обработка персональных данных'].map((d) => (
          <div key={d} className="mb-2 flex items-center gap-3 rounded-[14px] bg-card px-4 py-3.5 shadow-[0_1px_3px_rgba(20,20,25,.05)]">
            <Icon id="document" className="size-[17px] flex-none text-acc" />
            <span className="min-w-0 flex-1 text-[13.5px] font-bold">{d}</span>
          </div>
        ))}
        <p className="px-1 pt-1 text-[11px] leading-[1.45] font-semibold text-faint">
          Ваши согласия зафиксированы с версией документа и датой принятия.
        </p>
      </Sheet>
    </div>
  )
}
