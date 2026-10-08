import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { afterEach, describe, it } from 'node:test'
import { createSandbox, isAlive, waitFor } from './sandbox.mjs'

const PID_FILE = 'node_modules/.cache/dev-session/dev-nest-nuxt.pid'

// Уменьшенный dev.mjs: запоминает сессию и через concurrently запускает
// дочерний процесс, который записывает свой PID, — чтобы проверить, что он
// остановится вместе с сессией
const SESSION = `import { concurrently } from 'concurrently'
import { rememberDevSession } from './dev-session.mjs'
rememberDevSession()
concurrently([{ command: 'node scripts/child.mjs', name: 'child' }], { raw: true })
`
const CHILD = `import { writeFileSync } from 'fs'
writeFileSync('child.pid', String(process.pid))
setInterval(() => {}, 1000)
`

let sandbox
afterEach(() => sandbox?.cleanup())

describe('dev session', () => {
  it('запоминает запущенный pnpm dev и останавливает его вместе со всеми процессами', async () => {
    sandbox = createSandbox({ 'scripts/session.mjs': SESSION, 'scripts/child.mjs': CHILD })
    const session = sandbox.start(['scripts/session.mjs'])
    await waitFor(() => existsSync(sandbox.path('child.pid')), { message: 'дочерний процесс запустится' })
    const childPid = Number(readFileSync(sandbox.path('child.pid'), 'utf8'))

    assert.equal(Number(readFileSync(sandbox.path(PID_FILE), 'utf8')), session.pid)

    const { stopDevSession } = await sandbox.import('dev-session.mjs')
    assert.equal(stopDevSession(), true)
    await waitFor(() => !isAlive(session.pid) && !isAlive(childPid), { message: 'сессия и дочерний процесс завершатся' })
    assert.equal(existsSync(sandbox.path(PID_FILE)), false)
  })

  it('игнорирует pid-файл, оставшийся от уже завершённой сессии', async () => {
    // PID завершившегося процесса — как после аварийного выхода, когда файл не удалился
    const ended = spawnSync(process.execPath, ['-e', 'console.log(process.pid)'], { encoding: 'utf8' })
    sandbox = createSandbox({ [PID_FILE]: ended.stdout.trim() })
    const { stopDevSession } = await sandbox.import('dev-session.mjs')
    assert.equal(stopDevSession(), false)
  })

  it('ничего не делает, если сессия не запомнена', async () => {
    sandbox = createSandbox()
    const { stopDevSession } = await sandbox.import('dev-session.mjs')
    assert.equal(stopDevSession(), false)
  })
})
