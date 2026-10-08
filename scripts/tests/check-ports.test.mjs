import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'
import { existsSync, readFileSync } from 'node:fs'
import { KEYS, createSandbox, isAlive, occupyPort, waitFor } from './sandbox.mjs'

// Вызов checkPorts отдельным процессом: диалог читает клавиши из stdin, а при
// отказе процесс завершается через process.exit. Без --stop-session опции
// не передаются — как в predocker.mjs
const CHECK = `import { checkPorts } from './check-ports.mjs'
const options = process.argv.includes('--stop-session') ? { stopDevSession: true } : undefined
const ports = await checkPorts([{ name: 'backend', envPath: '.env', key: 'PORT' }], options)
console.log(JSON.stringify(ports))
`

// Уменьшенный dev.mjs: запоминает сессию и запускает два процесса — один держит
// порт, другой порт не занимает. По второму видно, остановлена ли вся сессия
// или только процесс на порту
const SESSION = `import { concurrently } from 'concurrently'
import { rememberDevSession } from './dev-session.mjs'
rememberDevSession()
concurrently([
  { command: 'node scripts/holder.mjs', name: 'holder' },
  { command: 'node scripts/idle.mjs', name: 'idle' },
], { raw: true })
`
const HOLDER = `import { writeFileSync } from 'fs'
import { createServer } from 'net'
createServer().listen(process.env.PORT, '127.0.0.1', () => writeFileSync('holder.pid', String(process.pid)))
`
const IDLE = `import { writeFileSync } from 'fs'
writeFileSync('idle.pid', String(process.pid))
setInterval(() => {}, 1000)
`

async function freePort() {
  const probe = await occupyPort()
  await probe.close()
  return probe.port
}

// Песочница с занятым портом из .env: прошлый pnpm dev или просто процесс на порту
async function sandboxWithBusyPort({ session }) {
  const port = await freePort()
  sandbox = createSandbox({
    '.env': `PORT=${port}\n`,
    'scripts/check.mjs': CHECK,
    'scripts/session.mjs': SESSION,
    'scripts/holder.mjs': HOLDER,
    'scripts/idle.mjs': IDLE,
  })
  const readPid = name => Number(readFileSync(sandbox.path(name), 'utf8'))
  if (session) {
    const main = sandbox.start(['scripts/session.mjs'], { PORT: port })
    await waitFor(() => existsSync(sandbox.path('holder.pid')) && existsSync(sandbox.path('idle.pid')), { message: 'сессия запустит процессы' })
    return { port, session: main.pid, holder: readPid('holder.pid'), idle: readPid('idle.pid') }
  }
  const holder = sandbox.start(['scripts/holder.mjs'], { PORT: port })
  await waitFor(() => existsSync(sandbox.path('holder.pid')), { message: 'процесс займёт порт' })
  return { port, holder: holder.pid }
}

// Первый вариант в диалоге — «Kill», второй — «Abort»
const answerDialog = (args, keys) => sandbox.answer('check.mjs', args, keys, { prompt: 'Abort' })

let sandbox
afterEach(() => sandbox?.cleanup())

describe('[check-ports.test.mjs] isPortFree', () => {
  it('отличает свободный порт от занятого', async () => {
    sandbox = createSandbox()
    const { isPortFree } = await sandbox.import('check-ports.mjs')
    const holder = await occupyPort()
    assert.equal(await isPortFree(holder.port), false)
    await holder.close()
    assert.equal(await isPortFree(holder.port), true)
  })
})

