#  Frontend (Nuxt <img src="https://nuxt.com/assets/design-kit/icon-green.svg" height="20" style="vertical-align:middle">)

## สถาปัตยกรรม

Frontend ไม่เก็บสถานะการยืนยันตัวตนไว้เลย — ไม่ว่าจะใน `localStorage` หรือ `sessionStorage` ทุกอย่างถูกเก็บใน `httpOnly` cookies ซึ่ง browser ส่งให้โดยอัตโนมัติ Nuxt เพียง **อ่าน** สถานะปัจจุบันแล้วนำไปใส่ใน `useState` แบบ reactive

การยืนยันตัวตนถูกจัดการในสองสถานการณ์:

- **สถานการณ์ที่ 1 — F5 (โหลดหน้าเต็ม)**

  access_token อาจหมดอายุขณะที่ผู้ใช้ไม่ได้เข้ามา จำเป็นต้อง refresh token ก่อนการ render แบบ SSR เพื่อให้ server และ client เห็นสถานะเดียวกันและไม่เกิด hydration mismatch

- **สถานการณ์ที่ 2 — SPA-navigation (โดยไม่โหลดหน้าใหม่)**

  ผู้ใช้เปลี่ยนหน้าหรือทำ action (ลบ, บันทึก) ในขณะที่ access_token หมดอายุแล้ว API-request จะคืน 401 — จำเป็นต้อง refresh token โดยอัตโนมัติแล้วส่ง request ซ้ำ

ทั้งสองสถานการณ์ถูกแก้ไขอย่างเป็นอิสระด้วยเครื่องมือคนละตัว

## กฎ: ทุก request ต้องผ่าน `$api` หรือ `useApi` เท่านั้น

> **ทุก request ที่ยิงไปยัง API ที่มีการป้องกันต้องผ่าน `$api` หรือ `useApi` — ห้ามยิงตรงผ่าน `$fetch` หรือ `useFetch` เด็ดขาด**

มีเพียง `$api` และ `useApi` เท่านั้นที่มี logic ของ 401-retry: เมื่อ access_token หมดอายุ มันจะทำ refresh โดยอัตโนมัติแล้วส่ง request ซ้ำ ส่วน `$fetch`/`useFetch` โดยตรง เมื่อเจอ 401 จะล้มเหลวพร้อม error เฉย ๆ — ผู้ใช้จะเห็นหน้าจอที่พังแทนที่จะเป็นการกู้คืน session แบบโปร่งใส

```typescript
// ✅ ถูกต้อง
const { $api } = useNuxtApp()
await $api('/tasks', { method: 'POST', body: { title } })

const { data } = await useApi<Task[]>('/tasks')

// ❌ ไม่ถูกต้อง — ไม่มี 401-retry
await $fetch('/api/backend/tasks', { method: 'POST', body: { title } })
const { data } = await useFetch('/api/backend/tasks')
```

ข้อยกเว้น — endpoint สาธารณะ (`/auth/login`, `/auth/register`) และ request ภายใน logic การยืนยันตัวตนเอง (`plugins/02.auth.ts`, `composables/useAuth.ts`) ซึ่ง retry ไม่สามารถใช้ได้โดยนิยาม

## ไฟล์

| ไฟล์                             | สถานการณ์ | บทบาท                                            |
| -------------------------------- | -------- | ------------------------------------------------ |
| `server/middleware/auth.ts`      | F5       | Silent refresh ก่อนการ render แบบ SSR            |
| `plugins/01.api.ts`              | SPA      | `$api` พร้อม 401-retry สำหรับ request แบบ imperative |
| `composables/useApi.ts`          | SPA      | `useApi` พร้อม 401-retry สำหรับ request แบบ declarative |
| `composables/useRefreshToken.ts` | —        | Deduplication ของ refresh: singleton promise     |
| `composables/apiErrorHandler.ts` | SPA      | ตัวจัดการ 401 ร่วมของ `$api` และ `useApi`         |
| `plugins/02.auth.ts`             | ทั้งสอง   | เติมค่า `user` ผ่าน `/auth/me` ตอนเริ่มต้น        |
| `composables/useAuth.ts`         | —        | `login`, `logout`, `register`, `user` แบบ reactive |
| `middleware/auth.global.ts`      | —        | การป้องกัน route: redirect ไปยัง `/login` หรือ `/` |

