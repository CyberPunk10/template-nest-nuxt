# Backend (NestJS <img src="https://nestjs.com/img/logo-small.svg" height="20" style="vertical-align:middle">)

## ทำงานอย่างไร

- **การลงทะเบียน:** `POST /auth/register` — สร้างผู้ใช้ แล้วตั้งค่า cookie ทั้งสองตัว
- **การเข้าสู่ระบบ:** `POST /auth/login` — ตรวจสอบ email+password ผ่าน bcrypt แล้วตั้งค่า cookie
- **Cookies:** `access_token` (JWT, 15 นาที) และ `refresh_token` (7 วัน) — ทั้งคู่เป็น httpOnly เข้าถึงจาก JS ไม่ได้
- **Route ที่ป้องกันไว้:** `JwtAuthGuard` แบบ global ตรวจสอบ `access_token` ในทุก request
- **Refresh:** เมื่อ access token หมดอายุ frontend จะเรียก `POST /auth/refresh` อัตโนมัติ refresh token จะถูก rotate ทุกครั้งที่มีการ refresh
- **Session:** refresh token แต่ละตัวถูกเก็บในตาราง `Session` เป็น HMAC hash ทุกครั้งที่ refresh token record เดิมจะถูกทำเครื่องหมาย `isUsed: true` แล้วสร้าง record ใหม่ขึ้นมา การ logout จะลบ session ที่ active อยู่ออกจาก DB
- **Reuse detection:** ถ้า refresh token ที่ถูกใช้ไปแล้วถูกนำมาแสดงซ้ำอีกครั้ง — เป็นสัญญาณว่า token ถูกขโมย session ทั้งหมดในตระกูลเดียวกัน (`familyId`) จะถูก invalidate

### Flag ของ cookie

token ทั้งสองตัวถูกตั้งด้วย flag ชุดเดียวกัน:

```ts
{
  httpOnly: true,
  sameSite: 'strict',
  secure: isProd,     // NODE_ENV === 'production'
  path: '/',
}
```

- `httpOnly` — JavaScript มองไม่เห็น cookie นี้ XSS จึงขโมย token ไม่ได้
- `sameSite: 'strict'` — เบราว์เซอร์จะไม่ส่ง cookie เมื่อเข้ามาจากเว็บอื่น: ป้องกัน CSRF
- `secure` เปิดใช้ **เฉพาะ** ตอน production: cookie แบบนี้จะไม่ถูกส่งผ่าน HTTP ธรรมดาเลย การพัฒนาในเครื่องที่ไม่มี TLS จึงจะ login ไม่ได้
- `path: '/'` ระบุไว้อย่างชัดเจนด้วยเหตุผล — Express ต้องการให้ `path` ตรงกันทั้งตอนตั้งและตอนลบ ไม่งั้น `clearCookie()` ตอน logout จะลบ cookie ไม่ออก

อายุของ token มาจาก `JWT_EXPIRES_IN` และ `REFRESH_TOKEN_EXPIRES_DAYS` — [ตัวแปรของ backend](../structure/apps/backend/env-example)

### ทำไมต้องเก็บ session ไว้ใน DB

JWT ไม่สามารถ invalidate ก่อนหมดอายุได้ — นี่คือคุณสมบัติพื้นฐานของมาตรฐาน ถ้าผู้ใช้ logout ออกไปหรือเปลี่ยนรหัสผ่าน access token ก็ยังคง valid อยู่ได้จนถึง 15 นาที

refresh token ใน DB แก้ปัญหานี้: เมื่อ logout หรือเปลี่ยนรหัสผ่าน session จะถูกลบออกจาก DB และไม่สามารถขอ access token ใหม่ได้อีก ด้วยวิธีนี้เวลา "รอด" สูงสุดของ token ที่ถูก compromise จะถูกจำกัดไว้ที่อายุของ access token (15 นาที)

ความสามารถเพิ่มเติมที่ตาราง `Session` มอบให้:

