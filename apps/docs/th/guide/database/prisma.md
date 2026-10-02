# Prisma: schema และ client

## โครงสร้าง

```
apps/backend/
├── prisma/
│   ├── schema.prisma       ← โมเดล
│   ├── migrations/         ← ประวัติ migration (commit เข้า git)
│   └── seed.ts             ← สร้างบัญชี admin
└── prisma.config.ts        ← การตั้งค่า Prisma (datasource URL)
```

วิธีเปลี่ยน schema และทำงานกับ `migrations/` — ในหน้า [Migration](/th/guide/database/migrations)

## การ generate client

client คือผลลัพธ์ของการ build: Prisma สร้างมันจาก `schema.prisma` ไว้ที่ `src/generated/prisma` และไม่ได้อยู่ใน repository

ปกติไม่ต้อง generate เอง: `postinstall` ใน `apps/backend/package.json` ทำให้ระหว่าง `pnpm install` client จึงมีขึ้นเองบน clone ใหม่และใน Docker image

ต้องทำเอง — เมื่อ schema เปลี่ยน: หลังแก้ schema หรือหลัง `git pull` ตอนนั้น client จะไม่อัปเดตเอง: `migrate dev` เปลี่ยนแค่ฐานข้อมูล ไม่ generate client และ `pnpm install` ที่ไม่มี dependency ใหม่จะข้าม `postinstall`

```bash
pnpm db:generate
```

## การตั้งค่า generator

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

## Seed: admin account

การลงทะเบียนปกติ (`POST /auth/register`) จะสร้างผู้ใช้ด้วย role `user` เสมอ (รับประกันโดย schema — `role Role @default(user)`) ดังนั้นถ้าไม่มีขั้นตอนแยก database จะไม่มี `admin` เลยแม้แต่คนเดียว นี่คือสิ่งที่ `prisma/seed.ts` มีไว้แก้ — รันเป็นคำสั่งแยก รวมถึงหลัง `migrate reset` ด้วย:

```bash
cd apps/backend
pnpm prisma migrate reset   # สร้าง database ใหม่ (ถ้าจำเป็น)
pnpm prisma db seed         # จากนั้น seed admin account อย่างชัดเจน
```

script นี้ idempotent (upsert ตาม email) และอ่านข้อมูลจาก `ADMIN_EMAIL`/`ADMIN_PASSWORD` ใน `.env`

รายละเอียด (วิธีทำงาน, ข้อควรระวังสำหรับ production) — ดูที่ [Auth → Backend: Seed](/th/guide/auth/backend#seed-สร้าง-admin-account)
