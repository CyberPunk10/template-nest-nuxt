# package.json

Manifest ที่ root ของ monorepo สคริปต์ในนี้ควบคุมทั้ง repository: `pnpm -r ...` ครอบทุก workspace, Docker, การเตรียม `.env`

| สคริปต์            | คำสั่ง                                     | ทำอะไร                                                                     |
| ---------------- | --------------------------------------- | ------------------------------------------------------------------------- |
| `env:copy`       | `node scripts/copy-env-cli.mjs`         | สร้าง `.env` ที่ขาดหายทั้งหมดจาก `.env.example` — ไม่รันหรือตรวจสอบอะไรอย่างอื่น     |
| `env:copy:force` | `node scripts/copy-env-cli.mjs --force` | เหมือนกัน แต่เขียนทับไฟล์ `.env` ที่มีอยู่ — การแก้ในเครื่องจะหายไป                     |
| `predev`         | `node scripts/predev.mjs`               | รันอัตโนมัติก่อน `dev` (npm `pre*` convention)                                 |
| `dev`            | `node scripts/dev.mjs`                  | เปิด backend, frontend และ docs พร้อมกัน (ผ่าน `concurrently`)                |
| `db:up`          | `node scripts/db.mjs up`                | เปิด container ของฐานข้อมูลและรอ healthcheck                                 |
| `db:down`        | `node scripts/db.mjs down`              | หยุด container ของฐานข้อมูล ข้อมูลยังอยู่ใน volume                                |
| `db:generate`    | `node scripts/db.mjs generate`          | generate client ของ Prisma — จำเป็นหลังแก้ schema; หลัง `pnpm install` จะรันเอง |
| `db:migrate`     | `node scripts/db.mjs migrate`           | รัน migration ที่ยังไม่มีใน DB                                                  |
| `predocker:up`   | `node scripts/predocker.mjs`            | รันอัตโนมัติก่อน `docker:up`                                                   |
| `docker:up`      | `docker compose --profile app up`       | เปิดทั้ง stack ใน Docker: ฐานข้อมูล, backend, frontend, nginx                  |
| `build`          | `pnpm -r build`                         | Build workspace package ทั้งหมด (รัน `build` ใน `apps/*` แต่ละตัว)             |
| `test`           | `pnpm -r test`                          | Unit test ทุก workspace (แพ็กเกจที่ไม่มี `test` จะถูกข้าม)                        |
| `test:e2e`       | `pnpm -r test:e2e`                      | E2E test — ต้องรันแอปทั้งตัว จึงแยกออกจาก `test`                                |
| `lint`           | `pnpm -r lint`                          | รัน linter กับ workspace package ทั้งหมด                                      |
| `type-check`     | `pnpm -r type-check`                    | ตรวจสอบ type ของ workspace package ทั้งหมด                                  |
| `reinstall`      | `node scripts/reinstall.mjs`            | ลบ `node_modules`/`pnpm-lock.yaml` แล้วติดตั้ง dependency ใหม่ทั้งหมด            |
| `deps:sync`      | `pnpm update -r`                        | ปรับช่วงเวอร์ชันใน `package.json` ให้ตรงกับที่ติดตั้งจริง                             |
| `prepare`        | `husky`                                 | ตั้งค่า git hook (เรียกอัตโนมัติตอน `pnpm install`)                              |

สคริปต์เหล่านี้ไม่ทับกับสคริปต์ของ application: ตัวที่ root ทำงานกับทั้ง monorepo ส่วน per-app ทำงานเฉพาะใน workspace ของตัวเอง และถูกเรียกผ่าน filter (`pnpm --filter backend dev`) หรือโดยอ้อมจากคำสั่งที่ root

คำสั่งส่วนใหญ่มี [Node script](./scripts/) ใน `scripts/` อยู่เบื้องหลัง

## เวอร์ชันของเครื่องมือ

```json
"packageManager": "pnpm@11.27.1",
"engines": {
  "node": ">=24",
  "pnpm": ">=11",
  "npm": "please-use-pnpm"
}
```

`packageManager` ตรึงเวอร์ชัน pnpm ผ่าน Corepack ส่วน `engines` ร่วมกับ `engine-strict=true` ใน `.npmrc` ป้องกันการติดตั้ง dependency บน Node เวอร์ชันที่ไม่รองรับ — [pnpm และ Corepack](../pnpm)
