# Reverse proxy

ในโหมด Docker มี service เดียวที่หันออกสู่ภายนอก — nginx จาก `infra/nginx/` มันรับ traffic จากภายนอกทั้งหมดแล้วกระจายไปยัง application ใน network ภายใน

```
browser  →  nginx:80
  │
  ├── /dev/docs/  →  /srv/docs       static ของ VitePress
  ├── /api/docs   →  backend:3100    Swagger UI
  └── /*          →  frontend:3200   Nuxt SSR
                          │
                          └──→  backend:3100   API ผ่าน BFF proxy
```

ตัว nginx เองดูแลแค่สอง route: อ่านเอกสารจาก disk และ proxy Swagger ไปที่ backend ส่วนที่เหลือทั้งหมด รวมถึง request ไปที่ API (`/api/backend/*`) วิ่งไปที่ Nuxt — สำหรับ nginx มันแยกไม่ออกจาก request ธรรมดาที่ส่งไป frontend แล้ว Nuxt เป็นคน forward ต่อไปยัง backend เอง

## ทำไมพอร์ตของ application ถึงปิด

`backend` กับ `frontend` ประกาศพอร์ตด้วย `expose` ไม่ใช่ `ports` — เห็นได้ภายใน Docker network แต่ไม่ได้ forward ออกมาที่ host มีแค่ proxy ที่เปิดพอร์ตออกไป

```yaml
backend:
  expose:
    - '${BACKEND_INTERNAL_PORT}'
```

Application ที่อยู่หลัง proxy ไม่ควรเข้าถึงได้โดยข้าม proxy: ไม่งั้น security header, limit และ routing ที่ proxy ตั้งไว้ก็ไม่มีความหมาย ยิ่งเปิดพอร์ตน้อย attack surface ก็ยิ่งเล็ก — เป็นแนวปฏิบัติปกติของ production

ถ้าต้องการเรียก service ตรงๆ เช่นเพื่อดูว่าปัญหาอยู่ที่ proxy หรือที่ตัว application:

```bash
docker compose exec backend wget -qO- http://localhost:3100/health
```

## ทำไมเป็น `infra/` ไม่ใช่ `apps/`

Convention ของ monorepo กำหนดให้ `apps/` เป็นที่ของ application และ `packages/` เป็นที่ของ library ที่ใช้ซ้ำได้ ตัว proxy ไม่ใช่ทั้งสองอย่าง: ไม่มี `package.json` ไม่ได้อยู่ใน `pnpm install` และ workspace ไม่ได้ build มัน นี่คือ config ของ infrastructure จึงอยู่ใน `infra/` — โฟลเดอร์ที่ในอนาคตจะเก็บส่วนประกอบอื่นๆ ของการ deploy ได้ด้วย (monitoring, script deploy)

## config ทำอะไรบ้าง

`infra/nginx/nginx.conf.tpl` ไม่ได้ดูแลแค่ routing

**เอกสารเป็น static** `/dev/docs/` เสิร์ฟจาก disk ผ่าน `alias` ไม่ได้ proxy ไปยัง service แยก:

```nginx
location /dev/docs/ {
    alias /srv/docs/;
    try_files $uri $uri.html $uri/index.html =404;
    error_page 404 /dev/docs/404.html;
}
```

ใช้ `alias` ไม่ใช่ `root`: path บน disk (`/srv/docs/`) ไม่ตรงกับ URL (`/dev/docs/`) และ `alias` จะแทนที่ prefix ที่ match ในขณะที่ `root` จะเอาไปต่อท้าย path

ต้องมี `$uri.html` เพราะ VitePress build หน้าเป็นไฟล์แบบ `guide/x.html` แต่ลิงก์ถึงมันโดยไม่มีนามสกุล ส่วน `=404` ท้ายสุดจำเป็น: ถ้าไม่มี หน้าที่ไม่มีอยู่จริงจะถูกส่งกลับด้วย status **200** — เนื้อหาถูก แต่ status ผิด

**Cache ของ asset** ไฟล์ใน `/dev/docs/assets/` ถูก build โดยมี hash ในชื่อ: เนื้อหาหลัง URL แบบนั้นไม่มีวันเปลี่ยน browser จึงไม่ต้องมาตรวจซ้ำ:

```nginx
location /dev/docs/assets/ {
    alias /srv/docs/assets/;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

**Security header** — `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy` และ `server_tokens off` เพื่อไม่ให้เวอร์ชัน nginx โผล่ใน response และหน้า error

::: warning add_header ไม่ถูกสืบทอด
ถ้า `location` ที่ซ้อนอยู่ประกาศ `add_header` **ของตัวเอง** header จากระดับบนจะหยุดทำงานในนั้น — ทั้งหมด ไม่ใช่ทีละตัว ด้วยเหตุนี้ใน `/dev/docs/assets/` ที่มี `Cache-Control` จึงต้องเขียน security header ซ้ำอีกครั้ง นี่เป็นสาเหตุของช่องโหว่ที่พบบ่อย: header "มีอยู่ใน config" แต่ไม่ได้ถูกส่งในบาง route
:::

**WebSocket** header `Upgrade`/`Connection` ถูก forward ไปยัง Nuxt เผื่อวันหนึ่ง frontend ไปอยู่หลัง proxy ในโหมด dev แล้ว HMR ยังทำงาน:

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}
```

