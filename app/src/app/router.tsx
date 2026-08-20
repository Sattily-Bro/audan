// Пути совместимы с deep-links старого сайта (ad.php → /ad/{id}, obj.php → /place/{id},
// post.php → /post/{id}) — их нельзя ломать (CLAUDE.md).
// Все экраны — ленивые чанки: стартовый бандл не тянет разделы, в которые не заходили.
import { Suspense, lazy, type ComponentType, type LazyExoticComponent } from 'react'
import { createBrowserRouter } from 'react-router'

function screen(loader: () => Promise<{ default: ComponentType }>) {
  const C: LazyExoticComponent<ComponentType> = lazy(loader)
  return (
    <Suspense fallback={<div className="min-h-dvh bg-paper" />}>
      <C />
    </Suspense>
  )
}
import Pending from '../screens/Pending'

export const router = createBrowserRouter([
  { path: '/login', element: screen(() => import('../screens/auth/Login')) },
  { path: '/signup', element: screen(() => import('../screens/auth/Signup')) },
  { path: '/otp', element: screen(() => import('../screens/auth/Otp')) },
  { path: '/pin', element: screen(() => import('../screens/auth/Pin')) },

  { path: '/', element: screen(() => import('../screens/home/Home')) },
  { path: '/search', element: screen(() => import('../screens/profile/Search')) },
  { path: '/notify', element: screen(() => import('../screens/profile/Notify')) },

  { path: '/market', element: screen(() => import('../screens/market/Cats')) },
  { path: '/market/livestock-sub', element: screen(() => import('../screens/market/Subcats')) },
  { path: '/market/new', element: screen(() => import('../screens/market/AdNew')) },
  { path: '/market/my', element: screen(() => import('../screens/market/MyAds')) },
  { path: '/market/:section', element: screen(() => import('../screens/market/List')) },
  { path: '/ad/:id', element: screen(() => import('../screens/market/AdDetail')) },
  { path: '/favs', element: screen(() => import('../screens/market/Favs')) },

  { path: '/food', element: screen(() => import('../screens/food/Food')) },
  { path: '/food/:rest', element: screen(() => import('../screens/food/Menu')) },
  { path: '/food/:rest/reviews', element: screen(() => import('../screens/food/Reviews')) },
  { path: '/checkout', element: screen(() => import('../screens/food/Checkout')) },
  { path: '/order/:id', element: screen(() => import('../screens/food/Order')) },
  { path: '/orders', element: screen(() => import('../screens/food/Orders')) },

  { path: '/map', element: screen(() => import('../screens/map/MapScreen')) },
  { path: '/map/list', element: screen(() => import('../screens/map/MapList')) },
  { path: '/map/new', element: screen(() => import('../screens/map/AddPlace')) },
  { path: '/map/my', element: screen(() => import('../screens/map/MyPlaces')) },
  { path: '/place/:id', element: screen(() => import('../screens/map/Place')) },

  { path: '/jobs', element: screen(() => import('../screens/jobs/Jobs')) },
  { path: '/jobs/my', element: <Pending title="Мои заявки" /> },
  { path: '/vacancy/:id', element: screen(() => import('../screens/jobs/VacDetail')) },
  { path: '/employer/:id', element: screen(() => import('../screens/jobs/Employer')) },
  { path: '/services', element: screen(() => import('../screens/jobs/Services')) },
  { path: '/services/new', element: <Pending title="Анкета мастера" /> },
  { path: '/services/my', element: <Pending title="Мои анкеты" /> },
  { path: '/master/:id', element: screen(() => import('../screens/jobs/Master')) },

  { path: '/feed', element: screen(() => import('../screens/feed/Feed')) },
  { path: '/post/:id', element: screen(() => import('../screens/feed/Post')) },
  { path: '/compose', element: screen(() => import('../screens/feed/Compose')) },
  { path: '/stories', element: screen(() => import('../screens/feed/Stories')) },
  { path: '/story/:id', element: screen(() => import('../screens/feed/Story')) },
  { path: '/stories/map', element: screen(() => import('../screens/feed/StoriesMap')) },

  { path: '/profile', element: screen(() => import('../screens/profile/Profile')) },
  { path: '/owner', element: screen(() => import('../screens/profile/Owner')) },

  { path: '*', element: <Pending title="Экран не найден" /> },
])
