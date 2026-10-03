#  Фронтенд (Nuxt <img src="https://nuxt.com/assets/design-kit/icon-green.svg" height="20" style="vertical-align:middle">)

## Архитектура

Фронтенд не хранит никакого состояния авторизации — ни в `localStorage`, ни в `sessionStorage`. Всё хранится в `httpOnly` cookies, которые браузер отправляет автоматически. Nuxt только **читает** текущее состояние и кладёт его в реактивный `useState`.

Авторизация обрабатывается в двух сценариях:

- **Сценарий 1 — F5 (полная загрузка страницы)**

  access_token мог протухнуть пока пользователь не заходил. Нужно обновить токен до SSR-рендера, чтобы сервер и клиент видели одинаковое состояние и не было hydration mismatch.

- **Сценарий 2 — SPA-навигация (без перезагрузки)**

  пользователь переходит между страницами или совершает действие (удалить, сохранить) когда access_token уже протух. API-запрос вернёт 401 — нужно автоматически обновить токен и повторить запрос.

Оба сценария решаются независимо разными инструментами.

## Правило: все запросы только через `$api` или `useApi`

> **Любой запрос к защищённому API должен идти через `$api` или `useApi` — никогда напрямую через `$fetch` или `useFetch`.**

Только `$api` и `useApi` содержат логику 401-retry: при истёкшем access_token они автоматически делают refresh и повторяют запрос. Прямой `$fetch`/`useFetch` при 401 просто упадёт с ошибкой — пользователь увидит сломанный интерфейс вместо прозрачного восстановления сессии.

```typescript
// ✅ правильно
const { $api } = useNuxtApp()
await $api('/tasks', { method: 'POST', body: { title } })

const { data } = await useApi<Task[]>('/tasks')

// ❌ неправильно — нет 401-retry
await $fetch('/api/backend/tasks', { method: 'POST', body: { title } })
const { data } = await useFetch('/api/backend/tasks')
```

Исключение — публичные эндпоинты (`/auth/login`, `/auth/register`) и запросы внутри самой логики авторизации (`plugins/02.auth.ts`, `composables/useAuth.ts`), где retry неприменим по определению.

## Файлы

| Файл                             | Сценарий | Роль                                             |
| -------------------------------- | -------- | ------------------------------------------------ |
| `server/middleware/auth.ts`      | F5       | Silent refresh до SSR-рендера                    |
| `plugins/01.api.ts`              | SPA      | `$api` с 401-retry для императивных запросов     |
| `composables/useApi.ts`          | SPA      | `useApi` с 401-retry для декларативных запросов  |
| `composables/useRefreshToken.ts` | —        | Дедупликация refresh: singleton промис           |
| `composables/apiErrorHandler.ts` | SPA      | Общий 401-обработчик для `$api` и `useApi`       |
| `plugins/02.auth.ts`             | Оба      | Заполняет `user` через `/auth/me` при старте     |
| `composables/useAuth.ts`         | —        | `login`, `logout`, `register`, реактивный `user` |
| `middleware/auth.global.ts`      | —        | Защита роутов: редирект на `/login` или `/`      |

## Сценарий 1: F5 с протухшим токеном

При полной загрузке страницы нельзя допустить чтобы сервер рендерил страницу в состоянии "не авторизован", а клиент после гидратации оказывался авторизованным — это **hydration mismatch**, Vue выбросит предупреждение и возможны визуальные артефакты.

Решение — `server/middleware/auth.ts`: Nitro middleware, который перехватывает запрос **до Vue/SSR**.

| Шаг | Браузер                                                    | Nitro                                                                    | Vue / SSR                                                           |
| --- | ---------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| 1   | `GET /profile` (только `refresh_token`)                    |                                                                          |                                                                     |
| 2   |                                                            | `server/middleware/auth.ts`: нет `access_token`, есть `refresh_token`    |                                                                     |
| 3   |                                                            | `POST /auth/refresh` → NestJS напрямую (server-to-server)                |                                                                     |
| 4   |                                                            | Новые токены: `Set-Cookie` → в ответ страницы; cookie → в текущий запрос |                                                                     |
| 5   |                                                            |                                                                          | `plugins/02.auth.ts`: `GET /auth/me` → `user.value = {…}`           |
| 6   |                                                            |                                                                          | `middleware/auth.global.ts`: `user != null` → пускает на `/profile` |
| 7   |                                                            |                                                                          | SSR рендер: `layout = default`, user есть                           |
| 8   | Получает HTML + `Set-Cookie`, сохраняет новые токены       |                                                                          |                                                                     |
| 9   | Vue гидратируется: `user != null` → нет hydration mismatch |                                                                          |                                                                     |

**Почему refresh именно здесь, а не в Vue-плагине:** `Set-Cookie` должен попасть в браузер _и_ быть виден SSR-рендеру в рамках одного запроса. Nitro middleware выполняется раньше Vue — он обновляет cookie-заголовок текущего запроса (для SSR) и добавляет `Set-Cookie` в HTTP-ответ (для браузера). Из Vue-плагина сделать то же самое невозможно — Vue уже запущен.