ต้องใช้ `map` เพราะเขียน `Connection: upgrade` เป็นค่าคงที่ไม่ได้ — มันจะทำให้ keep-alive ของ request HTTP ปกติพัง ตรงนี้ค่าจะถูกใส่เฉพาะตอนที่ client ส่ง header `Upgrade` มาจริงๆ

**Swagger** `proxy_pass` ของ `/api/docs` **ไม่มี** slash ปิดท้าย เพื่อให้ URI ถูกเก็บไว้ทั้งหมด Swagger UI โหลด asset ด้วย absolute path จาก `/api/docs/` การเขียน prefix ใหม่จะทำให้พัง

## สิ่งที่ตั้งใจไม่ใส่

**HSTS** — header นี้บังคับให้ browser ใช้ https ไปอีกนาน บนเว็บที่เป็น http จะทำให้เข้าไม่ได้เลย บรรทัดนี้จึง comment ไว้: เปิดใช้พร้อมกับ TLS

**Content-Security-Policy** — ชุด directive ที่ถูกต้องขึ้นอยู่กับว่า application ใช้ resource ภายนอกอะไรบ้าง policy ที่ผิดจะทำหน้าเว็บพังแบบเงียบๆ จึงยังไม่ได้ตั้ง: ให้ปรับตามแต่ละโปรเจกต์

**TLS** — ยังไม่มี certificate proxy ฟังเป็น HTTP ธรรมดา ในสถานการณ์ deploy ส่วนใหญ่ (managed platform, cloud load balancer, Kubernetes Ingress) TLS จะถูก terminate ที่ชั้นบน และ traffic ที่มาถึง proxy ถอดรหัสแล้ว ถ้า deploy บน VPS ของตัวเองจะต้องใช้ certbot หรือย้ายไป Caddy ที่มี HTTPS อัตโนมัติ

## Template กับ envsubst

`nginx.conf.tpl` ไม่ใช่ config ที่พร้อมใช้ entrypoint ที่มากับ image `nginx:alpine` จะรัน `*.template` ใน `/etc/nginx/templates/` ผ่าน `envsubst` แล้ววางผลลัพธ์ที่ `/etc/nginx/conf.d/` ก่อน nginx จะ start

จุดที่ต้องระวัง: `envsubst` แทนที่ `$ตัวแปร` **ทุกตัว** รวมถึงของ nginx เองอย่าง `$uri`, `$host`, `$http_upgrade` พวกนี้ไม่ได้ตั้งไว้ใน environment จึงจะกลายเป็นค่าว่างและทำให้ config พัง ป้องกันด้วย filter:

```dockerfile
ENV NGINX_ENVSUBST_FILTER='^(NGINX_INTERNAL_PORT|FRONTEND_INTERNAL_PORT|BACKEND_INTERNAL_PORT)$'
```

ถ้าเพิ่มตัวแปรใหม่ใน template ให้ใส่ที่นี่ด้วย ไม่งั้นมันจะค้างอยู่ใน config แบบดิบๆ

## การตรวจสอบ

ดู config สุดท้ายหลังการแทนที่ค่า:

```bash
docker compose exec nginx cat /etc/nginx/conf.d/default.conf
```

ตรวจ header ของ route ที่ต้องการ:

```bash
curl -sI http://localhost/dev/docs/
```

Log ของ access และ error:

```bash
docker compose logs nginx
```

## ในโหมด dev ไม่มี proxy

`pnpm dev` รัน 3 process บนพอร์ตของตัวเอง ไม่มี nginx นี่เป็นความตั้งใจ: HMR ของ Vite เปิด WebSocket ค้างไว้ และการวาง proxy ไว้ข้างหน้าต้องตั้งค่าเพิ่ม (`server.hmr.clientPort`) ซึ่งทำให้ workflow ที่ใช้บ่อยที่สุดยุ่งยากขึ้นเพียงเพื่อให้เหมือน production

ผลในทางปฏิบัติคือ address ใน dev กับ Docker ต่างกัน จึงเก็บไว้ใน environment variable:

| อะไร        | dev                               | Docker      |
| ----------- | --------------------------------- | ----------- |
| Application | `http://localhost:3200`           | `http://localhost/` |
| เอกสาร      | `http://localhost:5173/dev/docs/` | `http://localhost/dev/docs/` |
| Swagger     | `http://localhost:3100/api/docs`  | `http://localhost/api/docs` |

แต่ path ตรงกัน — ต่างแค่ host กับพอร์ต ส่วน `base` ของเอกสารกำหนดตายตัวเป็น `/dev/docs/` เพื่อให้ตรงกันด้วย
