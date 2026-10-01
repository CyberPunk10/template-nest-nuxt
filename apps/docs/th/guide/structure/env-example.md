# .env[.example]

ตัวแปรสำหรับ docker compose: ชื่อและพอร์ตที่ Compose ต้องรู้ **ก่อน** ที่ container จะ start ตัวแอปพลิเคชันเองไม่ได้อ่านไฟล์นี้ — แต่ละตัวมี `.env` ของตัวเอง แต่เมื่อรันผ่าน Docker ค่าจากที่นี่จะเข้าสู่ container ผ่าน `environment` ใน `docker-compose.yml` ซึ่งมีลำดับความสำคัญเหนือ `apps/*/.env`

| ตัวแปร                    | ค่า                       | คอมเมนต์                                                                                                                                                                                                                          |
| ------------------------ | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NGINX_HOST_PORT`        | `80`                     | พอร์ตเดียวที่เปิดออกสู่ภายนอก — จุดเข้าของ traffic ทั้งหมด                                                                                                                                                                                  |
| `PUBLIC_ORIGIN`          | `http://localhost`       | ที่อยู่ที่ใช้เปิดเว็บไซต์ ส่งต่อให้ backend เป็น `CORS_ORIGIN` บนเซิร์ฟเวอร์คือ `https://<โดเมน>`                                                                                                                                                  |
| `NGINX_INTERNAL_PORT`    | `80`                     | พอร์ตที่ nginx ฟังอยู่ภายใน container                                                                                                                                                                                                  |
| `BACKEND_INTERNAL_PORT`  | `3100`                   | พอร์ตของ backend **ภายใน container**; ไม่ได้เปิดออกสู่ภายนอก                                                                                                                                                                           |
| `FRONTEND_INTERNAL_PORT` | `3200`                   | พอร์ตของ frontend ภายใน container; ไม่ได้เปิดออกสู่ภายนอก                                                                                                                                                                              |
| `COMPOSE_NETWORK_NAME`   | `template-nest-nuxt_app` | ชื่อของ Docker network ที่ใช้ร่วมกัน อ่านโดยทั้ง `docker-compose.yml` และ `ensure-network.mjs` network ถูกประกาศเป็น `external` — Compose ไม่ได้สร้างให้ แต่ `pnpm docker:up` เป็นคนสร้าง — [รายละเอียด](/th/guide/structure/docker-compose#network) |

เอกสารไม่ได้ใช้พอร์ตของตัวเอง — static file ของมันถูก build เข้าไปใน image ของ reverse proxy โดยตรง

## ใครอ่านไฟล์นี้

ตัวแปรจากที่นี่กระจายไปยังผู้ใช้หลายฝ่าย การแก้จึงปลอดภัยกว่าที่คิด เพราะกำหนดค่าไว้ที่เดียว

- `BACKEND_INTERNAL_PORT` และ `FRONTEND_INTERNAL_PORT` — ไปที่ `expose` ของ container, ไปที่ `PORT` ของตัวแอปเอง, ไปที่ address `NUXT_BACKEND_URL` ของ frontend และไปที่ config ของ nginx ที่ใช้ proxy
- `NGINX_INTERNAL_PORT` — ไปที่ `listen` ใน config ของ nginx และไปที่การเปิดพอร์ตออกภายนอก

ใน `pnpm dev` ตัวแปรเหล่านี้ไม่เกี่ยวข้อง: พอร์ตมาจาก `PORT` ใน `apps/*/.env` — [อธิบายทั้งสองโหมด](/th/guide/env-variables#พอร์ต)

[ตัวแปรสภาพแวดล้อม](/th/guide/env-variables#ไฟล์)