## Сценарий 2: SPA-навигация с протухшим токеном

Пользователь открыл страницу, токен был жив. Через минуту access_token протух, пользователь нажал "Удалить" — `$api` получит 401. Без retry запрос просто упадёт с ошибкой, действие не выполнится.

Решение — встроенный механизм `ofetch`: `retry: 1` + `retryStatusCodes: [401]`. При 401 `ofetch` вызывает `onResponseError`, где мы делаем refresh, а затем **автоматически повторяет** оригинальный запрос уже с новым токеном.

```
$api('/users/1', { method: 'DELETE' })
  → 401
  → onResponseError: POST /auth/refresh → 200, новый токен в куках
  → ofetch автоматически повторяет DELETE /users/1
  → 204 No Content ✓
```

Если refresh провалился (сессия истекла) — `options.retry = 0` отменяет повторный запрос, `user.value = null`, редирект на `/login`.

## plugins/01.api.ts — `$api`

Предоставляет `$api` — императивный HTTP-клиент для действий по событию (клик, submit).

```typescript
const { $api } = useNuxtApp()
await $api('/users/1', { method: 'DELETE' })
await $api('/auth/login', { method: 'POST', body: { email, password } })
```

Построен на `$fetch.create` с `retry: 1` и `retryStatusCodes: [401]`. При 401 делает refresh и повторяет запрос автоматически.

**Когда использовать:** всегда когда запрос инициируется пользователем — удаление, создание, обновление, логин, логаут.

## composables/useApi.ts — `useApi`

Предоставляет `useApi` — декларативный способ загрузки данных для компонента.

```typescript
const { data: users, refresh } = await useApi<User[]>('/users', { default: () => [] })
```

Построен на `createUseFetch` (Nuxt 4) с теми же `retry: 1` и `retryStatusCodes: [401]`.

**Чем отличается от `$api`:** `useFetch` делает больше чем просто запрос:

- Результат **реактивен** — компонент обновится автоматически
- Участвует в **SSR payload** — данные загруженные на сервере передаются клиенту, не нужен повторный запрос при гидратации
- **Дедуплицирует** одинаковые запросы — если два компонента вызывают `useApi('/users')`, запрос уйдёт один раз

**Когда использовать:** когда данные нужны компоненту при рендере — списки, профиль, любые данные для отображения.

### `useApi` vs `$api` — итог

|              | `useApi`                                  | `$api`                                         |
| ------------ | ----------------------------------------- | ---------------------------------------------- |
| Тип          | Декларативный (`useFetch`)                | Императивный (`$fetch`)                        |
| Когда        | При рендере компонента                    | По событию (клик, submit)                      |
| Реактивность | Да — `data` обновляется автоматически     | Нет — просто Promise                           |
| SSR payload  | Да — данные передаются клиенту            | Нет                                            |
| Пример       | `const { data } = await useApi('/users')` | `await $api('/users/1', { method: 'DELETE' })` |

## composables/useRefreshToken.ts

Содержит дедуплицированный refresh — singleton промис, общий для `$api` и `useApi`.

**Проблема без дедупликации:** если на странице несколько компонентов делают запросы одновременно (например `HomeTasks` и `HomeDbTables`) и access_token протух — оба получают 401 и оба пытаются сделать `/auth/refresh`. Первый успевает, второй использует уже помеченный `isUsed: true` refresh token → reuse detection → вся семья сессий уничтожается → разлогин.

**Решение:** `refreshPromise` — модульная переменная (живёт вне функции). Пока refresh выполняется, все последующие вызовы получают тот же промис и ждут его результата. После завершения промис сбрасывается в `null`.

```typescript
let refreshPromise: Promise<boolean> | null = null  // singleton на модуль

async function refresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise  // уже выполняется — ждём
  refreshPromise = $fetch('/auth/refresh', { method: 'POST', ... })
    .finally(() => { refreshPromise = null })
  return refreshPromise
}
```

## composables/apiErrorHandler.ts

Общий обработчик 401 для обоих клиентов — `$api` (`plugins/01.api.ts`) и `useApi` (`composables/useApi.ts`). Фабрика `createAuthErrorHandler()` принимает функцию навигации, потому что клиенты вызывают её по-разному: `useApi` — через `navigateTo` напрямую, `$api` — через `nuxtApp.runWithContext`.

Логика по порядку:

1. Не 401 — выходим сразу
2. Запрос к `/auth/*` — отменяем retry (иначе бесконечный цикл: refresh падает с 401 → снова refresh)
3. SSR — отменяем retry и обнуляем `user`: silent refresh уже отработал в Nitro middleware, повторять нечего
4. Клиент — делаем refresh через дедуплицированный `useRefreshToken`, при неудаче разлогиниваем

