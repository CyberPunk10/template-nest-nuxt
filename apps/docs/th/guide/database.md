# ฐานข้อมูล: PostgreSQL + Prisma

> **Branch:** เอกสารนี้ใช้ได้เฉพาะกับ branch `postgres-prisma` เท่านั้น

## Stack

- **PostgreSQL 17** — รันผ่าน Docker
- **Prisma 7** — ORM, migration, การ generate client

---

## การรันในเครื่อง (Local)

> **เมื่อสลับ branch** ไฟล์ `.env` ในเครื่องจะไม่อัปเดตให้อัตโนมัติ — อาจไม่มีตัวแปรของ branch ใหม่อยู่ในนั้น ให้เทียบกับ `.env.example` แล้วเพิ่มตัวแปรที่ขาดไป เช่น เมื่อสลับ branch `main` → `postgres-prisma` ไฟล์ `apps/backend/.env` อาจไม่มีตัวแปร `POSTGRES_*` ให้คัดลอกมาจาก `apps/backend/.env.example`

รัน PostgreSQL ผ่าน Docker:

```bash
pnpm db:up
```

โดยทั่วไปไม่ค่อยต้องใช้คำสั่งนี้เดี่ยว ๆ เพราะ `pnpm dev` จะรันฐานข้อมูลให้เอง หากต้องการหยุด container ใช้ `pnpm db:down` (ข้อมูลยังอยู่ใน volume)

ฐานข้อมูลถูกประกาศไว้ใน `docker-compose.yml` ไฟล์เดียวกันโดยไม่มี profile ส่วน service ของแอปอยู่ภายใต้ profile `app` ดังนั้น `docker compose up` จะแตะเฉพาะ postgres และถ้าต้องการ stack ทั้งหมดให้ใช้ `pnpm docker:up`

รัน migration:

```bash
cd apps/backend
pnpm prisma migrate dev
```

---

## การตั้งค่า (Configuration)

### `apps/backend/.env`

พารามิเตอร์การเชื่อมต่อ DB สำหรับ Prisma และตัวแอปพลิเคชัน:

```
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=template
```

### `.env` ที่ root

พารามิเตอร์ของ container ฐานข้อมูล — Docker Compose เป็นตัวอ่าน:

```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=template
POSTGRES_PORT=5432
```

user, password และชื่อ database ถูกเขียนซ้ำในสองไฟล์อย่างตั้งใจ: `.env` ที่ root ให้ Compose อ่าน ส่วน `apps/backend/.env` ให้ Nest อ่านตอนรันบน host ส่วน backend ที่รันใน container รับค่าชุดเดียวกันจาก `.env` ที่ root (ดู `environment` ใน `docker-compose.yml`) ค่าจึงไม่ตรงกันได้เฉพาะกรณีรันบน host เท่านั้น

### ถ้า port 5432 ถูกใช้อยู่

เปลี่ยนในสองไฟล์ — ให้เป็นค่าเดียวกัน:

```
.env                  POSTGRES_PORT=5435
apps/backend/.env     POSTGRES_PORT=5435
```

`.env` ที่ root กำหนดพอร์ตที่ container ฐานข้อมูลถูกเปิดออกมาบนเครื่อง host ส่วนไฟล์ที่สองจำเป็นเมื่อ backend รันผ่าน `pnpm dev`: มันบอก Nest และ Prisma ว่าให้เชื่อมต่อไปที่พอร์ตไหน

เมื่อ backend รันใน container เอง ไฟล์ที่สองจะไม่ถูกใช้เลย: compose ส่ง `postgres:5432` ให้ ซึ่งเป็นชื่อ service และพอร์ตภายใน network การ map พอร์ตออก host ไม่เกี่ยวข้องในกรณีนี้

---

## Prisma

### โครงสร้าง

```
apps/backend/
├── prisma/
│   ├── schema.prisma       ← โมเดล
│   ├── migrations/         ← ประวัติ migration (commit เข้า git)
│   └── seed.ts             ← สร้างบัญชี admin
└── prisma.config.ts        ← การตั้งค่า Prisma (datasource URL)
```

### คำสั่งหลัก

คำสั่งทั้งหมดรันจาก `apps/backend/`:

```bash
cd apps/backend

# สร้างและรัน migration
pnpm prisma migrate dev --name <ชื่อ>

# รัน migration โดยไม่สร้างใหม่ (CI / production)
pnpm prisma migrate deploy

# เปิด Prisma Studio (GUI สำหรับดูและแก้ไขข้อมูล)
pnpm prisma studio
# → http://localhost:5555

# generate client ใหม่ด้วยตนเอง
pnpm prisma generate
```

### การ generate client

client คือผลลัพธ์ของการ build: Prisma สร้างมันจาก `schema.prisma` ไว้ที่ `src/generated/prisma` และไม่ได้อยู่ใน repository

