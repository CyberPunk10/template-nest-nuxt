# apps/

แอปพลิเคชัน 3 ตัวที่เป็นอิสระต่อกัน แต่ละตัวมี `package.json`, `.env` และ `Dockerfile` ของตัวเอง — ไม่รู้จักกันเลยนอกจากที่อยู่ HTTP

```
apps/
├── backend/     NestJS — REST API
├── frontend/    Nuxt 4 — UI และ BFF proxy
└── docs/        VitePress — เอกสารชุดนี้
```

| แอปพลิเคชัน | พอร์ตใน dev | หน้าที่ |
| --- | --- | --- |
| [backend](./backend/) | `3100` | API, Swagger, validate สภาพแวดล้อม |
| [frontend](./frontend/) | `3200` | UI แบบ SSR, proxy request ไป API |
| [docs](./docs/) | `5173` | เว็บ static ใน Docker ถูก build เข้า image ของ nginx |

Backend ไม่รู้จัก frontend เลย — การเชื่อมต่อเป็นทางเดียวและผ่าน HTTP เท่านั้น Frontend ขึ้นกับ `@repo/shared` และ `@repo/ui` ส่วน backend ขึ้นกับ `@repo/shared` อย่างเดียว

ที่อยู่ของเพื่อนบ้านขึ้นกับวิธี start ตอน `pnpm dev` ทั้งสาม process อยู่บนเครื่องเดียวกันและหากันด้วยพอร์ต: Nuxt เรียก `http://localhost:3100` ส่วนใน Docker แต่ละตัวอยู่ใน container ของตัวเอง ซึ่ง `localhost` คือตัวมันเอง จึงเรียกด้วยชื่อ service: `http://backend:3100` การสลับค่านี้ทำโดย `environment` ใน `docker-compose.yml` โค้ดเองไม่รู้เรื่องนี้เลย

ที่เปิดออกสู่ภายนอกมีพอร์ตเดียวคือของ reverse proxy — [Reverse proxy](../../reverse-proxy)
