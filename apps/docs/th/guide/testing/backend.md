# การทดสอบ backend

Stack ของเทสต์คือ [Jest](https://jestjs.io/) เป็น runner, [ts-jest](https://kulshekhar.github.io/ts-jest/) สำหรับ transform TypeScript, `@nestjs/testing` สำหรับประกอบโมดูล และ [Supertest](https://github.com/ladjs/supertest) สำหรับยิง HTTP request ทั้งหมดนี้ติดมากับ `nest new` อยู่แล้ว ไม่ต้องตั้งค่าเพิ่ม

## การรัน

คำสั่งด้านล่างเขียนในรูปแบบสั้น — คือหน้าตาเวลาอยู่ใน `apps/backend` ถ้ารันจาก root ของโมโนรีโป ให้เติม `--filter @repo/backend` เข้าไปในทุกคำสั่ง เรื่อง `--filter` และการรันทุก package พร้อมกันอยู่ใน[ส่วนรวม](./)

นอกจาก `test` กับ `test:e2e` แล้ว backend ยังมีคำสั่งสำหรับงานประจำวัน:

| คำสั่ง            | ทำอะไร                                                             |
| ----------------- | ------------------------------------------------------------------ |
| `pnpm test:watch` | รันเทสต์ที่เกี่ยวข้องใหม่ทุกครั้งที่บันทึกไฟล์                     |
| `pnpm test:cov`   | วัด coverage แล้วเขียนรายงาน HTML ไว้ที่ `apps/backend/coverage/`  |
| `pnpm test:debug` | รัน Jest ภายใต้ Node inspector เพื่อ debug ใน IDE                  |

รันไฟล์เดียวหรือเทสต์เดียว:

```bash
pnpm test tasks.service                    # ไฟล์ที่ path มีข้อความนี้
pnpm test -t 'не затирает поля'            # เทสต์ที่ชื่อมีข้อความนี้
pnpm test:e2e --testPathPatterns=tasks     # แบบเดียวกันสำหรับ e2e

# แบบเดียวกันจาก root ของโมโนรีโป
pnpm --filter @repo/backend test tasks.service
```

ชื่อเทสต์ในเทมเพลตนี้เขียนเป็นภาษารัสเซีย `-t` จึงรับข้อความภาษารัสเซีย — runner จับคู่กับชื่อตามที่สะกดไว้ในไฟล์ spec

flag เขียนได้เลยโดยไม่ต้องมีตัวคั่น `--`: pnpm ส่ง argument ที่มันไม่รู้จักต่อไปให้ script อยู่แล้ว ส่วน `--` ที่ใส่เองจะถูกส่งต่อไปตรง ๆ และ Jest จะอ่านมันเป็น path ของไฟล์

## เทสต์สามชุด

สามชุดนี้แยกกันทั้งที่ตั้งไฟล์และ config

|                  | Unit test                          | E2E test                              | E2E rate limiting                   |
| ---------------- | ---------------------------------- | ------------------------------------- | ----------------------------------- |
| คำสั่ง            | `pnpm test`                        | `pnpm test:e2e`                       | `pnpm test:e2e:throttle`            |
| อยู่ที่ไหน       | `src/**/*.spec.ts`                 | `test/default/*.e2e-spec.ts`          | `test/throttle/*.e2e-spec.ts`       |
| Config           | ส่วน `jest` ใน `package.json`      | `test/jest-e2e.json`                  | `test/jest-e2e-throttle.json`       |
| ยกอะไรขึ้นมา     | คลาสเดียวพร้อม stub                | ทั้ง application ผ่าน `AppModule`     | application ที่เปิด throttler       |
| ช่องทาง          | เรียก method ตรง ๆ                 | HTTP ผ่าน Supertest                   | HTTP ผ่าน Supertest                 |

การวางไฟล์เป็นแบบเดียวกันทั้ง repository ([ข้อตกลงร่วม](./#conventions)): `tasks.service.ts` → `tasks.service.spec.ts` วางข้างกัน ส่วน e2e อยู่ใน `test/`

สิ่งที่เป็นเรื่องเฉพาะของ Jest ตรงนี้คือ แต่ละชุดต้องใช้ **config แยกกัน** ไม่ใช่ไฟล์เดียวที่มีหลาย project เพราะ `rootDir` ต่างกัน — ชุด unit มองเข้าไปที่ `src` ส่วน e2e มองที่ root ของ package เพื่อให้เห็นทั้ง `test/` และ `src/` กฎการเลือกไฟล์จึงต่างกันด้วย (`testRegex` สำหรับชุด unit, `testMatch` สำหรับ e2e) ไม่อย่างนั้นแต่ละชุดจะไปหยิบไฟล์ของอีกชุดมารัน

เทสต์ rate limiting แยกเป็นชุดที่สามเพราะ environment ในเทสต์ปกติ throttler ถูกปิดไว้ (`APP_ENV=test`) ไม่งั้นตัวนับที่สะสมไว้จะไปพังเทสต์ข้างเคียง แต่เทสต์ `429` ต้องการให้มันเปิด `setupFiles` ของมันจึงตั้ง `APP_ENV=production` และลด `THROTTLE_LIMIT` เหลือ `12` — ลิมิตที่แตะถึงได้ในไม่กี่วินาที สิ่งนี้ใช้ config ร่วมกับ e2e ตัวอื่นไม่ได้ เพราะค่าถูกตั้งก่อนโหลดโมดูลและมีผลกับทั้งการรัน

## Unit test

คลาสที่ทดสอบถูกประกอบผ่าน `Test.createTestingModule` — DI container ตัวเดียวกับตอนรันจริง เพียงแต่สลับ dependency เป็นตัวแทน:

```ts
const module: TestingModule = await Test.createTestingModule({
  providers: [TasksService],
}).compile()

service = module.get<TasksService>(TasksService)
```

โมดูลถูกสร้างใหม่ใน `beforeEach` ไม่ใช่ `beforeAll` เพราะ `TasksService` เก็บ task ไว้ในหน่วยความจำของ instance ตัวเอง ถ้าใช้ service ร่วมกันทั้งไฟล์ task จากเทสต์หนึ่งจะไปโผล่ในเทสต์ถัดไป: เทสต์จะเริ่มขึ้นกับลำดับการรัน และพังทีละตัวเมื่อสลับลำดับ

dependency ที่ไม่เกี่ยวกับพฤติกรรมที่กำลังตรวจจะถูกแทนด้วย stub `AppController` อ่าน config ก็จริง แต่ไม่จำเป็นต้องยก `ConfigModule` ขึ้นมาและ parse `.env` เพื่อการนั้น:

```ts
{
  provide: ConfigService,
  useValue: { get: (key: string, defaultValue?: unknown) => env[key] ?? defaultValue },
}
```

stub เลียนแบบ signature ของ method จริงครบถ้วน รวมถึง argument ตัวที่สอง — ค่า default ถ้าใช้ stub แบบง่าย ๆ `(key) => env[key]` พฤติกรรมจะต่างจาก `ConfigService` ตัวจริง และเทสต์จะเริ่มโกหกทันทีที่โค้ดหันไปพึ่งค่า default

### ทดสอบกับ object แบบเดียวกับที่ application จะได้รับจริง

ความต่างระหว่าง literal กับ instance ของ DTO ไม่ใช่เรื่องพิธีการ `ValidationPipe` ที่ตั้ง `transform: true` ส่งให้ service ไม่ใช่ object ที่มาใน request body แต่เป็น instance ของคลาส DTO ซึ่ง **ทุก** ฟิลด์ที่ประกาศไว้จะมีอยู่ครบ และฟิลด์ที่ไม่ได้ส่งมาจะมีค่าเป็น `undefined`:

```ts
plainToInstance(UpdateTaskDto, { description: 'Новое' })
// UpdateTaskDto { title: undefined, description: 'Новое' }
// Object.keys(dto) → ['title', 'description']
```

เทสต์ที่ส่ง literal `{ description: 'Новое' }` เข้า `service.update()` จึงทดสอบเส้นทางที่ไม่มีอยู่จริงใน application ด้วยเหตุนี้ ใน `tasks.service.spec.ts` DTO สำหรับการตรวจแบบนี้จึงถูกสร้างด้วยวิธีเดียวกับที่ pipe ทำ — คือผ่าน `plainToInstance`

## E2E test

application ถูกประกอบจาก `AppModule` ตัวจริง และตอบ HTTP request จริง:

```ts
const moduleFixture = await Test.createTestingModule({ imports: [AppModule] }).compile()
app = setupApp(moduleFixture.createNestApplication())
await app.init()
```

`app.init()` ยก application ขึ้นมาโดยไม่จับพอร์ต — Supertest คุยกับ HTTP server ตรง ๆ ผ่าน `app.getHttpServer()` พอร์ต `PORT` จึงยังว่าง รันเทสต์คู่ไปกับ `pnpm dev` ได้

ต้องปิด application ใน `afterAll`/`afterEach` เสมอ: ถ้าไม่มี `app.close()` Jest จะไม่จบการทำงานและจะเตือนเรื่อง open handle

### config ของ application ไม่ถูกเขียนซ้ำในเทสต์

global middleware, pipe และ filter ถูกระบุไว้ที่เดียว — ใน `src/setup-app.ts` ซึ่งทั้ง `main.ts` และ e2e test ทุกตัวเรียกใช้:

```ts
export function setupApp(app: INestApplication): INestApplication {
  app.use(cookieParser())
  app.useGlobalFilters(new HttpExceptionFilter())
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  return app
}
```

`JwtStrategy` อ่าน token จาก `req.cookies` — ถ้าไม่มี `cookieParser` route ที่ป้องกันไว้ทุกตัวจะตอบ `401` แม้ว่า request จะมี cookie มาด้วยก็ตาม

`Test.createTestingModule` ประกอบให้แค่โมดูล — ทุกอย่างที่ตอนรันจริงถูกติดเข้าไปใน `main.ts` จะไม่มีอยู่ใน application ของเทสต์ ถ้า copy-paste รายการนั้นไปไว้ในเทสต์ e2e จะกลายเป็นการตรวจ application ที่ config ต่างจาก production และทั้งสองฝั่งจะเคลื่อนออกจากกันตั้งแต่การแก้ครั้งแรก: ลองเอา `forbidNonWhitelisted` ออกจาก `main.ts` ดู เทสต์จะยังเขียวอยู่ เพราะในสำเนาของตัวเองยังมีค่านั้นอยู่ การใช้ฟังก์ชันร่วมกันทำให้การเคลื่อนออกจากกันแบบนี้เกิดไม่ได้

CORS, Swagger และ `listen` ไม่ได้อยู่ใน `setupApp`: ไม่เกี่ยวกับพฤติกรรมของ endpoint ที่กำลังตรวจ CORS ทำงานจาก header `Origin` ซึ่ง supertest ไม่ได้ส่ง, Swagger mount route แยกต่างหาก, ส่วน `listen` เปิดพอร์ต — ในเทสต์แอปอยู่ในหน่วยความจำ

### state ระหว่างเทสต์

`auth.e2e-spec.ts` ยก application ครั้งเดียวใน `beforeAll` และอาศัยข้อมูลในการแยกเทสต์ออกจากกัน: `beforeEach` เรียก `cleanupTestData()` เพื่อลบผู้ใช้ที่ใช้ทดสอบ ซึ่งถูกกว่าการสร้าง application ใหม่ทุกเทสต์อย่างชัดเจน

ส่วน `app.e2e-spec.ts` ไม่มี state เลย จึงใช้ `beforeAll` และยก application ขึ้นครั้งเดียว

### ตัวแปรสภาพแวดล้อม

`AppModule` เรียก `ConfigModule.forRoot()` ไว้ใน decorator `@Module` โดยตรง นั่นแปลว่าสภาพแวดล้อมถูก validate **ตอนที่โมดูลถูก import** การไปตั้งตัวแปรใน `beforeAll` จึงสายเกินไปแล้ว — ตอนนั้น import เกิดขึ้นไปเรียบร้อย

ด้วยเหตุนี้ config ของ e2e จึงดึง `test/setup-env.ts` เข้ามาผ่าน `setupFiles`: hook นี้ทำงานก่อนไฟล์เทสต์จะถูกโหลด

```ts
process.env.CORS_ORIGIN ??= 'http://localhost:3200'
```

`CORS_ORIGIN` เป็นตัวแปรเดียวที่ไม่มีค่า default ใน [Joi schema](../env-variables) และถ้าไม่มีมัน application จะไม่สตาร์ต ตัวดำเนินการ `??=` ไม่เขียนทับค่าที่ตั้งไว้แล้ว: บนเครื่องจะหยิบจาก `.env` ส่วนใน CI จะใช้ค่าสำรองนี้ schema รับ `NODE_ENV=test` ด้วย — Jest ตั้งค่านี้ให้เอง

## เทสต์ครอบคลุมอะไรบ้าง

`pnpm test:cov` จะพิมพ์ตาราง coverage ออกมา สิ่งที่ถูกตัดออกจากรายงานคือไฟล์ spec เอง, `main.ts` (bootstrap ถูกตรวจครบผ่าน e2e อยู่แล้ว) และ `src/generated/` — โค้ดที่ Prisma สร้างขึ้นในเบรนช์ที่มีฐานข้อมูล: มันจะฉุดตัวเลขรวมให้ต่ำลงทั้งที่ไม่เกี่ยวกับโค้ดของโปรเจกต์ เรื่องที่ว่าทำไมเปอร์เซ็นต์ coverage เพียงอย่างเดียวมีความหมายน้อย อยู่ใน[ส่วนรวม](./#worth-keeping-in-mind)

ตอนนี้ในเทมเพลตมี:

- **`tasks.service.spec.ts`** — CRUD ผ่าน Prisma client ที่ mock ไว้: การกรองตามเจ้าของ, การอัปเดตบางส่วนโดยไม่ลบ field อื่น, `NotFoundException` เมื่อ `id` ไม่รู้จัก และ `ForbiddenException` เมื่อเป็น task ของคนอื่น
- **`users.service.spec.ts`** — CRUD ของผู้ใช้: การแปลง code ของ Prisma เป็น HTTP exception — `P2025` → `NotFoundException`, `P2002` → `ConflictException` เมื่อ email ซ้ำ
- **`app.controller.spec.ts`** — `/health` กับ `/dev/config` รวมถึงพฤติกรรมของ `publicUrl` ที่ต่างกันระหว่าง dev กับ production
- **`http-exception.filter.spec.ts`** — การแปลง error ให้เป็น JSON รูปแบบเดียว และการที่ข้อความของ exception ที่ไม่คาดคิดไม่รั่วออกไปถึง client
- **`auth.e2e-spec.ts`** — วงจรเต็ม: สมัคร, เข้าสู่ระบบ, refresh พร้อม rotate token, logout, reuse detection, การเข้าถึง route ที่ป้องกันไว้
- **`app.e2e-spec.ts`** — `/`, `/health`, `/dev/config` และ `404` เมื่อ route ไม่รู้จัก
- **`throttle.e2e-spec.ts`** — `429` เมื่อเกินลิมิตจำนวน request (เป็นชุดแยก ดูด้านบน)

## การเพิ่มเทสต์

สำหรับโมดูลใหม่:

1. unit test ของ service — `src/modules/<ชื่อ>/<ชื่อ>.service.spec.ts` ตรวจลอจิกทางธุรกิจ: คืนค่าอะไร, โยน exception ตัวไหน, state เปลี่ยนอย่างไร
2. e2e test ของ controller — `test/default/<ชื่อ>.e2e-spec.ts` ตรวจ contract ของ HTTP: status code, รูปร่างของ body, การ validate และให้ยก application ผ่าน `setupApp` — ไม่อย่างนั้น validation กับ exception filter จะไม่ทำงาน และเทสต์จะไปล็อก status code ที่ server จริงไม่ได้ตอบ

unit test แยกสำหรับ controller มักจะเกินจำเป็น: ถ้า controller แค่ส่งต่อไปให้ service ก็ไม่มีอะไรให้ตรวจแบบแยกเดี่ยว — สาระทั้งหมดของมัน (route, pipe, status code) เห็นได้เฉพาะในระดับ e2e
