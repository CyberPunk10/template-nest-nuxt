# log.mjs

ใส่ prefix ให้กับข้อความของ script ใน `scripts/` เอง

```js
import { createLogger } from './log.mjs'

const log = createLogger('predev.mjs')

log.ok('ports: backend 3100')      // [predev.mjs] ✓ ports: backend 3100
log.error('ports: PORT=abc ...')   // [predev.mjs] ✗ ports: PORT=abc ...
log.log('Ports checked')           // [predev.mjs] Ports checked
```

`ok` ทำเครื่องหมายขั้นตอนที่สำเร็จ (✓) ส่วน `error` คือ error (✗) เครื่องหมายเหล่านี้มองเห็นได้แม้ไม่มีสี — ใน log ของ CI และเมื่อตั้ง `NO_COLOR`

## ทำไมต้องมี

script เรียก `docker compose`, `pnpm install` และ `concurrently` ซึ่ง output ของคำสั่งเหล่านั้นออกมาที่ terminal เดียวกัน ถ้าไม่มีเครื่องหมายกำกับ บรรทัดของเราเองจะหายไปในกระแสรวมนั้น

รูปแบบนี้ตั้งใจให้เหมือน prefix ของ `concurrently` (`[Nest]`, `[Nuxt]`) แต่ใช้สีของตัวเอง — สีม่วงแดงสำหรับข้อความทั่วไป สีแดงสำหรับ error เครื่องหมาย ✓ เป็นสีเขียว ส่วนสีแดง เหลือง และฟ้าถูก `concurrently` ใช้ไปแล้ว ดู [dev.mjs](./dev)

## เมื่อไหร่ที่ไม่มีสี

escape code จะถูกส่งออกเฉพาะเมื่อ output ไปที่ terminal เท่านั้น ถ้า redirect ลงไฟล์หรือรันใน CI มันจะกลายเป็นขยะแบบ `ESC[35m` จึงมีการตรวจ `process.stdout.isTTY` ส่วนตัวแปร `NO_COLOR` ใช้ปิดสีแบบบังคับ ซึ่งเป็นข้อตกลงที่ใช้กันทั่วไป

```bash
pnpm db:up                 # prefix มีสี
pnpm db:up > log.txt       # ไม่มี escape code
NO_COLOR=1 pnpm db:up      # แบบเดียวกันแต่บังคับ
```

