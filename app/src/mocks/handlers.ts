// MSW-моки всего API по контракту HANDOFF §2/§3: POST /api/?r=…, ответ { ok: … }.
// Данные — из дизайн-прототипа (scripts/gen-mocks.mjs), состояние живёт в памяти вкладки.
import { http, HttpResponse } from 'msw'
import type { User } from '../api/types'
import { db } from './db'

const demoUser: User = {
  id: 1,
  name: 'Аружан С.',
  phone: '77079020198',
  role: 'user',
  status: 'active',
}

/* ---- состояние мок-сервера (живёт до перезагрузки вкладки) ---- */
let authorized = false
const favAds = new Set<number>()
const favPlaces = new Set<number>()
let orderSeq = 14
interface MockOrder {
  id: number
  seq: number
  restKey: string
  status: string
  items: { id: string; name: string; price: number; qty: number }[]
  subtotal: number
  delivery_fee: number
  total: number
  kaspi: string
  district: string
  address: string
  customer_name: string
  customer_phone: string
}
const orders: MockOrder[] = []
const myPlaces: (typeof db.places[number] & { views?: number })[] = []
const responded = new Set<number>()

interface MockPost {
  id: number
  authorName: string
  when: string
  text: string
  imageId: number | null
  likes: number
  dislikes: number
  myVote: 0 | 1 | -1
  comments: { id: number; authorName: string; when: string; text: string; likes: number }[]
}
let postSeq = 100
const posts: MockPost[] = [
  { id: 1, authorName: 'Бекзат Молдағали', when: '2 часа назад', text: 'Кто-нибудь знает, когда откроют новый мост через Шу? Строители говорят к осени, но верится с трудом.', imageId: null, likes: 14, dislikes: 2, myVote: 0, comments: [
    { id: 1, authorName: 'Айдана', when: 'час назад', text: 'Говорят, к сентябрю. Опоры уже стоят.', likes: 3 },
  ] },
  { id: 2, authorName: 'Гүлнәз Оспанова', when: '5 часов назад', text: 'Продаётся место на базаре, ряд с одеждой. Пишите в личку.', imageId: null, likes: 4, dislikes: 0, myVote: 0, comments: [] },
  { id: 3, authorName: 'Диас Жұмабеков', when: 'вчера', text: 'Уборка началась — комбайны пошли по полям за Төле би. Урожай в этом году обещает быть.', imageId: 108, likes: 27, dislikes: 1, myVote: 0, comments: [] },
]

const masters = [
  { id: 1, name: 'Данибек', spec: 'Авто-электрик', district: 'Төле би', rating: '5,0', jobs: 214, phone: '+7 776 254 08 31' },
  { id: 2, name: 'Алим', spec: 'Ремонт оборудования', district: 'Шу қаласы', rating: '4,8', jobs: 96, phone: '+7 705 118 44 07' },
  { id: 3, name: 'Ербол', spec: 'Сантехник', district: 'Бірлік', rating: '4,9', jobs: 152, phone: '+7 747 903 25 61' },
]

const ok = (data: Record<string, unknown> = {}) => HttpResponse.json({ ok: true, ...data })
const err = (error: string, status = 400) => HttpResponse.json({ ok: false, error }, { status })

function findRest(keyOrId: unknown) {
  return db.restaurants.find((r) => r.key === keyOrId || r.id === Number(keyOrId))
}

