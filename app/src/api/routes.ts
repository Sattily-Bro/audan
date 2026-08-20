// Полный список роутов фронта — из raion-handoff/HANDOFF.md §3.
// Единственный источник истины по именам: правки только вслед за бэком.
// Группы channels/groups/taxi/cinema/games «спят» и фронтом не используются.

export const API_ROUTES = [
  // auth — регистрация, вход, аккаунт
  'auth.me', 'auth.logout',
  'auth.phone_start', 'auth.phone_check',
  'auth.phone_register', 'auth.phone_verify', 'auth.phone_login',
  'auth.phone_forgot', 'auth.phone_reset', 'auth.phone_resend',
  'auth.update_name', 'auth.update_contacts', 'auth.change_password', 'auth.update_avatar',
  'auth.accept_docs', 'auth.delete_account',
  'auth.block_user', 'auth.unblock_user', 'auth.blocked_list',
  // home — сводка главной
  'home.summary',
  // market — объявления
  'market.list', 'market.get', 'market.create', 'market.edit', 'market.delete',
  'market.my', 'market.bump', 'market.report',
  // feed — лента
  'feed.list', 'feed.get', 'feed.news', 'feed.comments', 'feed.create', 'feed.repost',
  'feed.vote', 'feed.commentVote', 'feed.comment', 'feed.edit', 'feed.delete', 'feed.save', 'feed.report',
  // food — еда и заказы
  'food.restaurants', 'food.get', 'food.order', 'food.my_orders', 'food.order_status',
  'food.mark_paid', 'food.reviews', 'food.review',
  // owner — кабинет заведения
  'owner.orders', 'owner.set_status', 'owner.toggle_open', 'owner.menu_save',
  // bizmap — карта города
  'bizmap.list', 'bizmap.get', 'bizmap.add', 'bizmap.my', 'bizmap.edit', 'bizmap.reviews', 'bizmap.review',
  // gigs — работа и подработка
  'gigs.list', 'gigs.get', 'gigs.create', 'gigs.respond', 'gigs.my',
  // services — мастера
  'services.list', 'services.get', 'services.apply',
  // favs — сохранённое
  'favs.toggle', 'favs.list',
  // profile
  'profile.get', 'profile.update',
  // notif / push
  'notif.list', 'notif.read', 'push.subscribe', 'push.unsubscribe',
  // media
  'media.upload',
  // geoinsta — stories
  'geoinsta.list', 'geoinsta.get', 'geoinsta.create', 'geoinsta.vote',
] as const

export type ApiRoute = (typeof API_ROUTES)[number]
