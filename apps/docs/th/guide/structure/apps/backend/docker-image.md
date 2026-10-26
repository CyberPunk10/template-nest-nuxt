# apps/backend

build NestJS ไปที่ `dist/` แล้ว deploy ผ่าน `pnpm deploy --prod` — image สุดท้ายมีแค่ `node_modules` ของ production กับโค้ดที่ compile แล้ว ไม่มี `pnpm` และไม่มี source

รันคำสั่งทั้งหมดด้านล่าง **จาก root ของ monorepo** (ไม่ต้อง cd เข้า /apps/backend)

build image:

```bash
docker build -f apps/backend/Dockerfile -t backend-preview .
```

รัน container ที่พอร์ต 3100:

```bash
docker run -d -p 3100:3100 \
  -e PORT=3100 \
  -e CORS_ORIGIN=http://localhost:3200 \
  -e JWT_SECRET=change-me-to-a-random-string-of-at-least-32-characters \
  -e REFRESH_TOKEN_SECRET=change-me-to-another-random-string-of-at-least-32-chars \
  --name backend-preview backend-preview
```

secret จำเป็นต้องมี: ถ้าไม่มี Nest จะไม่ผ่านการตรวจ env และล้มตอน start

ตรวจสอบ:

```bash
curl http://localhost:3100/health
```

หรือผ่าน [HEALTHCHECK](../../../docker/dockerfiles#healthcheck) ที่มีอยู่แล้ว — Docker เรียกเองเป็นระยะ เราแค่ดูผลลัพธ์:

```bash
docker inspect --format='{{json .State.Health}}' backend-preview
```

หยุดและลบทิ้ง:

```bash
docker stop backend-preview
docker rm backend-preview
docker rmi backend-preview
```
