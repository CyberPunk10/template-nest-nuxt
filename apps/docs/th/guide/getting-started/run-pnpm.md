# รันด้วย pnpm

โหมดหลักสำหรับการพัฒนา: application รันแบบ native แต่ละตัวมี hot reload ของตัวเอง ไม่ต้องใช้ Docker

ก่อนรันครั้งแรก — [การเตรียมความพร้อม](/th/guide/getting-started/setup)

## สรุปคำสั่ง

| งาน                                     | คำสั่ง                        |
| --------------------------------------- | --------------------------- |
| รันทั้งหมด                                | `pnpm dev`                  |
| รัน application เดียว                     | `pnpm --filter backend dev` |
| เตรียมการอย่างเดียว ไม่รัน                    | `pnpm predev`               |
| สร้างไฟล์ `.env` ที่ขาด                      | `pnpm env:copy`             |
| เขียนทับ `.env` ทั้งหมดจาก `.env.example`      | `pnpm env:copy:force`       |
| ตรวจ production build                    | `pnpm build`                |
| หยุด                                     | `Ctrl+C`                    |

## pnpm dev

```bash
pnpm dev
```

คำสั่งเดียวยกทั้งสาม application ขึ้นมา ก่อนเริ่ม [`predev.mjs`](/th/guide/structure/scripts/predev) จะทำงานก่อน: สร้างไฟล์ `.env` ที่ขาด และจัดการพอร์ตที่ชนกัน แต่ละขั้นตอนจะพิมพ์บรรทัดที่มี ✓ และถ้าการเตรียมการหยุด — จะมีบรรทัดที่มี ✗ พร้อมชื่อขั้นตอน สิ่งที่ต้องตรวจดูได้ใน[ตารางขั้นตอน](/th/guide/structure/scripts/predev#สิ่งที่แสดงผล)

ถ้าไม่ใช้ `predev.mjs` ก็ทำแบบเดียวกันได้ด้วยมือ: คัดลอก `.env.example` เป็น `.env` ที่ root และในแต่ละ `apps/*` (`pnpm env:copy`) ปล่อยพอร์ตจาก `PORT` ใน `apps/*/.env` แล้วยกฐานข้อมูลขึ้นมา (`pnpm db:up`)

| Service  | URL                               | เทคโนโลยี         |
| -------- | --------------------------------- | ---------------- |
| Backend  | `http://localhost:3100`           | NestJS `--watch` |
| Frontend | `http://localhost:3200`           | Nuxt dev         |
| Docs     | `http://localhost:5173/dev/docs/` | VitePress dev    |

แต่ละ application ฟังพอร์ตของตัวเอง: reverse proxy ไม่มีส่วนร่วมในโหมดนี้ — [ทำไม](/th/guide/reverse-proxy#ในโหมด-dev-ไม่มี-proxy)

Request ไปที่ API วิ่งผ่าน BFF proxy ของ Nuxt (`/api/backend/*`) เหมือนกับใน Docker — path นี้เหมือนกันทั้งสองโหมด

## รันทีละ application

`pnpm dev` ยกทุกอย่างขึ้นพร้อมกัน แต่ถ้าต้องการรันแค่ตัวเดียวก็ได้:

```bash
pnpm --filter backend dev
pnpm --filter frontend dev
pnpm --filter @repo/docs dev
```

## pnpm build

ตรวจสอบ production build โดยไม่ใช้ container:

```bash
pnpm build

# รัน backend
cd apps/backend && pnpm start:prod

# รัน frontend (อีก terminal หนึ่ง)
cd apps/frontend && node .output/server/index.mjs
```

แบบนี้ใกล้เคียง production มากกว่า `pnpm dev` แต่ยังไม่เหมือนกันเสียทีเดียว: ไม่มี reverse proxy และ application เข้าถึงได้ตรงๆ ทางพอร์ตของตัวเอง ถ้าอยากได้โครงสร้างทั้งชุดพร้อม proxy — [รันใน container](/th/guide/getting-started/run-docker)

## การหยุด

กด `Ctrl+C` ใน terminal ที่รัน `pnpm dev` — `concurrently` จะหยุดทั้งสาม process พร้อมกัน

::: warning
ถ้า process ถูกปิดด้วยวิธีอื่น (เช่นปิด terminal ไปเลย) process ลูกอาจยังค้างอยู่และครองพอร์ตไว้ `predev.mjs` จะตรวจเจอตอนรันครั้งถัดไปและเสนอให้ปิดมัน
:::
