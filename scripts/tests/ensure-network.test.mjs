import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { afterEach, describe, it } from 'node:test'
import { createSandbox } from './sandbox.mjs'

const hasDocker = spawnSync('docker', ['info'], { stdio: 'ignore' }).status === 0

let sandbox
afterEach(() => sandbox?.cleanup())

describe('[ensure-network.test.mjs] ensureNetwork', () => {
  it('называет файл, если нет COMPOSE_NETWORK_NAME', async () => {
    sandbox = createSandbox({ '.env': 'OTHER=1\n' })
    const { ensureNetwork } = await sandbox.import('ensure-network.mjs')
    assert.throws(() => ensureNetwork(), /COMPOSE_NETWORK_NAME not set in .*\.env/)
  })

  it('создаёт сеть один раз, а потом находит её', { skip: !hasDocker && 'Docker недоступен' }, async () => {
    const name = `scripts-test-${randomBytes(4).toString('hex')}`
    sandbox = createSandbox({ '.env': `COMPOSE_NETWORK_NAME=${name}\n` })
    const { ensureNetwork } = await sandbox.import('ensure-network.mjs')
    try {
      assert.deepEqual(ensureNetwork(), { name, created: true })
      assert.deepEqual(ensureNetwork(), { name, created: false })
    } finally {
      execFileSync('docker', ['network', 'rm', name], { stdio: 'ignore' })
    }
  })

  it('не путает сеть с другой, в имени которой есть то же имя', { skip: !hasDocker && 'Docker недоступен' }, async () => {
    const name = `scripts-test-${randomBytes(4).toString('hex')}`
    const similar = `${name}-other`
    execFileSync('docker', ['network', 'create', similar], { stdio: 'ignore' })
    sandbox = createSandbox({ '.env': `COMPOSE_NETWORK_NAME=${name}\n` })
    const { ensureNetwork } = await sandbox.import('ensure-network.mjs')
    try {
      assert.deepEqual(ensureNetwork(), { name, created: true })
    } finally {
      execFileSync('docker', ['network', 'rm', name, similar], { stdio: 'ignore' })
    }
  })
})
