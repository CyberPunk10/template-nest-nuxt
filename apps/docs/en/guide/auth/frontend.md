#  Frontend (Nuxt <img src="https://nuxt.com/assets/design-kit/icon-green.svg" height="20" style="vertical-align:middle">)

## Architecture

The frontend stores no authentication state at all — neither in `localStorage` nor in `sessionStorage`. Everything lives in `httpOnly` cookies that the browser sends automatically. Nuxt only **reads** the current state and puts it into a reactive `useState`.

Authentication is handled in two scenarios:

- **Scenario 1 — F5 (full page load)**

  the access_token may have expired while the user was away. The token must be refreshed before SSR rendering so that server and client see the same state and there's no hydration mismatch.

- **Scenario 2 — SPA navigation (no reload)**

  the user moves between pages or performs an action (delete, save) when the access_token has already expired. The API request returns 401 — the token must be refreshed automatically and the request retried.

Both scenarios are solved independently by different tools.

## Rule: all requests only through `$api` or `useApi`

> **Any request to the protected API must go through `$api` or `useApi` — never directly through `$fetch` or `useFetch`.**

Only `$api` and `useApi` contain the 401-retry logic: when the access_token has expired they automatically perform a refresh and retry the request. A direct `$fetch`/`useFetch` on a 401 simply fails with an error — the user sees a broken UI instead of a transparent session recovery.

```typescript
// ✅ correct
const { $api } = useNuxtApp()
await $api('/tasks', { method: 'POST', body: { title } })

const { data } = await useApi<Task[]>('/tasks')

// ❌ wrong — no 401-retry
await $fetch('/api/backend/tasks', { method: 'POST', body: { title } })
const { data } = await useFetch('/api/backend/tasks')
```

The exception is public endpoints (`/auth/login`, `/auth/register`) and requests inside the auth logic itself (`plugins/02.auth.ts`, `composables/useAuth.ts`), where retry is inapplicable by definition.

## Files

| File                             | Scenario | Role                                             |
| -------------------------------- | -------- | ------------------------------------------------ |
| `server/middleware/auth.ts`      | F5       | Silent refresh before SSR rendering              |
| `plugins/01.api.ts`              | SPA      | `$api` with 401-retry for imperative requests    |
| `composables/useApi.ts`          | SPA      | `useApi` with 401-retry for declarative requests |
| `composables/useRefreshToken.ts` | —        | Refresh deduplication: singleton promise         |
| `composables/apiErrorHandler.ts` | SPA      | Shared 401 handler for `$api` and `useApi`       |
| `plugins/02.auth.ts`             | Both     | Populates `user` via `/auth/me` on startup       |
| `composables/useAuth.ts`         | —        | `login`, `logout`, `register`, reactive `user`   |
| `middleware/auth.global.ts`      | —        | Route protection: redirect to `/login` or `/`    |

## Scenario 1: F5 with an expired token

On a full page load we must not let the server render the page as "unauthenticated" while the client ends up authenticated after hydration — that's a **hydration mismatch**, Vue will throw a warning and visual artifacts are possible.

The solution is `server/middleware/auth.ts`: a Nitro middleware that intercepts the request **before Vue/SSR**.

| Step | Browser                                                    | Nitro                                                                    | Vue / SSR                                                           |
| --- | ---------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| 1   | `GET /profile` (only `refresh_token`)                      |                                                                          |                                                                     |
| 2   |                                                            | `server/middleware/auth.ts`: no `access_token`, has `refresh_token`      |                                                                     |
| 3   |                                                            | `POST /auth/refresh` → NestJS directly (server-to-server)                |                                                                     |
| 4   |                                                            | New tokens: `Set-Cookie` → into the page response; cookie → into the current request |                                                         |
| 5   |                                                            |                                                                          | `plugins/02.auth.ts`: `GET /auth/me` → `user.value = {…}`           |
| 6   |                                                            |                                                                          | `middleware/auth.global.ts`: `user != null` → allows `/profile`     |
| 7   |                                                            |                                                                          | SSR render: `layout = default`, user present                        |
| 8   | Receives HTML + `Set-Cookie`, stores the new tokens        |                                                                          |                                                                     |
| 9   | Vue hydrates: `user != null` → no hydration mismatch       |                                                                          |                                                                     |

**Why the refresh happens here and not in a Vue plugin:** `Set-Cookie` must reach the browser _and_ be visible to the SSR render within a single request. Nitro middleware runs before Vue — it updates the cookie header of the current request (for SSR) and adds `Set-Cookie` to the HTTP response (for the browser). Doing the same from a Vue plugin is impossible — Vue is already running.