## สถานการณ์ที่ 1: F5 พร้อม token ที่หมดอายุ

เมื่อโหลดหน้าเต็ม เราต้องไม่ปล่อยให้ server render หน้าในสถานะ "ยังไม่ได้ยืนยันตัวตน" ในขณะที่ client หลัง hydration กลับกลายเป็นยืนยันตัวตนแล้ว — นี่คือ **hydration mismatch** Vue จะโยน warning ออกมาและอาจเกิด artifact ทางภาพ

วิธีแก้ — `server/middleware/auth.ts`: Nitro middleware ที่ดักจับ request **ก่อน Vue/SSR**

| ขั้นตอน | Browser                                                    | Nitro                                                                    | Vue / SSR                                                           |
| --- | ---------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| 1   | `GET /profile` (มีแค่ `refresh_token`)                    |                                                                          |                                                                     |
| 2   |                                                            | `server/middleware/auth.ts`: ไม่มี `access_token`, มี `refresh_token`    |                                                                     |
| 3   |                                                            | `POST /auth/refresh` → NestJS โดยตรง (server-to-server)                |                                                                     |
| 4   |                                                            | token ใหม่: `Set-Cookie` → ในการตอบกลับหน้า; cookie → ในการ request ปัจจุบัน |                                                                     |
| 5   |                                                            |                                                                          | `plugins/02.auth.ts`: `GET /auth/me` → `user.value = {…}`           |
| 6   |                                                            |                                                                          | `middleware/auth.global.ts`: `user != null` → ปล่อยให้เข้า `/profile` |
| 7   |                                                            |                                                                          | SSR render: `layout = default`, มี user                           |
| 8   | รับ HTML + `Set-Cookie`, เก็บ token ใหม่       |                                                                          |                                                                     |
| 9   | Vue hydrate: `user != null` → ไม่มี hydration mismatch |                                                                          |                                                                     |

**ทำไมถึงทำ refresh ที่นี่ ไม่ใช่ใน Vue-plugin:** `Set-Cookie` ต้องไปถึง browser _และ_ ต้องถูกมองเห็นโดยการ render แบบ SSR ภายใน request เดียวกัน Nitro middleware ทำงานก่อน Vue — มันอัปเดต cookie-header ของ request ปัจจุบัน (สำหรับ SSR) และเพิ่ม `Set-Cookie` ลงใน HTTP-response (สำหรับ browser) การทำแบบเดียวกันจาก Vue-plugin เป็นไปไม่ได้ — เพราะ Vue รันไปแล้ว

## สถานการณ์ที่ 2: SPA-navigation พร้อม token ที่หมดอายุ

ผู้ใช้เปิดหน้าไว้ตอน token ยังใช้งานได้ ผ่านไปหนึ่งนาที access_token หมดอายุ ผู้ใช้กด "ลบ" — `$api` จะได้รับ 401 หากไม่มี retry request จะล้มเหลวพร้อม error เฉย ๆ และ action จะไม่ถูกทำ

วิธีแก้ — กลไกในตัวของ `ofetch`: `retry: 1` + `retryStatusCodes: [401]` เมื่อเจอ 401 `ofetch` จะเรียก `onResponseError` ซึ่งเราทำ refresh ในนั้น แล้วจากนั้น **ส่ง request เดิมซ้ำโดยอัตโนมัติ** ด้วย token ใหม่

```
$api('/users/1', { method: 'DELETE' })
  → 401
  → onResponseError: POST /auth/refresh → 200, token ใหม่ใน cookie
  → ofetch ส่ง DELETE /users/1 ซ้ำโดยอัตโนมัติ
  → 204 No Content ✓
```

