# ตัวแปรสภาพแวดล้อม (ENV)

## ไฟล์

มี `.env` อิสระ 4 ไฟล์ — หนึ่งไฟล์ต่อแอป บวกกับไฟล์ root สำหรับ Docker:

```
template-nest-nuxt/
├── .env[.example]            ← อ่านโดย docker-compose.yml
├── apps/
│   ├── backend/
│   │   └── .env[.example]    ← NestJS อ่านตรง
│   ├── frontend/
│   │   └── .env[.example]    ← Nuxt อ่านตรง
│   └── docs/
│       └── .env[.example]    ← VitePress (dotenv ใน config.ts)
└── ...
```

แต่ละแอปอ่าน **เฉพาะ** `.env` ของตัวเองเท่านั้น ไม่รู้จักไฟล์ของแอปอื่น ส่วน `.env` ที่ root จำเป็นสำหรับ docker-compose

ใน repo มีแค่ไฟล์ `.env.example` ส่วน `.env` ที่ใช้งานจริงต้องสร้างเอง ทำได้ 3 วิธี:

- **อัตโนมัติ** — ตอนรัน `pnpm dev` หรือ `pnpm docker:up` ครั้งแรก [`predev.mjs` / `predocker.mjs`](./structure/scripts/) จะสร้างให้เบื้องหลัง
- **ด้วยคำสั่ง** — `pnpm env:copy` สร้างทั้ง 4 ไฟล์พร้อมกัน โดยไม่ต้องรันอะไรเพิ่ม
- **ด้วยมือ** — คัดลอก `.env.example` → `.env` ทั้งที่ root และในทุก `apps/*/`

ไฟล์ที่มีอยู่แล้ว **จะไม่ถูกเขียนทับ**: คำสั่งจะสร้างเฉพาะไฟล์ที่ยังไม่มี

ถ้าต้องการย้อนกลับไปใช้ค่าเริ่มต้นจริง ๆ:

```bash
pnpm env:copy:force
```

::: warning
`pnpm env:copy:force` จะเขียนทับไฟล์ `.env` **ทั้งไฟล์** ไม่ใช่เติมเฉพาะบรรทัดที่ขาด ทุกอย่างที่คุณแก้ด้วยมือจะหายไป
:::

## ตัวแปรแยกตามไฟล์

- [`.env`](./structure/env-example) — ไฟล์ root สำหรับ docker compose
- [`apps/backend/.env`](./structure/apps/backend/env-example)
- [`apps/frontend/.env`](./structure/apps/frontend/env-example)
- [`apps/docs/.env`](./structure/apps/docs/env-example)

## พอร์ต

โปรเจกต์รันได้ 2 แบบ และพอร์ตในแต่ละแบบมีความหมายต่างกัน

**`pnpm dev`** — 3 process รันบนเครื่องคุณโดยตรง แต่ละตัวมีพอร์ตของตัวเอง:

```
localhost:3100   backend
localhost:3200   frontend
localhost:5173   docs
```

เปิด address ที่ต้องการในเบราว์เซอร์ได้เลย พอร์ตกำหนดที่ `PORT` — ไฟล์ละหนึ่งค่าใน `apps/*/.env`

**Docker** — แอปเดียวกันแต่อยู่ใน container และเปิดออกภายนอกแค่ **พอร์ตเดียว**: reverse proxy ที่ `80` ซึ่งเป็นตัวกระจาย request ไปยัง service ต่าง ๆ:

```
localhost/            → frontend
localhost/api/docs    → backend (Swagger)
localhost/dev/docs/   → static ของเอกสาร
```

ภายใน network แอปยังคง listen บนพอร์ตเหมือนเดิม แต่เรียกถึงกันด้วยชื่อ service — `http://backend:3100` จากภายนอกพอร์ตเหล่านี้เข้าไม่ถึง และกำหนดไว้ใน `.env` ที่ root เพราะ Docker Compose ต้องใช้ ไม่ใช่ตัวแอปเอง

### สรุป

