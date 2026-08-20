// Экран «Регистрация» — имя, телефон, WhatsApp (по умолчанию совпадает), пароль ≥6,
// явные галочки согласий. Эталон: design/src/audan-screens.html, секция S35.
// API: auth.phone_start → SMS-код (/otp).
import { useState, type ReactNode } from 'react'
import { Button } from 'react-aria-components'
import { Link, useNavigate } from 'react-router'
import { api, ApiError } from '../../api/client'
import { formatKzPhone, isCompleteKzPhone, toApiPhone } from '../../lib/phone'
import { useSession } from '../../state/session'
import { Icon } from '../../ui/Icon'
import { SHead } from '../../ui/SHead'

type AgreeKey = 'offer' | 'rules' | 'privacy' | 'promo'
const REQUIRED: AgreeKey[] = ['offer', 'rules', 'privacy']

const FIELD =
  'mt-2 flex items-center gap-2.5 rounded-[14px] border-[1.5px] border-line bg-card px-4 py-3.5'
const INPUT =
  'w-full min-w-0 bg-transparent text-[15px] font-semibold outline-none placeholder:font-medium placeholder:text-faint'

function Lbl({ children, htmlFor }: { children: string; htmlFor: string }) {
  return (
    <label className="mt-[22px] block text-[12px] font-bold text-[#3A3833]" htmlFor={htmlFor}>
      {children} <em className="not-italic text-[#C4503A]">*</em>
    </label>
  )
}

function Check({ on, small }: { on: boolean; small?: boolean }) {
  return (
    <span
      className={
        'relative flex flex-none items-center justify-center border-[1.8px] transition-colors ' +
        (small ? 'size-[19px] rounded-md ' : 'mt-px size-[21px] rounded-[7px] ') +
        (on ? 'border-acc bg-acc' : 'border-[#D4D0C6]')
      }
    >
      {on && <Icon id="check" className="size-3 text-white" />}
    </span>
  )
}