หาก refresh ล้มเหลว (session หมดอายุ) — `options.retry = 0` จะยกเลิก request ที่จะส่งซ้ำ, `user.value = null`, redirect ไปยัง `/login`

## plugins/01.api.ts — `$api`

ให้ `$api` — HTTP-client แบบ imperative สำหรับ action ที่เกิดจาก event (คลิก, submit)

```typescript
const { $api } = useNuxtApp()
await $api('/users/1', { method: 'DELETE' })
await $api('/auth/login', { method: 'POST', body: { email, password } })
```

สร้างขึ้นบน `$fetch.create` พร้อม `retry: 1` และ `retryStatusCodes: [401]` เมื่อเจอ 401 จะทำ refresh และส่ง request ซ้ำโดยอัตโนมัติ

**ใช้เมื่อใด:** เสมอเมื่อ request ถูกเริ่มโดยผู้ใช้ — ลบ, สร้าง, อัปเดต, login, logout

## composables/useApi.ts — `useApi`

ให้ `useApi` — วิธีการโหลดข้อมูลแบบ declarative สำหรับ component

```typescript
const { data: users, refresh } = await useApi<User[]>('/users', { default: () => [] })
```

สร้างขึ้นบน `createUseFetch` (Nuxt 4) พร้อม `retry: 1` และ `retryStatusCodes: [401]` แบบเดียวกัน

**ต่างจาก `$api` อย่างไร:** `useFetch` ทำมากกว่าแค่การ request:

- ผลลัพธ์เป็น **reactive** — component จะอัปเดตโดยอัตโนมัติ
- มีส่วนร่วมใน **SSR payload** — ข้อมูลที่โหลดบน server ถูกส่งต่อให้ client ไม่ต้อง request ซ้ำตอน hydration
- **Deduplicate** request ที่เหมือนกัน — หากสอง component เรียก `useApi('/users')` request จะยิงเพียงครั้งเดียว

**ใช้เมื่อใด:** เมื่อ component ต้องการข้อมูลตอน render — รายการ, profile, ข้อมูลใด ๆ ที่ใช้แสดงผล

### `useApi` vs `$api` — สรุป

|              | `useApi`                                  | `$api`                                         |
| ------------ | ----------------------------------------- | ---------------------------------------------- |
| ประเภท        | Declarative (`useFetch`)                | Imperative (`$fetch`)                        |
| เมื่อใด        | ตอน render component                    | ตาม event (คลิก, submit)                      |
| Reactivity   | ใช่ — `data` อัปเดตโดยอัตโนมัติ     | ไม่ — เป็นแค่ Promise                           |
| SSR payload  | ใช่ — ข้อมูลถูกส่งให้ client            | ไม่                                            |
| ตัวอย่าง       | `const { data } = await useApi('/users')` | `await $api('/users/1', { method: 'DELETE' })` |

## composables/useRefreshToken.ts

มี refresh แบบ deduplicate — singleton promise ที่ใช้ร่วมกันระหว่าง `$api` และ `useApi`

**ปัญหาหากไม่มี deduplication:** หากในหน้ามีหลาย component ที่ยิง request พร้อมกัน (เช่น `HomeTasks` และ `HomeDbTables`) และ access_token หมดอายุ — ทั้งคู่จะได้รับ 401 และทั้งคู่พยายามยิง `/auth/refresh` ตัวแรกทำสำเร็จ ตัวที่สองใช้ refresh token ที่ถูกทำเครื่องหมาย `isUsed: true` ไปแล้ว → reuse detection → session ทั้งตระกูลถูกทำลาย → หลุด login

**วิธีแก้:** `refreshPromise` — ตัวแปรระดับ module (อยู่นอก function) ในขณะที่ refresh กำลังทำงาน ทุกการเรียกที่ตามมาจะได้รับ promise เดียวกันและรอผลลัพธ์ของมัน หลังจากเสร็จสิ้น promise จะถูก reset เป็น `null`

