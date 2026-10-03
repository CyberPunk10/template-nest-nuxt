# tsconfig.build.json

Config สำหรับ `nest build` — ไฟล์เดียวใน repo ที่ compile โค้ดจริง ที่เหลือมีไว้ตรวจ type

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "rootDir": "./src",
    "outDir": "./dist",
    "preserveWatchOutput": true
  },
  "exclude": ["node_modules", "dist", "test", "**/*spec.ts"]
}
```

มัน extends ไม่ใช่ config พื้นฐาน แต่เป็น [`tsconfig.json` ที่อยู่ข้าง ๆ](./tsconfig) — จึงได้ทั้งการตั้งค่าของ Nest และกฎร่วมจาก base

## noEmit: false

Config พื้นฐานห้ามสร้างไฟล์ เพื่อไม่ให้การรัน `tsc` โดยบังเอิญโปรย `.js` ไว้ข้างซอร์ส ที่นี่ยกเลิกข้อห้ามนั้น — เพราะนี่คือการ build จริง

## rootDir กับ outDir

ถ้าไม่มี `rootDir` compiler จะใช้ directory ร่วมที่ใกล้ที่สุดของไฟล์ทั้งหมดเป็น root แล้วโครงสร้างโฟลเดอร์จะติดไปในผลลัพธ์:

```
dist/apps/backend/src/main.js     ← ไม่มี rootDir
dist/main.js                      ← มี rootDir: ./src
```

แบบหลังคือสิ่งที่ทำให้ `CMD ["node", "dist/main"]` ใน Dockerfile ทำงานได้โดยไม่ต้องเขียน path ยาว

## preserveWatchOutput

ใน watch mode นั้น `tsc` จะล้างหน้าจอทุกครั้งที่ compile ใหม่ ถ้ารัน `pnpm dev` จาก root แบบขนาน log ของ Nuxt ที่บอก address ตอนเริ่มจะถูกลบไปด้วย — มันพิมพ์ครั้งเดียว การเสียมันไปไม่สะดวก

## ทำไมถึงตัด test ออก

```json
"exclude": ["node_modules", "dist", "test", "**/*spec.ts"]
```

`tsconfig.json` ข้าง ๆ ทำตรงกันข้ามคือ include `test` เพราะจำเป็นสำหรับการตรวจ type ส่วนการ build ไม่ต้องใช้ test: มันไม่ได้เข้าไปใน image และไฟล์ `*.spec.ts` ที่วางอยู่ข้างซอร์สก็จะหลุดไปอยู่ใน `dist/`
