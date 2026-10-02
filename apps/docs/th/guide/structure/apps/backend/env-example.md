# .env[.example]

| ตัวแปร                     | ค่า (dev)           | คอมเมนต์                                                                                                                                                                              |
| ------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `NODE_ENV`                | `development`      | โหมดของ application `docker-compose.yml` ปัจจุบัน override เป็น `production` — image ถูก build ในคอนฟิก production                                                    |
| `APP_ENV`                 | `development`      | โหมดระดับ application (`development`/`production`/`prod_qa`/`test`) ใน Docker เป็น `production`                                                                                        |
| `SWAGGER_ENABLED`         | ไม่ได้กำหนด          | จะเปิด Swagger UI ที่ `/api/docs` หรือไม่ ถ้าไม่กำหนด — เปิดทุกที่ยกเว้น `production` แยกจาก `NODE_ENV` เพื่อให้เปิด Swagger บน prod เพื่อ diagnostic ได้ หรือปิดบนเครื่องตัวเองได้           |
| `PORT`                    | `3100`             | พอร์ต backend ตอน `pnpm dev` ใน Docker จะถูก override ด้วย `BACKEND_INTERNAL_PORT` จาก `.env` ที่ root                                                                                   |
| `CORS_ORIGIN`             | `http://localhost:3200` | Origin ของ frontend ที่อนุญาตให้ส่ง request มา ใน Docker เปลี่ยนเป็น `http://localhost` — [รายละเอียด](../../../env-variables#cors-origin) |

## ความเชื่อมโยงกับไฟล์อื่น

ตัวแปรบางตัวเชื่อมโยงกับแอปข้างเคียง:

- **`CORS_ORIGIN`** ต้องตรงกับ address ของ frontend คือ `PORT` ใน `apps/frontend/.env` ถ้าไม่ตรง เบราว์เซอร์จะบล็อก request ไปยัง API ขณะที่ server ยังตอบ `200` และ log ก็ดูปกติ
- **`PORT`** — `NUXT_BACKEND_URL` ใน `apps/frontend/.env` ชี้มาที่ค่านี้: เป็น address ที่ Nuxt เรียกตอนทำ server-side rendering

เปลี่ยนพอร์ตแล้วตรวจทั้งสองฝั่ง [ความเชื่อมโยงทั้งหมด](../../../env-variables#ตัวแปรที่เชื่อมโยงกัน)

วิธีสร้าง `.env` ที่ใช้งานจริง — [ตัวแปรสภาพแวดล้อม](../../../env-variables#ไฟล์)
