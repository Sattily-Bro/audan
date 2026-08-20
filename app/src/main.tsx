import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import '@fontsource-variable/inter'
import './styles/app.css'
import { router } from './app/router'
import { SessionProvider } from './state/session'
import { injectIconSprite } from './ui/Icon'
import { restorePalette } from './theme/palettes'

restorePalette()

async function boot() {
  // Моки включаются явно: npm run dev:mock (VITE_MOCK=1) — фронт работает без PHP-бэка
  if (import.meta.env.VITE_MOCK === '1') {
    const { worker } = await import('./mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass' })
  }
  injectIconSprite()
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <SessionProvider>
        <RouterProvider router={router} />
      </SessionProvider>
    </StrictMode>,
  )
}

void boot()
