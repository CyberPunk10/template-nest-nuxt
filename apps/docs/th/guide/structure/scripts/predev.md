# predev.mjs

รันอัตโนมัติก่อน `pnpm dev` — ผ่าน npm `pre*` convention

ทำสามอย่าง:

1. **คัดลอก `.env.example` → `.env`** ทั้งสี่ไฟล์พร้อมกัน (root, `apps/backend`, `apps/frontend`, `apps/docs`) — ผ่าน `copyEnvFiles()` ที่ใช้ร่วมกันจาก [`copy-env.mjs`](/th/guide/structure/scripts/copy-env) ไม่ใช่แค่ "ของตัวเอง": แม้จะรันก่อน develop ในเครื่อง ก็สร้าง `.env` ที่ root ให้ด้วยถ้ายังไม่มี
2. **ตรวจสอบพอร์ตและแก้ปัญหาชนกัน** — ผ่าน `checkPorts()` ที่ใช้ร่วมกันจาก [`check-ports.mjs`](/th/guide/structure/scripts/check-ports) ถ้าชนกันจะเสนอ dialog: kill process ที่ครองพอร์ตอยู่ หรือยกเลิกการรัน
3. **ยกฐานข้อมูลขึ้นมา** — ผ่าน `dbUp()` จาก [`db.mjs`](/th/guide/structure/scripts/db) ตอน `pnpm dev` แอปรันในเครื่อง แต่ Postgres ต้องมาจาก Docker การเรียกซ้ำบน container ที่รันอยู่แล้วจะไม่เปลี่ยนอะไร

พอร์ตที่ตรวจคือ dev port: `PORT` จาก `apps/backend/.env`, `apps/frontend/.env` และ `apps/docs/.env`

พอร์ตของฐานข้อมูลไม่อยู่ใน list นี้: ตัวตรวจ kill ได้เฉพาะ process บน host ส่วนพอร์ตนี้ Docker เป็นผู้ครอง การที่พอร์ตถูกใช้อยู่จะถูกจับในขั้นที่ 3 — Docker จะบอกว่า `address already in use`

[`predocker.mjs`](/th/guide/structure/scripts/predocker) ทำแบบเดียวกัน — ต่างกันที่ list ของพอร์ต และไม่ได้ยกฐานข้อมูลแยก เพราะ `docker compose` ยกขึ้นมาพร้อม service อื่นอยู่แล้ว

## สิ่งที่แสดงผล

แต่ละขั้นตอนจะพิมพ์ผลลัพธ์หนึ่งบรรทัด:

```
[predev.mjs] ✓ .env: created apps/backend/.env from .env.example
[predev.mjs] ✓ ports: backend 3100 · frontend 3200 · docs 5173
[predev.mjs] ✓ db: postgres is up
```

ถ้าขั้นตอนไหนไม่สำเร็จ — จะมีบรรทัดที่มี ✗ พร้อมชื่อขั้นตอน และการเตรียมการจะหยุดตรงนั้น:

```
[predev.mjs] ✗ ports: PORT=abc in apps/backend/.env - not a valid port number (0-65535)
```

| ขั้นตอน   | สิ่งที่ต้องตรวจ                                                      | ทำซ้ำแยก           |
| ------- | --------------------------------------------------------------- | --------------- |
| `.env`  | มี `.env.example` อยู่ข้าง `.env` ที่ต้องการหรือไม่                      | `pnpm env:copy` |
| `ports` | ค่า `PORT` ใน `.env` ที่ระบุ                                        | `pnpm predev`   |
| `db`    | Docker ทำงานอยู่หรือไม่ และตั้ง `POSTGRES_*` ใน `.env` ที่ root แล้วหรือยัง | `pnpm db:up`    |

## การใช้งาน

รันเองอัตโนมัติ — ไม่ต้องเรียกแยก:

```bash
pnpm dev
```

npm เห็น script `predev` แล้วรันก่อน `dev` ถ้าต้องการรันแค่ขั้นเตรียมโดยไม่ start application:

```bash
pnpm predev
```
