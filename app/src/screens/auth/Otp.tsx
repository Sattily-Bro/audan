// Экран «Код из SMS» — 4 ячейки, автофокус, таймер повторной отправки 45 с,
// при ошибке — тряска и красная подпись. Эталон: S23. API: auth.phone_check / auth.phone_resend.
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router'
import { api, ApiError } from '../../api/client'
import { toApiPhone } from '../../lib/phone'
import { useSession } from '../../state/session'
import { SHead } from '../../ui/SHead'

const RESEND_SEC = 45

export default function Otp() {
  const nav = useNavigate()
  const { pendingPhone, refresh } = useSession()
  const [cells, setCells] = useState(['', '', '', ''])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const [left, setLeft] = useState(RESEND_SEC)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  // без номера здесь делать нечего — обратно на вход
  useEffect(() => {
    if (!pendingPhone) nav('/login', { replace: true })
  }, [pendingPhone, nav])

  useEffect(() => {
    inputs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (left <= 0) return
    const t = setInterval(() => setLeft((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [left])

  async function check(code: string) {
    setBusy(true)
    setError('')
    try {
      await api('auth.phone_check', { phone: toApiPhone(pendingPhone), code })
      await refresh()
      nav('/pin')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Нет связи — попробуйте ещё раз')
      setShake(true)
      setTimeout(() => setShake(false), 450)
      setCells(['', '', '', ''])
      inputs.current[0]?.focus()
    } finally {
      setBusy(false)
    }
  }

  function put(i: number, v: string) {
    const d = v.replace(/\D/g, '').slice(-1)
    const next = [...cells]
    next[i] = d
    setCells(next)
    setError('')
    if (d && i < 3) inputs.current[i + 1]?.focus()
    if (next.every((c) => c !== '')) void check(next.join(''))
  }

  function onKey(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !cells[i] && i > 0) {
      const next = [...cells]
      next[i - 1] = ''
      setCells(next)
      inputs.current[i - 1]?.focus()
      e.preventDefault()
    }
  }

  async function resend() {
    if (left > 0 || busy) return
    setError('')
    try {
      await api('auth.phone_resend', { phone: toApiPhone(pendingPhone) })
      setLeft(RESEND_SEC)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Нет связи — попробуйте ещё раз')
    }
  }

  const mmss = `0:${String(left).padStart(2, '0')}`

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <style>{'@keyframes otp-shake{20%,60%{transform:translateX(-7px)}40%,80%{transform:translateX(7px)}}'}</style>
      <SHead title="Код из SMS" backTo="/login" />
      <div className="px-6 pt-2">
        <p className="text-[14px] leading-[1.45] font-semibold text-[#6C6A62]">
          Отправили код на <b className="font-bold text-ink">+7 {pendingPhone}</b>
        </p>

        <div
          className="mt-[18px] flex gap-[9px]"
          style={shake ? { animation: 'otp-shake .45s' } : undefined}
        >
          {cells.map((c, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el }}
              id={`otp-cell-${i}`}
              aria-label={`Цифра ${i + 1}`}
              className={
                'num h-14 w-full min-w-0 flex-1 rounded-[14px] border-[1.5px] bg-card text-center text-[22px] font-extrabold outline-none transition-colors ' +
                (error
                  ? 'border-danger'
                  : c
                    ? 'border-acc'
                    : 'border-line focus:border-acc focus:shadow-[0_0_0_3px_rgba(var(--acc-rgb),.14)]')
              }
              type="text"
              inputMode="numeric"
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              maxLength={1}
              value={c}
              disabled={busy}
              onChange={(e) => put(i, e.target.value)}
              onKeyDown={(e) => onKey(i, e)}
            />
          ))}
        </div>

        {error && <p className="mt-3 text-center text-[12.5px] font-semibold text-danger">{error}</p>}

        <p className="mt-4 text-center text-[12.5px] font-semibold text-mut">
          Не пришёл?{' '}
          {left > 0 ? (
            <b className="num font-extrabold text-mut">Отправить снова через {mmss}</b>
          ) : (
            <button type="button" onClick={() => void resend()} className="font-extrabold text-acc-d">
              Отправить снова
            </button>
          )}{' '}
          ·{' '}
          <button type="button" onClick={() => nav('/login')} className="font-extrabold text-acc-d">
            Изменить номер
          </button>
        </p>
      </div>
    </div>
  )
}