| ตัวแปร             | ไฟล์           | กำหนดอะไร                        |
| ----------------- | ------------- | ------------------------------- |
| `PORT`            | `apps/*/.env` | พอร์ตของ process ตอน `pnpm dev`  |
| `*_INTERNAL_PORT` | `.env` (root) | พอร์ตของ process ภายใน container |
| `NGINX_HOST_PORT` | `.env` (root) | พอร์ตเดียวที่เปิดออกภายนอกใน Docker  |

เอกสารไม่มี `*_INTERNAL_PORT`: ใน Docker ไฟล์ static ของมันอยู่ใน image ของ proxy อยู่แล้ว จึงไม่มี process แยก ส่วนใน dev นั้น VitePress รัน server ของตัวเอง — จึงมี `PORT=5173`

### ทำไมรวมค่าเป็นตัวเดียวไม่ได้

ถึงตัวเลขจะตรงกัน (3100 และ 3200 ทั้งสองโหมด) แต่มันคนละเรื่องกัน ใน dev พอร์ตถูกจองบนเครื่องคุณ และแอปอื่นอาจแย่งไปได้ ส่วนใน container พอร์ตอยู่ใน network namespace ที่แยกต่างหาก: ไม่มีอะไรให้ชนกัน และจากภายนอกก็มองไม่เห็นอยู่แล้ว

ผลในทางปฏิบัติ: ถ้าพอร์ต 3200 บนเครื่องถูกใช้อยู่ ก็แก้ `PORT` ใน `apps/frontend/.env` ได้เลย โดยไม่กระทบ Docker

### ทำไม backend กับ frontend ไม่มี host port

