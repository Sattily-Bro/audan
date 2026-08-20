// Экран 4 «Подать объявление» (эталон: S4) — форма в 3 шага (наше решение,
// озвучено владельцу): 1 раздел+фото+название → 2 поля словаря SECTION_FIELDS
// (обязательные — из ads_field_req) → 3 цена+район+телефон. API: market.create.
import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { api } from '../../api/client'
import { SECTION_FIELDS, type SectionField } from '../../lib/sections.gen'
import { Icon } from '../../ui/Icon'
import { CATS, DISTRICTS, KIND_SECTION, KIND_TITLES, LIVESTOCK_SUBCATS } from './sections'
import { Sheet, SheetOpt } from './Sheet'

// Все конечные разделы подачи: корневые без «Живого скота» + его субкатегории
const ALL_KINDS = [...CATS.filter((c) => c.kind !== 'livestock'), ...LIVESTOCK_SUBCATS]

export default function AdNew() {
  const nav = useNavigate()
  const [step, setStep] = useState(1)
  const [kind, setKind] = useState('')
  const [photos, setPhotos] = useState<number[]>([])
  const [title, setTitle] = useState('')
  const [extra, setExtra] = useState<Record<string, string>>({})
  const [price, setPrice] = useState('')
  const [district, setDistrict] = useState('')
  const [phone, setPhone] = useState('')
  const [sheet, setSheet] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const section = KIND_SECTION[kind] ?? ''
  const fields = SECTION_FIELDS[section] ?? []
  const openField = fields.find((f) => f.key === sheet)

  const step1Ok = kind !== '' && title.trim().length > 0
  const step2Ok = fields.every((f) => !f.req || (extra[f.key] ?? '').trim() !== '')
  const step3Ok = price.trim() !== '' && district !== '' && phone.trim().length >= 10

  function back() {
    if (step > 1) setStep(step - 1)
    else nav(-1)
  }

  async function submit() {
    if (!step3Ok || busy) return
    setBusy(true)
    setError('')
    try {
      await api('market.create', {
        kind,
        section,
        title: title.trim(),
        price: Number(price.replace(/\D/g, '')),
        district,
        phone,
        photos: photos.length,
        extra,
      })
      nav('/market/my')
    } catch {
      setError('Не получилось отправить — попробуйте ещё раз')
      setBusy(false)
    }
  }

  return (
    <div className="min-h-dvh bg-paper pb-1">
      {/* шапка с «умным» назад: сначала по шагам, затем выход */}
      <header className="flex items-center gap-2.5 px-4 pt-3 pb-2.5">
        <button
          type="button"
          aria-label="Назад"
          onClick={back}
          className="flex size-[38px] items-center justify-center rounded-full bg-card shadow-[0_1px_3px_rgba(20,20,25,.08)]"
        >
          <Icon id="arrow-left" className="size-[17px]" />
        </button>
        <div className="flex-1 text-[16px] font-extrabold tracking-tight">Новое объявление</div>
        <div className="w-[38px]" />
      </header>

      {/* прогресс-точки шагов (эталон .fstep) */}
      <div className="flex gap-1.5 px-4 pb-3.5">
        {[1, 2, 3].map((i) => (
          <i key={i} className={'h-1 flex-1 rounded-[2px] ' + (i <= step ? 'bg-acc' : 'bg-line')} />
        ))}
      </div>

      {step === 1 && (
        <>
          <FGroup label="Раздел" req>
            <FSelect
              value={kind ? KIND_TITLES[kind] : ''}
              placeholder="Выберите раздел"
              onPress={() => setSheet('adnew-kind')}
            />
          </FGroup>
          <div className="mx-4 mb-3">
            <div className="mb-1.5 text-[12px] font-bold text-[#3A3833]">
              Фото <em className="text-acc not-italic">*</em>{' '}
              <span className="font-medium text-faint">— до 10 фото и видео до 30 сек</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {photos.map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-label="Убрать фото"
                  onClick={() => setPhotos(photos.filter((x) => x !== p))}
                  className="flex size-[72px] flex-none items-center justify-center rounded-xl bg-[linear-gradient(140deg,#F0EDE7,#E0DBD1)] text-[#BDB6A8]"
                >
                  <Icon id="image" className="size-[22px]" />
                </button>
              ))}
              {photos.length < 10 && (
                <button
                  type="button"
                  onClick={() => setPhotos([...photos, Date.now()])}
                  className="flex size-[72px] flex-none flex-col items-center justify-center gap-[3px] rounded-xl border-[1.5px] border-dashed border-[#D4D4D8] bg-card text-[9.5px] font-bold text-mut"
                >
                  <Icon id="plus" className="size-[18px] text-acc" />
                  добавить
                </button>
              )}
            </div>
          </div>
          <FGroup label="Название" req>
            <input
              id="adnew-title"
              className="w-full rounded-[13px] bg-card px-3.5 py-[13px] text-[14px] font-medium shadow-[0_1px_3px_rgba(20,20,25,.05)] outline-none placeholder:text-faint"
              placeholder="Например: Toyota Camry 50, один хозяин"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </FGroup>
          <FSubmit label="Дальше — детали" disabled={!step1Ok} onPress={() => setStep(2)} />
        </>
      )}

      {step === 2 && (
        <>
          {fields.length === 0 && (
            <p className="mx-4 mb-3 rounded-[13px] bg-card px-3.5 py-[13px] text-[13px] font-medium text-mut shadow-[0_1px_3px_rgba(20,20,25,.05)]">
              Для раздела «{KIND_TITLES[kind]}» дополнительных полей нет — переходите к контактам.
            </p>
          )}
          {fields.map((f) => (
            <FGroup key={f.key} label={f.label} req={f.req} hint={f.hint}>
              {f.type === 'select' ? (
                <FSelect
                  value={extra[f.key] ?? ''}
                  placeholder={f.placeholder ?? 'Выбрать'}
                  onPress={() => setSheet(f.key)}
                />
              ) : (
                <input
                  id={`adnew-${f.key}`}
                  className="num w-full rounded-[13px] bg-card px-3.5 py-[13px] text-[14px] font-medium shadow-[0_1px_3px_rgba(20,20,25,.05)] outline-none placeholder:text-faint"
                  inputMode={f.type === 'num' ? 'numeric' : undefined}
                  placeholder={f.placeholder ?? (f.type === 'date' ? 'дд.мм.гггг' : '')}
                  value={extra[f.key] ?? ''}
                  onChange={(e) => setExtra({ ...extra, [f.key]: e.target.value })}
                />
              )}
            </FGroup>
          ))}
          <FSubmit label="Дальше — контакты" disabled={!step2Ok} onPress={() => setStep(3)} />
        </>
      )}

      {step === 3 && (
        <>
          <FGroup label="Цена, ₸" req>
            <input
              id="adnew-price"
              className="num w-full rounded-[13px] bg-card px-3.5 py-[13px] text-[14px] font-medium shadow-[0_1px_3px_rgba(20,20,25,.05)] outline-none placeholder:text-faint"
              inputMode="numeric"
              placeholder="напр. 7 200 000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </FGroup>
          <FGroup label="Район" req>
            <FSelect value={district} placeholder="Выберите район" onPress={() => setSheet('adnew-district')} />
          </FGroup>
          <FGroup label="Телефон для связи" req>
            <input
              id="adnew-phone"
              className="num w-full rounded-[13px] bg-card px-3.5 py-[13px] text-[14px] font-medium shadow-[0_1px_3px_rgba(20,20,25,.05)] outline-none placeholder:text-faint"
              type="tel"
              inputMode="tel"
              placeholder="+7 707 000 00 00"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </FGroup>
          {error && <p className="mx-4 mb-2 text-[12.5px] font-semibold text-danger">{error}</p>}
          <FSubmit
            label={busy ? 'Отправляем…' : 'Опубликовать'}
            disabled={!step3Ok || busy}
            onPress={() => void submit()}
          />
          <p className="mx-4 pb-5 text-center text-[11.5px] font-medium text-mut">
            Объявление уйдёт на модерацию — обычно проверяем до 2 часов.
          </p>
        </>
      )}

      {/* шторки-пикеры вместо системных селектов */}
      {sheet === 'adnew-kind' && (
        <Sheet title="Раздел" onClose={() => setSheet(null)}>
          {ALL_KINDS.map((c) => (
            <SheetOpt
              key={c.kind}
              on={kind === c.kind}
              onPress={() => { setKind(c.kind); setExtra({}); setSheet(null) }}
            >
              {c.title}
            </SheetOpt>
          ))}
        </Sheet>
      )}
      {sheet === 'adnew-district' && (
        <Sheet title="Район" onClose={() => setSheet(null)}>
          {DISTRICTS.map((d) => (
            <SheetOpt key={d} on={district === d} onPress={() => { setDistrict(d); setSheet(null) }}>
              {d}
            </SheetOpt>
          ))}
        </Sheet>
      )}
      {openField && (
        <Sheet title={openField.label} onClose={() => setSheet(null)}>
          {(openField.options ?? []).map((o) => (
            <SheetOpt
              key={o}
              on={extra[openField.key] === o}
              onPress={() => { setExtra({ ...extra, [openField.key]: o }); setSheet(null) }}
            >
              {o}
            </SheetOpt>
          ))}
        </Sheet>
      )}
    </div>
  )
}