export const handlers = [
  /* картинки: GET /api/?r=image&id=N → public/mock-img/N.jpg */
  http.get('/api/', async ({ request }) => {
    const u = new URL(request.url)
    if (u.searchParams.get('r') !== 'image') return err('Неизвестный GET-роут', 404)
    const id = u.searchParams.get('id')
    return fetch(new URL(`/mock-img/${id}.jpg`, u.origin))
  }),

  http.post('/api/', async ({ request }) => {
    const r = new URL(request.url).searchParams.get('r') ?? ''
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>

    switch (r) {
      /* ================= auth ================= */
      case 'auth.me':
        return ok({ user: authorized ? demoUser : null })
      case 'auth.phone_start': {
        const phone = String(body.phone ?? '')
        if (phone.length < 11) return err('Введите корректный номер телефона')
        return ok({ pending: true, phone, exists: true, channel: 'whatsapp' })
      }
      case 'auth.phone_check':
      case 'auth.phone_login':
      case 'auth.phone_verify':
      case 'auth.phone_register': {
        const code = String(body.code ?? '')
        if (code && code.length === 4 && code !== '0000') return err('Неверный код')
        authorized = true
        return ok({ user: demoUser })
      }
      case 'auth.phone_resend':
        return ok({ pending: true })
      case 'auth.logout':
        authorized = false
        return ok()
      case 'auth.accept_docs':
      case 'auth.update_name':
      case 'auth.update_contacts':
      case 'auth.change_password':
        return ok()

      /* ================= home ================= */
      case 'home.summary':
        return ok({
          banners: [
            { id: 1, title: 'Продавайте быстрее', sub: 'Поднимите объявление в топ за 500 ₸' },
            { id: 2, title: 'Доставка еды в Шу', sub: '6 заведений · от 400 ₸' },
            { id: 3, title: 'Биотех набирает смену', sub: '12 вакансий, от 250 000 ₸' },
          ],
          activeOrder: orders.find((o) => !['delivered', 'cancelled'].includes(o.status)) ?? null,
          freshAds: db.ads.slice(0, 8),
          adsTotal: db.ads.length,
        })

      /* ================= market ================= */
      case 'market.list': {
        const kind = String(body.kind ?? body.section ?? '')
        const rows = kind ? db.ads.filter((a) => a.kind === kind || a.section === kind) : db.ads
        return ok({ ads: rows, total: rows.length })
      }
      case 'market.get': {
        const ad = db.ads.find((a) => a.id === Number(body.id))
        return ad ? ok({ ad, fav: favAds.has(ad.id) }) : err('Объявление не найдено', 404)
      }
      case 'market.my':
        return ok({ ads: db.ads.slice(0, 1).map((a) => ({ ...a, views: 46, favs: 3 })) })
      case 'market.create':
        return ok({ id: 900, status: 'На проверке' })

      /* ================= favs ================= */
      case 'favs.toggle': {
        const kind = String(body.kind ?? 'ad')
        const id = Number(body.id)
        const set = kind === 'place' ? favPlaces : favAds
        if (set.has(id)) set.delete(id); else set.add(id)
        return ok({ on: set.has(id) })
      }
      case 'favs.list':
        return ok({
          ads: db.ads.filter((a) => favAds.has(a.id)),
          places: db.places.filter((p) => favPlaces.has(p.id)),
        })

      /* ================= food ================= */
      case 'food.restaurants':
        return ok({ restaurants: db.restaurants })
      case 'food.get': {
        const rest = findRest(body.id ?? body.key)
        return rest ? ok({ restaurant: rest }) : err('Заведение не найдено', 404)
      }
      case 'food.order': {
        const rest = findRest(body.rest)
        if (!rest) return err('Заведение не найдено', 404)
        const items = (body.items ?? []) as MockOrder['items']
        const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
        const fee = subtotal >= rest.freeFrom ? 0 : rest.deliveryFee
        const order: MockOrder = {
          id: orders.length + 1,
          seq: ++orderSeq,
          restKey: rest.key,
          status: 'pending',
          items,
          subtotal,
          delivery_fee: fee,
          total: subtotal + fee,
          kaspi: String(body.kaspi ?? demoUser.phone),
          district: String(body.district ?? ''),
          address: String(body.address ?? ''),
          customer_name: demoUser.name,
          customer_phone: demoUser.phone,
        }
        orders.unshift(order)
        return ok({ order })
      }
      case 'food.my_orders':
        return ok({ orders })
      case 'food.order_status': {
        const o = orders.find((x) => x.id === Number(body.id))
        return o ? ok({ order: o }) : err('Заказ не найден', 404)
      }
      case 'food.mark_paid': {
        const o = orders.find((x) => x.id === Number(body.id))
        if (!o) return err('Заказ не найден', 404)
        o.status = 'paid'
        return ok({ order: o })
      }
      case 'food.reviews': {
        const rest = findRest(body.id ?? body.rest)
        return ok({ reviews: rest?.reviews ?? null })
      }

      /* ================= owner (кабинет заведения) ================= */
      case 'owner.orders':
        return ok({ orders, open: true })
      case 'owner.set_status': {
        const o = orders.find((x) => x.id === Number(body.id))
        if (!o) return err('Заказ не найден', 404)
        const to = String(body.status)
        // переходы по HANDOFF §6
        const allowed: Record<string, string[]> = {
          pending: ['accepted', 'cancelled'],
          accepted: ['paid', 'cancelled'],
          paid: ['preparing', 'cancelled'],
          preparing: ['ready', 'courier', 'cancelled'],
          ready: ['courier', 'delivered', 'cancelled'],
          courier: ['delivered', 'cancelled'],
        }
        if (!allowed[o.status]?.includes(to)) return err(`Нельзя перевести из «${o.status}» в «${to}»`)
        o.status = to
        return ok({ order: o })
      }
      case 'owner.toggle_open':
        return ok({ open: Boolean(body.open) })

      /* ================= bizmap (карта) ================= */
      case 'bizmap.list':
        return ok({ places: db.places })
      case 'bizmap.get': {
        const p = db.places.find((x) => x.id === Number(body.id) || x.key === body.id)
        return p ? ok({ place: p, fav: favPlaces.has(p.id) }) : err('Объект не найден', 404)
      }
      case 'bizmap.add': {
        const place = {
          ...db.places[0],
          id: 100 + myPlaces.length,
          key: `new${myPlaces.length}`,
          name: String(body.name ?? 'Новое место'),
          category: String(body.category ?? ''),
          address: String(body.address ?? ''),
          pending: 1 as const,
          reject_reason: '',
          imageIds: [],
          reviewCards: [],
        }
        myPlaces.push(place)
        return ok({ place })
      }
      case 'bizmap.my':
        return ok({
          places: [
            { ...db.places[0], pending: 0, reject_reason: '', views: 1240 },
            ...myPlaces,
            { ...db.places[5], id: 99, pending: 1, reject_reason: 'Добавьте фото вывески и уточните график работы', views: 0 },
          ],
        })
      case 'bizmap.reviews': {
        const p = db.places.find((x) => x.id === Number(body.id))
        return ok({ reviews: p?.reviewCards ?? [] })
      }

      /* ================= gigs (работа) ================= */
      case 'gigs.list':
        return ok({ gigs: db.gigs, employers: db.employers })
      case 'gigs.get': {
        const g = db.gigs.find((x) => x.id === Number(body.id) || x.key === body.id)
        if (!g) return err('Вакансия не найдена', 404)
        return ok({ gig: g, employer: db.employers.find((e) => e.key === g.employerKey) ?? null, responded: responded.has(g.id) })
      }
      case 'gigs.respond': {
        const g = db.gigs.find((x) => x.id === Number(body.id) || x.key === body.id)
        if (!g) return err('Вакансия не найдена', 404)
        responded.add(g.id)
        return ok()
      }

      /* ================= services (мастера) ================= */
      case 'services.list':
        return ok({ masters })
      case 'services.get': {
        const m = masters.find((x) => x.id === Number(body.id))
        return m ? ok({ master: m }) : err('Мастер не найден', 404)
      }

      /* ================= feed ================= */
      case 'feed.list':
        return ok({ posts })
      case 'feed.get': {
        const p = posts.find((x) => x.id === Number(body.id))
        return p ? ok({ post: p }) : err('Пост не найден', 404)
      }
      case 'feed.comments': {
        const p = posts.find((x) => x.id === Number(body.id))
        return ok({ comments: p?.comments ?? [] })
      }
      case 'feed.vote': {
        const p = posts.find((x) => x.id === Number(body.id))
        if (!p) return err('Пост не найден', 404)
        const on = Number(body.on) as 1 | -1
        if (p.myVote === on) { p.myVote = 0; if (on === 1) p.likes--; else p.dislikes-- }
        else {
          if (p.myVote === 1) p.likes--
          if (p.myVote === -1) p.dislikes--
          p.myVote = on
          if (on === 1) p.likes++; else p.dislikes++
        }
        return ok({ likes: p.likes, dislikes: p.dislikes, myVote: p.myVote })
      }
      case 'feed.comment': {
        const p = posts.find((x) => x.id === Number(body.id))
        if (!p) return err('Пост не найден', 404)
        const c = { id: ++postSeq, authorName: demoUser.name, when: 'только что', text: String(body.text ?? ''), likes: 0 }
        p.comments.push(c)
        return ok({ comment: c })
      }
      case 'feed.create': {
        const p: MockPost = { id: ++postSeq, authorName: demoUser.name, when: 'только что', text: String(body.text ?? ''), imageId: null, likes: 0, dislikes: 0, myVote: 0, comments: [] }
        posts.unshift(p)
        return ok({ post: p })
      }

      /* ================= geoinsta (stories) ================= */
      case 'geoinsta.list':
        return ok({ stories: db.stories })
      case 'geoinsta.get': {
        const s = db.stories.find((x) => x.id === Number(body.id) || x.key === body.id)
        return s ? ok({ story: s }) : err('История не найдена', 404)
      }
      case 'geoinsta.vote': {
        const s = db.stories.find((x) => x.id === Number(body.id) || x.key === body.id)
        if (!s) return err('История не найдена', 404)
        s.likes += 1
        return ok({ likes: s.likes })
      }

      /* ================= notif / profile ================= */
      case 'notif.list':
        return ok({
          notifications: [
            { id: 1, icon: 'megaphone', title: 'Ваше объявление одобрено', sub: 'Toyota Camry 50 — уже в списке', when: '10 мин назад', go: '/market/my' },
            { id: 2, icon: 'courier', title: 'Заказ №14 едет к вам', sub: 'Курьер будет через 15 минут', when: 'час назад', go: '/orders' },
            { id: 3, icon: 'location', title: 'Новое место рядом', sub: 'Салон «Сымбат» появился на карте', go: '/map', when: 'вчера' },
          ],
        })
      case 'notif.read':
        return ok()
      case 'profile.get':
        return ok({ user: demoUser })

      default:
        return err(`Мок для «${r}» ещё не описан`, 404)
    }
  }),
]
