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

## ควรวางคอมโพเนนต์ไว้ที่ไหน

หลักการง่าย ๆ: แพ็กเกจที่ใช้ร่วมกันเก็บคอมโพเนนต์ที่นำกลับมาใช้ซ้ำได้ และไม่รู้อะไรเกี่ยวกับแอปเลย — ทั้ง store, API และหน้าเว็บ

- **ในแพ็กเกจที่ใช้ร่วมกัน** (`packages/ui/src/components/`) — คอมโพเนนต์เรียบง่ายที่ไม่มี logic ของแอป: ปุ่ม, badge, การ์ด, ช่องกรอกข้อมูล รับข้อมูลผ่าน props และแจ้งการกระทำผ่าน event
- **ใน frontend** (`apps/frontend/app/components/`) — ทุกอย่างที่เรียก API ใช้ store หรือรู้จักหน้าเว็บ
- **ไม่แน่ใจ** — วางไว้ใน frontend: ย้ายเข้าแพ็กเกจทีหลังไม่ยาก

## ทำไมต้องแยกเป็นแพ็กเกจ

เพื่อให้ frontend ตัวที่สองใช้คอมโพเนนต์เดียวกันได้ — ส่วนใหญ่คือหน้า admin ถ้าจะไม่มี frontend ตัวที่สอง ก็ลบแพ็กเกจแล้วเก็บคอมโพเนนต์ไว้ใน frontend ได้

## ใช้เป็นซอร์สโดยตรง

package นี้ยังเป็นซอร์สโค้ด มีแค่ frontend ที่ใช้ และ Vite จัดการ `.vue` กับ `.ts` ได้โดยตรง — ไม่ต้องมีขั้น build กลางทาง

จะ compile ด้วย `tsc` ธรรมดาก็ไม่ได้อยู่ดี: ไฟล์ `.vue` ต้องใช้ `vue-tsc` และ pipeline เฉพาะของมัน `tsconfig.json` ที่นี่มีไว้สำหรับ `vue-tsc --noEmit` ตอนตรวจ type เท่านั้น

ดังนั้น `main` จึงชี้ไปที่ `src/index.ts` ตรง ๆ — เหมือนกับ [shared](../shared/) ต่างกันแค่การตรวจ type: ที่นี่ต้องใช้ `vue-tsc` ส่วนที่นั่น `tsc` ก็พอ

## การตั้งค่า TypeScript ของตัวเอง

extend `tsconfig.base.json` แต่เพิ่ม lib `DOM` เข้ามา — base config ไม่มีมันโดยเจตนา เพราะใช้ร่วมกับ backend ด้วย

Manifest ของ package — [package.json](./package-json)
