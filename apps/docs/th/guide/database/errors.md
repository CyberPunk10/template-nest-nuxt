# Error ของ Prisma

Prisma แปลง error ของ PostgreSQL ให้เป็น code ของตัวเองผ่าน `PrismaClientKnownRequestError` ซึ่งช่วยให้จัดการ error ได้โดยไม่ต้อง parse ข้อความจาก driver

Code ที่พบบ่อยที่สุด:

| Code    | ความหมาย                                                | การตอบสนองทั่วไป                       |
| ------- | ------------------------------------------------------- | ------------------------------------ |
| `P2002` | ละเมิด unique constraint (เช่น email ถูกใช้ไปแล้ว)           | `409 Conflict`                       |
| `P2025` | ไม่พบ record ตอน `update`, `delete`, `findUniqueOrThrow` | `404 Not Found`                      |
| `P2003` | ละเมิด foreign key constraint                            | `409 Conflict` หรือ `400 Bad Request` |

Pattern ที่ถูกต้องตามหลัก idiomatic คือ ทำ `update`/`delete` ไปเลยแล้วดักจับ P2025 แทนที่จะทำ `findUniqueOrThrow` ก่อนล่วงหน้า

::: tip TOCTOU (Time-Of-Check Time-Of-Use)
คลาสของ bug ที่ระหว่างการตรวจสอบเงื่อนไขกับการใช้งานเงื่อนไขนั้นมีช่องว่างซึ่งสถานะอาจเปลี่ยนแปลงได้ ในที่นี้: ระหว่าง `findUniqueOrThrow` (การตรวจสอบ) กับ `update`/`delete` (การใช้งาน) process อื่นสามารถลบ record ได้ทัน
:::

❌ **สองคำสั่งที่มีช่อง TOCTOU:**

```typescript
// คำสั่งที่ 1: ตรวจสอบว่ามีอยู่หรือไม่
await this.prisma.user.findUniqueOrThrow({ where: { id } }).catch(() => {
  throw new NotFoundException() // จัดการแล้ว
})
// ← ตรงนี้ process อื่นอาจลบ record ได้
// คำสั่งที่ 2: update — โยน P2025 ที่ไม่ได้จัดการ → 500
return await this.prisma.user.update({ where: { id }, data: dto })
```

✅ **คำสั่งเดียว จัดการ P2025 อย่างชัดเจน:**

```typescript
try {
  return await this.prisma.user.update({ where: { id }, data: dto })
} catch (e) {
  if (e instanceof PrismaClientKnownRequestError) {
    if (e.code === 'P2025') throw new NotFoundException()
    if (e.code === 'P2002') throw new ConflictException()
  }
  throw e
}
```

วิธีนี้ตัดช่อง TOCTOU ระหว่างสองคำสั่งออกไป และลดจำนวนครั้งที่เรียก DB ลงครึ่งหนึ่ง

รายการ code ทั้งหมด: [Prisma Error Reference](https://www.prisma.io/docs/orm/reference/error-reference)
