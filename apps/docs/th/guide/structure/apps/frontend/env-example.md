# .env[.example]

| ตัวแปร                            | ค่า (dev)                          | คอมเมนต์                                                                                                                                            |
| -------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PORT`                           | `3200`                            | พอร์ต frontend ตอน `pnpm dev` ใน Docker จะถูก override ด้วย `FRONTEND_INTERNAL_PORT` จาก `.env` ที่ root                                                |
| `NUXT_PUBLIC_API_BASE`           | `/api/backend`                    | Prefix สำหรับ server-side proxy ไปที่ backend (browser เรียกมาที่นี่ ไม่ได้เรียก backend ตรง)                                                                 |
| `NUXT_BACKEND_URL`               | `http://localhost:3100`           | Address ของ backend สำหรับ Nuxt SSR (ฝั่ง server) ใน Docker ถูก override เป็น `http://backend:${BACKEND_INTERNAL_PORT}` — เรียกด้วยชื่อ service เพราะ `localhost` ภายใน network เข้าไม่ถึง |
| `NUXT_PUBLIC_APP_ENV`            | `development`                     | โหมด environment ฝั่ง client ใน Docker เป็น `production`                                                                                             |
| `NUXT_PUBLIC_DOCS_URL`           | `http://localhost:5173/dev/docs/` | ลิงก์ไปยังเอกสาร (เมนู, DevPanel) ใน Docker เป็น path แบบสัมพัทธ์ `/dev/docs/`: proxy ตัวเดียวกันเป็นคนเสิร์ฟเอกสาร ลิงก์จึงชี้ไปที่ origin ปัจจุบัน           |

frontend **ไม่ได้** เก็บ address ของ backend สำหรับลิงก์ใน DevPanel และ flag ของ Swagger ไว้เอง — มันถาม backend ผ่าน `/dev/config` ไม่งั้นค่าเดียวกันจะต้องอยู่สองที่และต้องคอย sync เอง อีกทั้ง address ยังต่างกันระหว่าง `pnpm dev` กับ Docker

## ความเชื่อมโยงกับไฟล์อื่น

frontend รู้ address ของเพื่อนบ้านทั้งสองฝั่ง และทั้งสองฝั่งก็อ้างถึงพอร์ตของ frontend เช่นกัน:

- **`PORT`** — `CORS_ORIGIN` ใน `apps/backend/.env` ชี้มาที่ค่านี้ (ไม่งั้น backend จะปฏิเสธ request) และ `DASHBOARD_URL` ใน `apps/docs/.env` ก็เช่นกัน (ไม่งั้นปุ่ม «ดูตัวอย่างเดโม» จะพาไปผิดที่)
- **`NUXT_BACKEND_URL`** ต้องชี้ไปที่ `PORT` จาก `apps/backend/.env` — ไม่งั้น SSR จะเรียก API ไม่ได้
- **`NUXT_PUBLIC_DOCS_URL`** ต้องชี้ไปที่ `PORT` จาก `apps/docs/.env` พร้อมกับ path `/dev/docs/`

เปลี่ยนพอร์ตแล้วตรวจทั้งสองฝั่ง [ความเชื่อมโยงทั้งหมด](../../../env-variables#ตัวแปรที่เชื่อมโยงกัน)

วิธีสร้าง `.env` ที่ใช้งานจริง — [ตัวแปรสภาพแวดล้อม](../../../env-variables#ไฟล์)