export default function Signup() {
  const nav = useNavigate()
  const { setPendingPhone } = useSession()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [wa, setWa] = useState('')
  const [waSame, setWaSame] = useState(true)
  const [pwd, setPwd] = useState('')
  const [pwdShown, setPwdShown] = useState(false)
  const [agree, setAgree] = useState<Record<AgreeKey, boolean>>({
    offer: false, rules: false, privacy: false, promo: false,
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const allOn = agree.offer && agree.rules && agree.privacy && agree.promo
  const waValue = waSame ? phone : wa
  const ready =
    name.trim().length > 0 &&
    isCompleteKzPhone(phone) &&
    isCompleteKzPhone(waValue) &&
    pwd.length >= 6 &&
    REQUIRED.every((k) => agree[k]) &&
    !busy

  function toggle(k: AgreeKey) {
    setAgree((a) => ({ ...a, [k]: !a[k] }))
  }
  function toggleAll() {
    const to = !allOn
    setAgree({ offer: to, rules: to, privacy: to, promo: to })
  }

  async function submit() {
    if (!ready) return
    setBusy(true)
    setError('')
    try {
      await api('auth.phone_start', {
        phone: toApiPhone(phone),
        whatsapp: toApiPhone(waValue),
        name: name.trim(),
        password: pwd,
        consents: { offer: true, rules: true, privacy: true, promo: agree.promo },
      })
      setPendingPhone(phone)
      nav('/otp')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Нет связи — попробуйте ещё раз')
    } finally {
      setBusy(false)
    }
  }

  const pwdBad = pwd.length > 0 && pwd.length < 6

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <SHead title="Регистрация" backTo="/login" />
      <div className="flex-1 px-6 pt-1">
        <p className="text-[14px] leading-[1.45] font-semibold text-[#6C6A62]">
          Создайте аккаунт: код придёт по SMS на указанный номер.
        </p>

        <Lbl htmlFor="su-name">Как вас зовут</Lbl>
        <div className={FIELD}>
          <input
            id="su-name"
            className={INPUT}
            type="text"
            autoComplete="name"
            placeholder="Имя"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <Lbl htmlFor="su-phone">Номер телефона</Lbl>
        <div className={FIELD}>
          <span className="border-r-[1.5px] border-[#EAE7DF] pr-2.5 text-[15px] font-bold">+7</span>
          <input
            id="su-phone"
            className={INPUT + ' num'}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="707 000 00 00"
            value={phone}
            onChange={(e) => setPhone(formatKzPhone(e.target.value))}
          />
        </div>

        <Lbl htmlFor="su-wa">Номер WhatsApp</Lbl>
        <div className={FIELD}>
          <span className="flex items-center border-r-[1.5px] border-[#EAE7DF] pr-2.5">
            <Icon id="whatsapp" className="size-[17px] text-ok" />
          </span>
          <input
            id="su-wa"
            className={INPUT + ' num disabled:text-mut'}
            type="tel"
            inputMode="tel"
            placeholder="707 000 00 00"
            value={waSame ? phone : wa}
            disabled={waSame}
            onChange={(e) => setWa(formatKzPhone(e.target.value))}
          />
        </div>
        <button
          type="button"
          onClick={() => setWaSame(!waSame)}
          className="mt-[9px] flex items-center gap-[9px] text-[12px] font-semibold text-[#6C6A62]"
        >
          <Check on={waSame} small />
          Совпадает с номером телефона
        </button>

        <Lbl htmlFor="su-pwd">Пароль</Lbl>
        <div className={FIELD}>
          <input
            id="su-pwd"
            className={INPUT}
            type={pwdShown ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="не короче 6 символов"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
          />
          <button
            type="button"
            aria-label={pwdShown ? 'Скрыть пароль' : 'Показать пароль'}
            onClick={() => setPwdShown(!pwdShown)}
            className={'flex size-[26px] flex-none items-center justify-center ' + (pwdShown ? 'text-acc-d' : 'text-mut')}
          >
            <Icon id="eye" className="size-[17px]" />
          </button>
        </div>
        <p className={'mt-[7px] text-[11px] font-semibold ' + (pwdBad ? 'text-[#C4503A]' : pwd.length >= 6 ? 'text-ok' : 'text-faint')}>
          Минимум 6 символов
        </p>

        {/* согласия */}
        <div className="mt-[18px] rounded-[15px] bg-card px-3.5 py-1 shadow-[0_1px_3px_rgba(20,20,25,.05)]">
          <button type="button" onClick={toggleAll} className="flex w-full items-start gap-[11px] py-[11px] text-left">
            <Check on={allOn} />
            <span className="min-w-0 flex-1 text-[12.5px] leading-[1.45] font-semibold text-[#3A3833]">
              <b className="font-extrabold text-acc-d">Принять всё</b>
            </span>
          </button>
          {([
            ['offer', <>Соглашаюсь с <b className="font-extrabold text-acc-d">Публичной офертой</b><em className="ml-0.5 not-italic text-[#C4503A]">*</em></>],
            ['rules', <>Соглашаюсь с <b className="font-extrabold text-acc-d">Правилами сервиса</b><em className="ml-0.5 not-italic text-[#C4503A]">*</em></>],
            ['privacy', <>Согласен на <b className="font-extrabold text-acc-d">обработку персональных данных</b><em className="ml-0.5 not-italic text-[#C4503A]">*</em></>],
            ['promo', <>Хочу получать акции и новости города <span className="font-medium text-faint">— по желанию</span></>],
          ] as [AgreeKey, ReactNode][]).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => toggle(k)}
              className="flex w-full items-start gap-[11px] border-t border-soft py-[11px] text-left"
            >
              <Check on={agree[k]} />
              <span className="min-w-0 flex-1 text-[12.5px] leading-[1.45] font-semibold text-[#3A3833]">{label}</span>
            </button>
          ))}
        </div>

        {error && <p className="mt-3 text-[12.5px] font-semibold text-danger">{error}</p>}

        <Button
          className={
            'mt-[18px] flex h-[52px] w-full items-center justify-center rounded-[14px] text-[15px] font-bold text-white transition-colors ' +
            (ready ? 'bg-acc data-[hovered]:bg-acc-h' : 'bg-[#DDD9D0]')
          }
          isDisabled={!ready}
          onPress={() => void submit()}
        >
          {busy ? 'Отправляем код…' : 'Зарегистрироваться'}
        </Button>
        <p className="mt-3 flex items-center justify-center gap-[7px] text-[11px] leading-[1.4] font-semibold text-faint">
          <Icon id="shield-check" className="size-3.5 flex-none" />
          Каждое согласие фиксируется с версией документа и датой
        </p>
      </div>

      <p className="pt-4 pb-9 text-center text-[13px] font-medium text-mut">
        Уже есть аккаунт?{' '}
        <Link to="/login" className="font-bold text-acc-d">Войти</Link>
      </p>
    </div>
  )
}
