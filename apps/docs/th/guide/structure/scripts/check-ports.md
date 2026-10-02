# check-ports.mjs

Module ที่ใช้ร่วมกัน เก็บ utility เกี่ยวกับพอร์ต:

- `isPortFree(port)` — ตรวจสอบว่าพอร์ตว่างบน `127.0.0.1` หรือไม่
- `killPort(port)` — kill process ที่ครองพอร์ตอยู่ (ผ่าน `lsof`/`kill` เฉพาะ macOS/Linux)
- `requirePort(envPath, key)` — อ่านตัวแปรพอร์ตที่จำเป็นจาก `.env` ถ้าไม่มีหรือค่าไม่ถูกต้องจะโยน error ที่บอกชัดเจนว่าไฟล์ไหน
- `checkPorts(services)` — ตรวจสอบ list ของ service (`{ name, envPath, key }`) ถ้าชนกันจะแสดง dialog เสนอให้ kill process ที่ครองพอร์ตอยู่ หรือยกเลิกการรัน

[`predev.mjs`](./predev) และ [`predocker.mjs`](./predocker) ใช้ `checkPorts()` ตัวเดียวกัน แค่ส่ง list ของ service ต่างกันไป — logic ของ dialog และการ kill process ไม่ถูกเขียนซ้ำระหว่างสองสคริปต์

## การใช้งาน

ไม่มีคำสั่ง pnpm ของตัวเอง — สคริปต์อื่น import module นี้ไปใช้:

```js
import { checkPorts } from './check-ports.mjs'
import { BACKEND_ENV, FRONTEND_ENV } from './copy-env.mjs'

await checkPorts([
  { name: 'backend', envPath: BACKEND_ENV, key: 'PORT' },
  { name: 'frontend', envPath: FRONTEND_ENV, key: 'PORT' },
])
```

ถ้าพอร์ตว่างหมด ฟังก์ชันจะจบเงียบๆ ถ้าไม่ว่างจะแสดง dialog พร้อม list ของพอร์ตที่ถูกใช้อยู่

utility แต่ละตัวก็ใช้แยกได้:

```js
import { isPortFree, killPort, requirePort } from './check-ports.mjs'

const port = requirePort(BACKEND_ENV, 'PORT')   // 3100 หรือ error
if (!await isPortFree(port)) killPort(port)
```
