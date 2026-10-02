# apps/backend/prisma

ทุกอย่างที่เกี่ยวกับ schema ของฐานข้อมูลและวงจรชีวิตของมัน

```
prisma/
├── schema.prisma           model, ความสัมพันธ์, enum
├── migrations/             ประวัติการเปลี่ยน schema
│   ├── 20260813204454_init/
│   └── migration_lock.toml
└── seed.ts                 ใส่ข้อมูลเริ่มต้นลงฐานข้อมูล
```

Prisma CLI เป็นตัวอ่านโฟลเดอร์นี้ โดยกำหนด path ไว้ใน `prisma.config.ts` ของ backend ส่วน client ที่ generate มาไม่ได้อยู่ที่นี่ — มันถูกสร้างใน `src/generated/prisma/` และไม่เข้า version control

วิธีใช้งานทั้งหมด — migration, การ generate client, การ seed — อยู่ในหัวข้อ [ฐานข้อมูล](/th/guide/database/)