- **ออกจากระบบจากทุกอุปกรณ์** — ลบ session ทั้งหมดของผู้ใช้
- **รายการ session ที่ active** — แสดงให้ผู้ใช้เห็นว่าเข้าสู่ระบบอยู่ที่ไหนบ้าง (browser, IP, เวลา)
- **บังคับ logout** — ผู้ดูแลระบบสามารถลบ session ได้

### การ rotate token และ reuse detection

ทุกครั้งที่เรียก `POST /auth/refresh` จะเกิด **การ rotate**: refresh token เดิมถูกปิดใช้งาน แล้วออกตัวใหม่ให้ นี่คือมาตรฐาน RFC 9700 (OAuth 2.0 Security BCP)

**ตาราง `Session` ของผู้ใช้คนเดียวมีหน้าตาอย่างไร:**

```
| เหตุการณ์               | familyId | hash             | isUsed                       |
| --------------------- | -------- | ---------------- | ---------------------------- |
| Login จากโทรศัพท์       | f1       | "A"              | false   ← active             |
| Refresh (โทรศัพท์)      | f1       | "A"              | true    ← ถูกปิดใช้งาน          |
| f1                    | "B"      | false   ← active |
| Refresh (โทรศัพท์อีกครั้ง) | f1       | "B"              | true    ← ถูกปิดใช้งาน          |
| f1                    | "C"      | false   ← active |
| Login จากโน้ตบุ๊ก        | f2       | "D"              | false   ← active (คนละตระกูล) |
```

ในแต่ละตระกูล (`familyId`) จะมี record ที่ active (`isUsed: false`) อยู่เพียงหนึ่งเดียวเสมอ record ที่มี `isUsed: true` คือ "กับดัก": ถ้ามีใครนำ token เก่ามาแสดง เซิร์ฟเวอร์จะตรวจจับได้

**สถานการณ์ reuse attack:**

```
Login                  → { familyId: f1, hash: "A", isUsed: false }

Refresh (ถูกต้องตามสิทธิ์) → { familyId: f1, hash: "A", isUsed: true  }  (เก่า)
                          { familyId: f1, hash: "B", isUsed: false }  (ใหม่, active)

Refresh (ผู้โจมตีขโมย token "A" แล้วนำมาใช้ซ้ำ):
  → เซิร์ฟเวอร์ค้นหา hash("A") → พบ record ที่ isUsed: true
  → สัญญาณการ compromise: ลบทุก record ที่มี familyId: f1
  → ผู้ใช้ถูกบังคับ logout จากโทรศัพท์
  → session ของโน้ตบุ๊ก (f2) ไม่ได้รับผลกระทบ
```

