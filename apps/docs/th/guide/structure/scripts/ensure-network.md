# ensure-network.mjs

export ฟังก์ชันเดียว — `ensureNetwork()` อ่าน `COMPOSE_NETWORK_NAME` จาก `.env` ที่ root แล้วสร้าง Docker network ถ้ายังไม่มี การเรียกซ้ำจะไม่ทำอะไรและคืนค่า `created: false`

ตัวแปรนี้จำเป็นต้องมี: ถ้าไม่มี ฟังก์ชันจะ throw error:

```
WARN[0000] The "COMPOSE_NETWORK_NAME" variable is not set. Defaulting to a blank string.
network  declared as external, but could not be found.
```

เรียกจาก [`predocker.mjs`](/th/guide/structure/scripts/predocker) — ก่อน `pnpm docker:up`

## การใช้งาน

ไม่มีคำสั่ง pnpm ของตัวเอง — ถูกเรียกจาก [`predocker.mjs`](/th/guide/structure/scripts/predocker) จึงทำงานตอน `pnpm docker:up`:

```js
import { ensureNetwork } from './ensure-network.mjs'

const { name, created } = ensureNetwork()   // created: true — สร้าง network แล้ว, false — มีอยู่แล้ว
```

ทำเองด้วยมือ ถ้าต้องการ start stack ด้วย `docker compose up` ตรงๆ:

```bash
docker network create template-nest-nuxt_app
```