describe('[check-ports.test.mjs] requirePort', () => {
  it('читает корректный порт', async () => {
    sandbox = createSandbox({ 'apps/backend/.env': 'PORT=3100\n' })
    const { requirePort } = await sandbox.import('check-ports.mjs')
    assert.equal(requirePort(sandbox.path('apps/backend/.env'), 'PORT'), 3100)
  })

  it('называет файл, если ключа нет', async () => {
    sandbox = createSandbox({ 'apps/backend/.env': 'OTHER=1\n' })
    const { requirePort } = await sandbox.import('check-ports.mjs')
    assert.throws(() => requirePort(sandbox.path('apps/backend/.env'), 'PORT'), /PORT not set in .*apps\/backend\/\.env/)
  })

  it('отвергает значения, которые не являются номером порта', async () => {
    sandbox = createSandbox({ 'a.env': 'PORT=abc\n', 'b.env': 'PORT=70000\n' })
    const { requirePort } = await sandbox.import('check-ports.mjs')
    assert.throws(() => requirePort(sandbox.path('a.env'), 'PORT'), /PORT=abc .* not a valid port number/)
    assert.throws(() => requirePort(sandbox.path('b.env'), 'PORT'), /PORT=70000 .* not a valid port number/)
  })
})

describe('[check-ports.test.mjs] killPort', () => {
  it('останавливает процесс, который держит порт', async () => {
    sandbox = createSandbox()
    const { isPortFree, killPort } = await sandbox.import('check-ports.mjs')
    const probe = await occupyPort()
    const { port } = probe
    await probe.close()

    const holder = sandbox.start(['-e', `require('net').createServer().listen(${port}, '127.0.0.1')`])
    await waitFor(async () => !(await isPortFree(port)), { message: 'процесс займёт порт' })

    assert.equal(killPort(port), true)
    await waitFor(() => !isAlive(holder.pid), { message: 'процесс завершится' })
    assert.equal(await isPortFree(port), true)
  })

  it('ничего не делает со свободным портом', async () => {
    sandbox = createSandbox()
    const { killPort } = await sandbox.import('check-ports.mjs')
    const probe = await occupyPort()
    await probe.close()
    assert.equal(killPort(probe.port), false)
  })
})

describe('[check-ports.test.mjs] checkPorts', () => {
  it('возвращает проверенные порты, если все свободны', async () => {
    const free = await occupyPort()
    await free.close()
    sandbox = createSandbox({ 'apps/backend/.env': `PORT=${free.port}\n` })
    const { checkPorts } = await sandbox.import('check-ports.mjs')
    const result = await checkPorts([{ name: 'backend', envPath: sandbox.path('apps/backend/.env'), key: 'PORT' }])
    assert.deepEqual(result, [{ name: 'backend', port: free.port }])
  })
})

describe('[check-ports.test.mjs] checkPorts при занятом порте', () => {
  it('«Kill» для pnpm dev: останавливает прошлую сессию целиком и освобождает порт', async () => {
    const busy = await sandboxWithBusyPort({ session: true })
    const result = await answerDialog(['--stop-session'], KEYS.enter)
    assert.equal(result.status, 0, result.stderr)
    // Последняя строка вывода — результат checkPorts, выше — сам диалог
    assert.deepEqual(JSON.parse(result.stdout.trim().split('\n').at(-1)), [{ name: 'backend', port: busy.port }])
    await waitFor(() => ![busy.session, busy.holder, busy.idle].some(isAlive), { message: 'сессия завершится' })
  })

  it('«Kill» по умолчанию: убивает только процесс на порту, сессию не трогает', async () => {
    const busy = await sandboxWithBusyPort({ session: true })
    const result = await answerDialog([], KEYS.enter)
    assert.equal(result.status, 0, result.stderr)
    await waitFor(() => !isAlive(busy.holder), { message: 'процесс на порту завершится' })
    assert.equal(isAlive(busy.session), true)
    assert.equal(isAlive(busy.idle), true)
  })

  for (const [answer, keys] of [['Abort', KEYS.down + KEYS.enter], ['Ctrl+C', KEYS.ctrlC]]) {
    it(`«${answer}»: выходит с кодом 1 и не трогает процесс на порту`, async () => {
      const busy = await sandboxWithBusyPort({ session: false })
      const result = await answerDialog([], keys)
      assert.equal(result.status, 1)
      assert.equal(isAlive(busy.holder), true)
    })
  }
})
