import 'dotenv/config'
import * as bcrypt from 'bcrypt'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'

// Заводит admin-аккаунт для первого запуска. Идемпотентно: upsert по email,
// повторный запуск (например, через `prisma migrate reset`) не создаёт дублей
// и не трогает пароль уже существующего пользователя.
async function main(): Promise<void> {
  const {
    POSTGRES_HOST,
    POSTGRES_PORT,
    POSTGRES_USER,
    POSTGRES_PASSWORD,
    POSTGRES_DB,
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
    BCRYPT_ROUNDS,
  } = process.env

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.log('ADMIN_EMAIL/ADMIN_PASSWORD не заданы — пропускаем seed админа.')
    return
  }

  const connectionString = `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}?schema=public`
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

  try {
    const email = ADMIN_EMAIL.toLowerCase()
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, Number(BCRYPT_ROUNDS) || 12)

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      console.log(`Admin ${email} уже существует — пропускаем.`)
      return
    }

    await prisma.user.create({
      data: { name: 'Admin', email, passwordHash, role: 'admin' },
    })
    console.log(`Создан admin: ${email}`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
