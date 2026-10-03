# package.json

Manifest ของ application สคริปต์ทำงานเฉพาะใน workspace ของตัวเอง — จาก root เรียกผ่าน filter (`pnpm --filter @repo/docs dev`) หรือโดยอ้อมจากคำสั่งที่ root

| สคริปต์        | คำสั่ง                 | ทำอะไร                                               |
| ------------ | ------------------- | --------------------------------------------------- |
| `dev`        | `vitepress dev`     | Dev server ของเอกสารในเครื่อง                         |
| `build`      | `vitepress build`   | Static build เป็น `.vitepress/dist/`                 |
| `preview`    | `vitepress preview` | รันเอกสารที่ build แล้วในเครื่อง                          |
| `type-check` | `vue-tsc --noEmit`  | ตรวจสอบ type ของ config และ Vue component ของ theme |

Filter ที่นี่คือชื่อเต็มของ package `@repo/docs` ไม่ใช่ `docs` เหมือน application อื่น

อะไรอยู่ที่ไหน — [apps/docs](./)
