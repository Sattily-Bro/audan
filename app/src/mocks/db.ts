// Типизированный доступ к сгенерированным мок-данным (scripts/gen-mocks.mjs).
import raw from './data.json'

export interface MockAd {
  id: number
  kind: string
  section: string
  title: string
  subtitle: string
  price: number
  district: string
  createdAt: string
  imageIds: number[]
  extra: Record<string, string | number>
  sellerName: string
  sellerSince: string
  status: string
}

export interface MockMenuItem { name: string; price: number; desc: string; imageId: number | null }
export interface MockRestaurant {
  id: number
  key: string
  name: string
  logo: string
  imageId: number | null
  rating: string
  ratingCount: string
  time: string
  deliveryFee: number
  freeFrom: number
  open: boolean
  phone: string
  menu: { cat: string; items: MockMenuItem[] }[]
  reviews: { pct?: string; s?: string; bars?: number[]; cards?: unknown[] } | null
}

export interface MockGig {
  id: number
  key: string
  kind: 'vacancy' | 'gig'
  employerKey: string
  title: string
  pay: string
  employerLine: string
  tags: string[]
  extra: Record<string, string>
  description: string
}

export interface MockEmployer {
  key: string
  name: string
  sub: string
  letter: string
  color: string
  imageId: number | null
  staff: string
  answerRate: string
  about: string
  phone: string
}

export interface MockPlace {
  id: number
  key: string
  name: string
  category: string
  categoryKey: string
  sub: string
  address: string
  hours: string
  open: boolean
  h24: boolean
  delivery: boolean
  rating: string
  reviews: number
  far: string
  farM: number
  phone: string
  imageIds: number[]
  video: boolean
  feat: string[]
  reviewCards: { name: string; when: string; text: string; stars: number }[]
  x: number
  y: number
  pending: 0 | 1
  reject_reason: string
}

export interface MockStory { id: number; key: string; title: string; meta: string; imageId: number | null; likes: number }

interface MockDb {
  ads: MockAd[]
  restaurants: MockRestaurant[]
  gigs: MockGig[]
  employers: MockEmployer[]
  places: MockPlace[]
  stories: MockStory[]
  sections: Record<string, { title: string; section: string }>
  images: Record<string, string>
}

export const db = raw as unknown as MockDb
