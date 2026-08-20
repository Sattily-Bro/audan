// Экран «Код входа» — PIN из 4 цифр дважды (придумать → повторить), точки и
// цифровая клавиатура как в эталоне S24; после совпадения — шторка «Включить Face ID?»
// в стиле приложения (обе кнопки ведут на главную). PIN хранится локально.
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Sheet } from '../profile/Sheet'
import { Icon } from '../../ui/Icon'
import { SHead } from '../../ui/SHead'

const PIN_KEY = 'audan-pin'
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del']

export default function Pin() {
  const nav = useNavigate()
  const [stage, setStage] = useState<'create' | 'repeat'>('create')
  const [first, setFirst] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [fidOpen, setFidOpen] = useState(false)

  function finish() {
    try { localStorage.setItem(PIN_KEY, first) } catch { /* приватный режим */ }
    setFidOpen(true)
  }

  function press(k: string) {
    if (fidOpen) return
    if (k === 'del') {
      setPin((p) => p.slice(0, -1))
      return
    }
    if (!k || pin.length >= 4) return
    const next = pin + k
    setPin(next)
    setError('')
    if (next.length < 4) return
    // набрали 4 цифры
    if (stage === 'create') {
      setFirst(next)
      setTimeout(() => { setStage('repeat'); setPin('') }, 220)
    } else if (next === first) {
      finish()
    } else {
      setError('Коды не совпадают — попробуйте ещё раз')
      setTimeout(() => { setStage('create'); setFirst(''); setPin('') }, 500)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <SHead title="Код входа" />
      <div className="px-6 pt-1.5 text-center">
        <h1 className="text-[20px] font-extrabold tracking-tight">
          {stage === 'create' ? 'Придумайте код входа' : 'Повторите код'}
        </h1>
        <p className="mt-2 text-[14px] leading-[1.45] font-semibold text-[#6C6A62]">
          {stage === 'create'
            ? '4 цифры вместо пароля — вход за секунду'
            : 'Ещё раз — чтобы не ошибиться'}
        </p>
        <div className="mt-[26px] mb-1 flex justify-center gap-4">
          {[0, 1, 2, 3].map((i) => (
            <i
              key={i}
              className={
                'size-[15px] rounded-full border-[1.8px] transition-colors ' +
                (error
                  ? 'border-danger'
                  : i < pin.length ? 'border-acc bg-acc' : 'border-[#CFCBC1]')
              }
            />
          ))}
        </div>
        {error && <p className="mt-3 text-[12.5px] font-semibold text-danger">{error}</p>}
      </div>

      {/* клавиатура */}
      <div className="mt-auto grid grid-cols-3 gap-2.5 px-6 pt-4 pb-[max(env(safe-area-inset-bottom),24px)]">
        {KEYS.map((k, i) =>
          k === '' ? (
            <span key={i} />
          ) : (
            <button
              key={i}
              type="button"
              aria-label={k === 'del' ? 'Стереть' : k}
              onClick={() => press(k)}
              className={
                'flex h-[52px] items-center justify-center rounded-[14px] text-[20px] font-bold active:opacity-70 ' +
                (k === 'del' ? '' : 'bg-card shadow-[0_1px_3px_rgba(20,20,25,.06)]')
              }
            >
              {k === 'del' ? <Icon id="backspace" className="size-[22px]" /> : k}
            </button>
          ),
        )}
      </div>

      {/* предложение Face ID — шторка в стиле приложения */}
      <Sheet open={fidOpen} title="Face ID для «Audan»" onClose={() => nav('/')}>
        <div className="flex flex-col items-center px-2 pt-1 text-center">
          <span className="flex size-[64px] items-center justify-center rounded-[20px] bg-acc-bg">
            <Icon id="face-id" className="size-[34px] text-acc-d" />
          </span>
          <p className="mt-3.5 mb-5 max-w-[260px] text-[13px] leading-[1.45] font-semibold text-[#6C6A62]">
            Разрешить приложению использовать Face ID для входа вместо кода?
          </p>
        </div>
        <div className="flex gap-2.5 pb-1">
          <button
            type="button"
            onClick={() => nav('/')}
            className="flex h-[50px] flex-1 items-center justify-center rounded-[14px] border-[1.5px] border-line bg-card text-[14.5px] font-bold text-[#3A3833]"
          >
            Позже
          </button>
          <button
            type="button"
            onClick={() => nav('/')}
            className="flex h-[50px] flex-[1.5] items-center justify-center rounded-[14px] bg-acc text-[14.5px] font-bold text-white"
          >
            Включить
          </button>
        </div>
      </Sheet>
    </div>
  )
}