record ที่มี `isUsed: true` จำเป็นแค่ในฐานะกับดักเท่านั้น ตราบใดที่ token ต้นฉบับยังอาจมีชีวิตอยู่ได้ Cron job จะลบทุก record ที่ `expiresAt < now` — ทั้งกับดัก `isUsed: true` และ session ที่ active ของผู้ใช้ที่ไม่ได้เข้ามานาน (ดู [การล้าง session ที่หมดอายุ](#การล้าง-session-ที่หมดอายุ))

**`familyId`** รวมทุกการ rotate ของการเข้าสู่ระบบครั้งเดียวกันเข้าไว้ด้วยกัน ด้วยเหตุนี้เมื่อเกิดการ compromise จะมีเฉพาะสายที่ถูก compromise เท่านั้นที่ถูก invalidate ไม่ใช่ทุกอุปกรณ์ของผู้ใช้พร้อมกัน

### ทำไมใช้ HMAC ไม่ใช่ bcrypt สำหรับ refresh token

bcrypt ไม่ deterministic — ให้ hash ต่างกันทุกครั้ง จึงไม่สามารถค้นหา session ใน DB จาก hash โดยตรงได้ ต้องโหลด session ทั้งหมดออกมาแล้วไล่ตรวจทีละตัว — เป็นการ query แบบ O(n)

HMAC เป็น deterministic: token หนึ่งตัว + secret หนึ่งตัว = ได้ hash เดียวกันเสมอ ทำให้ค้นหา session ได้ในการ query ครั้งเดียว: `WHERE refreshTokenHash = hmac(token, secret)`

ข้อแลกเปลี่ยน: ถ้า `REFRESH_TOKEN_SECRET` รั่วไหล — refresh token ทั้งหมดมีโอกาสถูก compromise พร้อมกัน วิธีบรรเทา (Mitigation): เก็บ secret ไว้ในที่จัดเก็บที่ปลอดภัย (Vault, AWS Secrets Manager) และ rotate มันเป็นระยะ

## การป้องกัน email enumeration (timing attack)

เมื่อ login ด้วย email ที่ไม่มีอยู่จริง การ implement แบบไร้เดียงสาจะตอบกลับทันที — โดยไม่ผ่าน bcrypt ผู้ประสงค์ร้ายสามารถดูจากเวลาตอบกลับเพื่อระบุได้ว่า email นั้นลงทะเบียนอยู่ในระบบหรือไม่

วิธีแก้: `validateUser` จะรัน `bcrypt.compare` เสมอ แม้ว่าจะไม่พบผู้ใช้ก็ตาม — โดยใช้ `dummyHash`:

```
พบ email        → bcrypt.compare(password, user.passwordHash)  ~2-100ms
ไม่พบ email      → bcrypt.compare(password, dummyHash)          ~2-100ms (เวลาเท่ากัน)
```

`dummyHash` ถูก generate **หนึ่งครั้งตอนเริ่มต้น** ผ่าน `onModuleInit()` ด้วยค่า `BCRYPT_ROUNDS` ปัจจุบัน สิ่งนี้สำคัญ: hash ที่ hardcode ไว้ด้วย cost=12 คงที่ จะสร้างความต่างของ timing ขึ้นมาในการทดสอบและสภาพแวดล้อม staging ที่ตั้งค่า `BCRYPT_ROUNDS=4`

## สถาปัตยกรรม Passport: strategy และ guard

Passport ทำงานผ่านสองแนวคิด: **strategy** (จะตรวจสอบผู้ใช้อย่างไร) และ **guard** (จะให้ผ่านไปต่อหรือไม่)

### Strategy

strategy คือ class ที่มีเมธอด `validate()` ซึ่งตอบคำถามว่า "ผู้ใช้คนนี้คือใคร?" ผลลัพธ์ของ `validate()` นั้น Passport จะใส่ลงใน `req.user` ให้อัตโนมัติ

**`LocalStrategy`** — ใช้เฉพาะตอน login (`POST /auth/login`) เท่านั้น Passport จะดึง `email` และ `password` ออกจาก body ของ request เองแล้วส่งเข้าไปใน `validate()` ในนั้นจะมีการตรวจสอบรหัสผ่านผ่าน `bcrypt.compare` ถ้าตรวจสอบไม่ผ่าน — จะโยน `UnauthorizedException`

**`JwtStrategy`** — ใช้ในทุก route ที่ป้องกันไว้ Passport จะดึง `access_token` ออกจาก cookie เอง ตรวจสอบ signature และอายุ แล้วส่ง payload (`{ sub, email }`) เข้าไปใน `validate()` ไม่ต้องเขียน logic การ verify token เอง — Passport ทำให้แทน

### Guard

guard เป็นตัวตัดสินว่า — จะให้ request ผ่านไปต่อหรือไม่ มันจะเรียก strategy ขึ้นมาทำงานภายในตัวมันเอง

**`LocalAuthGuard`** — ใช้ด้วยตนเองผ่าน `@UseGuards(LocalAuthGuard)` เฉพาะบน route login เท่านั้น มันจะรัน `LocalStrategy`

**`JwtAuthGuard`** — ถูก register ไว้แบบ global ผ่าน `APP_GUARD` จึงทำงานกับทุก request ที่เข้ามา logic:

1. อ่าน metadata ของ route: มี `@Public()` หรือไม่?
2. ถ้ามี — ปล่อย request ผ่านไปโดยไม่ตรวจสอบ token
3. ถ้าไม่มี — รัน `JwtStrategy` เพื่อตรวจสอบ cookie

### request เดินทางผ่านระบบอย่างไร

**`POST /auth/login`** (route ถูกทำเครื่องหมาย `@Public()` + `@UseGuards(LocalAuthGuard)`):

```
→ JwtAuthGuard: เห็น @Public() → ข้ามการตรวจสอบ JWT
→ LocalAuthGuard: รัน LocalStrategy
→ LocalStrategy.validate(email, password) → bcrypt.compare
→ req.user = ออบเจ็กต์ผู้ใช้ที่ไม่มี passwordHash
→ เมธอดของ controller ถูกเรียกทำงาน
```

**`GET /users`** (route ที่ป้องกันไว้):

```
→ JwtAuthGuard: ไม่มี @Public() → รัน JwtStrategy
→ JwtStrategy: ดึง access_token ออกจาก cookie → verify JWT
→ req.user = { sub: userId, email }
→ เมธอดของ controller ถูกเรียกทำงาน
```

**`GET /users`** โดยไม่มี token:

```
→ JwtAuthGuard: ไม่มี @Public() → รัน JwtStrategy
→ JwtStrategy: ไม่มี cookie → strategy คืนค่า false
→ JwtAuthGuard.handleRequest: โยน UnauthorizedException → 401
```

### `@Public()` — decorator ทำงานอย่างไร

`@Public()` เขียน metadata ลงไปในตัว class หรือเมธอดของ controller โดยตรงในตอน compile `JwtAuthGuard` จะอ่าน metadata เหล่านี้ผ่าน `Reflector` ก่อนทุก request นี่เป็นกลไกฝั่ง server — client ไม่สามารถส่งผลต่อ metadata ของ route ได้ เพราะมันอยู่ใน memory ของ process

## วิธีเปิด route ให้เป็น public

โดยค่าเริ่มต้น route ทั้งหมดของ NestJS ถูกปิดไว้ด้วย `JwtAuthGuard` แบบ global การจะเปิด route ใดเป็นการเฉพาะ:

```typescript
import { Public } from '../auth/decorators/public.decorator'

@Public()
@Get('health')
health() {
  return { status: 'ok' }
}
```

## `passthrough` ใน controller ทำงานอย่างไร

```typescript
@Res({ passthrough: true }) res: Response
```

โดยค่าเริ่มต้น ถ้าคุณ inject `@Res()` NestJS จะมอบการควบคุม response ให้คุณทั้งหมด — ต้องเรียก `res.send()` เอง `passthrough: true` เป็นการบอก NestJS ว่า: "ผม inject `res` เข้ามาแค่เพื่อตั้งค่า cookie ส่วนตัว response นั้นคุณส่งเองเถอะ" ถ้าไม่มีสิ่งนี้ การ `return` จากเมธอดของ controller จะไม่ส่งอะไรออกไปเลย

## Rate limiting

แอปพลิเคชันได้รับการป้องกันจาก brute-force ผ่าน `@nestjs/throttler`

| ENV              | ค่าเริ่มต้น    | ใช้กับ        |
| ---------------- | ---------- | ----------- |
| `THROTTLE_TTL`   | `60000` ms | หน้าต่างการนับ |
| `THROTTLE_LIMIT` | `100`/min  | ทั้งแอปพลิเคชัน |

Limit นับ **แยกตามแต่ละ IP**

### ThrottlerGuard ถูกใช้กับ endpoint อย่างไร

`ThrottlerGuard` ถูก register เป็น global guard ผ่าน `APP_GUARD` — **ทุก endpoint** จะได้รับการป้องกันอัตโนมัติ (100/min)

`@Throttle({ default: { ttl, limit } })` เขียนทับ limit ของ endpoint ใดเป็นการเฉพาะ:

```
APP_GUARD: ThrottlerGuard                                      ← 100/min กับทุกอย่าง

POST /auth/login     @Throttle({ default: { limit: 10 } })     ← 10/min (เดารหัสผ่าน)
POST /auth/register  @Throttle({ default: { limit: 10 } })     ← 10/min (ลงทะเบียนจำนวนมาก)
POST /auth/refresh   @Throttle({ default: { limit: 10 } })     ← 10/min (เดา token)
POST /auth/logout                                              ← 100/min (global)
GET  /auth/me                                                  ← 100/min (global)
```

endpoint ของ auth ได้รับ limit ที่เข้มงวดกว่าโดยกำหนดไว้ใน decorator ตรงๆ — เห็นได้ทันทีว่า limit เท่าไหร่และทำไม

### เมื่ออยู่หลัง reverse proxy

ใน production แอปพลิเคชันมักอยู่หลัง nginx หรือ Cloudflare ในกรณีนี้ทุก request จะมาถึง NestJS จาก IP เดียวคือ IP ของ proxy — throttler จะนับ limit ผู้ใช้ทั้งหมดเป็นเหมือนคนเดียว

วิธีแก้ — ตั้งค่า `getTracker` ให้อ่าน IP จริงจาก header `X-Forwarded-For`:

```typescript
ThrottlerModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    throttlers: [
      { name: 'default', ttl: config.get('THROTTLE_TTL'), limit: config.get('THROTTLE_LIMIT') },
    ],
    getTracker: (req) => req.headers['x-forwarded-for'] ?? req.ip,
  }),
})
```

> **สำคัญ:** จะเชื่อ `X-Forwarded-For` ได้ก็ต่อเมื่อมันถูกกำหนดค่าโดย proxy ที่คุณไว้ใจเท่านั้น ถ้า header นี้ client สามารถปลอมได้ — นั่นคือช่องทางเลี่ยง rate limiting ต้องแน่ใจว่า nginx/Cloudflare เขียนทับ header นี้ ไม่ใช่ต่อท้ายค่าที่มีอยู่เดิม

### การทดสอบ

Throttler ถูกครอบคลุมด้วยชุดทดสอบ e2e สองชุดที่มีการตั้งค่าต่างกัน:

**`jest-e2e.json`** — auth-test หลัก (`test/default/`) Throttler **ถูกปิด** ผ่าน `skipIf`:

```typescript
skipIf: () => config.get('APP_ENV') === 'test',
```

`APP_ENV=test` ถูกตั้งค่าใน `test/setup-e2e.ts` ก่อนที่ module จะถูกโหลด ถ้าไม่มีสิ่งนี้ การทดสอบจะล้มเหลวด้วย 429 ตอนสร้างผู้ใช้ทดสอบ

**`jest-e2e-throttle.json`** — throttle-test (`test/throttle/`) Throttler **ถูกเปิด** (`APP_ENV=production`, `test/setup-e2e-throttle.ts`) ตรวจสอบพฤติกรรมจริง:

- limit แบบ global (`THROTTLE_LIMIT=12`) ทำงานที่ `/auth/me` — request ที่ 13 คืนค่า 429
- limit แบบ local (`limit: 10` บน route ของ auth) ทำงานก่อน global — request ที่ 11 ที่ `/auth/register` คืนค่า 429

```bash
pnpm test:e2e           # test หลัก (throttler ปิด)
pnpm test:e2e:throttle  # throttle-test (throttler เปิด)
```

## RBAC (Role-Based Access Control) และ ownership

### Roles (บทบาท)

ผู้ใช้แต่ละคนมี role (`Role.admin` หรือ `Role.user` — Prisma enum ที่ generate มาจาก `schema.prisma`) ซึ่งถูกฝังไว้ใน payload ของ JWT ตอน login และเข้าถึงได้ผ่าน `req.user.role` (ดู `JwtStrategy`) โดยค่าเริ่มต้น (`@default(user)` ใน schema) ผู้ใช้ใหม่ที่สร้างผ่าน `POST /auth/register` จะได้ `Role.user` เสมอ — การลงทะเบียนปกติไม่สร้าง admin ได้เลย

วิธีเดียวที่จะได้ admin account คือผ่าน seed (ดู [Seed: สร้าง admin account](#seed-สร้าง-admin-account) ด้านล่าง)

### `RolesGuard` และ `@Roles()`

`RolesGuard` ถูก register เป็น global guard ผ่าน `APP_GUARD` **ต่อจาก** `JwtAuthGuard` — เพื่อให้แน่ใจว่า `req.user` ถูกกำหนดค่าแล้วก่อนที่จะตรวจสอบ role guard นี้อ่าน metadata `@Roles()` ผ่าน `Reflector` ถ้าไม่มี decorator นี้ — จะปล่อยผ่านโดยไม่ตรวจสอบ role

```typescript
@Roles(Role.admin)
@Get()
findAll(): Promise<SafeUser[]> {
  return this.usersService.findAll()
}
```

ใช้กับ `GET /users` และ `GET /tasks/all` — ทั้งสองคืนข้อมูลของผู้ใช้ทุกคน และจำกัดไว้ให้ใช้ได้แค่ `admin`

### การตรวจสอบ ownership

ต่างจาก role การเข้าถึง resource เฉพาะ (profile ของผู้ใช้เอง, task) ไม่ได้ตรวจผ่าน decorator — แต่ผูกกับความเป็นเจ้าของ:

- **`UsersController`**: `assertSelf` เทียบ `id` จาก URL กับ `user.sub` จาก JWT และ throw `ForbiddenException` ถ้าไม่ตรงกัน — ใช้กับ `PUT/DELETE /users/:id` เท่านั้น หมายความว่ามีแค่เจ้าของ profile เท่านั้นที่แก้ไขหรือลบได้ ไม่ว่า role จะเป็นอะไร (รวมถึง `admin`)
- **`GET /users/:id`** ใช้การตรวจสอบที่ผ่อนปรนกว่าคือ `assertSelfOrAdmin` — เข้าถึงได้ทั้งเจ้าของ profile **หรือ** `admin` คนไหนก็ได้ (เช่น เพื่อ support/moderation) ความไม่สมมาตรนี้ตั้งใจทำ: การอ่านข้อมูลของคนอื่นมีความเสี่ยงต่ำ ในขณะที่การเขียนลง profile ของคนอื่นผ่าน self-service route เป็นความเสี่ยงที่ไม่ควรให้แบบ implicit ถ้าต้องการให้ admin เขียนข้อมูลของผู้ใช้คนอื่นได้เต็มรูปแบบ ต้องทำเป็น feature แยกต่างหาก (เช่น endpoint สำหรับ admin โดยเฉพาะที่มี audit trail ของตัวเอง) ไม่ใช่การขยาย `assertSelf`
- **`TasksController`** (`PUT/DELETE /tasks/:id`): `TasksService.findOne(id, userId)` ตรวจว่า task เป็นของผู้ใช้คนปัจจุบันจริง และ throw `ForbiddenException` ถ้าไม่ตรงกัน `GET /tasks/all` (เฉพาะ `admin`) เป็นทางเดียวที่จะเห็น task ของผู้ใช้ทุกคน

## Seed: สร้าง admin account

### ทำไมต้องมี

การลงทะเบียนปกติ (`POST /auth/register`) จะสร้างผู้ใช้ด้วย role `user` เสมอ — นี่คือสิ่งที่ Prisma schema รับประกัน (`role Role @default(user)`) ไม่ใช่การตรวจสอบใน code ดังนั้นจึงไม่มีทางถูกข้ามด้วยความผิดพลาดใน business logic ได้ หมายความว่าถ้าไม่มีขั้นตอนแยก ระบบจะไม่มี `admin` เลยแม้แต่คนเดียว และ route อย่าง `GET /users` กับ `GET /tasks/all` (ที่ guard ไว้ด้วย `@Roles(Role.admin)`) จะเข้าถึงไม่ได้เลยสำหรับทุกคน

seed (`prisma/seed.ts`) มีไว้เพื่อแก้ปัญหานี้โดยเฉพาะ: สร้าง admin account หนึ่งบัญชีนอก flow ปกติของผู้ใช้ เป็นส่วนหนึ่งของการเตรียม environment ไม่ใช่ตอนที่แอปกำลังรันอยู่

### ทำงานอย่างไร

`prisma/seed.ts` เป็น Node script ธรรมดาที่เชื่อมต่อ database ตรง (ใช้ `PrismaPg` adapter ตัวเดียวกับ `PrismaService`) และทำ upsert-by-fact:

```typescript
const existing = await prisma.user.findUnique({ where: { email } })
if (existing) return // มีอยู่แล้ว — ไม่ทำอะไร

await prisma.user.create({
  data: { name: 'Admin', email, passwordHash, role: 'admin' },
})
```

email และ password มาจาก `ADMIN_EMAIL`/`ADMIN_PASSWORD` (ดู `.env`) ถ้าตัวแปรใดตัวแปรหนึ่งไม่ได้ตั้งค่าไว้ — seed จะแค่ print คำเตือนแล้วจบโดยไม่มี error แอปทำงานได้ปกติแม้ไม่มี admin account ขั้นตอนนี้ไม่ได้บังคับ

script นี้ **idempotent** — รันซ้ำบน database ที่ seed ไปแล้วจะไม่สร้างซ้ำ และไม่แก้ password ของ admin ที่มีอยู่ แค่ print ว่ามีอยู่แล้ว

### วิธีรัน

ทั้ง `migrate dev` และ `migrate reset` ไม่รัน seed ส่วน `pnpm dev` รันมันเป็นขั้นตอนเตรียมก่อนเริ่ม ถ้าจะเรียกเองให้ใช้:

```bash
pnpm prisma migrate reset   # สร้าง database ใหม่ (ถ้าจำเป็น)
pnpm prisma db seed         # ไม่บังคับ: pnpm dev ครั้งถัดไปจะรัน seed ให้ด้วย
```

คำสั่ง seed ถูกกำหนดไว้ใน `prisma.config.ts` — นี่คือสิ่งที่ `prisma db seed` รันจริง:

```typescript
migrations: {
  path: 'prisma/migrations',
  seed: 'tsx prisma/seed.ts',
},
```

> **`tsx`** — TypeScript runner ที่เอกสารของ Prisma 7 แนะนำสำหรับ seed

### Production

`ADMIN_EMAIL`/`ADMIN_PASSWORD` ใน `.env.example` เป็น placeholder ธรรมดา เหมือน `JWT_SECRET` ตั้งค่าของตัวเองก่อนใช้งานจริง หลังจาก seed รันสำเร็จครั้งแรก ควรเปลี่ยน password ของ admin account ผ่าน flow ปกติของแอป (หรือแค่ไม่เก็บ password production ไว้ใน `.env` นานเกินกว่าที่จำเป็นสำหรับรัน seed)

## การล้าง session ที่หมดอายุ

ทุกครั้งที่ rotate record เดิมจะยังคงอยู่ในตาราง `Session` โดยมี `isUsed: true` ถ้าผู้ใช้ refresh วันละครั้งตลอด 7 วัน — จะสะสมได้ 7 record ต่อหนึ่งสาย ถ้าไม่ล้าง ตารางจะโตขึ้นไม่มีที่สิ้นสุด

`SessionCleanupService` รัน cron job ทุกคืนเวลา 03:00 น. และลบทุก record ที่ `expiresAt < now`:

```typescript
@Cron(CronExpression.EVERY_DAY_AT_3AM)
async cleanupExpiredSessions() {
  await this.prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  })
}
```

สิ่งนี้ลบไปพร้อมกันทั้ง:

- record ที่ `isUsed: true` ซึ่งหมดอายุแล้ว (ไม่ต้องใช้เป็นกับดักอีกต่อไป — token นำมาแสดงไม่ได้แล้ว)
- session ที่ active แต่ `expiresAt` หมดอายุ (ผู้ใช้ไม่ได้เข้ามา 7 วันขึ้นไป)

## ตัวแปร ENV

| ตัวแปร                        | คำอธิบาย                                                                    | ค่าเริ่มต้น    |
| ---------------------------- | ------------------------------------------------------------------------- | ---------- |
| `THROTTLE_TTL`               | หน้าต่าง rate limiting (ms)                                                 | `60000`    |
| `THROTTLE_LIMIT`             | จำนวน request สูงสุดต่อหน้าต่าง (global)                                        | `100`      |
| `JWT_SECRET`                 | secret สำหรับ sign JWT (อย่างน้อย 32 ตัวอักษร)                                  | — (บังคับ)   |
| `JWT_EXPIRES_IN`             | อายุของ access token                                                       | `15m`      |
| `REFRESH_TOKEN_SECRET`       | secret สำหรับ HMAC refresh token (อย่างน้อย 32 ตัวอักษร)                        | — (บังคับ)   |
| `REFRESH_TOKEN_EXPIRES_DAYS` | อายุของ refresh token (วัน)                                                 | `7`        |
| `BCRYPT_ROUNDS`              | cost factor ของ bcrypt สำหรับ hash รหัสผ่าน                                   | `12`       |
| `ADMIN_EMAIL`                | email ของ admin account สร้างโดย seed (ดู [Seed](#seed-สร้าง-admin-account)) | — (ไม่บังคับ) |
| `ADMIN_PASSWORD`             | password ของ admin account สร้างโดย seed                                   | — (ไม่บังคับ) |

## E2E test

**`test/default/auth.e2e-spec.ts`** — กลไกการ authorization (throttler ปิด):

- การลงทะเบียน: สร้างผู้ใช้, ตั้งค่า cookie, ความขัดแย้งเรื่อง email, การ validate
- การ login: ข้อมูลรับรองที่ถูกและผิด
- `GET /auth/me`: มี token และไม่มี
- Refresh: rotate token, invalidate ตัวเก่า, token ใหม่ valid
- Reuse detection: การนำ token เก่ามาใช้ซ้ำจะ invalidate ทั้งตระกูล; session ของอุปกรณ์อื่นไม่ได้รับผลกระทบ
- Logout: ล้าง session ใน DB, idempotent, ทำงานได้แม้ไม่มี token

**`test/throttle/throttle.e2e-spec.ts`** — rate limiting (throttler เปิด รายละเอียดในหัวข้อ Rate limiting → การทดสอบ)

```bash
pnpm test:e2e           # auth-test
pnpm test:e2e:throttle  # throttle-test
```

## เอกสารอ้างอิง

- [NestJS Authentication](https://docs.nestjs.com/security/authentication) — Guards, pattern `@Public()`, global guard ผ่าน `APP_GUARD`
- [NestJS Passport (recipes)](https://docs.nestjs.com/recipes/passport) — `LocalStrategy`, `JwtStrategy`, `PassportModule`
- [NestJS Guards](https://docs.nestjs.com/guards) — `canActivate`, `ExecutionContext`, `Reflector`
- [NestJS Custom Decorators](https://docs.nestjs.com/custom-decorators) — `SetMetadata`, `@Public()` ทำงานอย่างไร
- [@nestjs/jwt](https://github.com/nestjs/jwt) — `JwtModule.registerAsync`, `JwtService.sign()`, `JwtModuleOptions`
- [cookie-parser](https://www.npmjs.com/package/cookie-parser) — middleware สำหรับอ่าน cookie ใน Express/NestJS
- [RFC 9700 — OAuth 2.0 Security BCP](https://datatracker.ietf.org/doc/html/rfc9700) — refresh token rotation, reuse detection
- [@nestjs/throttler](https://docs.nestjs.com/security/rate-limiting) — rate limiting, `ThrottlerGuard`, `@Throttle()`, `getTracker`
- [@nestjs/schedule](https://docs.nestjs.com/techniques/task-scheduling) — cron job, `@Cron()`, `CronExpression`
