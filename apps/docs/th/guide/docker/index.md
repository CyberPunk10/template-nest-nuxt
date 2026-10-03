# Docker

โปรเจกต์นี้มี [Dockerfile](./dockerfiles) อิสระสี่ไฟล์ — ไฟล์ละหนึ่ง application (`backend`, `frontend`, `docs`) บวก reverse proxy (`nginx`) — และ [docker-compose.yml](../structure/docker-compose) หนึ่งไฟล์ที่ประกอบทั้งหมดเข้าเป็น stack

## จุดเข้าเดียว

เปิดออกสู่ภายนอกแค่ **พอร์ตเดียว** — `NGINX_HOST_PORT` (ค่าเริ่มต้น `80`) backend กับ frontend ประกาศพอร์ตด้วย `expose`: ภายใน Docker network เข้าถึงกันได้ แต่ไม่ได้ forward ออกมาที่ host เครื่อง traffic จากภายนอกทั้งหมดผ่าน reverse proxy

```
browser  →  nginx:80
  │
  ├── /dev/docs/  →  /srv/docs       static ของ VitePress
  ├── /api/docs   →  backend:3100    Swagger UI
  └── /*          →  frontend:3200   Nuxt SSR
                          │
                          └──  backend:3100   API ผ่าน BFF proxy
```

การ routing ทำงานอย่างไรและ proxy ทำอะไรอีกบ้าง — ดู [Reverse proxy](../reverse-proxy)

## เริ่มจากตรงไหน

- [Dockerfile](./dockerfiles) — image ถูกสร้างอย่างไร: stage, layer, เวอร์ชัน
- [docker compose](../structure/docker-compose) — ยก stack ขึ้นอย่างไร: ตัวแปร, network, เริ่มและหยุด

ถ้าแค่อยากรันโปรเจกต์ — [รันด้วย Docker](../getting-started/run-docker)
