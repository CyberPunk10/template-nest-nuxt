# packages/

ไลบรารี 2 ตัวที่แอปพลิเคชันเรียกใช้ เชื่อมกันแบบ `workspace:*` — pnpm ทำ symlink ให้ ไม่ต้อง publish ขึ้น registry

```
packages/
├── shared/      type (DTO) และคำแปล — สำหรับ backend และ frontend
└── ui/          Vue component — สำหรับ frontend เท่านั้น
```

| Package                                        | ใครใช้             | การ build       | การตรวจ type                      |
| ---------------------------------------------- | ----------------- | --------------- | --------------------------------- |
| [shared](./shared/) | backend, frontend | ใช้เป็นซอร์สโดยตรง | `tsc --noEmit`                    |
| [ui](./ui/)         | frontend          | ใช้เป็นซอร์สโดยตรง | `vue-tsc --noEmit` — เพราะ `.vue` |

ทั้งคู่ไม่ต้อง compile: `main` ชี้ไปที่ `src/index.ts` ตรง ๆ ส่วนซอร์สนั้นผู้ใช้จัดการเอง — Nest ด้วย `tsc` ส่วน Nuxt ผ่าน Vite รายละเอียดเต็ม — [สถาปัตยกรรม](../../architecture#packages-ใช้งานอย่างไร)
