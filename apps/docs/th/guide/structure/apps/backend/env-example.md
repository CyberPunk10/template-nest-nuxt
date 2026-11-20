# .env[.example]

| ตัวแปร                     | ค่า (dev)           | คอมเมนต์                                                                                                                                                                              |
| ------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `NODE_ENV`                | `development`      | โหมดของ application `docker-compose.yml` ปัจจุบัน override เป็น `production` — image ถูก build ในคอนฟิก production                                                    |
| `APP_ENV`                 | `development`      | โหมดระดับ application (`development`/`production`/`prod_qa`/`test`) ใน Docker เป็น `production`                                                                                        |
| `SWAGGER_ENABLED`         | ไม่ได้กำหนด          | จะเปิด Swagger UI ที่ `/api/docs` หรือไม่ ถ้าไม่กำหนด — เปิดทุกที่ยกเว้น `production` แยกจาก `NODE_ENV` เพื่อให้เปิด Swagger บน prod เพื่อ diagnostic ได้ หรือปิดบนเครื่องตัวเองได้           |
| `PORT`                    | `3100`             | พอร์ต backend ตอน `pnpm dev` ใน Docker จะถูก override ด้วย `BACKEND_INTERNAL_PORT` จาก `.env` ที่ root                                                                                   |
| `CORS_ORIGIN`             | `http://localhost:3200` | Origin ของ frontend ที่อนุญาตให้ส่ง request มา ใน Docker เปลี่ยนเป็น `http://localhost` — [รายละเอียด](../../../env-variables#cors-origin) |

## PostgreSQL

| ตัวแปร               | ค่า (dev)    | คอมเมนต์                                                                                          |
| ------------------- | ----------- | ------------------------------------------------------------------------------------------------- |
| `POSTGRES_HOST`     | `localhost` | จำเป็น ใน container เปลี่ยนเป็น `postgres` — ชื่อ service ภายใน network                              |
| `POSTGRES_PORT`     | `5432`      | ต้องตรงกับ `POSTGRES_PORT` ใน `.env` ที่ root ซึ่งกำหนด host port ที่เปิดออก ภายใน container เป็น `5432` เสมอ |
| `POSTGRES_USER`     | `postgres`  | จำเป็น ใน container รับค่าจาก `.env` ที่ root — ที่เดียวกับที่ container ฐานข้อมูลรับค่า                  |
| `POSTGRES_PASSWORD` | `postgres`  | จำเป็น แหล่งเดียวกัน                                                                                |
| `POSTGRES_DB`       | `template`  | จำเป็น แหล่งเดียวกัน                                                                                |

ค่าเหล่านี้ถูกเขียนซ้ำใน `.env` ที่ root อย่างตั้งใจ: ไฟล์นั้น Compose อ่าน ส่วนไฟล์นี้ Nest บน host อ่าน [รายละเอียด](../../../database/configuration#env-ที่-root)

## การยืนยันตัวตน

| ตัวแปร                        | ค่า (dev)   | คอมเมนต์                                                                              |
| ---------------------------- | ----------- | -------------------------------------------------------------------------------------- |
| `JWT_SECRET`                 | ค่าตัวอย่าง  | จำเป็น อย่างน้อย 32 ตัวอักษร ใช้เซ็น access token — **เปลี่ยนก่อนขึ้น production**          |
| `JWT_EXPIRES_IN`             | `15m`       | อายุของ access token รูปแบบ `<ตัวเลข><s\|m\|h\|d>`                                     |
| `REFRESH_TOKEN_SECRET`       | ค่าตัวอย่าง  | จำเป็น อย่างน้อย 32 ตัวอักษร เป็นคนละ secret กับ `JWT_SECRET` — **เปลี่ยนก่อนขึ้น production** |
| `REFRESH_TOKEN_EXPIRES_DAYS` | `7`         | อายุของ refresh token เป็นวัน                                                            |
| `BCRYPT_ROUNDS`              | `12`        | ต้นทุนการ hash รหัสผ่าน 4–20 ใน production ควร ≥ 12 ลดเหลือ 4 สมเหตุสมผลเฉพาะตอนเทสต์เพื่อความเร็ว |

## อื่น ๆ

| ตัวแปร            | ค่า (dev)            | คอมเมนต์                                                                            |
| ---------------- | ------------------- | ------------------------------------------------------------------------------------ |
| `THROTTLE_TTL`   | `60000`             | ช่วงเวลาของ rate limiting เป็นมิลลิวินาที ต่อ IP                                        |
| `THROTTLE_LIMIT` | `100`               | จำนวน request สูงสุดต่อช่วงเวลา                                                        |
| `ADMIN_EMAIL`    | `admin@example.com` | admin ถูกสร้างตอนแอป start ถ้าไม่กำหนด การสร้างจะถูกข้ามไป                                |
| `ADMIN_PASSWORD` | `password`          | รหัสผ่านของ admin ตัวนั้น hash ด้วย `BCRYPT_ROUNDS` การ start ใหม่จะไม่แตะ admin ที่มีอยู่แล้ว |

## ความเชื่อมโยงกับไฟล์อื่น

ตัวแปรบางตัวเชื่อมโยงกับแอปข้างเคียง:

- **`CORS_ORIGIN`** ต้องตรงกับ address ของ frontend คือ `PORT` ใน `apps/frontend/.env` ถ้าไม่ตรง เบราว์เซอร์จะบล็อก request ไปยัง API ขณะที่ server ยังตอบ `200` และ log ก็ดูปกติ
- **`PORT`** — `NUXT_BACKEND_URL` ใน `apps/frontend/.env` ชี้มาที่ค่านี้: เป็น address ที่ Nuxt เรียกตอนทำ server-side rendering

เปลี่ยนพอร์ตแล้วตรวจทั้งสองฝั่ง [ความเชื่อมโยงทั้งหมด](../../../env-variables#ตัวแปรที่เชื่อมโยงกัน)

วิธีสร้าง `.env` ที่ใช้งานจริง — [ตัวแปรสภาพแวดล้อม](../../../env-variables#ไฟล์)