ปกติไม่ต้อง generate เอง: `postinstall` ใน `apps/backend/package.json` ทำให้ระหว่าง `pnpm install` client จึงมีขึ้นเองบน clone ใหม่, ใน CI และใน Docker image

ต้องทำเอง — เมื่อ schema เปลี่ยน: หลังแก้ schema หรือหลัง `git pull` ตอนนั้น client จะไม่อัปเดตเอง: ใน Prisma 7 `migrate dev` ไม่ generate client และ `pnpm install` ที่ไม่มี dependency ใหม่จะข้าม `postinstall`

```bash
pnpm db:generate
```

generator ถูกตั้งเป็น CommonJS:

```prisma
generator client {
  provider            = "prisma-client"
  output              = "../src/generated/prisma"
  moduleFormat        = "cjs"
  importFileExtension = ""
}
```

ทั้งสองค่าถูกเลือกให้ตรงกับวิธีที่โค้ดถูกรันจริงในเทมเพลตนี้

`moduleFormat = "cjs"` — เพราะ Nest compile เป็น CommonJS ขณะที่ generator ให้ผลลัพธ์เป็น ESM โดยค่าเริ่มต้น ถ้าไม่ตั้งค่านี้ client ที่ build ออกมาจะมี `import.meta` ติดไป ทำให้ Node มองไฟล์เป็น ES module และล้มที่ `exports`:

```
ReferenceError: exports is not defined in ES module scope
```

ปัญหานี้โผล่เฉพาะใน image ที่ build แล้ว ตอน `pnpm dev` Nest จะ compile ใหม่แบบ on the fly แล้วรันผลลัพธ์จาก `dist/` ใน process เดียวกัน ความไม่เข้ากันจึงไม่ปรากฏ

`importFileExtension = ""` — เพราะ generator สร้างเฉพาะไฟล์ `.ts` แต่โดยค่าเริ่มต้นอ้างถึงมันเป็น `.js` TypeScript รับ import แบบนี้ได้ แต่ Jest ไม่ได้:

```
Cannot find module './internal/class.js' from 'generated/prisma/client.ts'
```

ค่าว่างจะตัดนามสกุลออกจาก import ทำให้ client resolve ได้ทั้งตอน build และตอนเทสต์

### Seed: admin account

การลงทะเบียนปกติ (`POST /auth/register`) จะสร้างผู้ใช้ด้วย role `user` เสมอ (รับประกันโดย schema — `role Role @default(user)`) ดังนั้นถ้าไม่มีขั้นตอนแยก database จะไม่มี `admin` เลยแม้แต่คนเดียว นี่คือสิ่งที่ `prisma/seed.ts` มีไว้แก้ — รันเป็นคำสั่งแยก รวมถึงหลัง `migrate reset` ด้วย:

```bash
cd apps/backend
pnpm prisma migrate reset   # สร้าง database ใหม่ (ถ้าจำเป็น)
pnpm prisma db seed         # จากนั้น seed admin account อย่างชัดเจน
```

script นี้ idempotent (upsert ตาม email) และอ่านข้อมูลจาก `ADMIN_EMAIL`/`ADMIN_PASSWORD` ใน `.env`

