# docker compose

`docker-compose.yml` ยก `nginx`, `backend` และ `frontend` ขึ้นมาใน network เดียวกัน

เอกสารไม่ได้เป็น service แยก: `docs-builder` build static ของมัน แล้ว `nginx` ตัวเดียวกันเป็นคนเสิร์ฟ — รายละเอียดใน [apps/docs](./apps/docs/docker-image)

## เริ่มรัน

วิธีปกติคือคำสั่งมาตรฐานของ Compose:

```bash
docker compose up
```

แต่บน clone ใหม่มันจะยังไม่ทำงานทันที: ยังไม่มีไฟล์ `.env` และ Docker network อีกทั้งพอร์ตของ proxy อาจถูกใช้อยู่

เพื่อไม่ต้องทำเองด้วยมือ จึงมี script ให้:

```bash
pnpm docker:up
```

ก่อนเริ่มมันจะเรียก [`predocker.mjs`](./scripts/predocker) ซึ่งสร้างไฟล์ `.env` ที่ขาด ตรวจพอร์ตของ proxy และสร้าง network — จากนั้นส่งต่อให้ `docker compose up` ตัวเดิม ด้วยเหตุนี้หลัง clone เสร็จจึงใช้คำสั่งเดียวก็พอ

เมื่อเตรียม environment ไว้แล้ว ก็ไม่ต่างกัน: ใช้ `docker compose` ตรงๆ ได้ คำสั่งรัน **จาก root ของ monorepo** ส่วน flag `--build` จะ build image ใหม่ก่อนเริ่ม

หลังจากรันแล้ว ทุกอย่างเข้าถึงได้ที่พอร์ตเดียว:

