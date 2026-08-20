// Генератор мок-данных фронта.
// Источники истины: design/src/flow-shell.html (данные прототипа) и
// raion-handoff/src/market.jsx (SECTION_FIELDS — словарь полей объявлений, HANDOFF §4.1).
// Запуск: node scripts/gen-mocks.mjs  (из папки app/)
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'

const ROOT = path.resolve(import.meta.dirname, '..')
const DESIGN = path.resolve(ROOT, '../design/src')
const HANDOFF = path.resolve(ROOT, '../raion-handoff')

// ---------- 1. Данные прототипа ----------
const shell = fs.readFileSync(path.join(DESIGN, 'flow-shell.html'), 'utf8')
const start = shell.indexOf('function AD(')
const end = shell.indexOf('var SEARCH_DB')
const ctx = {}
vm.createContext(ctx)
vm.runInContext(shell.slice(start, end), ctx)
const { ADS, RESTS, STORIES, VACS, PLACES, MCATS, EMPLOYERS } = ctx

// ---------- 2. SECTION_FIELDS из market.jsx ----------
const mjsx = fs.readFileSync(path.join(HANDOFF, 'src/market.jsx'), 'utf8')
function extractDecl(src, name) {
  const at = src.indexOf('const ' + name)
  if (at < 0) return ''
  let i = src.indexOf('=', at) + 1
  let depth = 0, started = false
  for (; i < src.length; i++) {
    const ch = src[i]
    if (ch === "'" || ch === '"' || ch === '`') {
      const q = ch; i++
      while (i < src.length && src[i] !== q) { if (src[i] === '\\') i++; i++ }
    } else if (ch === '{' || ch === '[' || ch === '(') { depth++; started = true }
    else if (ch === '}' || ch === ']' || ch === ')') depth--
    else if ((ch === ';' || ch === '\n') && started && depth === 0) break
  }
  return src.slice(at, i + 1) + ';\n'
}
const sfBlock = extractDecl(mjsx, 'SECTION_FIELDS')
const deps = [...new Set(sfBlock.match(/[A-Z][A-Z0-9_]{3,}/g) || [])].filter((d) => d !== 'SECTION_FIELDS')
const sfCtx = {}
vm.createContext(sfCtx)
vm.runInContext(deps.map((d) => extractDecl(mjsx, d)).join('') + sfBlock + '\nthis.SECTION_FIELDS = SECTION_FIELDS;', sfCtx)
const SECTION_FIELDS = sfCtx.SECTION_FIELDS

// ---------- 3. Реестр картинок ----------
const imgIds = new Map()
let nextImg = 100
function img(name) {
  if (!name) return null
  if (!imgIds.has(name)) imgIds.set(name, nextImg++)
  return imgIds.get(name)
}
const gal = (names) => (names || []).map(img).filter(Boolean)

// ---------- 4. Нормализация ----------
// раздел прототипа → section API
const KIND2SECTION = {
  car: 'car', estate: 'realty', rent: 'realty_rent',
  sheep: 'livestock', horse: 'livestock', cattle: 'livestock', other: 'livestock',
  parts: 'car_parts', phones: 'phones', tech: 'appliances', furn: 'furniture',
  spec: 'spectech_sale',
}
// обратный словарь: русский лейбл → системный ключ extra
const label2key = {}
for (const [section, fields] of Object.entries(SECTION_FIELDS)) {
  label2key[section] = Object.fromEntries(fields.map((f) => [f.label, f.key]))
}

let adId = 200
const ads = []
for (const [kind, group] of Object.entries(ADS)) {
  const section = KIND2SECTION[kind]
  for (const r of group.rows) {
    const [district, when] = String(r.m || '').split(' · ')
    const l2k = label2key[section] || {}
    const extra = {}
    for (const [label, value] of r.specs || []) extra[l2k[label] || label] = value
    ads.push({
      id: adId++,
      kind, // раздел прототипа — для группировки списков
      section,
      title: r.n,
      subtitle: r.s || '',
      price: r.p,
      district: district || 'Шу қаласы',
      createdAt: when || 'сегодня',
      imageIds: r.img ? [img(r.img), ...gal(r.gal).filter((x) => x !== img(r.img))] : gal(r.gal),
      extra,
      sellerName: (r.seller && r.seller[0]) || 'Продавец',
      sellerSince: (r.seller && r.seller[1]) || '',
      status: 'Опубликовано',
    })
  }
}

