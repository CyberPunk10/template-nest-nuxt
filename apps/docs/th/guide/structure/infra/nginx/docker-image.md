# infra/nginx

service เดียวที่เปิดพอร์ตออกสู่ภายนอก image ไม่มี build ของตัวเอง: หยิบ `nginx:1.31-alpine` ที่พร้อมใช้มา แล้วใส่ไฟล์สองชุดเข้าไป

```dockerfile
COPY infra/nginx/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=docs /app/apps/docs/.vitepress/dist /srv/docs
```

ชุดแรกคือ template ของ config: `envsubst` จะแทนค่าตัวแปรตอน container start ชุดที่สองคือ static ของเอกสารที่ [apps/docs](../../apps/docs/docker-image) build ไว้

นอกจาก routing แล้ว proxy ยังดูแล cache ของ asset, security header, gzip และการ forward WebSocket คำอธิบาย config — [Reverse proxy](../../../reverse-proxy)

## build และตรวจสอบ

image ขึ้นกับ `docs-builder` ดังนั้น build ผ่าน compose สะดวกกว่า — compose จะจัดหา build context ให้เอง:

```bash
docker compose build nginx
docker compose up -d nginx
```

ตรวจว่า proxy ตอบไหม ใช้ [HEALTHCHECK](../../../docker/dockerfiles#healthcheck) ที่มีอยู่แล้ว:

```bash
docker inspect --format='{{json .State.Health}}' template-nest-nuxt-nginx-1
```

Compose ตั้งชื่อ container จากชื่อโปรเจกต์ — ดูชื่อจริงได้ด้วย `docker compose ps`

ดู config สุดท้ายหลังแทนค่าตัวแปร:

```bash
docker compose exec nginx cat /etc/nginx/conf.d/default.conf
```