- Application: [http://localhost/](http://localhost/)
- เอกสาร: [http://localhost/dev/docs/](http://localhost/dev/docs/)
- Swagger UI: [http://localhost/api/docs](http://localhost/api/docs) (ถ้าเปิดอยู่ — ดู `SWAGGER_ENABLED`)

## Network

Network ถูกประกาศเป็น `external: true` — `docker compose` **ไม่ได้สร้าง** ให้ แต่คาดว่ามีอยู่แล้ว:

```bash
docker network create template-nest-nuxt_app
```

ถ้าไม่มี `docker compose up` แบบตรงๆ จะล้มเหลวด้วย `network ... declared as external, but could not be found` ถ้ารันผ่าน `pnpm docker:up` network จะถูกสร้างให้อัตโนมัติ

ชื่อ network มาจาก `COMPOSE_NETWORK_NAME` ในไฟล์ `.env` ที่ root — ทั้ง `docker-compose.yml` และ `ensure-network.mjs` อ่านจากที่เดียวกัน ถ้าไม่ได้ตั้งค่าตัวแปรนี้ ทั้งสองฝั่งจะแจ้งให้ทราบอย่างชัดเจน

ทำไมถึงเป็น external แทนที่จะให้ Compose สร้าง: มี container จาก compose ไฟล์ **อื่น** มาต่อกับ network นี้ด้วย — เช่น `docker-compose.dev.yml` ที่มี postgres บน branch ที่ใช้ฐานข้อมูล ไม่มีไฟล์ไหนเป็นเจ้าของ network แต่เพียงผู้เดียว จึงต้องสร้างจากข้างนอก ไม่งั้นลำดับการ start จะกลายเป็นเรื่องสำคัญ

## การหยุด

```bash
docker compose down
```

Network `template-nest-nuxt_app` จะไม่ถูกลบ (มันเป็น `external` — compose ไม่ได้สร้าง ก็ไม่ใช่หน้าที่ของมันที่จะลบ) ลบเองถ้าไม่ต้องการแล้ว:

```bash
docker network rm template-nest-nuxt_app
```

::: warning
`docker compose down --remove-orphans` จะลบ container จาก compose ไฟล์ข้างเคียงที่ต่อกับ network เดียวกันด้วย — เช่น postgres บน branch ที่ใช้ฐานข้อมูล ข้อมูลยังอยู่ใน volume แต่ต้อง start container ขึ้นมาใหม่
:::

## ไฟล์ .env ทุกไฟล์จำเป็นต้องมี

ถ้าไม่มี `.env` ที่ root `docker compose up` จะไม่ยอม start (`no port specified`) ถ้าไม่มี `apps/backend/.env`/`apps/frontend/.env` — ก็ไม่ยอมเช่นกัน พร้อมข้อความ `env file ... not found` ทั้งสองกรณีไม่มีการใส่ค่า default ให้เงียบๆ — เป็นการตัดสินใจโดยตั้งใจ ไม่ใช่ลืมใส่

ใน repository มีแค่ไฟล์ `.env.example` ส่วนไฟล์ `.env` ที่ใช้งานจริงสร้างเองด้วยมือหรือด้วยคำสั่ง:

```bash
pnpm env:copy
```

รายละเอียดเพิ่มเติม — ดู [ตัวแปรสภาพแวดล้อม](../env-variables#ไฟล์)

## `env_file` และการ override

`backend` กับ `frontend` ดึง `apps/*/.env` ของตัวเองผ่าน `env_file:` — ไฟล์เดียวกับที่ `pnpm dev` ใช้

```yaml
backend:
  env_file: apps/backend/.env
```

ไฟล์ `.env` จำเป็นต้องมี — ถ้าไม่มี `docker compose up` จะไม่ยอม start (`env file ... not found`)

บางครั้งค่าต้อง **ต่างกัน** ใน Docker — เช่น `NUXT_BACKEND_URL`: ใน `apps/frontend/.env` เป็น `http://localhost:3100` (ถูกต้องสำหรับ `pnpm dev` ที่ทุกอย่างอยู่บน host) แต่ภายใน Docker network `localhost` สำหรับ container frontend คือตัวมันเอง ไม่ใช่ backend กรณีแบบนี้ `environment:` ใน `docker-compose.yml` จะ **override ค่าจากไฟล์อย่างชัดเจน** — `environment:` ชนะ `env_file:` เสมอ:

```yaml
frontend:
  env_file: apps/frontend/.env
  environment:
    NUXT_BACKEND_URL: http://backend:3100   # override localhost:3100 จาก .env
```

กลไกเดียวกันนี้ใช้สลับการรันแบบ Docker ไปเป็นโหมด production:

```yaml
backend:
  environment:
    NODE_ENV: production   # ใน apps/backend/.env เป็น development — นั่นสำหรับ pnpm dev
```

ตัวแปรไหนตรงกันและตัวไหนถูก override — ดู [ตัวแปรสภาพแวดล้อม](../env-variables)

## Internal port

มีแค่ proxy ที่เปิด host port ส่วน application มีแค่ internal port ซึ่งมาจาก `.env` ที่ root:

```yaml
backend:
  expose:
    - '${BACKEND_INTERNAL_PORT}'
  env_file: apps/backend/.env
  environment:
    PORT: '${BACKEND_INTERNAL_PORT}'   # override PORT จาก .env
```

ดูแปลกๆ: `PORT` อยู่ใน `apps/backend/.env` อยู่แล้ว ทำไมต้องกำหนดซ้ำผ่าน `BACKEND_INTERNAL_PORT` อีก?

เหตุผลคือ Compose กับ container อ่านตัวแปรคนละเวลา:

| ใครอ่าน              | จากที่ไหน                   | เมื่อไหร่                                    |
| -------------------- | -------------------------- | ------------------------------------------- |
| Compose              | `.env` ที่ root            | ตอนอ่าน `docker-compose.yml` — ก่อน start   |
| Process ใน container | `env_file` + `environment` | ตอน container start                         |

Compose แทนค่า `${BACKEND_INTERNAL_PORT}` ในจังหวะที่ container ยังไม่มีอยู่ — ซึ่งแปลว่ามันก็ยังไม่เห็นเนื้อหาของ `apps/backend/.env` ด้วย: ไฟล์นั้นจะเข้าไปข้างในทีหลัง ดังนั้นทุกอย่างที่ Compose ต้องใช้เองจึงอยู่ใน `.env` ที่ root

**ในทางปฏิบัติหมายความว่า** พอร์ตของ container กำหนดที่ `.env` ที่ root:

```bash
BACKEND_INTERNAL_PORT=3100
```

ส่วน `PORT` ใน `apps/backend/.env` ไม่มีผลกับ Docker: บรรทัด `environment: PORT` จะทับมันตอน start เพราะ `environment` ใน Compose ชนะ `env_file` เสมอ ตัว `PORT` นั้นมีไว้เพื่ออย่างอื่น — สำหรับการรันผ่าน `pnpm dev` ที่ Docker ไม่เกี่ยวข้อง
