# ฐานข้อมูล: PostgreSQL + Prisma

> **Branch:** เอกสารนี้ใช้ได้เฉพาะกับ branch `postgres-prisma` เท่านั้น

## Stack

- **PostgreSQL 17** — รันผ่าน Docker
- **Prisma 7** — ORM, migration, การ generate client

## ทำงานอย่างไร

PostgreSQL รันใน container เสมอ — ทั้งตอน `pnpm dev` และ `pnpm docker:up` ฐานข้อมูลถูกประกาศไว้ใน `docker-compose.yml` ไฟล์เดียวกันโดยไม่มี profile ส่วน service ของแอปอยู่ภายใต้ profile `app` ดังนั้น `docker compose up` จะแตะเฉพาะ postgres และถ้าต้องการ stack ทั้งหมดให้ใช้ `pnpm docker:up`

การเตรียมฐานข้อมูลเกิดขึ้นเองตอนเริ่ม: ก่อนเริ่ม `pnpm dev` จะยก container ขึ้นมา generate client ของ Prisma และรัน migration — [รายละเอียด](/th/guide/structure/scripts/predev) ในโหมด Docker container ของ backend จะรัน migration เองตอน start

ยกหรือหยุดฐานข้อมูลแยกต่างหาก:

```bash
pnpm db:up     # ยก container และรอจนพร้อม
pnpm db:down   # หยุด ข้อมูลยังอยู่ใน volume
```

## คำสั่งหลัก

คำสั่ง `pnpm prisma ...` — จาก `apps/backend/` ส่วน `pnpm db:*` — จาก root

| งาน                              | คำสั่ง                                   |
| -------------------------------- | ------------------------------------- |
| สร้างและรัน migration              | `pnpm prisma migrate dev --name <ชื่อ>` |
| รัน migration ใหม่                 | `pnpm db:migrate`                     |
| generate client ใหม่              | `pnpm db:generate`                    |
| Prisma Studio (`localhost:5555`) | `pnpm prisma studio`                  |
