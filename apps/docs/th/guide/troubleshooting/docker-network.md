# ไม่ได้สร้างเครือข่าย Docker

## Docker ไม่ได้รันอยู่

```
[predocker.mjs] ✗ network: Command failed: docker network create template-nest-nuxt_app
```

ส่วนใหญ่เป็นเพราะ Docker ไม่ได้รันอยู่ ตรวจสอบ:

```bash
docker info
```

เปิด Docker Desktop หรือ daemon (`sudo systemctl start docker`) แล้วรัน `pnpm docker:up` อีกครั้ง

## รัน `docker compose up` โดยตรง

```
network template-nest-nuxt_app declared as external, but could not be found
```

เครือข่ายถูกสร้างโดย [`predocker.mjs`](../structure/scripts/predocker) ก่อน `pnpm docker:up` และโดย [`db.mjs`](../structure/scripts/db) ก่อนเริ่ม Postgres ใน `pnpm dev` การรัน `docker compose up` โดยตรงจะข้ามขั้นตอนนี้ ให้รันผ่าน `pnpm docker:up` หรือสร้างเครือข่ายเอง:

```bash
docker network create template-nest-nuxt_app
```
