import { BACKEND_ENV, FRONTEND_ENV, DOCS_ENV, copyEnvFiles } from './copy-env.mjs'
import { checkPorts } from './check-ports.mjs'
import { createLogger } from './log.mjs'
import { dbUp, dbGenerate, dbMigrate, dbSeed } from './db.mjs'

const log = createLogger('predev.mjs')

// Каждый шаг пишет строку о результате (✓), а при ошибке — какой шаг
// не выполнен (✗): так по выводу `pnpm dev` видно, что произошло, и
// понятно, какую часть повторить вручную.
let step = ''

async function main() {
  // Шаг 1: создать .env из .env.example если отсутствует
  step = '.env'
  const created = copyEnvFiles()
  log.ok(created.length ? `.env: created ${created.join(', ')} from .env.example` : '.env: files in place')

  // Шаг 2: проверить порты и разрешить конфликты.
  // Порт БД сюда не входит: проверка умеет только убивать процессы на хосте,
  // а этот порт держит Docker. Его занятость поймает dbUp на шаге 3.
  step = 'ports'
  const ports = await checkPorts([
    { name: 'backend', envPath: BACKEND_ENV, key: 'PORT' },
    { name: 'frontend', envPath: FRONTEND_ENV, key: 'PORT' },
    { name: 'docs', envPath: DOCS_ENV, key: 'PORT' },
  ])
  log.ok(`ports: ${ports.map(p => `${p.name} ${p.port}`).join(' · ')}`)

  // Шаг 3: поднять БД — приложения запускаются локально, но Postgres нужен
  // из Docker. Повторный запуск на уже поднятом контейнере ничего не меняет.
  step = 'db'
  dbUp()
  log.ok('db: postgres is up')

  // Шаг 4: сгенерировать клиент Prisma — схема могла измениться после
  // `pnpm install`, а со старым клиентом backend не увидит её изменений.
  step = 'client'
  dbGenerate()
  log.ok('client: generated from schema.prisma')

  // Шаг 5: применить новые миграции — например, пришедшие с `git pull`.
  step = 'migrations'
  dbMigrate()
  log.ok('migrations: database is up to date')

  // Шаг 6: создать админа, если его ещё нет, — чтобы после первого запуска
  // сразу можно было войти. Только для разработки: в проде админа заводят
  // отдельной командой, а не при каждом старте (см. docker-entrypoint.sh).
  step = 'admin'
  dbSeed()
  log.ok('admin: in place')
}

main().catch((e) => {
  log.error(`${step}: ${e.message}`)
  process.exit(1)
})
