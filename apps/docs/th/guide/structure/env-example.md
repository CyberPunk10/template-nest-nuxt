# .env[.example]

ตัวแปรสำหรับ docker compose: ชื่อและพอร์ตที่ Compose ต้องรู้ **ก่อน** ที่ container จะ start ตัวแอปพลิเคชันเองไม่ได้อ่านไฟล์นี้ — แต่ละตัวมี `.env` ของตัวเอง แต่เมื่อรันผ่าน Docker ค่าจากที่นี่จะเข้าสู่ container ผ่าน `environment` ใน `docker-compose.yml` ซึ่งมีลำดับความสำคัญเหนือ `apps/*/.env`

| ตัวแปร                    | ค่า                       | คอมเมนต์                                                                                                                                                                                                                          |
| ------------------------ | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NGINX_HOST_PORT`        | `80`                     | จุดเข้าของ traffic ของแอปทั้งหมด                                                                                                                                                                                                           |
| `PUBLIC_ORIGIN`          | `http://localhost`       | ที่อยู่ที่ใช้เปิดเว็บไซต์ ส่งต่อให้ backend เป็น `CORS_ORIGIN` บนเซิร์ฟเวอร์คือ `https://<โดเมน>`                                                                                                                                                  |
| `NGINX_INTERNAL_PORT`    | `80`                     | พอร์ตที่ nginx ฟังอยู่ภายใน container                                                                                                                                                                                                  |
| `BACKEND_INTERNAL_PORT`  | `3100`                   | พอร์ตของ backend **ภายใน container**; ไม่ได้เปิดออกสู่ภายนอก                                                                                                                                                                           |
| `FRONTEND_INTERNAL_PORT` | `3200`                   | พอร์ตของ frontend ภายใน container; ไม่ได้เปิดออกสู่ภายนอก                                                                                                                                                                              |
| `COMPOSE_NETWORK_NAME`   | `template-nest-nuxt_app` | ชื่อของ Docker network ที่ใช้ร่วมกัน อ่านโดยทั้ง `docker-compose.yml` และ `ensure-network.mjs` network ถูกประกาศเป็น `external` — Compose ไม่ได้สร้างให้ แต่ `pnpm docker:up` เป็นคนสร้าง — [รายละเอียด](/th/guide/structure/docker-compose#network) |
| `POSTGRES_USER`          | `postgres`               | user ของฐานข้อมูล: ถูกสร้างตอน container initialise และ backend ใช้ตัวนี้เชื่อมต่อ                                                                                                                                                         |
| `POSTGRES_PASSWORD`      | `postgres`               | password ของ user ตัวนั้น                                                                                                                                                                                                           |
| `POSTGRES_DB`            | `template`               | ชื่อ database ที่จะถูกสร้าง                                                                                                                                                                                                            |
| `POSTGRES_PORT`          | `5432`                   | host port ของ container ฐานข้อมูล เป็นพอร์ตเดียวของแอปที่เปิดออกภายนอกนอกจาก proxy — ใช้เชื่อมต่อฐานข้อมูลจาก host ตอน `pnpm dev`                                                                                                              |

เอกสารไม่ได้ใช้พอร์ตของตัวเอง — static file ของมันถูก build เข้าไปใน image ของ reverse proxy โดยตรง

## อะไรในไฟล์นี้ที่ถูกใช้ตอน `pnpm dev`

พอร์ต — ไม่ถูกใช้: แอปรันบน host โดยตรงโดยไม่ใช้ container และอ่าน `PORT` จาก `apps/*/.env` ของตัวเอง — [รายละเอียดของทั้งสองโหมด](/th/guide/env-variables#พอร์ต)

`POSTGRES_*` — มีผล: Postgres รันใน container เสมอ และ Compose อ่านตัวแปรเหล่านี้จากที่นี่ ค่าชุดเดียวกันถูกเขียนซ้ำใน `apps/backend/.env` เพราะ Nest นอก Docker อ่านเองโดยตรง — [รายละเอียด](/th/guide/database)

[ตัวแปรสภาพแวดล้อม](/th/guide/env-variables#ไฟล์)
