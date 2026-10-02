# โครงสร้างโปรเจกต์

Monorepo ที่ประกอบด้วย 5 package: แอปพลิเคชัน 3 ตัวใน `apps/` และไลบรารีที่ใช้ร่วมกัน 2 ตัวใน `packages/`

```
template-nest-nuxt/
├── apps/
│   ├── backend/          NestJS API
│   ├── frontend/         Nuxt 4
│   └── docs/             VitePress — เอกสารชุดนี้
├── packages/
│   ├── shared/           type (DTO) และคำแปล
│   └── ui/               Vue component
├── infra/
│   └── nginx/            reverse proxy: config และ Dockerfile
├── scripts/              Node script เบื้องหลังคำสั่ง pnpm
├── .husky/               git hook
├── docker-compose.yml
└── config ที่ root       pnpm, TypeScript, ESLint
```

package แต่ละตัวขึ้นต่อกันอย่างไร — ดู [สถาปัตยกรรม](../architecture)

## Config

| ไฟล์                     | ทำอะไร                                                                                                                                   |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm-workspace.yaml`   | ประกาศว่าโฟลเดอร์ไหนเป็น workspace (`apps/*`, `packages/*`) ถ้าไม่มี pnpm จะไม่เชื่อม package เข้าด้วยกัน                                           |
| `tsconfig.base.json`    | การตั้งค่า TypeScript ที่ใช้ร่วมกัน: ความเข้มงวดและการตรวจสอบ config ของแต่ละแอป extend จากไฟล์นี้                                                   |
| `eslint.config.base.js` | ตัวกฎของ linter: rule, style, global                                                                                                     |
| `eslint.config.js`      | re-export ของ base บรรทัดเดียว จำเป็นเพราะ ESLint มองหาไฟล์ชื่อมาตรฐานที่ root ส่วนแอปต่าง ๆ import `base` โดยตรง                                  |
| `lint-staged.config.js` | สิ่งที่จะรันกับไฟล์ใน staged: `eslint --fix` สำหรับ js/ts/vue                                                                                    |
| `.npmrc`                | `engine-strict=true` — `pnpm install` จะปฏิเสธการติดตั้งบน Node เวอร์ชันที่ไม่รองรับ แทนที่จะพังทีหลังตอน runtime                                      |
| `.nvmrc`                | เวอร์ชัน Node สำหรับ `nvm use` — คู่กับ `engines` ใน `package.json` ที่ root                                                                     |
| `.dockerignore`         | สิ่งที่ **ไม่** เข้าไปใน build context: `node_modules`, ผลลัพธ์การ build, `.env` (ยกเว้น `.example`) มีผลโดยตรงต่อขนาด image และความเร็วในการ build |
| `pnpm-lock.yaml`        | lockfile ไฟล์เดียวสำหรับทั้ง monorepo — เป็นผลจาก workspaces เก็บเวอร์ชันที่แน่นอนของทุก dependency รวมถึงตัวที่ติดมาด้วย                                   |

TypeScript config แยกตามชั้น — [tsconfig.base.json](./tsconfig-base)

## จะเพิ่มของใหม่ตรงไหน

| อะไร                        | ที่ไหน                                                                               |
| --------------------------- | ---------------------------------------------------------------------------------- |
| หน้าเว็บฝั่ง frontend           | `apps/frontend/app/pages/` — route ถูกสร้างจากชื่อไฟล์เอง                               |
| module ของ API              | `apps/backend/src/modules/<ชื่อ>/` และลงทะเบียนใน `app.module.ts`                     |
| type ที่ทั้งสองฝั่งต้องใช้          | `packages/shared/src/` — ไม่งั้นจะกลายเป็นเขียนซ้ำสองที่                                    |
| type ที่ใช้แค่ฝั่งเดียว            | ไว้ในแอปนั้น ไม่ต้องใส่ใน `shared`                                                       |
| Vue component ที่ใช้ได้ทั่วไป     | `packages/ui/src/components/`                                                      |
| component ที่ใช้เฉพาะ frontend | `apps/frontend/app/components/` — auto-import ตามชื่อไฟล์                             |
| Node script สำหรับคำสั่ง pnpm    | `scripts/` และเพิ่มบรรทัดใน `package.json` ที่ root                                     |
| หน้าเอกสาร                   | `apps/docs/guide/` และไฟล์เดียวกันใน `en/` กับ `th/` และเพิ่มใน `.vitepress/config/*.ts` |
