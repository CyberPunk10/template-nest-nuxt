# tsconfig.base.json

ในโปรเจกต์มีไฟล์ config ของ TypeScript ทั้งหมดเจ็ดไฟล์ หลักการเดียวที่ช่วยไม่ให้สับสนคือ **ทุกไฟล์ยกเว้นไฟล์เดียวมีไว้ตรวจสอบ type เท่านั้น** การ compile เป็นหน้าที่ของเครื่องมืออื่น — `nest build`, Nuxt, VitePress ข้อยกเว้นเดียวคือ [`apps/backend/tsconfig.build.json`](./apps/backend/tsconfig-build)

## การสืบทอด config

```
template-nest-nuxt/
├── tsconfig.base.json          ← ฐานร่วม
│
├── apps/
│   ├── backend/
│   │   ├── tsconfig.json
│   │   └── tsconfig.build.json ← extends tsconfig.json ด้านบน ไม่ใช่ base
│   ├── frontend/
│   │   └── tsconfig.json
│   └── docs/
│       └── tsconfig.json
│
└── packages/
    ├── shared/
    │   └── tsconfig.json
    └── ui/
        └── tsconfig.json
```

ทุก config extends ตัวพื้นฐาน ยกเว้น `apps/frontend`: config จริงของมัน Nuxt เป็นคนสร้างไว้ใน `.nuxt/` ส่วนไฟล์นั้นเพียง reference ถึงพวกมัน และตัวที่ generate มาก็ไม่ได้ extends อะไรเช่นกัน — Nuxt เขียนทุกออปชันไว้ครบ รวมถึง `strict` และ `noEmit` ชุดเดียวกับที่นี่ [รายละเอียด](./apps/frontend/tsconfig)

แต่ละไฟล์เก็บ **เฉพาะสิ่งที่ต่างจาก base** เท่านั้น ออปชันที่ไม่ได้เขียนไว้จะถูกสืบทอดมา และนี่เป็นความตั้งใจ — การเขียน `strict` ซ้ำในทุกไฟล์คือหนทางที่ทำให้สักวันหนึ่งมีแพ็กเกจที่ลืมใส่ไปเงียบ ๆ

## สิ่งที่อยู่ใน base

