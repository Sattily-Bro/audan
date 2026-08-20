// Глобальный поиск (эталон: S26): один вход для всего супер-аппа. Живой поиск
// по market.list + food.restaurants + bizmap.list (грузим параллельно, фильтруем
// на клиенте), результаты секциями Объявления / Еда / Места, история — локально.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { api } from '../../api/client'
import { fmtT } from '../../lib/format'
import { Icon } from '../../ui/Icon'
import { SHead } from '../../ui/SHead'
import { Photo } from '../../ui/kit'
import type { MockAd, MockPlace, MockRestaurant } from '../../mocks/db'

const HISTORY_KEY = 'audan-search-history'
const CHIPS = ['Камри', 'Бараны', 'Дом', 'Электрик', 'Самса', 'Работа', 'Аптека']

interface Hit {
  key: string
  sec: 'Объявления' | 'Еда' | 'Места'
  title: string
  sub: string
  imageId: number | null
  go: string
}

function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    const arr: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : []
  } catch { return [] }
}
function saveHistory(list: string[]): void {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 8))) } catch { /* приватный режим */ }
}

export default function Search() {
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [ads, setAds] = useState<MockAd[]>([])
  const [rests, setRests] = useState<MockRestaurant[]>([])
  const [places, setPlaces] = useState<MockPlace[]>([])
  const [history, setHistory] = useState<string[]>(loadHistory)
  const inputRef = useRef<HTMLInputElement>(null)

  // все три источника — параллельно, один раз на вход в поиск
  useEffect(() => {
    let alive = true
    void Promise.all([
      api<{ ads: MockAd[] }>('market.list'),
      api<{ restaurants: MockRestaurant[] }>('food.restaurants'),
      api<{ places: MockPlace[] }>('bizmap.list'),
    ]).then(([m, f, b]) => {
      if (!alive) return
      setAds(m.ads)
      setRests(f.restaurants)
      setPlaces(b.places)
    }).catch(() => { /* без данных покажем только подсказки */ })
    return () => { alive = false }
  }, [])

  useEffect(() => { inputRef.current?.focus() }, [])

  const query = q.trim().toLowerCase()

  const hits = useMemo<Hit[]>(() => {
    if (query.length < 2) return []
    const out: Hit[] = []
    for (const a of ads) {
      if (`${a.title} ${a.subtitle} ${a.district}`.toLowerCase().includes(query)) {
        out.push({
          key: `ad${a.id}`, sec: 'Объявления', title: a.title,
          sub: `${fmtT(a.price)} · ${a.district}`,
          imageId: a.imageIds[0] ?? null, go: `/ad/${a.id}`,
        })
      }
    }
    for (const r of rests) {
      const dish = r.menu.flatMap((c) => c.items).find((it) => it.name.toLowerCase().includes(query))
      if (r.name.toLowerCase().includes(query) || dish) {
        out.push({
          key: `rest${r.id}`, sec: 'Еда',
          title: dish ? `${dish.name} — ${r.name}` : r.name,
          sub: dish ? `${fmtT(dish.price)} · доставка ${r.time}` : `★ ${r.rating} · доставка ${r.time}`,
          imageId: dish?.imageId ?? r.imageId, go: `/food/${r.key}`,
        })
      }
    }
    for (const p of places) {
      if (`${p.name} ${p.category} ${p.sub} ${p.address}`.toLowerCase().includes(query)) {
        out.push({
          key: `pl${p.id}`, sec: 'Места', title: p.name,
          sub: `${p.category} · ${p.address}`,
          imageId: p.imageIds[0] ?? null, go: `/place/${p.id}`,
        })
      }
    }
    return out.slice(0, 18)
  }, [query, ads, rests, places])

  const sections = useMemo(() => {
    const by = new Map<string, Hit[]>()
    for (const h of hits) {
      if (!by.has(h.sec)) by.set(h.sec, [])
      by.get(h.sec)!.push(h)
    }
    return [...by.entries()]
  }, [hits])

  function openHit(h: Hit) {
    const term = q.trim()
    if (term) {
      const next = [term, ...history.filter((x) => x.toLowerCase() !== term.toLowerCase())]
      setHistory(next.slice(0, 8))
      saveHistory(next)
    }
    nav(h.go)
  }

  function dropHistory(term: string) {
    const next = history.filter((x) => x !== term)
    setHistory(next)
    saveHistory(next)
  }

  return (
    <div className="min-h-dvh bg-paper pb-6">
      <SHead title="Поиск" backTo="/" />

      {/* строка поиска */}
      <div className="mx-4 mb-3 flex items-center gap-2.5 rounded-[14px] bg-card px-[15px] shadow-[0_1px_3px_rgba(20,20,25,.06)]">
        <Icon id="search" className="size-[19px] flex-none text-mut" />
        <input
          ref={inputRef}
          id="global-search"
          className="h-12 w-full min-w-0 bg-transparent text-[14.5px] font-medium outline-none placeholder:text-faint"
          type="search"
          placeholder="iPhone, электрик, самса…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {q && (
          <button type="button" aria-label="Очистить" onClick={() => { setQ(''); inputRef.current?.focus() }} className="flex-none text-faint">
            <Icon id="close" className="size-4" />
          </button>
        )}
      </div>

      {query.length < 2 ? (
        <>
          <div className="flex items-baseline justify-between px-4 pt-1 pb-2.5">
            <h4 className="text-[15.5px] font-bold tracking-tight">Часто ищут в Шу</h4>
          </div>
          <div className="flex flex-wrap gap-2 px-4">
            {CHIPS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => { setQ(c); inputRef.current?.focus() }}
                className="rounded-full bg-card px-3.5 py-[9px] text-[12.5px] font-bold shadow-[0_1px_3px_rgba(20,20,25,.07)]"
              >
                {c}
              </button>
            ))}
          </div>

          {history.length > 0 && (
            <>
              <div className="flex items-baseline justify-between px-4 pt-4 pb-2.5">
                <h4 className="text-[15.5px] font-bold tracking-tight">Вы искали</h4>
                <button
                  type="button"
                  onClick={() => { setHistory([]); saveHistory([]) }}
                  className="text-[11.5px] font-bold text-mut"
                >
                  Очистить
                </button>
              </div>
              {history.map((h) => (
                <div key={h} className="mx-4 mb-2 flex items-center gap-3 rounded-[13px] bg-card px-3.5 py-3 shadow-[0_1px_3px_rgba(20,20,25,.05)]">
                  <Icon id="clock" className="size-4 flex-none text-faint" />
                  <button
                    type="button"
                    onClick={() => { setQ(h); inputRef.current?.focus() }}
                    className="min-w-0 flex-1 truncate text-left text-[13.5px] font-semibold"
                  >
                    {h}
                  </button>
                  <button type="button" aria-label={`Убрать «${h}» из истории`} onClick={() => dropHistory(h)} className="flex-none text-faint">
                    <Icon id="close" className="size-3.5" />
                  </button>
                </div>
              ))}
            </>
          )}
        </>
      ) : hits.length === 0 ? (
        <p className="px-8 py-[26px] text-center text-[12.5px] leading-[1.5] font-semibold text-mut">
          Ничего не нашли по запросу «{q.trim()}».<br />
          Попробуйте короче — например, из подсказок выше
        </p>
      ) : (
        sections.map(([sec, rows]) => (
          <div key={sec}>
            <div className="px-4 pt-2 pb-2">
              <h4 className="text-[13px] font-extrabold tracking-tight text-mut">{sec}</h4>
            </div>
            {rows.map((h) => (
              <button
                key={h.key}
                type="button"
                onClick={() => openHit(h)}
                className="mx-4 mb-2 flex w-[calc(100%-32px)] items-center gap-3 rounded-[14px] bg-card p-3 text-left shadow-[0_1px_3px_rgba(20,20,25,.06)]"
              >
                {h.imageId ? (
                  <Photo id={h.imageId} className="h-[50px] w-14 flex-none rounded-[10px]" />
                ) : (
                  <span className="flex h-[50px] w-14 flex-none items-center justify-center rounded-[10px] bg-soft text-[17px] font-extrabold text-mut">
                    {h.title[0]}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-bold">{h.title}</span>
                  <span className="num mt-[3px] block truncate text-[11.5px] font-medium text-mut">{h.sub}</span>
                </span>
                <Icon id="chevron-right" className="size-3.5 flex-none text-[#C5C1B7]" />
              </button>
            ))}
          </div>
        ))
      )}
    </div>
  )
}
