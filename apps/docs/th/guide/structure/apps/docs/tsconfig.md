# tsconfig.json

การตรวจสอบ type ของ theme VitePress: Vue component และ `.vitepress/config.ts` ตัวเอกสาร VitePress build เอง config นี้มีไว้สำหรับ type เท่านั้น

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ESNext",
    "lib": ["ESNext", "DOM"],
    "types": ["vitepress/client", "node"],
    "resolveJsonModule": true
  },
  "include": [".vitepress/**/*.ts", ".vitepress/**/*.vue"],
  "exclude": [".vitepress/dist", ".vitepress/cache"]
}
```

## target กับ lib

Theme รันในเบราว์เซอร์ จึงต้องมี DOM type: `document`, `window`, `HTMLElement` [config พื้นฐาน](../../tsconfig-base) ตั้งใจไม่ใส่ไว้ — มันไม่ผูกกับสภาพแวดล้อมใด และ backend ก็รันอยู่คนละที่

## types: ทำไมต้อง vitepress/client

แพ็กเกจ `vitepress/client` re-export `vite/client` ซึ่งประกาศโมดูล `*.vue`, `*.css` และ asset อื่น ๆ ไว้ ถ้าไม่มี การ import component ใน theme จะขึ้น error:

```
Cannot find module './components/Home/HomeHero.vue'
```

ส่วน `node` จำเป็นสำหรับ `config.ts` เอง — มันรันใน Node: อ่าน `process.env` และสร้าง path ผ่าน `path` กับ `url`

## resolveJsonModule

คำแปลของ interface อยู่ใน `.vitepress/locales/*.json` และถูก import โดยตรง ถ้าไม่มีออปชันนี้ TypeScript จะไม่ยอม resolve การ import แบบนั้น

## การตรวจสอบ type

```bash
pnpm --filter @repo/docs type-check
```

รัน `vue-tsc --noEmit` ไม่ใช่ `tsc` ธรรมดา เพราะตัวหลังอ่านไฟล์ `.vue` ไม่ได้ และจะรายงาน syntax error ในทุก component