```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "noEmit": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

| ออปชัน | เหตุผล |
| --- | --- |
| `strict` | เปิดการตรวจสอบเข้มงวดทั้งหมด รวมถึง `strictNullChecks` |
| `esModuleInterop` | import แพ็กเกจ CommonJS ด้วย `import x from` โดยไม่ต้องใช้ `* as` |
| `forceConsistentCasingInFileNames` | ตัวพิมพ์เล็กใหญ่ในพาธ: บน macOS ไม่มีปัญหา แต่ build ใน Docker จะพัง |
| `skipLibCheck` | ไม่ตรวจ type ใน `node_modules` — เร็วกว่าและไม่ติด error ของคนอื่น |
| `noEmit` | ไม่สร้างไฟล์ใด ๆ |
| `noImplicitOverride` | การ override method ต้องใส่คีย์เวิร์ด `override` |
| `noFallthroughCasesInSwitch` | ห้ามให้ `case` ตกทะลุไปตัวถัดไปโดยไม่มี `break` |

### ทำไม `noEmit` ต้องอยู่ใน base

ถ้าไม่มี การรัน `tsc` ตรง ๆ ไม่ว่าจะด้วยมือ จาก IDE หรือจากเครื่องมือที่ไม่รู้เรื่อง จะโปรยไฟล์ `.js` ไว้ข้างซอร์ส สคริปต์ `type-check` ส่ง `--noEmit` เป็น flag อยู่แล้ว แต่การป้องกันที่อยู่แค่ในคำสั่งย่อมใช้ไม่ได้เมื่อไม่ได้ใช้คำสั่งนั้น

Config สำหรับ build จึงยกเลิกอย่างชัดเจนด้วย `"noEmit": false`

### การตรวจสองอย่างที่เกินจาก `strict`

`noImplicitOverride` และ `noFallthroughCasesInSwitch` ไม่ได้อยู่ใน `strict` — ต้องเปิดแยก

ตัวแรกบังคับให้ระบุการ override อย่างชัดเจน:

```ts
class Child extends Base {
  handle() { }           // error
  override handle() { }  // ถูกต้อง
}
```

ประเด็นไม่ใช่พิธีการ: ถ้าไม่มีมัน การเผลอบดบัง method ของ parent ทั้งที่คิดว่ากำลังเขียนตัวใหม่นั้นเกิดขึ้นง่ายมาก กรณีกลับกันแย่กว่า — เปลี่ยนชื่อ method ใน base class แล้วตัว override ใน subclass ก็เลิกถูกเรียกไปเงียบ ๆ

ตัวที่สองจับ `break` ที่ลืมใส่:

```ts
switch (status) {
  case 'active':
    doSomething()      // error: จะตกทะลุไป 'archived'
  case 'archived':
    cleanup()
}
```

การจับกลุ่ม case โดยตั้งใจยังทำได้ — `case` เปล่าที่ไม่มีเนื้อในไม่ถือเป็น error

## สิ่งที่ตั้งใจไม่ใส่ใน base

### `paths` สำหรับ `@repo/*`

การแมปพาธไปยังแพ็กเกจใน workspace ดูน่าใช้:

```json
// อย่าทำแบบนี้
"paths": {
  "@repo/shared": ["./packages/shared/src/index.ts"]
}
```

มันทั้งไม่จำเป็นและเป็นโทษ ไม่จำเป็นเพราะ pnpm สร้าง symlink ไว้ใน `node_modules/@repo/` อยู่แล้ว และ `package.json` ของแพ็กเกจชี้ `main` ไปที่ `src/index.ts` โดยตรง TypeScript หาเจอเอง ส่วนที่เป็นโทษคือ `paths` ชี้ไปยัง **ซอร์สของอีกแพ็กเกจหนึ่ง** ทำให้ตอน build backend นั้น `tsc` พยายาม compile ไฟล์เหล่านั้นไปพร้อมกัน:

```
error TS6059: File '.../packages/shared/src/types/api.ts' is not under
rootDir '.../apps/backend/src'. 'rootDir' is expected to contain all source files.
```

ทางแก้คือต้องรีเซ็ต `"paths": {}` ใน config ของ build ซึ่งเป็นการแก้ขัดที่มีอยู่เพียงเพื่อลบล้างการตั้งค่าที่ไม่ควรมีตั้งแต่แรก

### `module` กับ `moduleResolution`

สองออปชันนี้อธิบายว่าโค้ดถูกโหลดตอน runtime อย่างไร — และ runtime ของแต่ละแพ็กเกจไม่เหมือนกัน จึงไม่มีค่ากลางที่ใช้ร่วมได้

| แพ็กเกจ | ค่า | อะไรโหลดโค้ด |
| --- | --- | --- |
| `apps/backend` | `node16` | Node ผ่าน `require` |
| `packages/shared`, `packages/ui`, `apps/docs` | `ESNext` + `bundler` | Vite, Rollup, VitePress |

แต่ละแพ็กเกจประกาศทั้งสองออปชันเอง วางอยู่ติดกัน — ทำให้แยกออกจากกันไม่ได้เพราะแก้ตัวหนึ่งแล้วลืมอีกตัว

### `target` และ `lib`

Backend รันบน Node ส่วนแพ็กเกจ Vue รันในเบราว์เซอร์ ไม่มีค่ากลางที่ใช้ร่วมกันได้ แต่ละไฟล์จึงกำหนดของตัวเอง

## Config ของแต่ละแพ็กเกจ

สิ่งที่แต่ละตัวเพิ่มจาก base:

| Config | ความต่าง |
| --- | --- |
| [`apps/backend`](./apps/backend/tsconfig) | resolve แบบ `node16`, decorator, type ของ jest |
| [`apps/backend/tsconfig.build.json`](./apps/backend/tsconfig-build) | ตัวเดียวที่ compile จริง |
| [`apps/frontend`](./apps/frontend/tsconfig) | ไม่ extends base — Nuxt สร้าง config ให้ |
| [`apps/docs`](./apps/docs/tsconfig) | resolve แบบ bundler, DOM lib, type ของ VitePress |
| [`packages/shared`](./packages/shared/tsconfig) | resolve แบบ bundler, resolveJsonModule สำหรับคำแปล |
| [`packages/ui`](./packages/ui/tsconfig) | resolve แบบ bundler, DOM lib สำหรับ component |

## การตรวจสอบ type

```bash
pnpm type-check
```

รันผ่านทุก workspace แต่เครื่องมือของแต่ละแพ็กเกจต่างกัน:

| แพ็กเกจ | คำสั่ง | เหตุผล |
| --- | --- | --- |
| `backend`, `shared` | `tsc --noEmit` | TypeScript ล้วน |
| `ui`, `docs` | `vue-tsc --noEmit` | `tsc` อ่าน `.vue` ไม่ได้ |
| `frontend` | `nuxt typecheck` | ต้องใช้ type ที่ generate ไว้ใน `.nuxt/` |
