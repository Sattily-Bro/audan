// Экран 16 «Вход» — только по номеру телефона, дальше SMS-код.
// Эталон: design/src/audan-screens.html, секция S16. API: auth.phone_start.
import { useState } from 'react'
import { Button } from 'react-aria-components'
import { Link, useNavigate } from 'react-router'
import { api, ApiError } from '../../api/client'
import { formatKzPhone, isCompleteKzPhone, toApiPhone } from '../../lib/phone'
import { useSession } from '../../state/session'

export default function Login() {
  const nav = useNavigate()
  const { setPendingPhone } = useSession()
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const ready = isCompleteKzPhone(phone) && !busy

  async function submit() {
    if (!ready) return
    setBusy(true)
    setError('')
    try {
      await api('auth.phone_start', { phone: toApiPhone(phone) })
      setPendingPhone(phone)
      nav('/otp')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Нет связи — попробуйте ещё раз')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <div className="flex-1 px-6 pt-16">
        <div className="text-[30px] font-extrabold tracking-tight">
          Audan<span className="text-acc">.</span>kz
        </div>
        <p className="mt-2.5 text-[13.5px] leading-snug font-medium text-mut">
          Вход по номеру телефона — это ваш аккаунт: объявления, заказы и уведомления.
        </p>

        <label className="mt-8 block text-[12px] font-bold tracking-wide text-mut" htmlFor="login-phone">
          Номер телефона
        </label>
        <div className="mt-2 flex items-center gap-2.5 rounded-[14px] bg-card px-4 py-3.5 shadow-[0_1px_3px_rgba(20,20,25,.08)]">
          <span className="text-[16px] font-bold">+7</span>
          <input
            id="login-phone"
            className="num w-full bg-transparent text-[16px] font-bold outline-none placeholder:font-medium placeholder:text-faint"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="707 000 00 00"
            value={phone}
            onChange={(e) => setPhone(formatKzPhone(e.target.value))}
            onKeyDown={(e) => { if (e.key === 'Enter') void submit() }}
          />
        </div>
        {error && <p className="mt-2 text-[12.5px] font-semibold text-danger">{error}</p>}

        <Button
          className="mt-5 flex h-[52px] w-full items-center justify-center rounded-[14px] bg-acc text-[15px] font-bold text-white transition-colors data-[hovered]:bg-acc-h data-[disabled]:opacity-40"
          isDisabled={!ready}
          onPress={() => void submit()}
        >
          {busy ? 'Отправляем код…' : 'Войти'}
        </Button>
      </div>

      <p className="pb-9 text-center text-[13px] font-medium text-mut">
        Нет аккаунта?{' '}
        <Link to="/signup" className="font-bold text-acc-d">Зарегистрироваться</Link>
      </p>
    </div>
  )
}
