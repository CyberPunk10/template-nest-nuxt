# infra/nginx

Reverse proxy — service เดียวที่เปิดพอร์ตออกสู่ภายนอก

```
infra/nginx/
├── nginx.conf.template     template ของ config: route, header, gzip
└── Dockerfile              nginx พร้อมเอกสารที่ build แล้ว
```

## ทำไมเป็น template ไม่ใช่ conf ธรรมดา

นามสกุล `.template` เป็น convention ของ image nginx อย่างเป็นทางการ: ไฟล์ใน `/etc/nginx/templates/` จะผ่าน `envsubst` ตอน container start และ `${BACKEND_INTERNAL_PORT}` จะถูกแทนด้วยค่าจริง

ไม่ใช่ทุกตัวแปรที่จะถูกแทน: ใน Dockerfile ตั้ง `NGINX_ENVSUBST_FILTER` เป็น allow-list ไว้ ถ้าไม่มี `envsubst` จะไปแตะตัวแปรของ nginx เอง (`$host`, `$uri`, `$http_upgrade`) แล้วเปลี่ยนเป็น string ว่าง

## เอกสารอยู่ใน image

Dockerfile คัดลอก static ที่ VitePress build แล้วจาก image `docs-builder` ไปไว้ที่ `/srv/docs` ไม่มี container ของเอกสารแยกต่างหาก — nginx เสิร์ฟจากดิสก์เลย

รายละเอียด route — [Reverse proxy](../../../reverse-proxy), การ build image — [Dockerfile](./docker-image)
