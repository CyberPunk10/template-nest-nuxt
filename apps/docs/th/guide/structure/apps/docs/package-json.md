# package.json

Manifest ของ application สคริปต์ทำงานเฉพาะใน workspace ของตัวเอง — จาก root เรียกผ่าน filter (`pnpm --filter @repo/docs dev`) หรือโดยอ้อมจากคำสั่งที่ root

| สคริปต์        | คำสั่ง                 | ทำอะไร                                               |
| ------------ | ------------------- | --------------------------------------------------- |
| `dev`        | `vitepress dev`     | Dev server ของเอกสารในเครื่อง                         |
| `build`      | `vitepress build`   | Static build เป็น `.vitepress/dist/`                 |
| `preview`    | `vitepress preview` | รันเอกสารที่ build แล้วในเครื่อง                          |
| `type-check` | `vue-tsc --noEmit`  | ตรวจสอบ type ของ config และ Vue component ของ theme |

Filter ที่นี่คือชื่อเต็มของ package `@repo/docs` ไม่ใช่ `docs` เหมือน application อื่น

## Dependency

แพ็กเกจทั้งหมดเป็น `devDependencies`: ใน image มีเพียงไฟล์ static ที่ build แล้ว

| แพ็กเกจ | ใช้ทำอะไร |
| --- | --- |
| `vitepress`, `vue` | ตัวสร้างเอกสารและ Vue สำหรับ component ของ theme |
| `dotenv` | อ่าน `apps/docs/.env` ใน `.vitepress/config.ts` |
| `vue-tsc` | ตรวจ type ของ config และ component ของ theme |
| `@types/node` | Type ของ Node.js สำหรับ config |

อะไรอยู่ที่ไหน — [apps/docs](./)