## Scenario 2: SPA navigation with an expired token

The user opened the page while the token was alive. A minute later the access_token expired, the user clicked "Delete" — `$api` will get a 401. Without retry the request just fails with an error and the action isn't performed.

The solution is `ofetch`'s built-in mechanism: `retry: 1` + `retryStatusCodes: [401]`. On a 401 `ofetch` calls `onResponseError`, where we do the refresh, and then it **automatically retries** the original request with the new token.

```
$api('/users/1', { method: 'DELETE' })
  → 401
  → onResponseError: POST /auth/refresh → 200, new token in cookies
  → ofetch automatically retries DELETE /users/1
  → 204 No Content ✓
```

If the refresh fails (session expired) — `options.retry = 0` cancels the retry, `user.value = null`, redirect to `/login`.

## plugins/01.api.ts — `$api`

Provides `$api` — an imperative HTTP client for event-driven actions (click, submit).

```typescript
const { $api } = useNuxtApp()
await $api('/users/1', { method: 'DELETE' })
await $api('/auth/login', { method: 'POST', body: { email, password } })
```

Built on `$fetch.create` with `retry: 1` and `retryStatusCodes: [401]`. On a 401 it refreshes and retries the request automatically.

**When to use:** always when the request is initiated by the user — delete, create, update, login, logout.

## composables/useApi.ts — `useApi`

Provides `useApi` — a declarative way to load data for a component.

```typescript
const { data: users, refresh } = await useApi<User[]>('/users', { default: () => [] })
```

Built on `createUseFetch` (Nuxt 4) with the same `retry: 1` and `retryStatusCodes: [401]`.

**How it differs from `$api`:** `useFetch` does more than just a request:

- The result is **reactive** — the component updates automatically
- It participates in the **SSR payload** — data loaded on the server is passed to the client, so no repeat request is needed on hydration
- It **deduplicates** identical requests — if two components call `useApi('/users')`, the request fires only once

**When to use:** when the component needs the data at render time — lists, profile, any data for display.

### `useApi` vs `$api` — summary

|              | `useApi`                                  | `$api`                                         |
| ------------ | ----------------------------------------- | ---------------------------------------------- |
| Type         | Declarative (`useFetch`)                  | Imperative (`$fetch`)                          |
| When         | At component render                       | On an event (click, submit)                    |
| Reactivity   | Yes — `data` updates automatically        | No — just a Promise                            |
| SSR payload  | Yes — data is passed to the client        | No                                             |
| Example      | `const { data } = await useApi('/users')` | `await $api('/users/1', { method: 'DELETE' })` |

## composables/useRefreshToken.ts

Contains the deduplicated refresh — a singleton promise shared by `$api` and `useApi`.

**The problem without deduplication:** if several components on a page make requests simultaneously (for example `HomeTasks` and `HomeDbTables`) and the access_token has expired — both get a 401 and both try to call `/auth/refresh`. The first succeeds, the second uses a refresh token already flagged `isUsed: true` → reuse detection → the entire session family is destroyed → logout.

**The solution:** `refreshPromise` — a module-level variable (lives outside the function). While a refresh is in flight, all subsequent calls get the same promise and wait for its result. Once done, the promise is reset to `null`.

```typescript
let refreshPromise: Promise<boolean> | null = null  // singleton per module

async function refresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise  // already running — wait
  refreshPromise = $fetch('/auth/refresh', { method: 'POST', ... })
    .finally(() => { refreshPromise = null })
  return refreshPromise
}
```

## composables/apiErrorHandler.ts

The shared 401 handler for both clients — `$api` (`plugins/01.api.ts`) and `useApi` (`composables/useApi.ts`). The `createAuthErrorHandler()` factory takes a navigation function, because the clients call it differently: `useApi` uses `navigateTo` directly, `$api` goes through `nuxtApp.runWithContext`.

The logic, in order:

1. Not a 401 — return immediately
2. Request to `/auth/*` — cancel retry (otherwise an infinite loop: refresh fails with 401 → refresh again)
3. SSR — cancel retry and clear `user`: silent refresh already ran in the Nitro middleware, nothing to repeat
4. Client — refresh via the deduplicated `useRefreshToken`, log out on failure

