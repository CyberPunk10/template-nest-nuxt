# versions.test.mjs

Test ที่ตรวจว่าเวอร์ชัน Node ถูกเขียนไว้ตรงกันทุกที่ในโปรเจกต์ รันเป็นอันดับแรกใน `pnpm test`

| ที่ | ตรวจอะไร |
|---|---|
| `.nvmrc` | เวอร์ชันที่แน่นอนแบบ `24.22.1` — ใช้โดย `nvm use`, CI และการตรวจใน [`predev.mjs`](./predev) |
| `engines.node` ใน `package.json` ที่ root | ต้องเป็น `>=` เวอร์ชันจาก `.nvmrc` พอดี |
| `FROM node:…` ใน Dockerfile ของ `apps/*` และ `infra/*` | major และ minor เดียวกับ `.nvmrc`: `node:24.22-alpine` สำหรับ `24.22.1` |

## ทำไมต้องมี

ตอนอัปเดต Node ง่ายที่จะแก้ `.nvmrc` แล้วลืม Dockerfile: ในเครื่องทุกอย่างทำงานบนเวอร์ชันใหม่ แต่ image ของ Docker ยังเป็นเวอร์ชันเก่า test จะล้มและบอกชื่อไฟล์:

```
apps/frontend/Dockerfile: node:24.21-alpine, but .nvmrc has 24.22.1
```

## การใช้งาน

```bash
pnpm test                                # พร้อมกับ test อื่น ๆ
node --test scripts/versions.test.mjs    # เฉพาะการตรวจนี้
```