::: warning Композаблы вызываются в фабрике, а не в обработчике
```typescript
export function createAuthErrorHandler(navigateToLogin) {
  const { user } = useAuth()          // ← здесь: контекст Nuxt есть
  const { refresh } = useRefreshToken()

  return async function onResponseError(...) {
    // ← а здесь контекста уже нет: это асинхронный колбэк ofetch
  }
}
```

Вызов композабла внутри `onResponseError` даёт ошибку `NUXT_E1001: A composable that requires access to the Nuxt instance was called outside of a plugin, Nuxt hook, or Vue setup function`. Фабрика же выполняется в контексте плагина/setup, где композаблы легальны.
:::

## plugins/02.auth.ts

Выполняется при каждом старте приложения — на сервере (SSR) и на клиенте (после гидратации). Заполняет `useState('auth.user')` через `/auth/me`.

**На сервере:** к этому моменту `server/middleware/auth.ts` уже обновил куки — `/auth/me` выполняется с актуальным `access_token`. Используется `useRequestFetch()`, а не `$fetch`: обычный `$fetch` на сервере работает в контексте Node.js и не видит браузерных кук, а `useRequestFetch` форвардит заголовки входящего запроса автоматически.

::: tip Почему не читать куки вручную
Напрашивается вариант проще: взять `nuxtApp.ssrContext?.event.headers.get('cookie')` и передать в `headers` вручную. Он работает, но хрупок: `event.headers` **кэширует** значение при первом чтении, поэтому если любое middleware выше по цепочке обратилось к нему раньше — плагин получит старый токен и пользователя выбросит на логин.

`useRequestFetch()` этой проблемы лишён: внутри он доходит до `getRequestHeaders()`, который читает `event.node.req.headers` напрямую, минуя кэш.
:::

**На клиенте:** пробует `/auth/me`. Если 401 (edge-case: токен протух между SSR и гидратацией) — делает refresh, затем снова `/auth/me`. В штатном сценарии браузер уже получил новые токены в `Set-Cookie` от Nitro и `/auth/me` проходит сразу.

## composables/useAuth.ts

Содержит действия авторизации и реактивный `user`.

`user` хранится в `useState('auth.user')` — per-request state (не глобальная переменная). Nuxt сериализует его в SSR payload и восстанавливает на клиенте при гидратации. Благодаря этому `user`, установленный на сервере, сразу доступен клиенту без повторного запроса.

После `login` и `register` явно запрашивает `/auth/me` и кладёт результат в `user` — надёжнее чем парсить ответ самого логина, потому что `/auth/me` всегда возвращает актуальные данные из хранилища.

## middleware/auth.global.ts

Выполняется при каждой навигации. Читает `user.value`:

| Условие                                           | Действие             |
| ------------------------------------------------- | -------------------- |
| Роут `guestOnly` и `user != null`                 | Редирект на `/`      |
| Роут не `public` и не `guestOnly`, `user == null` | Редирект на `/login` |
| Остальное                                         | Пропускает           |

Метаданные роутов задаются через `definePageMeta`:

```typescript
definePageMeta({ layout: 'auth', guestOnly: true }) // /login, /register
definePageMeta({ public: true }) // публичные страницы
// защищённый роут — ничего не указывать (по умолчанию)
```

## Layouts

`default` — для авторизованных пользователей, с шапкой. `auth` — для гостевых страниц (`/login`, `/register`), чистый фон без навигации.

## BFF proxy

Все запросы идут через Nuxt BFF proxy (`server/api/backend/[...path].ts`), а не напрямую к NestJS. Это решает две проблемы:

1. **CORS:** браузер обращается к тому же origin — прокси форвардит на NestJS
2. **Cookies:** `SameSite=Strict` работает корректно — запрос к тому же домену

`apiBase = '/api/backend'` (публичный, для браузера и SSR через прокси). `backendUrl` (приватный) используется только в Nitro middleware для прямого server-to-server запроса к NestJS.

## Документация

- [Nuxt: Custom useFetch](https://nuxt.com/docs/4.x/guide/recipes/custom-usefetch) — `createUseFetch`, вшитый `baseURL`, interceptors
- [Nuxt: useState](https://nuxt.com/docs/api/composables/use-state) — per-request SSR-совместимый state
- [Nuxt: Server Middleware](https://nuxt.com/docs/guide/directory-structure/server#server-middleware) — Nitro middleware, выполняется до рендера
- [Nuxt: Plugins](https://nuxt.com/docs/guide/directory-structure/plugins) — порядок выполнения, нумерация файлов
- [Nuxt: Route Middleware](https://nuxt.com/docs/guide/directory-structure/middleware) — `defineNuxtRouteMiddleware`, `navigateTo`
- [ofetch: retry](https://github.com/unjs/ofetch#%EF%B8%8F-auto-retry) — `retry`, `retryStatusCodes`, `retryDelay`
- [nuxt/nuxt Discussion #22441](https://github.com/nuxt/nuxt/discussions/22441) — паттерн 401-retry с ofetch в Nuxt
