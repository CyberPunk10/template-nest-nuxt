# tsconfig.json

Config ของแพ็กเกจ Vue component:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ESNext",
    "lib": ["ESNext", "DOM"]
  },
  "include": ["src/**/*"]
}
```

## ทำไมต้องมี DOM lib

Component ทำงานในเบราว์เซอร์: เรียกใช้ `HTMLElement` ฟัง event อ่านขนาดของ node [config พื้นฐาน](../../tsconfig-base) ตั้งใจไม่ใส่ DOM type ไว้ — เพราะทุกแพ็กเกจใช้ร่วมกัน รวมถึง backend ที่ไม่มี browser API

`target: ESNext` ก็ด้วยเหตุผลเดียวกัน: โค้ดผ่าน Vite ซึ่งตัดสินใจเองว่าจะ transpile อะไรให้เบราว์เซอร์เป้าหมาย การลดเวอร์ชันที่ชั้นนี้ไม่มีประโยชน์

## ทำไมไม่มี outDir

แพ็กเกจเป็นแบบ source-only เหมือน [`@repo/shared`](../shared/tsconfig): `main` และ `types` ใน `package.json` ชี้ไปที่ `src/index.ts` Nuxt หยิบไฟล์ `.vue` ไปใช้ตรง ๆ ผ่าน Vite — ไม่ต้อง build แยก และการ build จะเพิ่มขั้นตอนระหว่างการแก้กับผลลัพธ์เปล่า ๆ

## การตรวจสอบ type

```bash
pnpm --filter @repo/ui type-check
```

ที่นี่ใช้ `vue-tsc --noEmit` ไม่ใช่ `tsc`: compiler ธรรมดาอ่าน single-file component ไม่ได้ และจะสะดุดตั้งแต่ `<template>` แรก