ใน `docker-compose.yml` ใช้ `expose` แทน `ports`: พอร์ตถูกประกาศไว้แต่ไม่ forward ออกมาที่ host เข้าถึงได้ผ่าน reverse proxy เท่านั้น — [ทำไมถึงเป็นแบบนี้](./reverse-proxy#ทําไมพอร์ตของ-application-ถึงปิด)

### ทำไม `PORT` จาก `apps/*/.env` ไม่มีผลใน Docker

ไฟล์ถูกส่งเข้า container จริง — ผ่าน `env_file` ใน compose แต่บรรทัด `environment: PORT` ทับค่านั้นตอนเริ่มทำงาน: ใน Compose นั้น `environment` แรงกว่า `env_file` เสมอ

ตั้งใจให้เป็นแบบนี้ ไม่งั้น `PORT` ที่แก้ไว้ใช้ในเครื่องตัวเองจะหลุดเข้าไปใน container และทำให้การเชื่อมกับ nginx พัง — [รายละเอียดเต็ม](./structure/docker-compose#internal-port)

## CORS_ORIGIN

ในบรรดาตัวแปรทั้งหมด ตัวนี้ทำให้เกิดปัญหาที่หาสาเหตุยากบ่อยที่สุด

เบราว์เซอร์ไม่ยอมให้หน้าเว็บจาก address หนึ่งอ่าน response จากอีก address หนึ่ง เว้นแต่ server จะอนุญาตอย่างชัดเจน การอนุญาตมาในรูป header `Access-Control-Allow-Origin` ซึ่ง backend เอาค่ามาจาก `CORS_ORIGIN` การเทียบเป็นแบบเข้มงวด ตรงกันทุกตัวอักษร

อาการเงียบมาก: server ตอบ **200** log ดูปกติ แต่ในเบราว์เซอร์ request ถูกทำเครื่องหมายว่าล้มเหลว และข้อมูลไปไม่ถึงแอป เสียเวลาไล่หาในโค้ดได้ง่าย ๆ ทั้งที่สาเหตุคือบรรทัดเดียวใน `.env`

### ค่าต้องตรงกับอะไร

| โหมด       | ค่า                      | ตรงกับ                            |
| ---------- | ----------------------- | -------------------------------- |
| `pnpm dev` | `http://localhost:3200` | `PORT` ใน `apps/frontend/.env`   |
| Docker     | `http://localhost`      | `PUBLIC_ORIGIN` ใน `.env` ที่ root |

เปลี่ยนพอร์ต frontend ใน dev — ต้องแก้ `CORS_ORIGIN` ใน `apps/backend/.env` ด้วย เปลี่ยนพอร์ต proxy หรือ deploy ขึ้นเซิร์ฟเวอร์ — แก้ `PUBLIC_ORIGIN` ใน `.env` ที่ root (บนเซิร์ฟเวอร์คือ `https://<โดเมน>`)

### ทำไมใน Docker ถึงไม่มีพอร์ต

เบราว์เซอร์ **ตัดพอร์ตมาตรฐานออก**: `:80` สำหรับ http และ `:443` สำหรับ https เวลาเปิด `http://localhost` มันจะส่ง `Origin: http://localhost` — ไม่มีพอร์ต ถ้าเขียนไว้เป็น `http://localhost:80` ก็จะไม่ตรง และ request ไปยัง API ทั้งหมดจะถูกบล็อก

### ใน production พอร์ตไม่เกี่ยว

เมื่อ frontend กับ backend แยกไปคนละโดเมน:

```
frontend:  https://app.example.com    ← address ที่เบราว์เซอร์ส่งมา
backend:   https://api.example.com
CORS_ORIGIN=https://app.example.com
```

address ต่างกันที่โดเมน พอร์ตเป็นค่ามาตรฐานจึงไม่ปรากฏใน header ส่วน `PORT` ใน `apps/frontend/.env` ก็ยังอยู่ — Nuxt ยัง listen ที่ 3200 เพียงแต่อยู่หลัง proxy

นั่นคือความสัมพันธ์ «`CORS_ORIGIN` ↔ พอร์ตของ frontend» มีอยู่เฉพาะตอนที่ทั้งคู่อยู่บน `localhost` เท่านั้น

### ตรวจสอบอย่างไร

```bash
curl -sI -H "Origin: http://localhost:3200" http://localhost:3100/health | grep -i access-control
```

ถ้าไม่มี `Access-Control-Allow-Origin` พร้อม address ของคุณ แสดงว่าค่าไม่ถูกต้อง

## ตัวแปรที่เชื่อมโยงกัน

ตัวแปรบางตัวอ้างถึงพอร์ตของแอปข้างเคียง เปลี่ยนพอร์ตแล้วต้องแก้ตัวที่อ้างถึงมันด้วย

**พอร์ตของ frontend** (`PORT` ใน `apps/frontend/.env`)

- `CORS_ORIGIN` ใน `apps/backend/.env` — ไม่งั้น backend จะปฏิเสธ request จาก origin อื่น
- `DASHBOARD_URL` ใน `apps/docs/.env` — ไม่งั้นปุ่ม «ดูตัวอย่างเดโม» จะพาไปผิดที่

**พอร์ตของ backend** (`PORT` ใน `apps/backend/.env`)

- `NUXT_BACKEND_URL` ใน `apps/frontend/.env` — ไม่งั้น SSR จะเรียก API ไม่ได้

::: tip ใน Docker ไม่มีความเชื่อมโยงนี้
ที่นั่นใช้ชื่อ service เป็น address (`http://backend:3100`) ไม่ใช่พอร์ตบน host การตรวจพอร์ตจึงจำเป็นเฉพาะกับ `pnpm dev`
:::

## ค่าว่าง

ตัวแปรของ backend ที่มีค่า default (`NODE_ENV`, `APP_ENV`, `PORT`, `SWAGGER_ENABLED`) ถูกกำกับด้วย `.empty('')` ใน Joi schema การเขียน `FOO=` — วิธีปกติในการ «ล้าง» ตัวแปรใน compose หรือ CI — จะถือว่า «ไม่ได้กำหนด» และใช้ค่า default แทน

ส่วน `CORS_ORIGIN` ที่บังคับต้องมีนั้นตั้งใจไม่ใส่กำกับนี้: origin ว่างคือความผิดพลาดของการตั้งค่า แอปควรล้มตั้งแต่ตอนเริ่มทำงาน
