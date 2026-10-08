import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'
import { createSandbox } from './sandbox.mjs'

let sandbox
afterEach(() => sandbox?.cleanup())

describe('copy-env-cli.mjs', () => {
  it('сообщает о созданных, уже существующих и перезаписанных файлах', () => {
    sandbox = createSandbox({ '.env.example': 'A=1\n', 'apps/backend/.env.example': 'B=2\n' })

    const first = sandbox.run('copy-env-cli.mjs')
    assert.equal(first.status, 0)
    assert.match(first.stdout, /\[copy-env\] ✓ created: \.env, apps\/backend\/\.env/)

    const second = sandbox.run('copy-env-cli.mjs')
    assert.match(second.stdout, /all \.env files already exist/)

    const forced = sandbox.run('copy-env-cli.mjs', ['--force'])
    assert.match(forced.stdout, /overwritten: \.env, apps\/backend\/\.env/)
  })
})
