# packages/ui

ไลบรารี Vue component ใช้โดย frontend เท่านั้น

```
packages/ui/
├── src/
│   ├── components/     UiButton, UiBadge, UiCard
│   └── index.ts
├── package.json
└── tsconfig.json       extend base เพิ่ม DOM
```

## ทำไมไม่ compile

package นี้ยังเป็นซอร์สโค้ด มีแค่ frontend ที่ใช้ และ Vite จัดการ `.vue` กับ `.ts` ได้โดยตรง — ไม่ต้องมีขั้น build กลางทาง

จะ compile ด้วย `tsc` ธรรมดาก็ไม่ได้อยู่ดี: ไฟล์ `.vue` ต้องใช้ `vue-tsc` และ pipeline เฉพาะของมัน `tsconfig.json` ที่นี่มีไว้สำหรับ `vue-tsc --noEmit` ตอนตรวจ type เท่านั้น

ดังนั้น `main` จึงชี้ไปที่ `src/index.ts` ตรง ๆ — เหมือนกับ [shared](../shared/) ต่างกันแค่การตรวจ type: ที่นี่ต้องใช้ `vue-tsc` ส่วนที่นั่น `tsc` ก็พอ

## การตั้งค่า TypeScript ของตัวเอง

extend `tsconfig.base.json` แต่เพิ่ม lib `DOM` เข้ามา — base config ไม่มีมันโดยเจตนา เพราะใช้ร่วมกับ backend ด้วย

Manifest ของ package — [package.json](./package-json)
