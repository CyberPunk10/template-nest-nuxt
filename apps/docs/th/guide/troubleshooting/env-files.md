# ไม่มีไฟล์ `.env`

## อาการ

```
no port specified
```

```
env file apps/backend/.env not found
```

ตัวแปรใน `docker-compose.yml` ไม่มีค่าเริ่มต้น และไฟล์ `.env` ถูกสร้างโดย `predocker.mjs` — เฉพาะเมื่อรัน `pnpm docker:up` เช่นกัน สร้าง `.env` ที่ขาดโดยไม่ต้องรันอะไร:

```bash
pnpm env:copy
```

## ขาดตัวแปรใหม่

ถ้ามี `.env` อยู่แล้ว `pnpm env:copy` จะไม่แตะ — แม้ใน `.env.example` จะมีตัวแปรใหม่ก็ตาม ให้เพิ่มตัวที่ขาดเอง หรือเขียนทับ `.env` ทั้งหมดจาก `.env.example`:

```bash
pnpm env:copy:force
```

::: warning
`env:copy:force` จะลบการแก้ไขของคุณใน `.env` ถ้าคุณเปลี่ยนพอร์ตหรือ secret ไว้ ให้ย้ายตัวแปรเอง
:::
