import { useCallback, useEffect, useRef, useState } from 'react'
import { api, ApiError } from '../api/client'
import type { ApiRoute } from '../api/routes'

interface DataState<T> {
  data: T | null
  loading: boolean
  error: string
  reload: () => void
}

/** Простая загрузка данных экрана: один запрос, состояние загрузки/ошибки, reload. */
export function useData<T>(route: ApiRoute, params: Record<string, unknown> = {}): DataState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const key = JSON.stringify(params)
  const seq = useRef(0)

  const load = useCallback(() => {
    const my = ++seq.current
    setLoading(true)
    setError('')
    api<T>(route, JSON.parse(key) as Record<string, unknown>)
      .then((d) => { if (seq.current === my) { setData(d); setLoading(false) } })
      .catch((e: unknown) => {
        if (seq.current !== my) return
        setError(e instanceof ApiError ? e.message : 'Нет связи — потяните, чтобы обновить')
        setLoading(false)
      })
  }, [route, key])

  useEffect(() => { load() }, [load])
  return { data, loading, error, reload: load }
}
