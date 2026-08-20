// Статусы заказа еды — по спеке design/FOOD-ORDER-FLOW.md (оплата по счёту Kaspi,
// списания при оформлении нет, «отменить» кнопки нет — только звонок заведению).
// Мок-бэкенд сводит sent→pending и invoiced→accepted, промежуточный ready
// показываем как «готовится».
import type { TabItem } from '../../ui/TabBar'

/** Цепочка статусов таймлайна (S13) */
export const ORDER_STEPS = [
  { key: 'pending', label: 'Ждёт подтверждения' },
  { key: 'accepted', label: 'Счёт выставлен' },
  { key: 'paid', label: 'Оплата отмечена' },
  { key: 'preparing', label: 'Готовится' },
  { key: 'courier', label: 'Едет к вам' },
  { key: 'delivered', label: 'Доставлен' },
] as const

const RANK: Record<string, number> = {
  pending: 0, accepted: 1, paid: 2, preparing: 3, ready: 3, courier: 4, delivered: 5,
}
export const orderRank = (status: string): number => RANK[status] ?? 0

/** Короткий лейбл статуса для строк и чипов */
export const ORDER_LABEL: Record<string, string> = {
  pending: 'ждёт подтверждения',
  accepted: 'счёт выставлен',
  paid: 'оплата отмечена',
  preparing: 'готовится',
  ready: 'готовится',
  courier: 'едет к вам',
  delivered: 'доставлен',
  cancelled: 'отменён',
}

export const isActiveOrder = (status: string): boolean => !['delivered', 'cancelled'].includes(status)

/** Заказ еды — форма ответа мока food.order / food.order_status / food.my_orders */
export interface FoodOrder {
  id: number
  seq: number
  restKey: string
  status: string
  items: { name: string; price: number; qty: number }[]
  subtotal: number
  delivery_fee: number
  total: number
  kaspi: string
  district: string
  address: string
  customer_name: string
  customer_phone: string
}

/** Таб-бар раздела «Еда» (правило: первым пунктом всегда «Главная») */
export const FOOD_TABS: TabItem[] = [
  { icon: 'home', label: 'Главная', to: '/', end: true },
  { icon: 'store', label: 'Еда', to: '/food' },
  { icon: 'document', label: 'Заказы', to: '/orders' },
  { icon: 'user', label: 'Профиль', to: '/profile' },
]

/** tel:-ссылка из номера вида «+7 705 460 12 40» */
export const telHref = (phone: string): string => 'tel:' + phone.replace(/[^\d+]/g, '')
/** wa.me-ссылка из того же формата номера */
export const waHref = (phone: string): string => 'https://wa.me/' + phone.replace(/\D/g, '')