รายละเอียด (วิธีทำงาน, ข้อควรระวังสำหรับ production) — ดูที่ [Auth → Backend: Seed](./auth/backend.md#seed-สร้าง-admin-account)

---

## Migration

โฟลเดอร์ `prisma/migrations/` จะถูก commit เข้า git — นี่คือประวัติการเปลี่ยนแปลง schema ของ DB
ห้ามแก้ไขไฟล์ migration ด้วยมือเด็ดขาด

สำหรับ production ให้ใช้ `prisma migrate deploy` — จะรันเฉพาะ migration ที่ pending อยู่โดยไม่มีคำถามแบบ interactive

---

## การแก้ปัญหาความไม่ตรงกันระหว่าง schema กับ client ที่ generate ไว้

### ปัญหาเกิดขึ้นได้อย่างไร

Prisma ทำงานกับ artifact สองอย่างที่เป็นอิสระต่อกัน:

1. **ประวัติ migration** — ไฟล์ใน `prisma/migrations/` ที่ commit เข้า git
2. **client ที่ generate ไว้** — โค้ด TypeScript ใน `src/generated/prisma/` ที่ไม่ได้ commit (อยู่ใน `.gitignore`)

client ถูก generate จากสถานะจริงของ DB ณ ตอนที่รัน `prisma migrate dev` ถ้าใน DB มีการรัน migration ที่ไฟล์ของมันไม่อยู่ใน `migrations/` — เช่น ถูกสร้างบนเครื่องอื่นหรือใน branch อื่นแล้วไม่ได้เข้า git — client จะมี field และโมเดลที่ไม่มีอยู่ใน `schema.prisma` ผลลัพธ์คือ: เกิด TypeScript error กับ field ที่ไม่มีในโค้ด

สัญญาณของสถานการณ์นี้ในผลลัพธ์ของ `migrate dev`:

```
Drift detected: Your database schema is not in sync with your migration history.
The following migration(s) are applied to the database but missing from the local migrations directory: 20260607165435_add_auth
```

### วิธีแก้สำหรับสภาพแวดล้อม dev

ต้อง reset DB กลับไปยังสถานะที่อธิบายไว้ในไฟล์ migration ปัจจุบัน แล้ว build client ใหม่:

```bash
cd apps/backend

# 1. reset DB และรัน migration ใหม่ทั้งหมด (ข้อมูลทั้งหมดจะถูกลบ)
pnpm prisma migrate reset

# 2. generate client ใหม่จาก schema.prisma ปัจจุบัน
pnpm prisma generate
```

> `migrate reset` จะไม่รัน `generate` ให้อัตโนมัติ — ต้อง build client แยกเอง
> หลังจากนั้น TypeScript error กับ field ที่ "ไม่มีอยู่" จะหายไป

### เมื่อวิธีนี้ใช้ไม่ได้

ถ้าความไม่ตรงกันเกิดขึ้นใน **production** หรือในสภาพแวดล้อมที่มีข้อมูลซึ่งสูญเสียไม่ได้ — `migrate reset` ใช้ไม่ได้ ในกรณีนี้ต้องเลือกอย่างใดอย่างหนึ่ง คือกู้ไฟล์ migration ที่หายไปกลับมาจากประวัติ git ของ branch อื่นหรือเครื่องอื่น หรือใช้ `prisma migrate resolve` เพื่อประสานสถานะด้วยตนเอง

---

## Error codes ของ Prisma

Prisma แปลง error ของ PostgreSQL ให้เป็น code ของตัวเองผ่าน `PrismaClientKnownRequestError` ซึ่งช่วยให้จัดการ error ได้โดยไม่ต้อง parse ข้อความจาก driver

Code ที่พบบ่อยที่สุด:

| Code    | ความหมาย                                                        | การตอบสนองทั่วไป                      |
| ------- | ------------------------------------------------------------- | ------------------------------------ |
| `P2002` | ละเมิด unique constraint (เช่น email ถูกใช้ไปแล้ว)              | `409 Conflict`                       |
| `P2025` | ไม่พบ record ตอน `update`, `delete`, `findUniqueOrThrow`       | `404 Not Found`                      |
| `P2003` | ละเมิด foreign key constraint                                 | `409 Conflict` หรือ `400 Bad Request` |

Pattern ที่ถูกต้องตามหลัก idiomatic คือ ทำ `update`/`delete` ไปเลยแล้วดักจับ P2025 แทนที่จะทำ `findUniqueOrThrow` ก่อนล่วงหน้า

::: tip TOCTOU (Time-Of-Check Time-Of-Use)
คลาสของ bug ที่ระหว่างการตรวจสอบเงื่อนไขกับการใช้งานเงื่อนไขนั้นมีช่องว่างซึ่งสถานะอาจเปลี่ยนแปลงได้ ในที่นี้: ระหว่าง `findUniqueOrThrow` (การตรวจสอบ) กับ `update`/`delete` (การใช้งาน) process อื่นสามารถลบ record ได้ทัน
:::

❌ **สองคำสั่งที่มีช่อง TOCTOU:**

```typescript
// คำสั่งที่ 1: ตรวจสอบว่ามีอยู่หรือไม่
await this.prisma.user.findUniqueOrThrow({ where: { id } }).catch(() => {
  throw new NotFoundException() // จัดการแล้ว
})
// ← ตรงนี้ process อื่นอาจลบ record ได้
// คำสั่งที่ 2: update — โยน P2025 ที่ไม่ได้จัดการ → 500
return await this.prisma.user.update({ where: { id }, data: dto })
```

✅ **คำสั่งเดียว จัดการ P2025 อย่างชัดเจน:**

```typescript
try {
  return await this.prisma.user.update({ where: { id }, data: dto })
} catch (e) {
  if (e instanceof PrismaClientKnownRequestError) {
    if (e.code === 'P2025') throw new NotFoundException()
    if (e.code === 'P2002') throw new ConflictException()
  }
  throw e
}
```

วิธีนี้ตัดช่อง TOCTOU ระหว่างสองคำสั่งออกไป และลดจำนวนครั้งที่เรียก DB ลงครึ่งหนึ่ง

รายการ code ทั้งหมด: [Prisma Error Reference](https://www.prisma.io/docs/orm/reference/error-reference)
