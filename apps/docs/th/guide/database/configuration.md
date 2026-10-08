# การตั้งค่า

ค่าของฐานข้อมูลอยู่ในไฟล์ `.env` สองไฟล์: ไฟล์ที่ root อ่านโดย Docker Compose ส่วน `apps/backend/.env` อ่านโดย Nest และ Prisma ตอนรันในเครื่อง

## `apps/backend/.env`

พารามิเตอร์การเชื่อมต่อ DB สำหรับ Prisma และตัวแอปพลิเคชัน:

```
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=template
```

## `.env` ที่ root

พารามิเตอร์ของ container ฐานข้อมูล — Docker Compose เป็นตัวอ่าน:

```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=template
POSTGRES_PORT=5432
```

user, password และชื่อ database ถูกเขียนซ้ำในสองไฟล์อย่างตั้งใจ: `.env` ที่ root ให้ Compose อ่าน ส่วน `apps/backend/.env` ให้ Nest อ่านตอนรันบน host ส่วน backend ที่รันใน container รับค่าชุดเดียวกันจาก `.env` ที่ root (ดู `environment` ใน `docker-compose.yml`) ค่าจึงไม่ตรงกันได้เฉพาะกรณีรันบน host เท่านั้น

## ถ้า port 5432 ถูกใช้อยู่

เปลี่ยนในสองไฟล์ — ให้เป็นค่าเดียวกัน:

```
.env                  POSTGRES_PORT=5435
apps/backend/.env     POSTGRES_PORT=5435
```

`.env` ที่ root กำหนดพอร์ตที่ container ฐานข้อมูลถูกเปิดออกมาบนเครื่อง host ส่วนไฟล์ที่สองจำเป็นเมื่อ backend รันผ่าน `pnpm dev`: มันบอก Nest และ Prisma ว่าให้เชื่อมต่อไปที่พอร์ตไหน

เมื่อ backend รันใน container เอง ไฟล์ที่สองจะไม่ถูกใช้เลย: compose ส่ง `postgres:5432` ให้ ซึ่งเป็นชื่อ service และพอร์ตภายใน network การ map พอร์ตออก host ไม่เกี่ยวข้องในกรณีนี้
