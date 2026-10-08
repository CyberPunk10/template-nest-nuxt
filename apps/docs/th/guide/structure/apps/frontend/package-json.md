# package.json

Manifest ของ application สคริปต์ทำงานเฉพาะใน workspace ของตัวเอง — จาก root เรียกผ่าน filter (`pnpm --filter frontend dev`) หรือโดยอ้อมจากคำสั่งที่ root

| สคริปต์         | คำสั่ง              | ทำอะไร                                                       |
| ------------- | ---------------- | ----------------------------------------------------------- |
| `dev`         | `nuxt dev`       | Develop ในเครื่อง มี hot-reload                                |
| `build`       | `nuxt build`     | Production build เป็น `.output/`                             |
| `preview`     | `nuxt preview`   | รัน production build ในเครื่อง                                 |
| `generate`    | `nuxt generate`  | build แบบ static ไม่ได้ใช้ในเทมเพลตนี้: image รัน SSR             |
| `postinstall` | `nuxt prepare`   | สร้าง `.nuxt/` (types, aliases) — รันอัตโนมัติหลัง `pnpm install` |
| `lint`        | `eslint . --fix` | Linter พร้อม auto-fix                                        |
| `type-check`  | `nuxt typecheck` | ตรวจสอบ type ผ่าน `vue-tsc`                                  |

## Dependency

| แพ็กเกจ | ใช้ทำอะไร |
| --- | --- |
| `nuxt`, `vue`, `vue-router` | Nuxt และ Vue ที่เป็นฐานของ application |
| `@nuxtjs/i18n` | คำแปลของหน้าจอ (ru, en, th) |
| `@nuxtjs/color-mode` | ธีมสว่างและธีมมืด |
| `@nuxt/icon` | Component `<Icon>` สำหรับไอคอน Iconify |
| `@vueuse/core` | Wrapper ของ browser API ที่ปลอดภัยกับ SSR |
| `vue-tippy` | Tooltip (`app/plugins/tippy.ts`) |
| `@repo/shared`, `@repo/ui` | Type และ UI component ที่ใช้ร่วมกันจาก `packages/` |

| แพ็กเกจสำหรับการพัฒนา | ใช้ทำอะไร |
| --- | --- |
| `@iconify-json/lucide` | ไอคอน Lucide ในเครื่อง: server ส่งไอคอนเอง ไม่ต้องเรียก API ของ Iconify |
| `sass` | Compile SCSS ใน style ของ component |
| `@nuxt/eslint` | Config ของ ESLint ที่รู้จัก auto-import ของ Nuxt |
| `vue-tsc` | ตรวจ type ในไฟล์ `.vue` สำหรับ `nuxt typecheck` |

อะไรอยู่ที่ไหน — [apps/frontend](./)