/** Группа поля формы (эталон .fgrp/.flbl) */
function FGroup({ label, req, hint, children }: {
  label: string
  req?: boolean
  hint?: SectionField['hint']
  children: ReactNode
}) {
  return (
    <div className="mx-4 mb-3">
      <div className="mb-1.5 text-[12px] font-bold text-[#3A3833]">
        {label} {req && <em className="text-acc not-italic">*</em>}
      </div>
      {children}
      {hint && <p className="mt-1.5 text-[11px] leading-snug font-medium text-faint">{hint}</p>}
    </div>
  )
}

/** Кнопка-селект (эталон .fin с шевроном) — открывает шторку */
function FSelect({ value, placeholder, onPress }: {
  value: string
  placeholder: string
  onPress: () => void
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      className={
        'flex w-full items-center justify-between rounded-[13px] bg-card px-3.5 py-[13px] text-left text-[14px] font-medium shadow-[0_1px_3px_rgba(20,20,25,.05)] ' +
        (value ? 'text-ink' : 'text-faint')
      }
    >
      {value || placeholder}
      <Icon id="chevron-down" className="size-[11px] text-mut" />
    </button>
  )
}

/** Кнопка перехода/отправки (эталон .fsubmit) */
function FSubmit({ label, disabled, onPress }: {
  label: string
  disabled?: boolean
  onPress: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onPress}
      className="mx-4 mt-1.5 mb-5 flex h-[50px] w-[calc(100%-32px)] items-center justify-center rounded-[14px] bg-acc text-[14.5px] font-bold text-white transition-opacity disabled:opacity-40"
    >
      {label}
    </button>
  )
}
