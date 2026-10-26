# db.mjs

จัดการฐานข้อมูล: container, client ของ Prisma, migration และ seed ใช้ได้ทั้งเป็น CLI (`pnpm db:*`) และเป็น module — ฟังก์ชันถูกเรียกจาก [`predev.mjs`](./predev)

ฐานข้อมูลถูกประกาศไว้ใน `docker-compose.yml` ไฟล์เดียวกันโดยไม่มี profile ส่วน service ของแอปอยู่ภายใต้ profile `app` ด้วยเหตุนี้คำสั่งที่ไม่ระบุ profile จึงแตะเฉพาะ `postgres` — รายละเอียดใน [docker-compose.yml](../docker-compose#profile)

## คำสั่ง

| คำสั่ง                | ทำอะไร                                                     |
| ------------------ | --------------------------------------------------------- |
| `pnpm db:up`       | สร้าง network ถ้าจำเป็น, ยก `postgres` ขึ้นมา และรอ healthcheck |
| `pnpm db:down`     | หยุด `postgres` ข้อมูลยังอยู่ใน volume                          |
| `pnpm db:generate` | generate client ของ Prisma จาก schema (`prisma generate`) |
| `pnpm db:migrate`  | รัน migration ที่ยังไม่มีใน DB (`prisma migrate deploy`)        |
| `pnpm db:seed`     | สร้างผู้ดูแลระบบ ถ้ายังไม่มี (`prisma db seed`)                 |

โดยทั่วไปไม่ค่อยต้องใช้คำสั่งเหล่านี้เดี่ยว ๆ เพราะ `pnpm dev` รันให้เอง จะมีประโยชน์ตอนที่แอปรันอยู่แล้วหรือไม่ต้องการรันแอป — เช่น เพื่อรัน migration หลัง `git pull` หรือเชื่อมต่อฐานข้อมูลด้วย client

## การรอให้พร้อมใช้งาน

`up` ใส่ flag `--wait` ไว้: คำสั่งจะคืนค่าเมื่อ healthcheck กลายเป็น `healthy` ไม่ใช่ตอนที่สร้าง container เสร็จ ถ้าไม่มี flag นี้ Nest จะเริ่มเชื่อมต่อก่อนที่ Postgres จะรับ connection แล้วล้มตอน start

```js
compose(['up', '-d', '--wait', DB_SERVICE])
```

healthcheck ถูกประกาศไว้ที่ service `postgres` และอาศัย `pg_isready`

## พอร์ตถูกใช้อยู่

ก่อนยก container ขึ้น `up` จะตรวจว่า `POSTGRES_PORT` ว่างหรือไม่ ถ้ามีอย่างอื่นใช้อยู่ — เช่น PostgreSQL ที่ติดตั้งในระบบ — คำสั่งจะหยุดพร้อมคำแนะนำ:

```
POSTGRES_PORT 5432 is busy. Change POSTGRES_PORT in .env and apps/backend/.env.
```

ชื่อ service และพอร์ตของ Postgres ภายใน container กำหนดเป็นค่าคงที่ `DB_SERVICE` และ `DB_CONTAINER_PORT` — ตรงกับใน `docker-compose.yml` ถ้าแก้ที่นั่น ต้องแก้ใน `db.mjs` ด้วย

## ทำไม `down` แค่หยุด

`dbDown()` เรียก `docker compose stop` ไม่ใช่ `down` ผลลัพธ์ต่างกัน: `down` จะลบ container ส่วน `down -v` จะลบ volume พร้อมข้อมูลไปด้วย การลบข้อมูลจึงตั้งใจไม่ห่อไว้ในคำสั่ง pnpm เพื่อไม่ให้เกิดขึ้นด้วยความเคยชิน:

```bash
docker compose down -v   # ลบฐานข้อมูลพร้อมข้อมูลทั้งหมด
```

## การใช้เป็น module

```js
import { dbUp, dbGenerate, dbMigrate, dbSeed } from './db.mjs'

dbUp()         // network + postgres + รอ healthcheck
dbGenerate()   // prisma generate ใน apps/backend
dbMigrate()    // prisma migrate deploy ใน apps/backend
dbSeed()       // prisma db seed ใน apps/backend
```
