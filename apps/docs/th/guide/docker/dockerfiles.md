# Dockerfile

`Dockerfile` อิสระสี่ไฟล์ — ไฟล์ละหนึ่ง application บวก reverse proxy สร้างต่างกันเพราะแก้ปัญหาคนละอย่าง:

| ไฟล์                        | ทำอะไร                                                             |
| -------------------------- | ----------------------------------------------------------------- |
| `apps/backend/Dockerfile`  | build NestJS, image สุดท้ายมีแค่ `dist/` กับ dependency ของ production |
| `apps/frontend/Dockerfile` | build Nuxt, image สุดท้ายคือ `.output/` พร้อม Nitro server            |
| `apps/docs/Dockerfile`     | build static ของ VitePress, ไม่มีอะไรให้รัน                           |
| `infra/nginx/Dockerfile`   | หยิบ `nginx:alpine` มา แล้วใส่ config กับไฟล์เอกสาร                    |

**Multi-stage** สำหรับ backend และ frontend: stage `builder` ติดตั้ง dependency และสร้าง production artifact ส่วน stage `runner` คัดลอกเฉพาะผลลัพธ์ออกมา image สุดท้ายจึงเบา — ไม่มี source ไม่มี dev dependency

**Stage เดียว** สำหรับ docs และ nginx: ตัวแรกไม่มีอะไรให้รัน (proxy ไปหยิบผลลัพธ์ไป) ตัวที่สองไม่มีอะไรให้ build (มี image พร้อมอยู่แล้ว)

คำสั่ง build ทั้งหมดรัน **จาก root ของ monorepo** — context คือทั้ง repo เสมอ เพราะ image ต้องใช้ lockfile ร่วมและ workspace package

## ลำดับของ layer

ขั้นตอนใน `builder` เป็นแบบนี้:

```
COPY manifest  →  pnpm install --frozen-lockfile  →  COPY source  →  build
```

ลำดับนี้ไม่ได้บังเอิญ: Docker cache ทีละ layer ดังนั้นเมื่อ source เปลี่ยน `install` จะมาจาก cache มันจะรันใหม่ก็ต่อเมื่อ `package.json` หรือ lockfile เปลี่ยนเท่านั้น

backend จะคัดลอก `prisma/schema.prisma` และ `prisma.config.ts` มาพร้อมกับ manifest: client ของ Prisma ถูก generate โดย `postinstall` ระหว่าง `install` ดังนั้นของ backend `install` จะรันใหม่เมื่อแก้ schema ด้วย

## อะไรอยู่ใน image สุดท้าย

**Backend** รัน `pnpm deploy --prod /deploy` เพิ่ม — คัดลอกเฉพาะ dependency ของ `@repo/backend` ออกจาก `node_modules` โดยไม่เอา package อื่นของ monorepo มาด้วย runner จึงได้ `node_modules` ที่สะอาดและแบน:

```
/app/
├── node_modules/     ← เฉพาะ dependency ของ @repo/backend (pnpm deploy)
└── dist/
    └── main.js       ← โค้ดที่ compile แล้ว

CMD: node dist/main
```

**Frontend** ไม่ทำแบบนั้น — Nuxt แพ็ค dependency ทั้งหมดเข้า `.output` ตอน build:

```
/app/
└── .output/
    ├── server/index.mjs   ← จุดเริ่มต้น (Node.js server)
    └── public/            ← static (JS, CSS, asset)

CMD: node .output/server/index.mjs
```

runner ไม่ต้องมี `node_modules` เลย — คัดลอก `.output` ไปที่ server แล้วรันได้โดยไม่ต้องมี pnpm

**Reverse proxy** ได้รับแค่ไฟล์ ส่วน process นั้น image `nginx:alpine` เป็นคนเริ่มเอง:

```
/srv/docs/            ← static ของ VitePress ที่มาจาก docs-builder
/etc/nginx/templates/ ← template ของ config, envsubst จะจัดการตอน start
```

## เวอร์ชันของ base image

Base image ถูก pin ไว้ที่ระดับ minor:

```dockerfile
FROM node:24.18-alpine
FROM nginx:1.31-alpine
```

