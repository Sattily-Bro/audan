# Audan.kz — фронтенд

Производственный фронт городского супер-аппа Шу (редизайн raion.kz).
Один код — три поставки: веб (PWA), Android и iOS через Capacitor-обёртки из raion-handoff.

## Запуск

```bash
npm install

# с мок-данными (без бэкенда) — данные и фото из дизайн-прототипа
npm run dev:mock

# с живым PHP-бэкендом raion-handoff (HANDOFF.md §9: php -S localhost:8000)
npm run dev            # прокси /api → localhost:8000 (переопределяется VITE_API_TARGET)

npm run build          # проверка типов + прод-сборка в dist/
```

Мок-вход: любой номер, SMS-код `0000`.

## Структура

| Путь | Что это |
|---|---|
| `src/api/` | Контракт с бэком: `client.ts` (транспорт `POST /api/?r=…`, HANDOFF §2), `routes.ts` (все роуты §3 — опечатка не скомпилируется), `types.ts` (словарь §4, статусы §6) |
| `src/screens/` | Экраны по разделам (auth, home, market, food, map, jobs, feed, profile). В шапке каждого файла — ссылка на секцию дизайн-эталона |
| `src/ui/` | Общие элементы: `Icon` (заказной пак, 155 SVG), `TabBar` (контекстные таб-бары), `SHead`, `kit` (чипы, фото, секции) |
| `src/styles/app.css` | Дизайн-токены (тёплые нейтрали, радиусы, `--acc*`) |
| `src/theme/palettes.ts` | 13 палитр-кандидатов; финальный выбор за владельцем (дефолт «Кобальт») |
| `src/mocks/` | MSW-моки всего API + `data.json` (сгенерирован из прототипа) |
| `src/lib/sections.gen.ts` | SECTION_FIELDS — словарь полей объявлений (сгенерирован из raion-handoff) |
| `scripts/gen-mocks.mjs` | Перегенерация моков и словаря из `../design` и `../raion-handoff` |

## Правила

- **Дизайн-эталон** каждого экрана — секция `SN` в `../design/src/audan-screens.html`
  (интерактивный прототип: `../design/flow.html`). Поведение и тексты — оттуда.
- **Контракт API** — только из `../raion-handoff/HANDOFF.md` и PHP-роутов; типы не выводить из наблюдений.
- Пути роутера совместимы с deep-links старого сайта (`/ad/:id`, `/place/:id`, `/post/:id`) — не ломать.
- `id` элементов форм не должны совпадать с `id` иконок спрайта (`#phone` — иконка).
- Флоу оплаты еды — по счёту Kaspi, без списаний при оформлении: `../design/FOOD-ORDER-FLOW.md`.

## Сборка в мобильное приложение

```bash
npm run build
# dist/ кладётся в Capacitor-обёртку raion-handoff (android/, ios/, capacitor.config.json):
# webDir указывается на этот dist, дальше npx cap sync && npx cap open android|ios
```
