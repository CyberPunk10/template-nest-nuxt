// Управление БД: `node scripts/db.mjs up|down|generate|migrate`.
//
// Сервисы приложения в docker-compose.yml помечены профилем `app`, поэтому
// команда без профиля затрагивает только postgres. Модуль экспортирует
// функции для predev: при `pnpm dev` приложения работают локально, а БД —
// в Docker.

import { execFileSync } from 'child_process'
import { relative } from 'path'
import { ROOT_ENV, parseEnv } from './copy-env.mjs'
import { ensureNetwork } from './ensure-network.mjs'
import { createLogger } from './log.mjs'

// Параметры контейнера БД. Compose на отсутствующую переменную не падает,
// а молча подставляет пустую строку — контейнер поднялся бы с пустым
// логином и паролем. Поэтому проверяем сами и говорим, чего не хватает.
const REQUIRED_ENV = ['POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_DB', 'POSTGRES_PORT']

function requireDbEnv() {
  // Compose берёт переменные и из .env, и из окружения процесса —
  // проверяем оба источника, чтобы не отвергнуть валидный запуск.
  const env = parseEnv(ROOT_ENV)
  const missing = REQUIRED_ENV.filter(key => !env[key] && !process.env[key])
  if (missing.length) {
    throw new Error(
      `${missing.join(', ')} not set in ${relative(process.cwd(), ROOT_ENV)}`
      + ' - copy the values from .env.example next to it',
    )
  }
}

// Запускает docker compose с переданными аргументами
function compose(args) {
  execFileSync('docker', ['compose', ...args], { stdio: 'inherit' })
}

// Поднимает postgres в фоне и ждёт healthcheck: без --wait Nest может начать
// подключаться раньше, чем БД примет соединения.
export function dbUp() {
  requireDbEnv()
  ensureNetwork()
  compose(['up', '-d', '--wait', 'postgres'])
}

// Запускает Prisma CLI в пакете backend: там лежат схема и prisma.config.ts
function prisma(args) {
  execFileSync('pnpm', ['--filter', '@repo/backend', 'exec', 'prisma', ...args], { stdio: 'inherit' })
}

// Генерирует клиент Prisma из схемы. После `pnpm install` это делает
// postinstall backend'а, но схема могла измениться позже — после правки
// или `git pull`.
export function dbGenerate() {
  prisma(['generate'])
}

// Применяет миграции, которых ещё нет в БД. Именно deploy, а не dev:
// он не создаёт новых миграций, ничего не спрашивает и не пересоздаёт БД.
export function dbMigrate() {
  prisma(['migrate', 'deploy'])
}

// Останавливает postgres. Данные остаются в volume — удалить их можно только
// явным `docker compose down -v`, который намеренно не завёрнут в скрипт.
export function dbDown() {
  compose(['stop', 'postgres'])
}

const commands = {
  up: dbUp,
  down: dbDown,
  generate: dbGenerate,
  migrate: dbMigrate,
}

// Файл используется и как модуль (predev), и как CLI — команду выполняем
// только во втором случае, когда она передана аргументом.
const command = process.argv[2]
if (command) {
  const log = createLogger('db.mjs')
  if (!commands[command]) {
    log.error(`unknown command ${command} - available: ${Object.keys(commands).join(', ')}`)
    process.exit(1)
  }
  try {
    commands[command]()
  } catch (e) {
    // Ошибка уже понятна сама по себе — стек трейс только мешает.
    // Вывод самих docker compose и Prisma при этом идёт напрямую в терминал.
    log.error(`${command}: ${e.message}`)
    process.exit(1)
  }
}
