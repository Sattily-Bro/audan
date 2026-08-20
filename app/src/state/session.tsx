import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from '../api/client'
import type { User } from '../api/types'

interface SessionState {
  user: User | null
  loading: boolean
  /** телефон, введённый на входе/регистрации — нужен экрану SMS-кода */
  pendingPhone: string
  setPendingPhone: (p: string) => void
  setUser: (u: User | null) => void
  refresh: () => Promise<void>
}

const Ctx = createContext<SessionState | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingPhone, setPendingPhone] = useState('')

  async function refresh() {
    try {
      const r = await api<{ user: User | null }>('auth.me')
      setUser(r.user ?? null)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void refresh() }, [])

  return (
    <Ctx.Provider value={{ user, loading, pendingPhone, setPendingPhone, setUser, refresh }}>
      {children}
    </Ctx.Provider>
  )
}

export function useSession(): SessionState {
  const s = useContext(Ctx)
  if (!s) throw new Error('useSession вне SessionProvider')
  return s
}
