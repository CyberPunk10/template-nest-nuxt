# tsconfig.json

การตรวจสอบ type ของ backend — สิ่งที่ IDE เห็น และสิ่งที่ `pnpm type-check` รัน ส่วนการ build เป็นหน้าที่ของ [`tsconfig.build.json`](./tsconfig-build) ซึ่ง extends ไฟล์นี้

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "node16",
    "moduleResolution": "node16",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "target": "ES2023",
    "types": ["jest", "node"],
    "resolveJsonModule": true
  },
  "include": ["src", "test"]
}
```

ที่เหลือ — `strict`, `skipLibCheck`, `noEmit` — มาจาก [config พื้นฐาน](../../tsconfig-base)

## ทำไมต้อง node16

Nest โหลดโมดูลผ่าน `require` ทั้งรูปแบบโมดูลและการ resolve จึงเป็นไปตามกฎของ Node `node16` กำหนดทั้งสองอย่างด้วยค่าเดียว: มันดู field `type` ใน `package.json` ซึ่งไม่มีอยู่ — รูปแบบจึงเป็น CommonJS

ทั้งสองออปชันระบุไว้ด้วยกัน เพราะ TypeScript บังคับให้สอดคล้องกัน [การกระจายออปชันเหล่านี้ตามแพ็กเกจ](../../tsconfig-base)

## Decorator

NestJS สร้างขึ้นบน decorator: `@Module`, `@Controller`, `@Injectable` ระบบ dependency injection ทำงานได้เพราะ metadata ของ type ซึ่งเปิดใช้ด้วยสองออปชันนี้:

| ออปชัน | ทำอะไร |
| --- | --- |
| `experimentalDecorators` | เปิดใช้ syntax ของ decorator |
| `emitDecoratorMetadata` | เก็บ type ของพารามิเตอร์ไว้ถึง runtime — DI อ่านค่านี้เพื่อรู้ว่าต้อง inject อะไร |

`emitDecoratorMetadata` ใช้ร่วมกับ ESM แบบ native ไม่ได้ — เป็นอีกเหตุผลที่ backend ยังคงอยู่บน CommonJS

## resolveJsonModule

`@repo/shared` เป็นแพ็กเกจที่ไม่มีขั้นตอน build: `package.json` ของมันชี้ `main` ตรงไปที่ `src/index.ts` ดังนั้น backend จึง compile ซอร์สเหล่านั้นไปพร้อมกับของตัวเอง และในนั้นมีการ import คำแปล:

```ts
import ru from './ru.json'
```

Config ของ shared ไม่ได้มีส่วนร่วมใน compilation นั้น — ที่ใช้คือ config ของ backend ออปชันนี้จึงต้องอยู่ที่นี่ ถ้าไม่มี `tsc` จะล้มที่ไฟล์ของแพ็กเกจข้างเคียง

## ทำไม ES2023

แอปรันบน Node 24 จึงใช้ทุกอย่างที่ V8 เวอร์ชันนั้นรองรับได้ การลด `target` ไม่มีประโยชน์: โค้ดไม่ได้ไปที่เบราว์เซอร์ และการ transpile มีแต่จะทำให้ผลลัพธ์ใหญ่ขึ้น

## types: jest กับ node

ถ้าไม่ระบุรายการไว้ TypeScript จะดึงทุกแพ็กเกจใน `node_modules/@types` เข้ามา รวมถึงตัวที่ไม่เกี่ยว ที่นี่ระบุไว้สองตัว:

- **`jest`** — global อย่าง `describe`, `it`, `expect` ถ้าไม่มี spec จะขึ้น error `Cannot find name 'describe'`
- **`node`** — `process`, `Buffer`, `__dirname` และสภาพแวดล้อมฝั่ง server ที่เหลือ

## ทำไม include ถึงมี test

```json
"include": ["src", "test"]
```

`test/` เก็บ e2e spec ไว้ ถ้าไม่มีบรรทัดนี้ ไฟล์เหล่านั้นจะอยู่นอกโปรเจกต์: IDE จะมองไม่เห็น global ของ jest และ `pnpm type-check` จะข้ามไฟล์ไปเงียบ ๆ — error ของ type ใน test จะโผล่ตอนรันเท่านั้น

การ build ไม่ได้รับผลกระทบ: `tsconfig.build.json` ตัด `test` ออกต่างหาก
