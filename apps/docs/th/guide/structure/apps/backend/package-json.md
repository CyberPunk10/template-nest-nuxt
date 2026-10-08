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

## Dependency

| แพ็กเกจ | ใช้ทำอะไร |
| --- | --- |
| `@nestjs/core`, `@nestjs/common` | แกนของ NestJS: module, controller, dependency injection |
| `@nestjs/platform-express` | HTTP server บน Express สำหรับ NestJS |
| `reflect-metadata`, `rxjs` | Dependency ที่ NestJS ต้องมี: metadata ของ decorator และ stream |
| `@nestjs/config` | อ่าน `.env` และเข้าถึงการตั้งค่าผ่าน `ConfigService` |
| `joi` | ตรวจตัวแปร environment ตอนเริ่มแอป (`src/config/env.validation.ts`) |
| `@nestjs/swagger` | Swagger UI และคำอธิบาย API จาก decorator เฉพาะนอก production |
| `class-validator`, `class-transformer` | ตรวจและแปลง body ของ request เป็น DTO |
| `@repo/shared` | Type ที่ใช้ร่วมกับ frontend จาก `packages/shared` |

| แพ็กเกจสำหรับการพัฒนา | ใช้ทำอะไร |
| --- | --- |
| `@nestjs/cli` | คำสั่ง `nest start` และ `nest build` |
| `@nestjs/schematics` | ตัวสร้างไฟล์ `nest generate` (module, controller, service) |
| `typescript` | Compiler ของ TypeScript |
| `jest`, `ts-jest`, `@types/jest` | เทสต์ด้วย TypeScript โดยไม่ต้อง build แยก |
| `@nestjs/testing` | Testing module ของ NestJS ที่สลับ dependency ได้ |
| `supertest`, `@types/supertest` | ส่ง HTTP request ไปยังแอปใน E2E test |
| `@types/node`, `@types/express` | Type ของ Node.js และ Express |

อะไรอยู่ที่ไหน — [apps/backend](./)
