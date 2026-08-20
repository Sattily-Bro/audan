// Корзина еды — общий модуль состояния раздела (S6 меню → S30 оформление).
// Корзина всегда одного заведения (анатомия Glovo): добавление блюда из другого
// заведения начинает её заново. Персист — localStorage, реактивность —
// useSyncExternalStore на мини-эмиттере.
import { useSyncExternalStore } from 'react'

export interface CartItem { name: string; price: number; qty: number }
export interface Cart { rest: string; restName: string; items: CartItem[] }

const KEY = 'audan-food-cart'
const EMPTY: Cart = { rest: '', restName: '', items: [] }

function load(): Cart {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as Cart
  } catch { /* приватный режим / битый JSON */ }
  return EMPTY
}

let cart: Cart = load()
const listeners = new Set<() => void>()

function commit(next: Cart): void {
  cart = next
  try { localStorage.setItem(KEY, JSON.stringify(cart)) } catch { /* приватный режим */ }
  listeners.forEach((fn) => fn())
}

export function getCart(): Cart { return cart }

/** +1 порция. Блюдо из чужого заведения молча начинает новую корзину. */
export function addItem(rest: string, restName: string, dish: { name: string; price: number }): void {
  const base = cart.rest === rest ? cart.items : []
  const items = base.some((i) => i.name === dish.name)
    ? base.map((i) => (i.name === dish.name ? { ...i, qty: i.qty + 1 } : i))
    : [...base, { name: dish.name, price: dish.price, qty: 1 }]
  commit({ rest, restName, items })
}

/** −1 порция; нулевые позиции убираются, пустая корзина сбрасывается целиком */
export function removeItem(name: string): void {
  const items = cart.items
    .map((i) => (i.name === name ? { ...i, qty: i.qty - 1 } : i))
    .filter((i) => i.qty > 0)
  commit(items.length ? { ...cart, items } : { ...EMPTY })
}

/** Заполнить корзину составом прошлого заказа («Повторить» из S22) */
export function fillCart(rest: string, restName: string, items: CartItem[]): void {
  commit({ rest, restName, items: items.map((i) => ({ ...i })) })
}

export function clearCart(): void { commit({ ...EMPTY }) }

export const cartTotal = (c: Cart): number => c.items.reduce((s, i) => s + i.price * i.qty, 0)
export const cartCount = (c: Cart): number => c.items.reduce((s, i) => s + i.qty, 0)
export const qtyOf = (c: Cart, name: string): number => c.items.find((i) => i.name === name)?.qty ?? 0

function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

/** Реактивная корзина для экранов */
export function useCart(): Cart {
  return useSyncExternalStore(subscribe, getCart, getCart)
}

/* ---- Данные доставки (S30): район/адрес/номер Kaspi, живут между заказами ---- */

export interface Delivery { district: string; address: string; kaspi: string }

const DKEY = 'audan-food-delivery'
// Дефолты — из дизайн-эталона (S30: адрес и предзаполненный номер Kaspi)
const DEFAULT_DELIVERY: Delivery = {
  district: 'Шу қаласы',
  address: 'ул. Желтоқсан 12, кв. 4',
  kaspi: '+7 707 902 01 98',
}

export function getDelivery(): Delivery {
  try {
    const raw = localStorage.getItem(DKEY)
    if (raw) return { ...DEFAULT_DELIVERY, ...(JSON.parse(raw) as Partial<Delivery>) }
  } catch { /* приватный режим */ }
  return DEFAULT_DELIVERY
}

export function setDelivery(patch: Partial<Delivery>): Delivery {
  const next = { ...getDelivery(), ...patch }
  try { localStorage.setItem(DKEY, JSON.stringify(next)) } catch { /* приватный режим */ }
  return next
}
