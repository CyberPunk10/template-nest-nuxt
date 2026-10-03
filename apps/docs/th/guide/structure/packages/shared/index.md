# packages/shared

Type และคำแปลที่ใช้ร่วมกัน เป็น package เดียวที่ใช้โดย **ทั้งสอง** แอปพลิเคชัน

```
packages/shared/
├── src/
│   ├── i18n/           คำแปล: ru, en, th
│   └── index.ts        type (DTO) และจุด export
├── package.json
└── tsconfig.json       extend base เพิ่ม resolveJsonModule
```

## ควรเก็บอะไรไว้ที่นี่

ทุกอย่างที่ต้องตรงกันทั้งฝั่ง client และ server: รูปแบบ request/response, enum ของสถานะ, ข้อความใน UI ถ้า type ใช้แค่ฝั่งเดียว ก็ควรอยู่ในแอปนั้น ไม่ใช่ที่นี่

## ใช้เป็นซอร์สโดยตรง

`main` และ `types` ชี้ไปที่ `src/index.ts` ตรง ๆ ไม่มีขั้นตอน build: แอปพลิเคชัน compile ซอร์สเป็นส่วนหนึ่งของ build ตัวเอง — backend ด้วย `tsc` ส่วน frontend ผ่าน Vite การ resolve อาศัย symlink ของ pnpm workspace ไม่ใช่ `paths` ของ TypeScript

Manifest ของ package — [package.json](./package-json)