ไม่ใช้ tag แบบลอย `node:24-alpine`/`nginx:alpine` — ไม่งั้น build คนละวันจะได้ผลลัพธ์ต่างกัน และไม่ pin ด้วย digest แบบตายตัว: security patch จะไม่มาจนกว่าจะมีคนอัปเดต hash ด้วยมือ tag ระดับ minor เป็นทางสายกลาง: เวอร์ชันคงที่ แต่ patch ยังมาเอง

## ผู้ใช้แบบไม่มีสิทธิ์พิเศษ

stage `runner` ของ `backend` และ `frontend` รันด้วย `USER node` — ผู้ใช้แบบ unprivileged ที่มีอยู่แล้วใน image `node:*-alpine`:

```dockerfile
FROM node:24.18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
USER node
COPY --from=builder --chown=node:node /deploy/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/apps/backend/dist ./dist
```

ทำไม: ถ้าไม่ทำ process ภายใน container จะรันด้วย `root` ถ้ามีคนเจอช่องโหว่ RCE (remote code execution) ใน application ผู้โจมตีจะได้ root ใน container ทันที — ซึ่งขยาย blast radius: ทำ container escape หรือใช้ประโยชน์จาก volume ที่ mount ไว้ได้ง่ายขึ้น `USER node` ลดความเสี่ยงนี้โดยไม่มีต้นทุนอะไรเลย

`--chown=node:node` ใน `COPY` จำเป็น: `WORKDIR /app` ถูกสร้างด้วย `root` **ก่อน** `USER node` และถ้าไม่มี `--chown` process ที่รันด้วย `node` จะอ่านไฟล์ไม่ได้

`nginx` ไม่ต้องมี `USER` แยก — image รัน worker process ด้วยผู้ใช้ `nginx` แบบ unprivileged อยู่แล้ว

## HEALTHCHECK

`Dockerfile` ทุกไฟล์ที่มี process รันอยู่จะมี `HEALTHCHECK` — ถ้าไม่มี Docker หรือ orchestrator (Kubernetes readiness probe, Docker Swarm, `depends_on: condition: service_healthy`) จะแยกไม่ออกระหว่าง «process เริ่มแล้ว» กับ «application ตอบ request ได้จริง»

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://127.0.0.1:${PORT}/health || exit 1
```

| Service  | path ที่ตรวจ                                 | Interval / start-period |
| -------- | ------------------------------------------ | ----------------------- |
| backend  | `http://127.0.0.1:${PORT}/health`          | `5s` / `60s`            |
| frontend | `http://127.0.0.1:${PORT}/api/health`      | `30s` / `5s`            |
| nginx    | `http://127.0.0.1:${NGINX_INTERNAL_PORT}/` | `30s` / `5s`            |

backend ตรวจถี่กว่า — 5 วินาทีแทน 30: `depends_on: service_healthy` ของ frontend รอ healthcheck ตัวนี้อยู่ ถ้าตรวจห่างกว่านี้การ start ทั้ง stack จะยืดออกไปอีกครึ่งนาที ส่วน `start-period` 60 วินาทีมีไว้เพราะ [มีการรัน migration](/th/guide/structure/apps/backend/docker-image#migration-ตอน-start) ก่อนที่แอปจะเริ่ม

`docs-builder` ไม่มี healthcheck — ไม่มีอะไรให้ตรวจ image จบที่ stage build

`${PORT}` ใน `HEALTHCHECK CMD` ไม่ใช่การแทนค่าตอน build แต่เป็น shell variable ธรรมดา: อ่านจากค่าจริงภายใน container ณ ตอนที่ตรวจ

เลือกใช้ `wget` เพราะมีอยู่แล้วใน base image — ไม่ต้องติดตั้ง `curl` เพิ่ม

::: tip
การเขียน `127.0.0.1` ตรงๆ แทน `localhost` ไม่ใช่เรื่องสไตล์ ภายใน container `/etc/hosts` resolve `localhost` เป็นทั้ง `127.0.0.1` และ `::1` และ `wget` อาจลอง `::1` ก่อน ถ้า service ฟังเฉพาะ IPv4 (ซึ่งเป็นพฤติกรรมปกติของ nginx และ Node) การลองนั้นจะได้ `Connection refused` แล้ว healthcheck จะกลายเป็น `unhealthy` ทั้งที่ service ยังทำงานอยู่ ทดสอบมาแล้วจริง
:::

ตรวจสถานะของ container ที่รันอยู่:

```bash
docker inspect --format='{{json .State.Health}}' backend-preview
```