let restId = 1
const restaurants = Object.entries(RESTS).map(([key, r]) => ({
  id: restId++,
  key,
  name: r.n,
  logo: r.logo || '',
  imageId: img(r.img),
  rating: r.up || '',
  ratingCount: r.cnt || '',
  time: r.time || '',
  deliveryFee: r.feeN ?? 0,
  freeFrom: r.freeN ?? 0,
  open: true,
  phone: r.ph || '',
  menu: [
    ...(r.pop?.length ? [{ cat: 'Популярное', items: r.pop.map((d) => ({ name: d.n, price: d.p, desc: d.d || '', imageId: img(d.img) })) }] : []),
    ...(r.sections || []).map((s) => ({ cat: s.n, items: s.d.map((d) => ({ name: d.n, price: d.p, desc: d.d || '', imageId: img(d.img) })) })),
  ],
  reviews: r.rev || null,
}))

let vacId = 1
const gigs = Object.entries(VACS).map(([key, v]) => ({
  id: vacId++,
  key,
  kind: key.startsWith('g') ? 'gig' : 'vacancy',
  employerKey: v.ek,
  title: v.n,
  pay: v.p,
  employerLine: v.e,
  tags: v.tags || [],
  extra: Object.fromEntries((v.specs || [])),
  description: v.d || '',
}))

const employers = Object.entries(EMPLOYERS).map(([key, e]) => ({
  key,
  name: e.n,
  sub: e.sub || '',
  letter: e.l,
  color: e.c,
  imageId: img(e.img),
  staff: e.staff || '',
  answerRate: e.ans || '',
  about: e.about || '',
  phone: e.ph || '',
}))

let bizId = 1
const places = PLACES.map((p) => ({
  id: bizId++,
  key: p.id,
  name: p.n,
  category: MCATS[p.cat] || '',
  categoryKey: p.cat,
  sub: p.c,
  address: p.addr || '',
  hours: p.hours || '',
  open: !!p.open,
  h24: !!p.h24,
  delivery: !!p.del,
  rating: p.r,
  reviews: p.rev,
  far: p.far,
  farM: p.farM,
  phone: p.ph || '',
  imageIds: gal(p.gal),
  video: !!p.video,
  feat: p.feat || [],
  reviewCards: [
    { name: p.revName, when: p.revWhen, text: p.revText, stars: 5 },
    p.rev2 ? { name: p.rev2[0], when: p.rev2[1], text: p.rev2[2], stars: p.rev2[3] === '★★★★★' ? 5 : 4 } : null,
  ].filter(Boolean),
  x: p.x, y: p.y,
  pending: 0,
  reject_reason: '',
}))

let storyId = 1
const stories = Object.entries(STORIES).map(([key, s]) => ({
  id: storyId++, key, title: s.t, meta: s.m, imageId: img(s.img), likes: s.likes ?? 0,
}))

// ---------- 5. Запись ----------
const out = {
  ads, restaurants, gigs, employers, places, stories,
  sections: Object.fromEntries(Object.entries(ADS).map(([k, g]) => [k, { title: g.title, section: KIND2SECTION[k] }])),
  images: Object.fromEntries([...imgIds].map(([name, id]) => [id, name])),
}
fs.writeFileSync(path.join(ROOT, 'src/mocks/data.json'), JSON.stringify(out, null, 1))

// SECTION_FIELDS → типизированный модуль
fs.writeFileSync(path.join(ROOT, 'src/lib/sections.gen.ts'),
  '// Сгенерировано scripts/gen-mocks.mjs из raion-handoff/src/market.jsx (SECTION_FIELDS, HANDOFF §4.1).\n' +
  '// Не править руками — правки только вслед за бэком, затем перегенерировать.\n' +
  'export interface SectionField {\n  key: string\n  label: string\n  type: string\n  req?: boolean\n  options?: string[]\n  placeholder?: string\n  hint?: string\n}\n\n' +
  'export const SECTION_FIELDS: Record<string, SectionField[]> = ' +
  JSON.stringify(SECTION_FIELDS, null, 2) + '\n')

// картинки в public/mock-img/<id>.jpg
const dst = path.join(ROOT, 'public/mock-img')
fs.mkdirSync(dst, { recursive: true })
let copied = 0, missing = []
for (const [name, id] of imgIds) {
  const srcJpg = path.join(DESIGN, 'img', name + '.jpg')
  if (fs.existsSync(srcJpg)) { fs.copyFileSync(srcJpg, path.join(dst, id + '.jpg')); copied++ }
  else missing.push(name)
}
console.log(`ads=${ads.length} rests=${restaurants.length} gigs=${gigs.length} places=${places.length} stories=${stories.length} employers=${employers.length}`)
console.log(`images: ${copied} скопировано${missing.length ? ', НЕТ ФАЙЛОВ: ' + missing.join(', ') : ''}`)
