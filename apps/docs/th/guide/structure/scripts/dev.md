# dev.mjs

Wrapper ครอบ [`concurrently`](https://www.npmjs.com/package/concurrently) — รันสามคำสั่ง dev (`pnpm --filter backend dev`, `pnpm --filter frontend dev`, `pnpm --filter docs dev`) เป็น process เดียว มี output รวมกัน:

```js
concurrently(
  [
    { command: 'pnpm --filter backend dev', name: 'Nest' },
    { command: 'pnpm --filter frontend dev', name: 'Nuxt' },
    { command: 'pnpm --filter docs dev', name: 'Docs' },
  ],
  { prefixColors: ['#e0234e', '#ffca28', '#55a5d3'] },
)
```

ทำไมต้องใช้ `concurrently` โดยเฉพาะ ไม่ใช่สามคำสั่งพร้อมกันด้วย `&` ใน shell script:

- **Prefix มีชื่อและสี** — ทุกบรรทัดของ output จะมี tag `[Nest]`/`[Nuxt]`/`[Docs]` ในสีของตัวเอง (`prefixColors`) แทนที่จะเป็น stream ปนกันโดยไม่รู้ที่มา — ไม่งั้นจะบอกไม่ได้ว่า process ไหน log อะไรออกมา
- **Ctrl+C ครั้งเดียว** — `concurrently` จะ intercept signal แล้วหยุด process ลูกทั้งสามพร้อมกันอย่างถูกต้อง `&` เฉยๆ ใน shell ทำแบบนี้ไม่ได้: `Ctrl+C` จะ kill แค่ process ที่อยู่ foreground ส่วน backend/frontend/docs จะยังค้างอยู่ใน background แล้วครองพอร์ตต่อไป
- **ใช้ได้ข้าม platform** — ทำงานเหมือนกันทั้งใน bash/zsh และใน shell ของ Windows โดยไม่ต้องพึ่ง `&`/`wait` ที่พฤติกรรมต่างกันไปในแต่ละ shell

ถ้า process ใดใน 3 ตัวพัง โดย default `concurrently` จะไม่หยุดตัวอื่น (เปลี่ยนพฤติกรรมนี้ได้ผ่าน `killOthersOn` แต่ที่นี่ไม่ได้ตั้งไว้: การ develop backend ไม่ควรถูกขัดจังหวะแค่เพราะ docs มี build error ชั่วคราว)

ตอนเริ่ม `dev.mjs` จะบันทึก PID ของตัวเองลงใน `node_modules/.cache/dev-session/dev-nest-nuxt.pid` (module `dev-session.mjs`) และลบไฟล์เมื่อออก `pnpm dev` ครั้งถัดไปจะใช้ไฟล์นี้หยุดการรันนี้ทั้งหมดเมื่อพอร์ตชนกัน — ดูที่ [`check-ports.mjs`](./check-ports)

## การใช้งาน

```bash
pnpm dev
```

ก่อน start จะมี [`predev.mjs`](./predev) ทำงานอัตโนมัติ — เตรียม `.env` และตรวจพอร์ต

ถ้าต้องการ start แค่ application เดียวแทนที่จะเป็นสามตัว ใช้ filter โดยข้ามสคริปต์นี้:

```bash
pnpm --filter backend dev
pnpm --filter frontend dev
pnpm --filter @repo/docs dev
```
