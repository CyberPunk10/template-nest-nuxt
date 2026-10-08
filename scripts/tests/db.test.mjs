import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'
import { createSandbox, occupyPort } from './sandbox.mjs'

const DB_ENV = {
  POSTGRES_HOST: 'localhost',
  POSTGRES_PORT: '5432',
  POSTGRES_USER: 'app',
  POSTGRES_PASSWORD: 'secret',
  POSTGRES_DB: 'app',
}

const toEnvFile = env => Object.entries(env).map(([key, value]) => `${key}=${value}\n`).join('')

// Переменные БД из окружения процесса перекрывают .env (как и в Compose) —
// пустые значения убирают их влияние на тест
const NO_DB_ENV = Object.fromEntries(Object.keys(DB_ENV).map(key => [key, '']))

let sandbox
afterEach(() => sandbox?.cleanup())

describe('dbEnvMismatch', () => {
  it('ничего не находит, если параметры совпадают', async () => {
    sandbox = createSandbox()
    const { dbEnvMismatch } = await sandbox.import('db.mjs')
    assert.deepEqual(dbEnvMismatch(DB_ENV, DB_ENV), [])
  })

  it('находит расходящиеся ключи у локальной БД', async () => {
    sandbox = createSandbox()
    const { dbEnvMismatch } = await sandbox.import('db.mjs')
    for (const host of ['localhost', '127.0.0.1', '::1']) {
      const backend = { ...DB_ENV, POSTGRES_HOST: host, POSTGRES_PORT: '5442', POSTGRES_PASSWORD: 'other' }
      assert.deepEqual(dbEnvMismatch(DB_ENV, backend), ['POSTGRES_PORT', 'POSTGRES_PASSWORD'])
    }
  })

  it('не сверяет параметры, если backend ходит в удалённую БД', async () => {
    sandbox = createSandbox()
    const { dbEnvMismatch } = await sandbox.import('db.mjs')
    assert.deepEqual(dbEnvMismatch(DB_ENV, { POSTGRES_HOST: 'db.example.com' }), [])
  })
})

describe('checkBackendDbEnv', () => {
  it('называет расходящиеся значения, но не показывает пароль', async () => {
    sandbox = createSandbox({
      '.env': toEnvFile(DB_ENV),
      'apps/backend/.env': toEnvFile({ ...DB_ENV, POSTGRES_PORT: '5442', POSTGRES_PASSWORD: 'other' }),
    })
    const { checkBackendDbEnv } = await sandbox.import('db.mjs')
    assert.throws(checkBackendDbEnv, (error) => {
      assert.match(error.message, /POSTGRES_PORT not equal: .*\.env = 5432, .*apps\/backend\/\.env = 5442\./)
      assert.match(error.message, /POSTGRES_PASSWORD not equal\./)
      assert.doesNotMatch(error.message, /secret|other/)
      return true
    })
  })

  it('пропускает совпадающие файлы', async () => {
    sandbox = createSandbox({ '.env': toEnvFile(DB_ENV), 'apps/backend/.env': toEnvFile(DB_ENV) })
    const { checkBackendDbEnv } = await sandbox.import('db.mjs')
    assert.doesNotThrow(checkBackendDbEnv)
  })
})

describe('db.mjs up', () => {
  it('сначала называет недостающие переменные, даже если порт занят', async () => {
    const holder = await occupyPort()
    sandbox = createSandbox({ '.env': `POSTGRES_USER=app\nPOSTGRES_PORT=${holder.port}\n` })
    const result = sandbox.run('db.mjs', ['up'], { ...NO_DB_ENV, POSTGRES_PORT: String(holder.port) })
    await holder.close()
    assert.equal(result.status, 1)
    assert.match(result.stderr, /up: POSTGRES_PASSWORD, POSTGRES_DB not set in \.env/)
  })

  it('сообщает, что порт БД занят посторонним процессом', async () => {
    const holder = await occupyPort()
    sandbox = createSandbox({ '.env': toEnvFile({ ...DB_ENV, POSTGRES_PORT: holder.port }) })
    // В песочнице нет docker-compose.yml, поэтому порт не может принадлежать
    // нашему контейнеру — его держит holder
    const result = sandbox.run('db.mjs', ['up'], { ...NO_DB_ENV, POSTGRES_PORT: String(holder.port) })
    await holder.close()
    assert.equal(result.status, 1)
    assert.match(result.stderr, new RegExp(`POSTGRES_PORT ${holder.port} is busy\\. Change POSTGRES_PORT in \\.env and apps/backend/\\.env\\.`))
  })

  it('при свободном порте идёт дальше — к проверке Docker-сети', async () => {
    const probe = await occupyPort()
    await probe.close()
    // Без COMPOSE_NETWORK_NAME следующий шаг падает раньше любого вызова Docker
    sandbox = createSandbox({ '.env': toEnvFile({ ...DB_ENV, POSTGRES_PORT: probe.port }) })
    const result = sandbox.run('db.mjs', ['up'], { ...NO_DB_ENV, POSTGRES_PORT: String(probe.port) })
    assert.equal(result.status, 1)
    assert.match(result.stderr, /up: COMPOSE_NETWORK_NAME not set/)
  })
})

describe('db.mjs', () => {
  it('отвергает неизвестную команду и перечисляет доступные', () => {
    sandbox = createSandbox()
    const result = sandbox.run('db.mjs', ['nope'])
    assert.equal(result.status, 1)
    assert.equal(result.stderr, '[db.mjs] ✗ unknown command nope - available: up, down, generate, migrate, seed\n')
  })
})
