# tsconfig.json

แพ็กเกจนี้ต้องการเพิ่มจาก [ตัวพื้นฐาน](../../tsconfig-base) ไม่มาก — แค่บอกว่ามันไปที่ไหน:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ESNext",
    "lib": ["ESNext"],
    "resolveJsonModule": true
  },
  "include": ["src"]
}
```

## resolveJsonModule

คำแปลอยู่ใน `src/i18n/*/*.json` และถูก import โดยตรง:

```ts
import ru from './ru.json'
```

ถ้าไม่มีออปชันนี้ TypeScript จะไม่ยอม resolve การ import แบบนั้น อีกทั้งยังให้ type ตามเนื้อหาไฟล์ — โครงสร้างของคำแปลถูก infer ให้อัตโนมัติ

## module, moduleResolution กับ target

แพ็กเกจนี้เป็น source-only: field `main` และ `types` ใน `package.json` ชี้ตรงไปที่ `src/index.ts` ไม่มีการ build ผู้ใช้งาน compile ซอร์สเอง — Nuxt ผ่าน Vite, docs ผ่าน VitePress, backend ในระหว่าง `nest build`

แต่ก็ยังต้องมีค่าของตัวเอง: `pnpm type-check` และ IDE ทำงานจาก config นี้ ค่าที่ตั้งไว้อธิบายสถานการณ์หลัก คือการ build ด้วย bundler:

| ออปชัน | ค่า |
| --- | --- |
| `module` | `ESNext` — ES module แบบ native ตรงกับที่ Vite คาดหวัง |
| `moduleResolution` | `bundler` — resolve แบบเดียวกับ Vite และ Rollup |
| `target` | `ESNext` — ไม่มีเหตุผลต้องลด ผู้ใช้งานเป็นคน transpile |

ไม่ต้องมี `outDir`: แพ็กเกจไม่ได้ build อะไร และ `noEmit` มาจาก config พื้นฐานแล้ว

เวลาที่ backend เป็นคน compile ซอร์สเหล่านี้ จะใช้ [config ของมัน](../../apps/backend/tsconfig) ที่ resolve แบบ Node แทน — ไฟล์เดียวกัน กฎต่างกัน โค้ดที่นี่จึงเขียนให้ผ่านการตรวจทั้งสองแบบ

## ทำไม lib ไม่มี DOM

[`packages/ui`](../ui/tsconfig) ข้าง ๆ ใส่ `DOM` ไว้ใน `lib` ที่นี่ไม่มีโดยเจตนา แพ็กเกจนี้ไปทั้ง browser และ Node — การเรียก `window` หรือ `document` ในโค้ดส่วนกลางจะทำให้ backend พังตอน runtime เมื่อไม่มี `DOM` ความพยายามนั้นจะกลายเป็น type error แทนที่จะเป็นเรื่องเซอร์ไพรส์ฝั่ง server

## การตรวจสอบ type

```bash
pnpm --filter @repo/shared type-check
```

ใช้ `tsc --noEmit` ธรรมดา — ในแพ็กเกจมีแต่ `.ts` ไม่มี Vue component
