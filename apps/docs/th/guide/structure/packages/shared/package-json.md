# package.json

```json
{
  "name": "@repo/shared",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "type-check": "tsc --noEmit"
  }
}
```

| สคริปต์ | คำสั่ง | ทำอะไร |
| --- | --- | --- |
| `type-check` | `tsc --noEmit` | ตรวจสอบ type โดยไม่ build |

ไม่มีสคริปต์ `build`: `main` และ `types` ชี้ไปที่ `src/index.ts` ตรง ๆ — package ถูกใช้เป็นซอร์ส ส่วนการ compile เป็นหน้าที่ของแอปพลิเคชัน

`private: true` — package นี้ไม่ถูก publish ขึ้น registry แต่เชื่อมผ่าน `workspace:*`

Dependency มีเพียง `typescript` ใน `devDependencies` สำหรับสคริปต์ `type-check`
