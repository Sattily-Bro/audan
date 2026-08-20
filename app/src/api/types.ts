// Типы данных API — по словарю raion-handoff/HANDOFF.md (§4 JSON-поля, §6 статусы).
// Это контракт с бэком: не выводить типы из наблюдений за ответами.

export interface User {
  id: number
  name: string
  phone: string
  whatsapp?: string
  email?: string
  avatarId?: number | null
  role: 'user' | 'admin' | 'scout'
  status: 'pending' | 'active' | 'blocked'
}

/* ===== market (объявления) ===== */

export type AdSection =
  | 'car' | 'realty' | 'realty_rent' | 'livestock'
  | 'spectech_sale' | 'spectech_rent'
  | 'phones' | 'appliances' | 'furniture' | 'car_parts'

/** ads.extra — набор ключей зависит от section (HANDOFF §4.1); значения — строки/числа */
export type AdExtra = Record<string, string | number>

export interface Ad {
  id: number
  section: AdSection
  title: string
  price: number
  district: string
  createdAt: string
  imageIds: number[]
  extra: AdExtra
  sellerName: string
  sellerPhone?: string
  status: string
  views?: number
  favs?: number
}

/* ===== food (еда и заказы) ===== */

export interface MenuItem {
  name: string
  price: number
  desc?: string
  imageId?: number
  daysOff?: number[]
  offUntil?: string
}

export interface MenuCategory {
  cat: string
  items: MenuItem[]
}

export interface Restaurant {
  id: number
  name: string
  imageId?: number
  rating?: string
  time?: string
  deliveryFee: number
  freeFrom: number
  open: boolean
  menu: MenuCategory[]
  phone?: string
}

/** food_orders.status — точные значения и переходы из routes/owner.php / food.php (§6) */
export type FoodOrderStatus =
  | 'pending' | 'accepted' | 'paid' | 'preparing' | 'ready' | 'courier' | 'delivered' | 'cancelled'

export interface FoodOrderItem {
  id: string
  name: string
  price: number
  qty: number
  note?: string
}

export interface FoodOrder {
  id: number
  seq: number
  status: FoodOrderStatus
  items: FoodOrderItem[]
  subtotal: number
  delivery_fee: number
  total: number
  customer_name: string
  customer_phone: string
  kaspi: string
  district: string
  address: string
  cancel_reason?: string
  cancel_kind?: 'restaurant' | 'client'
}

/* ===== bizmap (карта города) ===== */

export interface Business {
  id: number
  name: string
  category: string
  address: string
  lat: number
  lng: number
  phone?: string
  whatsapp?: string
  hours?: string
  imageIds: number[]
  rating?: string
  reviews?: number
  /** Модерация (§6): pending=1 — на проверке; reject_reason непустой — отклонён с причиной */
  pending: 0 | 1
  reject_reason: string
  views?: number
}

/* ===== feed ===== */

export interface Post {
  id: number
  authorId: number
  authorName: string
  text: string
  imageIds: number[]
  createdAt: string
  likes: number
  dislikes: number
  /** post_votes хранит и лайк и дизлайк — сохранено из старого кода */
  myVote?: 1 | -1 | 0
  comments: number
}

export interface PostComment {
  id: number
  postId: number
  authorName: string
  text: string
  createdAt: string
  likes: number
}

/* ===== gigs (работа/подработка) ===== */

export interface GigTask {
  id: number
  kind: 'vacancy' | 'gig'
  title: string
  pay: string
  employer: string
  district?: string
  tags: string[]
  extra: Record<string, string>
  description: string
}
