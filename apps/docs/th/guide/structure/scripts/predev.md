# predev.mjs

รันอัตโนมัติก่อน `pnpm dev` — ผ่าน npm `pre*` convention

ก่อนเริ่ม จะทำตามลำดับดังนี้:

1. **คัดลอก `.env.example` → `.env`** ทั้งสี่ไฟล์พร้อมกัน (root, `apps/backend`, `apps/frontend`, `apps/docs`) — ผ่าน `copyEnvFiles()` ที่ใช้ร่วมกันจาก [`copy-env.mjs`](./copy-env) ไม่ใช่แค่ "ของตัวเอง": แม้จะรันก่อน develop ในเครื่อง ก็สร้าง `.env` ที่ root ให้ด้วยถ้ายังไม่มี
2. **ตรวจสอบพอร์ตและแก้ปัญหาชนกัน** — ผ่าน `checkPorts()` ที่ใช้ร่วมกันจาก [`check-ports.mjs`](./check-ports) ถ้าชนกันจะเสนอ dialog: kill process ที่ครองพอร์ตอยู่ หรือยกเลิกการรัน
3. **ยกฐานข้อมูลขึ้นมา** — ผ่าน `dbUp()` จาก [`db.mjs`](./db) ตอน `pnpm dev` แอปรันในเครื่อง แต่ Postgres ต้องมาจาก Docker การเรียกซ้ำบน container ที่รันอยู่แล้วจะไม่เปลี่ยนอะไร ก่อนหน้านั้นจะตรวจว่า `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD` และ `POSTGRES_DB` ใน `.env` ที่ root และ `apps/backend/.env` ตรงกัน: container อ่านจากไฟล์แรก backend อ่านจากไฟล์ที่สอง ตรวจเฉพาะเมื่อ backend ใช้ฐานข้อมูลในเครื่อง (`POSTGRES_HOST` เป็น `localhost`) ถ้าเป็นฐานข้อมูลภายนอก ค่าต่างกันได้
4. **generate client ของ Prisma** — ผ่าน `dbGenerate()` หลัง `pnpm install` `postinstall` ทำไว้แล้ว แต่ schema อาจเปลี่ยนทีหลัง: หลังแก้หรือหลัง `git pull`
5. **รัน migration ใหม่** — ผ่าน `dbMigrate()` (`prisma migrate deploy`) รันเฉพาะ migration ที่ยังไม่มีใน DB ไม่สร้าง migration ใหม่ และไม่สร้าง DB ใหม่
6. **สร้างผู้ดูแลระบบ ถ้ายังไม่มี** — ผ่าน `dbSeed()` (`prisma db seed`) จาก `ADMIN_EMAIL` และ `ADMIN_PASSWORD` ใน `apps/backend/.env` seed ไม่แตะผู้ใช้ที่มีอยู่และไม่เขียนทับรหัสผ่าน ใช้เฉพาะตอนพัฒนา: บนโปรดักชันสร้างผู้ดูแลระบบด้วยคำสั่งแยก

พอร์ตที่ตรวจคือ dev port: `PORT` จาก `apps/backend/.env`, `apps/frontend/.env` และ `apps/docs/.env`

พอร์ตของฐานข้อมูลไม่ได้ตรวจที่นี่ — ขั้นที่ 3 จะตรวจก่อนยกฐานข้อมูลขึ้น: ถ้าพอร์ตถูกใช้อยู่ การเตรียมจะหยุดพร้อมคำแนะนำให้เปลี่ยน `POSTGRES_PORT` รายละเอียดอยู่ใน [`db.mjs`](./db)

[`predocker.mjs`](./predocker) ทำแบบเดียวกัน — ต่างกันที่ list ของพอร์ต และไม่ได้ยกฐานข้อมูลแยก เพราะ `docker compose` ยกขึ้นมาพร้อม service อื่นอยู่แล้ว

## สิ่งที่แสดงผล

แต่ละขั้นตอนจะพิมพ์ผลลัพธ์หนึ่งบรรทัด:

```
[predev.mjs] ✓ .env: created apps/backend/.env from .env.example
[predev.mjs] ✓ ports: backend 3100 · frontend 3200 · docs 5173
[predev.mjs] ✓ db: postgres is up
[predev.mjs] ✓ client: generated from schema.prisma
[predev.mjs] ✓ migrations: database is up to date
[predev.mjs] ✓ admin: in place
```

ถ้าขั้นตอนไหนไม่สำเร็จ — จะมีบรรทัดที่มี ✗ พร้อมชื่อขั้นตอน และการเตรียมการจะหยุดตรงนั้น:

```
[predev.mjs] ✗ ports: PORT=abc in apps/backend/.env - not a valid port number (0-65535)
```

| ขั้นตอน        | สิ่งที่ต้องตรวจ                                                                       | ทำซ้ำแยก              |
| ------------ | -------------------------------------------------------------------------------- | ------------------ |
| `.env`       | มี `.env.example` อยู่ข้าง `.env` ที่ต้องการหรือไม่                                       | `pnpm env:copy`    |
| `ports`      | ค่า `PORT` ใน `.env` ที่ระบุ                                                         | `pnpm predev`      |
| `db`         | Docker ทำงานอยู่หรือไม่ และ `POSTGRES_*` ใน `.env` ที่ root กับ `apps/backend/.env` ตรงกันหรือไม่ | `pnpm db:up`       |
| `client`     | error ของ Prisma ด้านบน — ส่วนใหญ่คือพิมพ์ผิดใน `schema.prisma`                         | `pnpm db:generate` |
| `migrations` | error ของ Prisma ด้านบน และ `POSTGRES_*` ใน `apps/backend/.env` ตรงกับที่ root หรือไม่ | `pnpm db:migrate`  |
| `admin`      | error ด้านบน ถ้าไม่มี `ADMIN_*` ใน `apps/backend/.env` seed จะถูกข้าม                  | `pnpm db:seed`     |

## การใช้งาน

รันเองอัตโนมัติ — ไม่ต้องเรียกแยก:

```bash
pnpm dev
```

npm เห็น script `predev` แล้วรันก่อน `dev` ถ้าต้องการรันแค่ขั้นเตรียมโดยไม่ start application:

```bash
pnpm predev
```
