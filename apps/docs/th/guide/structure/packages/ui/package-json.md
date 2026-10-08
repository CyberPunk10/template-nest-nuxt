# package.json

```json
{
  "name": "@repo/ui",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "type-check": "vue-tsc --noEmit"
  }
}
```

| สคริปต์ | คำสั่ง | ทำอะไร |
| --- | --- | --- |
| `type-check` | `vue-tsc --noEmit` | ตรวจสอบ type รวมถึงไฟล์ `.vue` |

ใช้ `vue-tsc` ไม่ใช่ `tsc`: compiler ธรรมดาอ่าน single-file component ไม่ได้

ไม่มีการ build — Vite จัดการซอร์สโดยตรง `private: true` หมายความว่า package นี้ไม่ถูก publish และเชื่อมผ่าน `workspace:*`

Dependency ทั้งหมดใช้เฉพาะตอนพัฒนา: `vue` สำหรับ type ของ component, `vue-tsc` และ `typescript` สำหรับ `type-check` ส่วนตัว Vue มาจาก application ที่ใช้ package นี้
