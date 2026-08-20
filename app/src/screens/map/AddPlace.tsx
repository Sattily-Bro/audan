// Экран 37 «Добавить место» (эталон: S36). Единая форма для всех кнопок «Добавить»:
// название, категория (шторка), адрес, точка на карте (обязательна, ставится тапом),
// телефон, график (шторка), фото-плейсхолдеры, возможности. Отправка — на модерацию:
// bizmap.add → экран «Отправлено модератору» → «Мои объекты».
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { api, ApiError } from '../../api/client'
import { Icon } from '../../ui/Icon'
import { SHead } from '../../ui/SHead'
import { PickerSheet } from './shared'

const CATEGORY_OPTIONS = ['Кафе', 'Магазины', 'Продукты', 'Аптеки', 'АЗС', 'Красота', 'Услуги', 'Другое']
const HOURS_OPTIONS = ['Пн–Вс 08:00–22:00', 'Пн–Вс 09:00–18:00', 'Пн–Сб 09:00–19:00', 'Круглосуточно']
const FEATURES = ['Доставка', 'WhatsApp', 'Оплата Kaspi', 'Круглосуточно', 'Wi-Fi']

export default function AddPlace() {
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [hours, setHours] = useState('')
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null)
  const [photos, setPhotos] = useState(0)
  const [feats, setFeats] = useState<string[]>([])
  const [sheet, setSheet] = useState<'cat' | 'hours' | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const ready = name.trim() !== '' && category !== '' && address.trim() !== '' && phone.trim() !== '' && point !== null

  async function submit() {
    if (!ready || busy) return
    setBusy(true)
    setError('')
    try {
      await api('bizmap.add', {
        name: name.trim(),
        category,
        address: address.trim(),
        phone: phone.trim(),
        hours,
        x: point!.x,
        y: point!.y,
        feat: feats,
      })
      setSent(true)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Нет связи — попробуйте ещё раз')
      setBusy(false)
    }
  }

  /* «Отправлено модератору» (.co-done) */
  if (sent) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-paper px-[34px] text-center">
        <div className="mb-[18px] flex size-[86px] items-center justify-center rounded-full bg-acc-bg text-acc">
          <Icon id="shield-check" className="size-11" />
        </div>
        <h5 className="m-0 mb-2 text-[21px] font-extrabold tracking-tight">Отправлено модератору</h5>
        <p className="m-0 mb-[22px] text-[13px] leading-normal font-semibold text-[#6C6A62]">
          Проверяем обычно до 2 часов. Как только место одобрят — оно появится на карте, а вам придёт уведомление.
        </p>
        <button
          type="button"
          onClick={() => nav('/map/my')}
          className="flex h-[50px] w-full items-center justify-center self-stretch rounded-[14px] bg-acc text-[14.5px] font-bold text-white"
        >
          Мои объекты
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <SHead title="Добавить место" backTo="/map" />

      <div className="mx-4 mb-3.5 flex items-start gap-[9px] rounded-[13px] bg-acc-bg px-[13px] py-[11px] text-[12px] leading-snug font-semibold text-acc-d">
        <Icon id="shield-check" className="mt-px size-4 flex-none" />
        Место появится на карте после проверки модератором — обычно до 2 часов
      </div>

      <Field label="Название" required>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Например, Магазин «Береке-2»"
          className="w-full rounded-[13px] bg-card px-3.5 py-[13px] text-[14px] font-medium shadow-[0_1px_3px_rgba(20,20,25,.05)] outline-none placeholder:text-faint"
        />
      </Field>

      <Field label="Категория" required>
        <button
          type="button"
          onClick={() => setSheet('cat')}
          className="flex w-full items-center justify-between rounded-[13px] bg-card px-3.5 py-[13px] text-left text-[14px] font-medium shadow-[0_1px_3px_rgba(20,20,25,.05)]"
        >
          <span className={category ? '' : 'text-faint'}>{category || 'Выберите категорию'}</span>
          <Icon id="chevron-right" className="size-[11px] rotate-90 text-mut" />
        </button>
      </Field>

      <Field label="Адрес" required>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Район, улица, дом"
          className="w-full rounded-[13px] bg-card px-3.5 py-[13px] text-[14px] font-medium shadow-[0_1px_3px_rgba(20,20,25,.05)] outline-none placeholder:text-faint"
        />
      </Field>

      <Field label="Точка на карте" required>
        <div
          role="button"
          aria-label="Поставить точку на карте"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect()
            setPoint({
              x: Math.round(((e.clientX - r.left) / r.width) * 100) / 100,
              y: Math.round(((e.clientY - r.top) / r.height) * 100) / 100,
            })
          }}
          className="relative h-[126px] cursor-pointer overflow-hidden rounded-[13px] shadow-[0_1px_3px_rgba(20,20,25,.06)]"
        >
          <svg className="absolute inset-0 size-full"><use href="#streets2" /></svg>
          {point && (
            <span
              style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
              className="absolute flex size-[34px] -translate-x-1/2 -translate-y-full items-center justify-center rounded-full bg-acc shadow-[0_3px_10px_rgba(20,20,25,.28)]"
            >
              <Icon id="location" className="size-[17px] text-white" />
            </span>
          )}
          <span className="absolute right-2.5 bottom-2.5 left-2.5 rounded-[9px] bg-white/95 px-2.5 py-[7px] text-center text-[11px] font-semibold text-[#3A3833]">
            {point ? 'Точка поставлена · сдвиньте, если нужно' : 'Тапните по карте, чтобы поставить точку'}
          </span>
        </div>
      </Field>

      <Field label="Телефон" required>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          type="tel"
          inputMode="tel"
          placeholder="+7 707 000 00 00"
          className="num w-full rounded-[13px] bg-card px-3.5 py-[13px] text-[14px] font-medium shadow-[0_1px_3px_rgba(20,20,25,.05)] outline-none placeholder:text-faint"
        />
      </Field>

      <Field label="График работы">
        <button
          type="button"
          onClick={() => setSheet('hours')}
          className="flex w-full items-center justify-between rounded-[13px] bg-card px-3.5 py-[13px] text-left text-[14px] font-medium shadow-[0_1px_3px_rgba(20,20,25,.05)]"
        >
          <span className={hours ? '' : 'text-faint'}>{hours || 'Например, Пн–Вс 08:00–22:00'}</span>
          <Icon id="chevron-right" className="size-[11px] rotate-90 text-mut" />
        </button>
      </Field>

      <div className="mx-4 mb-3">
        <div className="mb-1.5 text-[12px] font-bold text-[#3A3833]">
          Фото <span className="font-medium text-faint">— витрина и вывеска</span>
        </div>
        <div className="flex gap-2">
          {Array.from({ length: photos }, (_, i) => (
            <span key={i} className="flex size-[72px] items-center justify-center rounded-xl bg-field text-faint">
              <Icon id="camera" className="size-5" />
            </span>
          ))}
          <button
            type="button"
            onClick={() => setPhotos((n) => Math.min(n + 1, 4))}
            className="flex size-[72px] flex-col items-center justify-center gap-[3px] rounded-xl border-[1.5px] border-dashed border-[#D4D4D8] bg-card text-[9.5px] font-semibold text-mut"
          >
            <Icon id="plus" className="size-[18px] text-acc" />
            добавить
          </button>
        </div>
      </div>

      <div className="mx-4 mb-3">
        <div className="mb-1.5 text-[12px] font-bold text-[#3A3833]">Возможности</div>
        <div className="flex flex-wrap gap-[7px]">
          {FEATURES.map((ft) => {
            const on = feats.includes(ft)
            return (
              <button
                key={ft}
                type="button"
                onClick={() => setFeats((x) => (on ? x.filter((y) => y !== ft) : [...x, ft]))}
                className={
                  'rounded-full px-[13px] py-2 text-[12px] font-semibold ' +
                  (on ? 'bg-acc text-white' : 'bg-card text-[#3A3833] shadow-[inset_0_0_0_1.5px_var(--color-line)]')
                }
              >
                {ft}
              </button>
            )
          })}
        </div>
      </div>

      {error && <p className="mx-4 mb-1 text-[12.5px] font-semibold text-danger">{error}</p>}
      <button
        type="button"
        disabled={!ready || busy}
        onClick={() => void submit()}
        className="mx-4 mt-1.5 mb-5 flex h-[50px] items-center justify-center rounded-[14px] bg-acc text-[14.5px] font-bold text-white disabled:opacity-40"
      >
        {busy ? 'Отправляем…' : 'Отправить на проверку'}
      </button>

      {sheet === 'cat' && (
        <PickerSheet
          title="Категория"
          options={CATEGORY_OPTIONS}
          value={category}
          onPick={setCategory}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === 'hours' && (
        <PickerSheet
          title="График работы"
          options={HOURS_OPTIONS}
          value={hours}
          onPick={setHours}
          onClose={() => setSheet(null)}
        />
      )}
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="mx-4 mb-3">
      <div className="mb-1.5 text-[12px] font-bold text-[#3A3833]">
        {label} {required && <em className="text-acc not-italic">*</em>}
      </div>
      {children}
    </div>
  )
}
