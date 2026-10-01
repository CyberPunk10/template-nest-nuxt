# รันด้วย Docker

แอปพลิเคชันรันใน container หลังจุดเข้าเดียว — เป็น image ชุดเดียวกับที่จะขึ้น deploy

เป็น image แบบ production ไม่มี hot reload การแก้โค้ดจะเห็นผลก็ต่อเมื่อ build ใหม่เท่านั้น ถ้าจะทำงานกับโค้ดให้ใช้ [`pnpm dev`](/th/guide/getting-started/run-pnpm)

ก่อนรันครั้งแรก — [การเตรียมความพร้อม](/th/guide/getting-started/setup)

## สรุปคำสั่ง

| งาน                                      | คำสั่ง                                                   |
| ---------------------------------------- | ----------------------------------------------------- |
| รันครั้งแรก และรันหลังแก้โค้ด                   | `pnpm docker:up --build`                              |
| รันโดยไม่ build ใหม่ — image ถูก build ไว้แล้ว | `pnpm docker:up`                                      |
| รันแบบ background                         | `pnpm docker:up --build -d`                           |
| ดูว่ามีอะไรรันอยู่และสถานะเป็นอย่างไร            | `docker compose ps`                                   |
| ดู log ของ service แบบ real-time          | `docker compose logs -f backend`                      |
| หยุด                                      | `Ctrl+C` หรือ `docker compose down` ถ้ารันแบบ background |

flag ที่ใส่หลัง `pnpm docker:up` จะถูกส่งต่อให้ `docker compose up` ตามเดิม

::: tip
ถ้าไม่ใส่ `--build` compose จะใช้ image ที่ build ไว้แล้ว — โค้ดที่เพิ่งแก้จะไม่เข้าไปใน container ถ้าการแก้ไข "ไม่แสดงผล" ให้ build ใหม่ก่อน
:::

## เริ่มรัน

```bash
pnpm docker:up --build
```

`pnpm docker:up` ไม่ใช่แค่ alias ของ `docker compose up`: ก่อนเริ่ม [`predocker.mjs`](/th/guide/structure/scripts/predocker) จะทำงานก่อน สร้างไฟล์ `.env` ที่ขาด ตรวจสอบพอร์ตของ proxy และสร้าง Docker network ด้วยเหตุนี้คำสั่งจึงใช้ได้ทันทีหลัง clone

เบื้องหลังคือ `docker compose --profile app up`: service ของแอปกำกับด้วย profile `app` ส่วนฐานข้อมูลไม่มี profile และถูกยกขึ้นมาเสมอ — ดู [profile](/th/guide/structure/docker-compose#profile)

มีแค่ reverse proxy ที่หันออกสู่ภายนอก — ทุกอย่างเข้ามาที่พอร์ตเดียว (`NGINX_HOST_PORT` ค่าเริ่มต้น `80`):

- Application: [http://localhost/](http://localhost/)
- เอกสาร: [http://localhost/dev/docs/](http://localhost/dev/docs/)
- Swagger UI: [http://localhost/api/docs](http://localhost/api/docs) (ถ้าเปิดอยู่ — ดู `SWAGGER_ENABLED`)

backend กับ frontend ไม่ได้ใช้ host port ของตัวเอง: เข้าถึงจากภายนอกไม่ได้ ต้องผ่าน proxy เท่านั้น — [ทำไม](/th/guide/reverse-proxy#ทําไมพอร์ตของ-application-ถึงปิด)

::: warning
การเรียก Compose ตรงๆ โดยข้าม `pnpm docker:up` ก็ทำงานได้ แต่ต้องระบุ profile และไม่มีการเตรียมให้: `docker compose up` ที่ไม่มี `--profile app` จะยกขึ้นมาแค่ฐานข้อมูล ถ้าไม่มี `.env` ที่ root จะไม่ยอม start (`no port specified`) ถ้าไม่มี `apps/*/.env` ก็ไม่ยอมเช่นกัน (`env file ... not found`) และถ้าพอร์ตถูกใช้อยู่จะได้ Docker error ธรรมดา `address already in use` โดยไม่มี dialog
:::

## การหยุด

```bash
docker compose --profile app down
```

ที่นี่ก็ต้องมี profile ด้วย: ถ้าไม่ใส่ Compose จะมองไม่เห็น service ของแอป และจะปิดแค่ฐานข้อมูล ถ้าต้องการทำตรงกันข้าม — หยุดแอปแล้วให้ฐานข้อมูลยังรันอยู่:

```bash
docker compose --profile app stop nginx backend frontend
```

Network `template-nest-nuxt_app` จะยังอยู่ — มันเป็น `external` compose ไม่ได้สร้างมันขึ้นมา ลบเองถ้าไม่ต้องการแล้ว:

```bash
docker network rm template-nest-nuxt_app
```

::: warning
`docker compose down --remove-orphans` จะลบ container จาก compose ไฟล์ข้างเคียงที่ต่อกับ network เดียวกันด้วย — เช่น postgres บน branch ที่ใช้ฐานข้อมูล ข้อมูลยังอยู่ใน volume แต่ต้อง start container ขึ้นมาใหม่
:::

## รันทีละ service

build และรัน container เดียวโดยไม่ใช้ compose — เช่นเพื่อตรวจสอบ image ตัวใดตัวหนึ่ง คำสั่งของแต่ละ service อยู่ในหมวด [Docker](/th/guide/docker/)

## ต่อจากนี้

- [Docker](/th/guide/docker/) — image ถูกสร้างอย่างไร, `env_file` กับ `environment`, `HEALTHCHECK`, `USER node`
- [Reverse proxy](/th/guide/reverse-proxy) — การ routing, config ของ nginx, security header
