# apps/frontend

Nuxt 4 ต่างจาก backend ตรงที่ตำแหน่งของไฟล์ **กำหนดพฤติกรรม**: Nuxt จะสแกนโฟลเดอร์แล้วสร้าง route, ลงทะเบียน component และตั้ง auto-import ให้เอง

```
apps/frontend/
├── app/                        ซอร์สของแอปพลิเคชัน
│   ├── assets/css/             style ที่ Vite ประมวลผล
│   ├── components/             Vue component (auto-import)
│   ├── composables/            composable (auto-import)
│   ├── layouts/                ตัวครอบหน้าเพจ
│   ├── pages/                  routing ตามไฟล์
│   ├── plugins/                โค้ดที่รันตอน init แอป
│   ├── utils/                  ฟังก์ชันช่วย (auto-import)
│   └── app.vue                 root component
├── server/                     ฝั่ง server (Nitro)
│   └── api/
│       ├── backend/            BFF proxy ไป NestJS
│       └── health.get.ts
├── i18n/                       การตั้งค่า @nuxtjs/i18n
├── public/                     เสิร์ฟตามเดิม: favicon, robots.txt
└── nuxt.config.ts
```

## ตำแหน่งไฟล์ให้อะไรบ้าง

| โฟลเดอร์ | Convention |
| --- | --- |
| `pages/` | ชื่อไฟล์กลายเป็น route: `pages/tasks.vue` → `/tasks` |
| `components/` | ใช้ใน template ได้เลยโดยไม่ต้อง import ระดับโฟลเดอร์กลายเป็นส่วนหนึ่งของชื่อ: `components/App/Sidebar.vue` → `<AppSidebar>` |
| `composables/`, `utils/` | export ใช้ได้ทุกที่โดยไม่ต้อง import |
| `plugins/` | รันตอน start ตัวเลขนำหน้ากำหนดลำดับ (`01.api.ts`) ส่วน `.client` คือรันเฉพาะบน browser |
| `layouts/` | `default.vue` ใช้กับทุกหน้า ถ้าไม่ได้ระบุเป็นอย่างอื่น |
| `public/` | เสิร์ฟจาก root: `public/robots.txt` → `/robots.txt` โดย bundler ไม่แตะ |

## app/ กับ server/ คนละสภาพแวดล้อม

`app/` คือส่วนที่ไปถึง browser (และถูก render บน server ตอน SSR) ส่วน `server/` รัน **เฉพาะ** บน server และไม่เข้าไปอยู่ใน bundle ฝั่ง client

ทุก request ที่ยิงไป API จะผ่าน `server/api/backend/`: browser คุยกับ origin ของตัวเอง แล้ว Nuxt forward ต่อไปยัง NestJS เพราะแบบนี้ backend จึงไม่มีปัญหา CORS ใน dev และไม่ต้องเปิดพอร์ตออกมาใน Docker — ดู [Reverse proxy](../../../reverse-proxy)

สคริปต์ของ application — [package.json](./package-json)
