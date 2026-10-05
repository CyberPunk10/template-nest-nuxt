import 'dotenv/config'
import * as bcrypt from 'bcrypt'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'

function log(message: string): void {
  // eslint-disable-next-line no-console -- это CLI-скрипт, вывод в консоль и есть его результат
  console.log(`[seed.ts] ${message}`)
}

// Заводит admin-аккаунт для первого запуска. Идемпотентно: если пользователь
// с этим email уже есть, ничего не делает — повторный запуск при каждом
// `pnpm dev` не создаёт дублей и не трогает пароль.
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
    log('ADMIN_EMAIL/ADMIN_PASSWORD not set - skipping admin seed')
    return
  }

  const connectionString = `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}?schema=public`
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

  try {
    const email = ADMIN_EMAIL.toLowerCase()
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, Number(BCRYPT_ROUNDS) || 12)

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      log(`admin ${email} already exists - skipping`)
      return
    }

    await prisma.user.create({
      data: { name: 'Admin', email, passwordHash, role: 'admin' },
    })
    log(`admin created: ${email}`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  // eslint-disable-next-line no-console -- см. log() выше
  console.error('[seed.ts]', e)
  process.exit(1)
})
