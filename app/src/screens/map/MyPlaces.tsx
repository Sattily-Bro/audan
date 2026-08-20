// Экран 38 «Мои объекты» (эталон: S37). Все состояния модерации в одном списке:
// на проверке (pending=1) · на карте (pending=0, с просмотрами) · отклонён
// (reject_reason — с причиной и кнопкой «Исправить»). API: bizmap.my.
import { useNavigate } from 'react-router'
import { useData } from '../../lib/useData'
import type { MockPlace } from '../../mocks/db'
import { Icon } from '../../ui/Icon'
import { Photo } from '../../ui/kit'
import { SHead, HeadAction } from '../../ui/SHead'
import { TabBar } from '../../ui/TabBar'
import { MAP_TABS } from './shared'

type MyPlace = MockPlace & { views?: number }

export default function MyPlaces() {
  const nav = useNavigate()
  const { data, loading } = useData<{ places: MyPlace[] }>('bizmap.my')
  const places = data?.places ?? []

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <div className="flex-1 pb-2">
        <SHead
          title="Мои объекты"
          backTo="/profile"
          actions={<HeadAction icon="plus" label="Добавить место" onPress={() => nav('/map/new')} />}
        />

        {loading && Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="mx-4 mb-2.5 h-[100px] animate-pulse rounded-2xl bg-line/60" />
        ))}
        {!loading && !places.length && (
          <div className="px-8 py-[26px] text-center text-[12.5px] leading-relaxed font-semibold text-mut">
            Пока нет объектов — добавьте своё место, и оно появится на карте после проверки
          </div>
        )}

        {places.map((p) => {
          const rejected = p.reject_reason !== ''
          const pending = !rejected && p.pending === 1
          return (
            <div key={p.id} className="mx-4 mb-2.5 flex gap-3 rounded-2xl bg-card p-[11px] shadow-[0_1px_3px_rgba(20,20,25,.06)]">
              <Photo id={p.imageIds[0]} className="size-[78px] flex-none rounded-[13px]" />
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-bold tracking-tight">{p.name}</div>
                <div className="mt-0.5 text-[11.5px] leading-snug font-semibold text-mut">
                  {p.category} · {p.address}
                </div>
                <div className="mt-[7px] flex flex-wrap items-center gap-2">
                  {rejected && <span className="rounded-[7px] bg-[#FBE5E1] px-2 py-[3px] text-[10px] font-bold text-[#B03A2A]">Отклонён</span>}
                  {pending && <span className="rounded-[7px] bg-[#FFF0CC] px-2 py-[3px] text-[10px] font-bold text-[#8A6410]">На проверке</span>}
                  {!rejected && !pending && (
                    <>
                      <span className="rounded-[7px] bg-[#E6F4EB] px-2 py-[3px] text-[10px] font-bold text-ok">На карте</span>
                      <span className="num flex items-center gap-1 text-[10.5px] font-semibold text-faint">
                        <Icon id="eye" className="size-3" />
                        {(p.views ?? 0).toLocaleString('ru-RU')} просмотров
                      </span>
                    </>
                  )}
                  {pending && <span className="text-[10.5px] font-semibold text-faint">проверяем — обычно до 2 часов</span>}
                </div>
                {rejected && (
                  <div className="mt-2 rounded-[9px] bg-[#FFF7E3] px-2.5 py-2 text-[11.5px] leading-snug font-semibold text-[#8A6410]">
                    Причина: {p.reject_reason}
                  </div>
                )}
                <div className="mt-[9px] flex gap-2">
                  {rejected && (
                    <button
                      type="button"
                      onClick={() => nav('/map/new')}
                      className="rounded-[10px] bg-acc px-[13px] py-2 text-[11.5px] font-bold text-white"
                    >
                      Исправить и отправить
                    </button>
                  )}
                  {!rejected && !pending && (
                    <>
                      <button
                        type="button"
                        onClick={() => nav('/map/new')}
                        className="rounded-[10px] bg-soft px-[13px] py-2 text-[11.5px] font-bold text-[#3A3833]"
                      >
                        Изменить
                      </button>
                      <button
                        type="button"
                        onClick={() => nav(`/place/${p.id}`)}
                        className="rounded-[10px] bg-soft px-[13px] py-2 text-[11.5px] font-bold text-[#3A3833]"
                      >
                        Посмотреть
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <TabBar items={MAP_TABS} />
    </div>
  )
}
