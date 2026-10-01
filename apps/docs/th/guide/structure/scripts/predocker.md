# predocker.mjs

รันอัตโนมัติก่อน `pnpm docker:up` — ผ่าน npm `pre*` convention

ทำสามอย่าง:

1. **คัดลอก `.env.example` → `.env`** ทั้งสี่ไฟล์พร้อมกัน (root, `apps/backend`, `apps/frontend`, `apps/docs`) — ผ่าน `copyEnvFiles()` ที่ใช้ร่วมกันจาก [`copy-env.mjs`](/th/guide/structure/scripts/copy-env)
2. **ตรวจสอบพอร์ตและแก้ปัญหาชนกัน** — ผ่าน `checkPorts()` ที่ใช้ร่วมกันจาก [`check-ports.mjs`](/th/guide/structure/scripts/check-ports) ถ้าชนกันจะเสนอ dialog: kill process ที่ครองพอร์ตอยู่ หรือยกเลิกการรัน
3. **สร้าง Docker network** ถ้ายังไม่มี — ผ่าน [`ensure-network.mjs`](/th/guide/structure/scripts/ensure-network) ชื่อ network มาจาก `COMPOSE_NETWORK_NAME` ในไฟล์ `.env` ที่ root — แหล่งเดียวกับที่ `docker-compose.yml` อ่าน การรันซ้ำจะไม่ทำอะไร

ตรวจเพียงพอร์ตเดียว — `NGINX_HOST_PORT` จาก `.env` ที่ root ส่วน backend และ frontend ไม่ได้ใช้ host port เลย เพราะอยู่ใน network ภายใน ส่วนพอร์ตของฐานข้อมูลถูกเปิดออกภายนอกก็จริง แต่ไม่อยู่ในการตรวจ — Docker เป็นผู้ครอง และถ้าฐานข้อมูลรันอยู่แล้วจะกลายเป็นการชนกันแบบหลอก

::: warning
สิ่งนี้จะทำงานแค่ก่อน `pnpm docker:up` เท่านั้น ไม่ใช่ก่อน `docker compose up` ตรงๆ ถ้าเรียก `docker compose up` ตรงๆ โดยไม่ผ่าน npm wrapper บน clone ใหม่ที่ยังไม่มี `.env` — คำสั่งจะปฏิเสธไม่ start: ตัวแปรพอร์ตใน `docker-compose.yml` ไม่มีค่า default (`no port specified` ถ้าไม่มี `.env` ที่ root) และ `env_file` สำหรับ `apps/*/.env` จำเป็นต้องมีโดย default (`env file ... not found`) และจะไม่มีการตรวจสอบพอร์ตชนกันแบบชัดเจนด้วย — ถ้า host port ถูกใช้อยู่ จะได้ Docker error ธรรมดา `address already in use` โดยไม่มี dialog เสนอให้ปล่อยพอร์ต สร้าง `.env` ที่ขาดหายไว้ล่วงหน้าโดยไม่ต้องรันอะไร: `pnpm env:copy`
:::

ตัวคู่กันสำหรับ develop ในเครื่อง — [`predev.mjs`](/th/guide/structure/scripts/predev)

## สิ่งที่แสดงผล

แต่ละขั้นตอนจะพิมพ์ผลลัพธ์หนึ่งบรรทัด:

```
[predocker.mjs] ✓ .env: files in place
[predocker.mjs] ✓ ports: nginx 80
[predocker.mjs] ✓ network: template-nest-nuxt_app created
```

ถ้าขั้นตอนไหนไม่สำเร็จ — จะมีบรรทัดที่มี ✗ พร้อมชื่อขั้นตอน และการเตรียมการจะหยุดตรงนั้น:

```
[predocker.mjs] ✗ network: Command failed: docker network create template-nest-nuxt_app
```

| ขั้นตอน     | สิ่งที่ต้องตรวจ                                 | ทำซ้ำแยก                                          |
| --------- | ------------------------------------------ | ---------------------------------------------- |
| `.env`    | มี `.env.example` อยู่ข้าง `.env` ที่ต้องการหรือไม่ | `pnpm env:copy`                                |
| `ports`   | ค่า `NGINX_HOST_PORT` ใน `.env` ที่ root      | `pnpm predocker:up`                            |
| `network` | Docker ทำงานอยู่หรือไม่                         | `docker network create template-nest-nuxt_app` |

## การใช้งาน

รันเองอัตโนมัติ — ไม่ต้องเรียกแยก:

```bash
pnpm docker:up
```

npm เห็น script `predocker:up` แล้วรันก่อน `docker:up` ถ้าต้องการรันแค่ขั้นเตรียมโดยไม่ start container:

```bash
pnpm predocker:up
```
