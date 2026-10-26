# apps/backend

แอปพลิเคชัน NestJS จุดเริ่มต้นคือ `src/main.ts`

```
apps/backend/
├── src/
│   ├── common/
│   │   ├── filters/            exception filter ระดับ global
│   │   └── transforms/         transformer สำหรับ DTO
│   ├── config/
│   │   └── env.validation.ts   Joi schema ของตัวแปรสภาพแวดล้อม
│   ├── modules/
│   │   ├── auth/               สมัคร, เข้าสู่ระบบ, refresh, session
│   │   ├── tasks/              CRUD ของ task
│   │   └── users/              ผู้ใช้
│   ├── app.controller.ts       /, /health, /dev/config
│   ├── app.module.ts           root module
│   ├── app.service.ts
│   ├── setup-app.ts            การตั้งค่า global ที่ใช้ร่วมกันระหว่าง main กับ e2e
│   └── main.ts                 bootstrap: CORS, Swagger, ValidationPipe
├── test/                       e2e test: default/ กับ throttle/ แต่ละชุดมี config ของตัวเอง
├── nest-cli.json
├── tsconfig.json               สำหรับ IDE และ type-check (noEmit)
└── tsconfig.build.json         สำหรับ nest build — ให้ dist/ ที่สะอาด
```

## Convention ของ Nest

Nest ไม่ได้บังคับว่าไฟล์ต้องอยู่ที่ไหน — ทุกอย่างเชื่อมกันผ่าน decorator และ module การจัดวางที่ใช้ในโปรเจกต์นี้:

- **`modules/<ชื่อ>/`** — ฟีเจอร์ที่จบในตัว: controller, service, DTO ทุก module ถูกลงทะเบียนใน `app.module.ts`
- **`common/`** — สิ่งที่ใช้กับทั้งแอป: filter, guard, interceptor ที่นี่คือที่อยู่ของ filter ที่แปลง error ทุกแบบให้เป็น JSON รูปเดียวกัน
- **`config/`** — validate สภาพแวดล้อม schema จะทำงานตอน start: ถ้าตัวแปรที่จำเป็นหายไป แอปจะไม่ขึ้น

## tsconfig สองไฟล์

`tsconfig.json` ใช้ `noEmit` — มีไว้ให้ IDE และคำสั่ง `type-check` ส่วนการ build เป็นหน้าที่ของ `tsconfig.build.json` ที่ตั้ง `rootDir: ./src` ไว้: ถ้าไม่มี `dist/` จะลอกโครงสร้าง `apps/backend/src/...` มาด้วย และ entry point จะย้ายออกจาก `dist/main.js`

รายละเอียดเรื่อง config — [tsconfig.base.json](../../tsconfig-base)

สคริปต์ของ application — [package.json](./package-json)
