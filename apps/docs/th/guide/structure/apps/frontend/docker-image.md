# apps/frontend

Build Nuxt เป็น `.output/` ตัว Nitro standalone server รวมทุกอย่างที่จำเป็นต่อการรันไว้แล้ว จึงไม่ต้องคัดลอก `node_modules` แยก

คำสั่งทั้งหมดด้านล่างรัน **จาก root ของ monorepo**

## เฉพาะ frontend

วิธีที่เร็วที่สุดในการตรวจว่า image build และ start ได้:

```bash
docker build -f apps/frontend/Dockerfile -t frontend-preview .

docker run -d -p 3200:3200 \
  -e PORT=3200 \
  -e NUXT_PUBLIC_API_BASE=/api/backend \
  --name frontend-preview frontend-preview
```

ตรวจสอบ:

```bash
curl http://localhost:3200/api/health
```

หรือเปิด: [http://localhost:3200](http://localhost:3200)

อีกทางคือดูผลของ [HEALTHCHECK](../../../docker/dockerfiles#healthcheck) ที่มีอยู่แล้ว — Docker เรียกเองเป็นระยะ:

```bash
docker inspect --format='{{json .State.Health}}' frontend-preview
```

เก็บกวาด:

```bash
docker stop frontend-preview
docker rm -f frontend-preview
docker rmi frontend-preview
```

::: warning
ถ้าไม่มี backend รันอยู่ที่ไหนเลย request ไป API จะไม่ผ่าน — แต่ตัว frontend เองยังทำงานได้ endpoint ของ frontend เอง (`/api/health`) ยังตอบตามปกติ

ถ้าอยากเห็นแอปทั้งหมด ให้รันคู่กับ backend — [ดูด้านล่าง](#จับคู่กับ-backend)
:::

## จับคู่กับ backend

Nuxt อ่านที่อยู่ของ backend จาก `NUXT_BACKEND_URL` — ใน `apps/frontend/.env` ค่าคือ `http://localhost:3100` ซึ่งถูกต้องสำหรับ `pnpm dev`: ทั้งสอง process รันอยู่บนเครื่องเดียวกัน

แต่ใน container ที่อยู่เดิมจะใช้ไม่ได้: `localhost` ใน container หมายถึงตัว container เอง ไม่ใช่เครื่องของคุณ ดังนั้น container ต้องต่อเข้า network เดียวกัน — ใน network นั้นจะหากันด้วยชื่อ และที่อยู่จะกลายเป็น `http://backend-preview:3100`

Build image, สร้าง network และ start ทั้งสอง container:

```bash
# image
docker build -f apps/backend/Dockerfile -t backend-preview .
docker build -f apps/frontend/Dockerfile -t frontend-preview .

# network
docker network create my-app

# backend — ไม่เปิดพอร์ตออกนอก มีแค่ frontend ที่ต้องใช้
docker run -d --network my-app --name backend-preview \
  -e PORT=3100 -e CORS_ORIGIN=http://localhost:3200 backend-preview

# frontend — เปิดพอร์ตออกมา ใช้ตรวจสอบผ่านทางนี้
docker run -d --network my-app -p 3200:3200 --name frontend-preview \
  -e PORT=3200 -e NUXT_BACKEND_URL=http://backend-preview:3100 frontend-preview
```

ตรวจทั้งสองเส้นทาง:

```bash
curl http://localhost:3200/api/health           # ตัว frontend เอง
curl http://localhost:3200/api/backend/health   # ผ่าน BFF proxy ไปยัง backend
```

หรือเปิด [http://localhost:3200](http://localhost:3200)

เก็บกวาดทั้งหมด รวมถึง network:

```bash
docker rm -f frontend-preview backend-preview
docker network rm my-app
docker rmi frontend-preview backend-preview
```

::: tip
งานประจำวันไม่ต้องทำแบบนี้ — [docker compose](../../docker-compose) รันคู่เดียวกันได้ด้วยคำสั่งเดียว พร้อม network และที่อยู่ที่ตั้งค่าไว้แล้ว
:::
