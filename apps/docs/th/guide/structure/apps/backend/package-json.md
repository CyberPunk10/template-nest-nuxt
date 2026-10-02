# package.json

Manifest ของ application สคริปต์ทำงานเฉพาะใน workspace ของตัวเอง — จาก root เรียกผ่าน filter (`pnpm --filter backend dev`) หรือโดยอ้อมจากคำสั่งที่ root

| สคริปต์                                           | คำสั่ง                  | ทำอะไร                                     |
| ----------------------------------------------- | -------------------- | ----------------------------------------- |
| `dev`                                           | `nest start --watch` | Develop ในเครื่อง มี hot-reload              |
| `build`                                         | `nest build`         | Production build เป็น `dist/`              |
| `start`                                         | `nest start`         | รัน `dist/` ที่ build แล้วโดยไม่มี watch        |
| `start:prod`                                    | `node dist/main`     | รันในโหมด production (สิ่งที่ `Dockerfile` ใช้) |
| `lint`                                          | `eslint ... --fix`   | Linter พร้อม auto-fix                      |
| `type-check`                                    | `tsc --noEmit`       | ตรวจสอบ type โดยไม่ build                  |
| `start:debug`                                   | `nest start --debug` | เหมือนกันแต่เปิดพอร์ต debugger              |
| `test` / `test:watch` / `test:cov`              | `jest ...`           | Unit test: รันครั้งเดียว, watch mode, พร้อม coverage |
| `test:debug`                                    | `node --inspect-brk` | รันเทสต์ภายใต้ debugger แบบ thread เดียว (`--runInBand`) |
| `test:e2e`                                      | `jest --config ...`  | E2E test ใช้ config ของตัวเอง `test/jest-e2e.json` |

อะไรอยู่ที่ไหน — [apps/backend](./)
