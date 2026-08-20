// Транспорт API raion-handoff (HANDOFF §2):
// POST /api/?r=<group>.<action>, JSON-тело, cookie-сессия, ответ { ok: true | false }.
import type { ApiRoute } from './routes'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function api<T = Record<string, unknown>>(
  route: ApiRoute,
  params: Record<string, unknown> = {},
): Promise<T> {
  const res = await fetch(`/api/?r=${route}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(params),
  })
  let data: { ok?: boolean; error?: string } & T
  try {
    data = await res.json()
  } catch {
    throw new ApiError('Некорректный ответ сервера', res.status)
  }
  if (data.ok !== true) throw new ApiError(data.error || `Ошибка ${res.status}`, res.status)
  return data
}

/** Картинки: GET /api/?r=image&id=N — BLOB из MySQL, один размер.
 *  (Вариант &w= и Cache-Control: immutable — в списке запросов к бэку, ещё не согласован.) */
export function imageUrl(id: number | string): string {
  return `/api/?r=image&id=${id}`
}
