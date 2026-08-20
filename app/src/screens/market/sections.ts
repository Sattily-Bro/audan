// Справочники раздела «Базар»: категории S1/S11, соответствие kind → section,
// районы и контекстный таб-бар. Ключи и заголовки — из src/mocks/data.json ("sections").
import type { TabItem } from '../../ui/TabBar'

export interface MarketCat {
  kind: string
  title: string
  icon: string
  to: string
}

/** Плоская сетка 3×3 корневых категорий (эталон S1) */
export const CATS: MarketCat[] = [
  { kind: 'estate', title: 'Жильё', icon: 'cat-house', to: '/market/estate' },
  { kind: 'rent', title: 'Аренда жилья', icon: 'cat-rent', to: '/market/rent' },
  { kind: 'car', title: 'Автомобили', icon: 'cat-car', to: '/market/car' },
  { kind: 'parts', title: 'Авто запчасти', icon: 'cat-parts', to: '/market/parts' },
  { kind: 'phones', title: 'Смартфоны', icon: 'cat-phone', to: '/market/phones' },
  { kind: 'tech', title: 'Техника', icon: 'cat-tech', to: '/market/tech' },
  { kind: 'furn', title: 'Мебель', icon: 'cat-furniture', to: '/market/furn' },
  { kind: 'spec', title: 'Спец техника', icon: 'cat-machinery', to: '/market/spec' },
  { kind: 'livestock', title: 'Живой скот', icon: 'cat-livestock', to: '/market/livestock-sub' },
]

/** Субкатегории «Живого скота» (эталон S11, LS_TILES старого кода) */
export const LIVESTOCK_SUBCATS: MarketCat[] = [
  { kind: 'sheep', title: 'Бараны', icon: 'cat-sheep', to: '/market/sheep' },
  { kind: 'horse', title: 'Лошади', icon: 'cat-horse', to: '/market/horse' },
  { kind: 'cattle', title: 'КРС', icon: 'cat-livestock', to: '/market/cattle' },
  { kind: 'other', title: 'Другой скот', icon: 'cat-other-animals', to: '/market/other' },
]

/** Заголовок списка по kind-ключу (совпадает с data.json → sections) */
export const KIND_TITLES: Record<string, string> = {
  car: 'Автомобили',
  sheep: 'Бараны',
  horse: 'Лошади',
  cattle: 'КРС',
  other: 'Другой скот',
  estate: 'Жильё',
  rent: 'Аренда жилья',
  parts: 'Авто запчасти',
  phones: 'Смартфоны',
  tech: 'Техника',
  furn: 'Мебель',
  spec: 'Спец техника',
}

/** kind → section (ключ словаря SECTION_FIELDS, HANDOFF §4.1) */
export const KIND_SECTION: Record<string, string> = {
  car: 'car',
  sheep: 'livestock',
  horse: 'livestock',
  cattle: 'livestock',
  other: 'livestock',
  estate: 'realty',
  rent: 'realty_rent',
  parts: 'car_parts',
  phones: 'phones',
  tech: 'appliances',
  furn: 'furniture',
  spec: 'spectech_sale',
}

/** Районы из справочника districts (реальные посёлки, топонимы — данные) */
export const DISTRICTS = ['Шу қаласы', 'Төле би', 'Алға', 'Бірлік', 'Жаңажол', 'Индустриальная зона']

/** Таб-бар раздела (эталон S1): Главная · Категории · Подать · Мои */
export const MARKET_TABS: TabItem[] = [
  { icon: 'home', label: 'Главная', to: '/', end: true },
  { icon: 'grid', label: 'Категории', to: '/market' },
  { icon: 'plus', label: 'Подать', to: '/market/new' },
  { icon: 'document', label: 'Мои', to: '/market/my' },
]

/** Вариант для «Моих»: «Категории» подсвечивается только на точном /market */
export const MARKET_TABS_MY: TabItem[] = [
  { icon: 'home', label: 'Главная', to: '/', end: true },
  { icon: 'grid', label: 'Категории', to: '/market', end: true },
  { icon: 'plus', label: 'Подать', to: '/market/new' },
  { icon: 'document', label: 'Мои', to: '/market/my' },
]
