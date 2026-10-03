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

อะไรอยู่ที่ไหน — [apps/frontend](./)
