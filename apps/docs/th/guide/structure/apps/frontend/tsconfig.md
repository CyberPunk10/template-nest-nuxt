# tsconfig.json

Config เดียวใน repo ที่ไม่ extends ตัวพื้นฐาน: การตั้งค่าไม่ได้มาจากที่นั่น แต่มาจากไฟล์ที่ Nuxt สร้างเอง ในไฟล์นี้จึงแทบไม่มีอะไร:

```json
{
  "files": [],
  "references": [
    { "path": "./.nuxt/tsconfig.app.json" },
    { "path": "./.nuxt/tsconfig.server.json" },
    { "path": "./.nuxt/tsconfig.shared.json" },
    { "path": "./.nuxt/tsconfig.node.json" }
  ]
}
```

## Nuxt เป็นคนสร้าง config จริง

ตอนรัน `nuxt prepare` (ซึ่งรันเป็น `postinstall` ด้วย) Nuxt จะเขียน config สี่ไฟล์ลงใน `.nuxt/`:

| ไฟล์ | สำหรับ |
| --- | --- |
| `tsconfig.app.json` | `app/` — page, component, composable |
| `tsconfig.server.json` | `server/` — API route บน nitro/h3 |
| `tsconfig.shared.json` | `shared/` — โค้ดที่ใช้ร่วมกันระหว่างสองตัวข้างบน |
| `tsconfig.node.json` | `nuxt.config.ts` และสภาพแวดล้อม node |

การแยกนี้ไม่ใช่เรื่องรูปแบบ: แต่ละชั้นมี global type และชุด auto-import ต่างกัน component รู้จัก `useRoute()` ส่วน server route รู้จัก `defineEventHandler()` และการสลับกันไม่ควรผ่านการตรวจ type

## ไฟล์นี้ทำอะไร

`references` ผูก config ทั้งสี่เข้าเป็นโปรเจกต์เดียว — IDE จึงรู้ว่าจะใช้ตัวไหนกับไฟล์ที่เปิดอยู่ ส่วน `files: []` หมายความว่าตัวมันเองไม่ได้ตรวจอะไรเลย

Config ที่ generate ออกมาก็ไม่ได้ extends อะไรเช่นกัน: Nuxt เขียนทุกออปชันไว้ครบ มีที่ตรงกับ [config พื้นฐาน](../../tsconfig-base) อยู่ — `strict`, `moduleResolution: Bundler`, `noEmit` — แต่กำหนดแยกกัน มาจากค่า default ของ Nuxt เอง

เปลี่ยนได้ผ่าน `typescript.tsConfig` ใน `nuxt.config.ts` ซึ่งเทมเพลตไม่ได้กำหนดส่วนนี้ไว้ จึงใช้ค่า default

## การตรวจสอบ type

```bash
pnpm --filter frontend type-check
```

เบื้องหลังคือ `nuxt typecheck` ไม่ใช่ `tsc` มันจะอัปเดต `.nuxt/` ก่อน แล้วค่อยรัน `vue-tsc` ด้วย config ที่ถูกต้อง `tsc` ธรรมดาใช้ไม่ได้ที่นี่: ถ้าไม่มี type ที่ generate ไว้ auto-import และ typed route จะดูเหมือน error

อ่านเพิ่มเติมใน [เอกสารของ Nuxt](https://nuxt.com/docs/guide/concepts/typescript)