```typescript
let refreshPromise: Promise<boolean> | null = null  // singleton ระดับ module

async function refresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise  // กำลังทำงานอยู่ — รอ
  refreshPromise = $fetch('/auth/refresh', { method: 'POST', ... })
    .finally(() => { refreshPromise = null })
  return refreshPromise
}
```

## composables/apiErrorHandler.ts

ตัวจัดการ 401 ที่ใช้ร่วมกันของทั้งสอง client — `$api` (`plugins/01.api.ts`) และ `useApi` (`composables/useApi.ts`) ฟังก์ชัน `createAuthErrorHandler()` รับฟังก์ชัน navigation เข้ามา เพราะแต่ละ client เรียกใช้ต่างกัน: `useApi` ใช้ `navigateTo` ตรง ๆ ส่วน `$api` ต้องผ่าน `nuxtApp.runWithContext`

ลำดับการทำงาน:

1. ไม่ใช่ 401 — จบทันที
2. request ไปยัง `/auth/*` — ยกเลิก retry (ไม่งั้นจะวนไม่รู้จบ: refresh ล้มเหลวด้วย 401 → refresh อีก)
3. SSR — ยกเลิก retry และล้างค่า `user`: silent refresh ทำงานไปแล้วใน Nitro middleware ไม่มีอะไรให้ทำซ้ำ
4. Client — ทำ refresh ผ่าน `useRefreshToken` ที่ deduplicate แล้ว หากล้มเหลวจึง logout

::: warning composable ถูกเรียกใน factory ไม่ใช่ใน handler
```typescript
export function createAuthErrorHandler(navigateToLogin) {
  const { user } = useAuth()          // ← ตรงนี้: ยังมี context ของ Nuxt
  const { refresh } = useRefreshToken()

  return async function onResponseError(...) {
    // ← ตรงนี้ไม่มีแล้ว: เป็น async callback ของ ofetch
  }
}
```

การเรียก composable ภายใน `onResponseError` จะเกิด error `NUXT_E1001: A composable that requires access to the Nuxt instance was called outside of a plugin, Nuxt hook, or Vue setup function` ส่วน factory ทำงานในบริบทของ plugin/setup ซึ่งเรียก composable ได้ถูกต้อง
:::

## plugins/02.auth.ts

ทำงานทุกครั้งที่แอปพลิเคชันเริ่มต้น — บน server (SSR) และบน client (หลัง hydration) เติมค่า `useState('auth.user')` ผ่าน `/auth/me`

**บน server:** ณ จุดนี้ `server/middleware/auth.ts` ได้อัปเดต cookie ไปแล้ว — `/auth/me` ทำงานด้วย `access_token` ที่เป็นปัจจุบัน ใช้ `useRequestFetch()` แทน `$fetch`: `$fetch` ธรรมดาบน server ทำงานในบริบทของ Node.js และไม่เห็น cookie ของ browser ส่วน `useRequestFetch` จะ forward header ของ request ขาเข้าให้อัตโนมัติ

::: tip ทำไมไม่อ่าน cookie ด้วยตนเอง
วิธีที่ดูง่ายกว่าคือดึง `nuxtApp.ssrContext?.event.headers.get('cookie')` แล้วส่งเข้า `headers` เอง วิธีนั้นใช้งานได้ แต่เปราะบาง: `event.headers` จะ **cache** ค่าไว้ตั้งแต่การอ่านครั้งแรก ดังนั้นหาก middleware ตัวใดก่อนหน้าไปแตะมันก่อน plugin จะได้ token เก่า และผู้ใช้จะถูกเด้งไปหน้า login

`useRequestFetch()` ไม่มีปัญหานี้: ภายในมันเรียกไปถึง `getRequestHeaders()` ซึ่งอ่าน `event.node.req.headers` โดยตรง ข้าม cache ไป
:::

**บน client:** ลอง `/auth/me` หากได้ 401 (edge-case: token หมดอายุระหว่าง SSR กับ hydration) — จะทำ refresh แล้วจึงลอง `/auth/me` อีกครั้ง ในสถานการณ์ปกติ browser ได้รับ token ใหม่ใน `Set-Cookie` จาก Nitro แล้ว และ `/auth/me` ผ่านทันที