::: warning Composables are called in the factory, not in the handler
```typescript
export function createAuthErrorHandler(navigateToLogin) {
  const { user } = useAuth()          // ← here: the Nuxt context exists
  const { refresh } = useRefreshToken()

  return async function onResponseError(...) {
    // ← here it's already gone: this is an async ofetch callback
  }
}
```

Calling a composable inside `onResponseError` throws `NUXT_E1001: A composable that requires access to the Nuxt instance was called outside of a plugin, Nuxt hook, or Vue setup function`. The factory, on the other hand, runs in a plugin/setup context where composables are valid.
:::

## plugins/02.auth.ts

Runs on every application startup — on the server (SSR) and on the client (after hydration). Populates `useState('auth.user')` via `/auth/me`.

**On the server:** by this point `server/middleware/auth.ts` has already refreshed the cookies — `/auth/me` runs with an up-to-date `access_token`. It uses `useRequestFetch()` rather than `$fetch`: plain `$fetch` runs in a Node.js context on the server and never sees browser cookies, while `useRequestFetch` forwards the incoming request headers automatically.

::: tip Why not read cookies manually
The obvious shortcut is to grab `nuxtApp.ssrContext?.event.headers.get('cookie')` and pass it into `headers` by hand. It works, but it is fragile: `event.headers` **caches** its value on first read, so if any middleware higher up the chain touched it earlier, the plugin gets the stale token and the user is bounced to the login page.

`useRequestFetch()` avoids this: internally it reaches `getRequestHeaders()`, which reads `event.node.req.headers` directly, bypassing the cache.
:::

**On the client:** it tries `/auth/me`. On a 401 (edge case: the token expired between SSR and hydration) — it refreshes, then calls `/auth/me` again. In the normal scenario the browser has already received new tokens in `Set-Cookie` from Nitro and `/auth/me` succeeds right away.

## composables/useAuth.ts

Contains the auth actions and the reactive `user`.

`user` is stored in `useState('auth.user')` — per-request state (not a global variable). Nuxt serializes it into the SSR payload and restores it on the client during hydration. Thanks to this, a `user` set on the server is immediately available to the client without a repeat request.

After `login` and `register` it explicitly requests `/auth/me` and puts the result into `user` — more reliable than parsing the login response itself, because `/auth/me` always returns up-to-date data from the storage.

## middleware/auth.global.ts

Runs on every navigation. Reads `user.value`:

| Condition                                          | Action               |
| -------------------------------------------------- | -------------------- |
| Route is `guestOnly` and `user != null`            | Redirect to `/`      |
| Route is neither `public` nor `guestOnly`, `user == null` | Redirect to `/login` |
| Otherwise                                          | Passes through       |

Route metadata is set via `definePageMeta`:

```typescript
definePageMeta({ layout: 'auth', guestOnly: true }) // /login, /register
definePageMeta({ public: true }) // public pages
// protected route — specify nothing (the default)
```

## Layouts

`default` — for authenticated users, with a header. `auth` — for guest pages (`/login`, `/register`), a clean background with no navigation.

## BFF proxy

All requests go through the Nuxt BFF proxy (`server/api/backend/[...path].ts`), not directly to NestJS. This solves two problems:

1. **CORS:** the browser talks to the same origin — the proxy forwards to NestJS
2. **Cookies:** `SameSite=Strict` works correctly — the request is to the same domain

`apiBase = '/api/backend'` (public, for the browser and for SSR through the proxy). `backendUrl` (private) is used only in the Nitro middleware for the direct server-to-server request to NestJS.

## Documentation

- [Nuxt: Custom useFetch](https://nuxt.com/docs/4.x/guide/recipes/custom-usefetch) — `createUseFetch`, built-in `baseURL`, interceptors
- [Nuxt: useState](https://nuxt.com/docs/api/composables/use-state) — per-request SSR-compatible state
- [Nuxt: Server Middleware](https://nuxt.com/docs/guide/directory-structure/server#server-middleware) — Nitro middleware, runs before rendering
- [Nuxt: Plugins](https://nuxt.com/docs/guide/directory-structure/plugins) — execution order, file numbering
- [Nuxt: Route Middleware](https://nuxt.com/docs/guide/directory-structure/middleware) — `defineNuxtRouteMiddleware`, `navigateTo`
- [ofetch: retry](https://github.com/unjs/ofetch#%EF%B8%8F-auto-retry) — `retry`, `retryStatusCodes`, `retryDelay`
- [nuxt/nuxt Discussion #22441](https://github.com/nuxt/nuxt/discussions/22441) — the 401-retry pattern with ofetch in Nuxt
