# Migration

migration คือไฟล์ SQL ที่เปลี่ยนฐานข้อมูลจากสถานะ schema หนึ่งไปยังสถานะถัดไป migration ถูกสร้างและรันโดย [Prisma Migrate](https://www.prisma.io/docs/orm/v7/prisma-migrate) หน้านี้อธิบายว่าในเทมเพลตตั้งค่าไว้อย่างไร และควรทำอย่างไรในสถานการณ์ที่พบบ่อย

## สรุปคำสั่ง

คำสั่ง `pnpm prisma ...` รันจาก `apps/backend/` ส่วนคำสั่ง `pnpm db:*` รันจาก root

| งาน                              | คำสั่ง                                                                 |
| -------------------------------- | ------------------------------------------------------------------- |
| สร้างและรัน migration              | `pnpm prisma migrate dev --name <ชื่อ>`                               |
| สร้าง migration เพื่อแก้ไข โดยยังไม่รัน | `pnpm prisma migrate dev --name <ชื่อ> --create-only`                 |
| รัน migration ใหม่                 | `pnpm db:migrate`                                                   |
| generate client ใหม่              | `pnpm db:generate`                                                  |
| ดูว่าอะไรรันแล้ว อะไรยัง              | `pnpm prisma migrate status`                                        |
| ทำเครื่องหมาย migration ที่ล้มเหลว     | `pnpm prisma migrate resolve --rolled-back <ชื่อ>` / `--applied <ชื่อ>` |
| สร้างฐานข้อมูลในเครื่องใหม่            | `pnpm prisma migrate reset` แล้วตามด้วย `pnpm prisma db seed`         |

## ทำงานอย่างไร

ไฟล์อยู่ใน `apps/backend/` ส่วนบันทึกอยู่ในฐานข้อมูลเอง:

| อะไร                  | อยู่ที่ไหน                               | หน้าที่                                                        |
| --------------------- | ------------------------------------ | ----------------------------------------------------------- |
| Schema                | `prisma/schema.prisma`               | ฐานข้อมูลควรมีหน้าตาอย่างไร แก้ไขที่ไฟล์นี้เท่านั้น                       |
| ประวัติ migration       | `prisma/migrations/`                 | หนึ่งโฟลเดอร์ที่มี `migration.sql` ต่อหนึ่งการเปลี่ยนแปลง commit ทั้งหมด |
| บันทึก migration ที่รันแล้ว | ตาราง `_prisma_migrations` ในฐานข้อมูล | migration ไหนรันไปแล้ว และมี checksum อะไร                     |
| Prisma client         | `src/generated/prisma`               | สร้างจาก schema ไม่อยู่ใน repository                            |

schema กับประวัติเป็นสองแหล่งที่แยกกัน สิ่งที่ไปถึงฐานข้อมูลมีแค่ประวัติ: `migrate deploy` รันไฟล์จาก `prisma/migrations/` และไม่อ่าน schema ส่วน client กลับกัน ถูกสร้างจาก schema และไม่รู้อะไรเกี่ยวกับ migration ดังนั้นการเปลี่ยน schema ต้องทำทั้งสองขั้นตอน: migration สำหรับฐานข้อมูล และ generate สำหรับ client

`prisma/migrations/migration_lock.toml` ก็ถูก commit ด้วย: Prisma ใช้ไฟล์นี้ตรวจจับการพยายามเปลี่ยนชนิดฐานข้อมูล

## migration รันอัตโนมัติเมื่อไหร่

โปรเจกต์ตั้งค่าไว้ให้ migration รันเองทุกครั้งที่เริ่ม — ไม่ต้องรันเอง:

| การเริ่ม           | ใครเป็นคนรัน                                                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm dev`       | `predev.mjs` ขั้นตอน `migrations` — [รายละเอียด](/th/guide/structure/scripts/predev)                                              |
| `pnpm docker:up` | container ของ backend ตอน start ก่อนแอปเริ่มทำงาน — [รายละเอียด](/th/guide/structure/apps/backend/docker-image#migration-ตอน-start) |

ทั้งสองกรณีคือ `prisma migrate deploy` มันรันเฉพาะ migration ที่ยังไม่มีในฐานข้อมูล ไม่ถามอะไร ไม่สร้าง migration ใหม่ และไม่สร้างฐานข้อมูลใหม่ migration ที่รันไปแล้วจะถูกข้าม ดังนั้นการรันซ้ำจะไม่เปลี่ยนอะไร ในขณะเดียวกันมันรัน `migration.sql` ตามที่เขียนไว้และไม่เตือนเรื่องข้อมูลหาย — นี่คือเหตุผลที่ต้องตรวจ SQL ก่อน commit

`prisma migrate dev` เป็นเครื่องมือของคนที่เปลี่ยน schema: มันสร้าง migration ใหม่และอาจเสนอให้สร้างฐานข้อมูลใหม่ ใช้ด้วยมือเท่านั้น

## ตั้งแต่แก้ schema จนถึง production

วงจรเต็มของการเปลี่ยน schema กฎหลัก: บน production `migrate deploy` จะรัน `migration.sql` ตามที่เขียนไว้โดยไม่ถาม ดังนั้นทุกอย่างที่ปกป้องข้อมูลต้องทำ **ก่อน commit** และ **ก่อน deploy**

### การพัฒนา

ฐานข้อมูลต้องรันอยู่ — `pnpm dev` หรือ `pnpm db:up` จะยกขึ้นมาให้ คำสั่ง `pnpm prisma ...` รันจาก `apps/backend/`

1. **แก้ schema** — `prisma/schema.prisma`

2. **สร้าง migration โดยยังไม่รัน:**

   ```bash
   pnpm prisma migrate dev --name add_task_priority --create-only
   ```

   จะได้ไฟล์ `prisma/migrations/<วันที่>_add_task_priority/migration.sql` ชื่อควรสั้นและบอกสาระของการเปลี่ยนแปลง เป็น `snake_case` ถ้าการเปลี่ยนแปลงแค่เพิ่มของใหม่ (ตาราง, field ที่ไม่บังคับ) ไม่ต้องใส่ `--create-only` ก็ได้: migration จะรันทันที และข้ามขั้นตอนที่ 4

3. **อ่าน `migration.sql`** ให้ระวังเป็นพิเศษกับคำสั่งที่อาจทำข้อมูลหายหรือล้มเหลวบนตารางที่มีข้อมูล:

   | ใน SQL                                     | อันตรายอย่างไร                             | ควรทำอะไร                                                                  |
   | ------------------------------------------ | ---------------------------------------- | ------------------------------------------------------------------------- |
   | `DROP COLUMN`, `DROP TABLE`                | ข้อมูลถูกลบ                                 | ถ้าเป็นการเปลี่ยนชื่อ — [แทนด้วย `RENAME`](#renaming-a-field-or-model)           |
   | `ADD COLUMN ... NOT NULL` โดยไม่มี `DEFAULT` | migration จะล้มเหลวถ้าตารางมีแถวอยู่          | [ตั้งค่า default หรือแบ่งเป็นหลายขั้นตอน](#a-required-field-on-a-table-with-data) |
   | `ALTER COLUMN ... TYPE`                    | ล้มเหลวหรือทำค่าผิดเพี้ยน ถ้าค่าแปลงเป็นชนิดใหม่ไม่ได้ | ทดสอบกับข้อมูล ถ้าจำเป็นให้เพิ่ม `USING`                                           |
   | `CREATE UNIQUE INDEX`                      | ล้มเหลวถ้าข้อมูลมีค่าซ้ำอยู่แล้ว                    | ลบค่าซ้ำก่อนด้วย `UPDATE`/`DELETE` ใน migration เดียวกัน                         |

   Prisma เองก็เตือนเรื่องข้อมูลหายด้วย — ในคอมเมนต์ต้นไฟล์ `migration.sql` และในผลลัพธ์ของ `migrate dev`

4. **รัน migration:**

   ```bash
   pnpm prisma migrate dev
   ```

5. **ตรวจผลลัพธ์** การรัน `pnpm prisma migrate dev` ซ้ำควรตอบว่า `Already in sync, no schema change or pending migration was found.` — แปลว่า SQL ทำให้ฐานข้อมูลตรงกับ schema พอดี ถ้า Prisma เสนอ migration ใหม่ แปลว่าการแก้ในขั้นตอนที่ 3 ผิด Prisma ไม่ตรวจข้อมูล: ถ้าเปลี่ยนตารางที่มีข้อมูล ให้ใส่แถวทดสอบไว้ก่อน และหลังรันให้ตรวจว่ายังอยู่ครบ (`pnpm prisma studio`)

6. **อัปเดต client** และโค้ดที่ใช้ field ที่เปลี่ยน:

   ```bash
   pnpm prisma generate   # จาก root — pnpm db:generate
   ```

7. **commit schema กับโฟลเดอร์ migration ด้วยกัน** ใน commit เดียว ตอน review ให้อ่าน `migration.sql` อย่างละเอียดเหมือนโค้ด

::: info Shadow database
ก่อนสร้าง migration `migrate dev` จะรันประวัติทั้งหมดบนฐานข้อมูล "shadow" ชั่วคราว เพื่อให้แน่ใจว่าประวัติกับฐานข้อมูลจริงตรงกัน ผู้ใช้ฐานข้อมูลจึงต้องมีสิทธิ์สร้างฐานข้อมูล ผู้ใช้จาก `docker-compose.yml` มีสิทธิ์นี้: image ของ Postgres สร้าง `POSTGRES_USER` เป็น superuser
:::

### Production

1. **ทดสอบ migration กับสำเนาข้อมูล production** ถ้ามันเปลี่ยนตารางที่มีข้อมูล ฐานข้อมูลในเครื่องมักเล็กและสะอาด แต่บน production มีทั้ง `NULL` ค่าซ้ำ และค่าที่คุณไม่รู้ว่ามี ให้ restore สำเนาล่าสุดของฐานข้อมูล production (staging หรือ dump ที่สร้างแบบขั้นตอนที่ 2) แล้วรัน `migrate deploy` กับมัน

2. **สำรองข้อมูล** ฐานข้อมูล production ก่อน deploy — จากโฟลเดอร์โปรเจกต์บนเซิร์ฟเวอร์:

   ```bash
   docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -Fc "$POSTGRES_DB"' > backup.dump
   ```

   restore จากไฟล์สำรอง:

   ```bash
   docker compose exec -T postgres sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists' < backup.dump
   ```

3. **deploy เวอร์ชันใหม่** container ของ backend จะรัน migration เองตอน start — ก่อนโค้ดใหม่เริ่มทำงาน ผ่าน `migrate deploy` ไม่ต้องรันอะไรเอง

4. **ถ้าแอปเวอร์ชันเก่ายังทำงานอยู่ระหว่าง deploy** — หลาย instance, deploy แบบค่อยเป็นค่อยไป — การเปลี่ยนแปลงที่ทำให้เสียต้องแบ่งเป็นขั้นตอนที่เข้ากันได้: [expand and contract](#without-downtime-expand-and-contract)

5. **ถ้า migration ล้มเหลว** container ของ backend จะไม่ start สาเหตุอยู่ใน log ของมัน (`docker compose logs backend`) ขั้นต่อไปอยู่ในหัวข้อ [migration ล้มเหลว](#a-migration-failed) กรณี "ถ้าต้องเก็บข้อมูลไว้"

บน production ห้ามรัน `migrate dev`, `migrate reset` และ `db push`: สองตัวแรกอาจสร้างฐานข้อมูลใหม่ ส่วน `db push` เปลี่ยนฐานข้อมูลโดยข้ามประวัติ migration

## หลัง `git pull`

ไม่ต้องทำอะไร: `pnpm dev` จะ generate client และรัน migration ใหม่ก่อนเริ่ม

ถ้าแอปรันอยู่แล้ว ให้ restart `pnpm dev` หรือรันขั้นตอนเอง (ฐานข้อมูลต้องรันอยู่):

```bash
# จาก root
pnpm db:generate   # ใน apps/backend — pnpm prisma generate
pnpm db:migrate    # ใน apps/backend — pnpm prisma migrate deploy
```

## การเปลี่ยนแปลงที่ทำให้เสีย {#breaking-changes}

แก้ `migration.sql` ได้อย่างปลอดภัยตราบใดที่ migration ยังไม่ได้รัน ดังนั้นจึงสร้างโดยยังไม่รัน แก้ไข แล้วค่อยรัน:

```bash
cd apps/backend
pnpm prisma migrate dev --name rename_bio --create-only   # สร้างโดยยังไม่รัน
# แก้ prisma/migrations/<วันที่>_rename_bio/migration.sql
pnpm prisma migrate dev                                   # รัน
```

migration ที่ commit แล้วห้ามแก้: คนอื่นอาจรันไปแล้ว และ Prisma จะจับการแก้ไขได้จาก checksum การแก้ไขให้ทำด้วย migration ใหม่ ถ้า migration ยังอยู่แค่ในเครื่องคุณ ลบแล้วสร้างใหม่ได้

### การเปลี่ยนชื่อ field หรือโมเดล {#renaming-a-field-or-model}

Prisma Migrate ไม่ได้บันทึกว่าคุณทำอะไรกับ schema: มันเปรียบเทียบสอง snapshot คือ "ก่อน" กับ "หลัง" ใน snapshot เห็นแค่ว่า field `bio` หายไป และ field `biography` ปรากฏขึ้น — จากข้อมูลนี้แยกไม่ออกว่าเป็นการเปลี่ยนชื่อ หรือการลบ field หนึ่งแล้วเพิ่มอีก field ดังนั้น Prisma จึง generate แบบหลัง:

```sql
ALTER TABLE "Profile" DROP COLUMN "bio",
ADD COLUMN "biography" TEXT NOT NULL;
```

ข้อมูลในคอลัมน์จะหายไป ให้แทน SQL ด้วยการเปลี่ยนชื่อ:

```sql
ALTER TABLE "Profile" RENAME COLUMN "bio" TO "biography";
```

โมเดลก็เช่นกัน: ใช้ `ALTER TABLE ... RENAME TO ...` แทนการลบและสร้างตารางใหม่

### field บังคับในตารางที่มีข้อมูล {#a-required-field-on-a-table-with-data}

คอลัมน์ `NOT NULL` ที่ไม่มีค่า default เพิ่มในตารางที่มีแถวอยู่แล้วไม่ได้ — migration จะล้มเหลว ทางเลือก:

- ตั้งค่า default ใน schema (`@default(...)`)
- แบ่ง migration เป็นสามขั้นตอนใน `migration.sql` เดียว: เพิ่มคอลัมน์โดยไม่มี `NOT NULL` เติมค่าด้วย `UPDATE` แล้วจึง `ALTER COLUMN ... SET NOT NULL`

### ไม่มี downtime: expand and contract {#without-downtime-expand-and-contract}

ถ้าแอปเวอร์ชันเก่าทำงานกับฐานข้อมูลที่อัปเดตแล้วอยู่ช่วงหนึ่ง — หลาย instance, deploy แบบค่อยเป็นค่อยไป — แม้แต่การเปลี่ยนชื่อด้วย `RENAME` ก็จะทำให้มันพัง จึงต้องแบ่งการเปลี่ยนแปลงเป็นขั้นตอน ที่แต่ละขั้นเข้ากันได้กับโค้ดปัจจุบัน:

1. **Expand**: เพิ่ม field ใหม่ แอปเขียนลงทั้งสอง field แต่อ่านจาก field เก่า
2. คัดลอกข้อมูลด้วย migration แยก: `UPDATE "Profile" SET biography = bio;`
3. แอปอ่านจาก field ใหม่ แล้วเลิกเขียนลง field เก่า
4. **Contract**: ลบ field เก่า

รายละเอียดเพิ่มเติมใน[เอกสารของ Prisma](https://www.prisma.io/docs/orm/v7/prisma-migrate/workflows/customizing-migrations#example-use-the-expand-and-contract-pattern-to-evolve-the-schema-without-downtime)

## เมื่อมีปัญหา

### migration ล้มเหลว {#a-migration-failed}

`predev` จะหยุดที่ขั้นตอน `migrations` และ Prisma จะแจ้งสาเหตุ:

```
Error: P3018
A migration failed to apply. New migrations cannot be applied before the error is recovered from.
Migration name: 20261002000000_add_task_priority
Database error:
ERROR: column "priority" of relation "Task" contains null values
```

migration ที่ล้มเหลวจะถูกบันทึกใน `_prisma_migrations` และการรัน `deploy` ครั้งถัดไปจะปฏิเสธจนกว่าจะจัดการ:

```
Error: P3009
migrate found failed migrations in the target database, new migrations will not be applied.
```

**ในเครื่อง ถ้าไม่ต้องการข้อมูล**: แก้สาเหตุ — เช่น SQL ใน migration ของคุณที่ยังไม่ได้ commit — แล้ว[สร้างฐานข้อมูลใหม่](#recreating-the-local-database)

**ถ้าต้องเก็บข้อมูลไว้**: ดูสถานะแล้วทำเครื่องหมาย migration เอง:

```bash
cd apps/backend
pnpm prisma migrate status                                  # อะไรรันแล้ว อะไรล้มเหลว
pnpm prisma migrate resolve --rolled-back "<ชื่อ migration>"  # ย้อนการเปลี่ยนแปลงเองแล้ว — รันใหม่
pnpm prisma migrate resolve --applied "<ชื่อ migration>"      # ทำการเปลี่ยนแปลงจนเสร็จเองแล้ว — ถือว่ารันแล้ว
```

ถ้า migration รันไปได้บางส่วน ให้ย้อนขั้นตอนที่ทำไปแล้วด้วยมือก่อน `--rolled-back` รายละเอียดเพิ่มเติมใน[เอกสารของ Prisma](https://www.prisma.io/docs/orm/v7/prisma-migrate/workflows/patching-and-hotfixing#failed-migration)

### `migrate dev` เสนอให้ reset ฐานข้อมูล

ก่อนสร้าง migration `migrate dev` จะเทียบประวัติกับฐานข้อมูล และหยุดถ้าไม่ตรงกัน:

```
Drift detected: Your database schema is not in sync with your migration history.
```

สาเหตุที่พบบ่อย:

- **สลับ branch** อีก branch มี migration ที่รันกับฐานข้อมูลในเครื่องไปแล้ว แต่ branch ปัจจุบันไม่มีไฟล์นั้น
- **migration ที่รันแล้วถูกแก้** Prisma เก็บ checksum ของแต่ละ migration และจับการแก้ไขได้
- **ฐานข้อมูลถูกเปลี่ยนโดยข้าม migration** — ด้วยมือหรือผ่าน `prisma db push`

ทางแก้ที่ถูกต้องคือแก้ที่สาเหตุ: เอาไฟล์ที่หายกลับมา (สลับกลับไป branch ที่มีไฟล์นั้น) หรือย้อนการแก้ migration ที่รันแล้ว ถ้าไม่ต้องการข้อมูลในเครื่อง ยอมให้ reset จะง่ายกว่า

`migrate deploy` ที่ `pnpm dev` รัน ไม่ได้ค้นหาความไม่ตรงกันแบบนี้: มันแค่เตือนเมื่อ migration ถูกแก้ และไม่สังเกตเห็น migration ที่หายไปหรือการแก้ฐานข้อมูลด้วยมือ ตรวจประวัติเองได้ด้วย `pnpm prisma migrate status` จาก `apps/backend`: มันแสดง migration ที่ยังไม่รัน ที่ล้มเหลว และที่ไม่มีในเครื่อง

### สร้างฐานข้อมูลในเครื่องใหม่ {#recreating-the-local-database}

สร้างฐานข้อมูลใหม่และรัน migration ทั้งหมดตั้งแต่ต้น — **ข้อมูลทั้งหมดจะถูกลบ**:

```bash
cd apps/backend
pnpm prisma migrate reset   # จะถามยืนยัน
pnpm prisma db seed         # seed หลัง reset ต้องรันแยก
```

seed สร้างบัญชี admin — [รายละเอียด](/th/guide/database/prisma#seed-admin-account)