## composables/useAuth.ts

มี action ของการยืนยันตัวตนและ `user` แบบ reactive

`user` ถูกเก็บใน `useState('auth.user')` — per-request state (ไม่ใช่ตัวแปร global) Nuxt serialize มันลงใน SSR payload และกู้คืนบน client ตอน hydration ด้วยเหตุนี้ `user` ที่ถูก set บน server จึงพร้อมใช้งานบน client ทันทีโดยไม่ต้อง request ซ้ำ

หลังจาก `login` และ `register` จะ request `/auth/me` อย่างชัดเจนแล้วนำผลลัพธ์ไปใส่ใน `user` — เชื่อถือได้มากกว่าการ parse response ของ login เอง เพราะ `/auth/me` คืนข้อมูลที่เป็นปัจจุบันจากที่เก็บข้อมูลเสมอ

## middleware/auth.global.ts

ทำงานทุกครั้งที่มีการ navigation อ่านค่า `user.value`:

| เงื่อนไข                                           | การกระทำ             |
| ------------------------------------------------- | -------------------- |
| Route `guestOnly` และ `user != null`                 | Redirect ไปยัง `/`      |
| Route ไม่ใช่ `public` และไม่ใช่ `guestOnly`, `user == null` | Redirect ไปยัง `/login` |
| อื่น ๆ                                         | ปล่อยผ่าน           |

Metadata ของ route กำหนดผ่าน `definePageMeta`:

```typescript
definePageMeta({ layout: 'auth', guestOnly: true }) // /login, /register
definePageMeta({ public: true }) // หน้าสาธารณะ
// route ที่มีการป้องกัน — ไม่ต้องระบุอะไร (ค่าเริ่มต้น)
```

## Layouts

`default` — สำหรับผู้ใช้ที่ยืนยันตัวตนแล้ว มี header `auth` — สำหรับหน้าของ guest (`/login`, `/register`) พื้นหลังเรียบไม่มี navigation

## BFF proxy

ทุก request ผ่าน Nuxt BFF proxy (`server/api/backend/[...path].ts`) ไม่ใช่ยิงตรงไปยัง NestJS สิ่งนี้แก้ปัญหาสองอย่าง:

1. **CORS:** browser ยิงไปยัง origin เดียวกัน — proxy จะ forward ต่อไปยัง NestJS
2. **Cookies:** `SameSite=Strict` ทำงานได้ถูกต้อง — request ไปยังโดเมนเดียวกัน

`apiBase = '/api/backend'` (สาธารณะ สำหรับ browser และ SSR ผ่าน proxy) `backendUrl` (private) ถูกใช้เฉพาะใน Nitro middleware สำหรับ request แบบ server-to-server ตรงไปยัง NestJS

## เอกสารอ้างอิง

- [Nuxt: Custom useFetch](https://nuxt.com/docs/4.x/guide/recipes/custom-usefetch) — `createUseFetch`, `baseURL` ที่ฝังไว้, interceptors
- [Nuxt: useState](https://nuxt.com/docs/api/composables/use-state) — per-request state ที่รองรับ SSR
- [Nuxt: Server Middleware](https://nuxt.com/docs/guide/directory-structure/server#server-middleware) — Nitro middleware ทำงานก่อนการ render
- [Nuxt: Plugins](https://nuxt.com/docs/guide/directory-structure/plugins) — ลำดับการทำงาน, การเลขไฟล์
- [Nuxt: Route Middleware](https://nuxt.com/docs/guide/directory-structure/middleware) — `defineNuxtRouteMiddleware`, `navigateTo`
- [ofetch: retry](https://github.com/unjs/ofetch#%EF%B8%8F-auto-retry) — `retry`, `retryStatusCodes`, `retryDelay`
- [nuxt/nuxt Discussion #22441](https://github.com/nuxt/nuxt/discussions/22441) — pattern ของ 401-retry ด้วย ofetch ใน Nuxt
