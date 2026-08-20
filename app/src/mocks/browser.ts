import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)

// Правка handlers при работающем dev-сервере не подхватывается воркером —
// надёжнее перезагрузить страницу целиком.
if (import.meta.hot) {
  import.meta.hot.accept(() => window.location.reload())
}
