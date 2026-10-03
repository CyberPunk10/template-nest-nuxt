# apps/backend

build NestJS ไปที่ `dist/` แล้ว deploy ผ่าน `pnpm deploy --prod` — image สุดท้ายมีแค่ `node_modules` ของ production กับโค้ดที่ compile แล้ว ไม่มี `pnpm` และไม่มี source

รันคำสั่งทั้งหมดด้านล่าง **จาก root ของ monorepo** (ไม่ต้อง cd เข้า /apps/backend)

build image:

```bash
docker build -f apps/backend/Dockerfile -t backend-preview .
```

## migration ตอน start

image เริ่มทำงานผ่าน `docker-entrypoint.sh` ไม่ใช่คำสั่งตรง ๆ: script จะรัน migration ก่อน แล้วจึงส่งต่อให้แอป

```sh
npx prisma migrate deploy
exec "$@"          # → node dist/main
```

ใช้ `migrate deploy` ไม่ใช่ `migrate dev`: จะใช้เฉพาะ migration ที่ค้างอยู่ ไม่มีคำถามแบบ interactive และไม่เสี่ยงสร้าง database ใหม่ จึงปลอดภัยทุกครั้งที่ restart container

จากตรงนี้จึงตามมาว่า ถ้าไม่มีฐานข้อมูลให้เชื่อมต่อ container จะไม่ start — มันจะล้มตอน migration ด้วยเหตุผลเดียวกัน `prisma/` และ `prisma.config.ts` จึงถูกคัดลอกเข้า image สุดท้าย

## การรันเดี่ยว ๆ

ยกฐานข้อมูลก่อน แล้วต่อ container เข้ากับ network เดียวกัน:

```bash
pnpm db:up
```

```bash
docker run -d -p 3100:3100 \
  --network template-nest-nuxt_app \
  -e PORT=3100 \
  -e CORS_ORIGIN=http://localhost:3200 \
  -e POSTGRES_HOST=postgres \
  -e POSTGRES_PORT=5432 \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=template \
  -e JWT_SECRET=change-me-to-a-random-string-of-at-least-32-characters \
  -e REFRESH_TOKEN_SECRET=change-me-to-another-random-string-of-at-least-32-chars \
  --name backend-preview backend-preview
```

`POSTGRES_HOST=postgres` คือชื่อ service ภายใน network: สำหรับ container แล้ว `localhost` หมายถึงตัวมันเอง ส่วน secret จำเป็นต้องมี ถ้าไม่มี Nest จะไม่ผ่านการตรวจ env และล้มตอน start

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
