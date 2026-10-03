# predev.mjs

รันอัตโนมัติก่อน `pnpm dev` — ผ่าน npm `pre*` convention

ก่อนเริ่ม จะทำตามลำดับดังนี้:

1. **คัดลอก `.env.example` → `.env`** ทั้งสี่ไฟล์พร้อมกัน (root, `apps/backend`, `apps/frontend`, `apps/docs`) — ผ่าน `copyEnvFiles()` ที่ใช้ร่วมกันจาก [`copy-env.mjs`](./copy-env) ไม่ใช่แค่ "ของตัวเอง": แม้จะรันก่อน develop ในเครื่อง ก็สร้าง `.env` ที่ root ให้ด้วยถ้ายังไม่มี
2. **ตรวจสอบพอร์ตและแก้ปัญหาชนกัน** — ผ่าน `checkPorts()` ที่ใช้ร่วมกันจาก [`check-ports.mjs`](./check-ports) ถ้าชนกันจะเสนอ dialog: kill process ที่ครองพอร์ตอยู่ หรือยกเลิกการรัน

พอร์ตที่ตรวจคือ dev port: `PORT` จาก `apps/backend/.env`, `apps/frontend/.env` และ `apps/docs/.env`

[`predocker.mjs`](./predocker) ทำแบบเดียวกัน — ต่างกันแค่ list ของพอร์ต และเพิ่มการสร้าง Docker network

## สิ่งที่แสดงผล

แต่ละขั้นตอนจะพิมพ์ผลลัพธ์หนึ่งบรรทัด:

```
[predev.mjs] ✓ .env: created apps/backend/.env from .env.example
[predev.mjs] ✓ ports: backend 3100 · frontend 3200 · docs 5173
```

ถ้าขั้นตอนไหนไม่สำเร็จ — จะมีบรรทัดที่มี ✗ พร้อมชื่อขั้นตอน และการเตรียมการจะหยุดตรงนั้น:

```
[predev.mjs] ✗ ports: PORT=abc in apps/backend/.env - not a valid port number (0-65535)
```

| ขั้นตอน   | สิ่งที่ต้องตรวจ                                 | ทำซ้ำแยก           |
| ------- | ------------------------------------------ | --------------- |
| `.env`  | มี `.env.example` อยู่ข้าง `.env` ที่ต้องการหรือไม่ | `pnpm env:copy` |
| `ports` | ค่า `PORT` ใน `.env` ที่ระบุ                   | `pnpm predev`   |

## การใช้งาน

รันเองอัตโนมัติ — ไม่ต้องเรียกแยก:

```bash
pnpm dev
```

npm เห็น script `predev` แล้วรันก่อน `dev` ถ้าต้องการรันแค่ขั้นเตรียมโดยไม่ start application:

```bash
pnpm predev
```
