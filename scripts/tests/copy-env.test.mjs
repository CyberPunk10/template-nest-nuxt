import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { afterEach, describe, it } from 'node:test'
import { createSandbox } from './sandbox.mjs'

const EXAMPLES = {
  '.env.example': 'ROOT=1\n',
  'apps/backend/.env.example': 'PORT=3100\n',
  'apps/frontend/.env.example': 'PORT=3200\n',
  'apps/docs/.env.example': 'PORT=5173\n',
}

let sandbox
afterEach(() => sandbox?.cleanup())

describe('[copy-env.test.mjs] parseEnv', () => {
  it('читает ключи и значения, пропуская комментарии и пустые строки', async () => {
    sandbox = createSandbox({ '.env': '# C=commented\n\nA=1\n B = two \nURL=http://x?a=b\n' })
    const { parseEnv } = await sandbox.import('copy-env.mjs')
    assert.deepEqual(parseEnv(sandbox.path('.env')), { A: '1', B: 'two', URL: 'http://x?a=b' })
  })

  it('возвращает пустой объект, если файла нет', async () => {
    sandbox = createSandbox()
    const { parseEnv } = await sandbox.import('copy-env.mjs')
    assert.deepEqual(parseEnv(sandbox.path('nope.env')), {})
  })
})

describe('[copy-env.test.mjs] copyEnvFiles', () => {
  it('создаёт каждый недостающий .env из его .env.example', async () => {
    sandbox = createSandbox(EXAMPLES)
    const { copyEnvFiles } = await sandbox.import('copy-env.mjs')
    assert.deepEqual(copyEnvFiles(), ['.env', 'apps/backend/.env', 'apps/frontend/.env', 'apps/docs/.env'])
    assert.equal(readFileSync(sandbox.path('apps/backend/.env'), 'utf8'), 'PORT=3100\n')
  })

  it('не трогает существующие .env', async () => {
    sandbox = createSandbox({ ...EXAMPLES, 'apps/backend/.env': 'PORT=4000\n' })
    const { copyEnvFiles } = await sandbox.import('copy-env.mjs')
    assert.deepEqual(copyEnvFiles(), ['.env', 'apps/frontend/.env', 'apps/docs/.env'])
    assert.equal(readFileSync(sandbox.path('apps/backend/.env'), 'utf8'), 'PORT=4000\n')
  })

  it('перезаписывает существующие .env с force', async () => {
    sandbox = createSandbox({ ...EXAMPLES, 'apps/backend/.env': 'PORT=4000\n' })
    const { copyEnvFiles } = await sandbox.import('copy-env.mjs')
    assert.equal(copyEnvFiles(true).length, 4)
    assert.equal(readFileSync(sandbox.path('apps/backend/.env'), 'utf8'), 'PORT=3100\n')
  })

  it('пропускает .env, у которого нет .env.example', async () => {
    sandbox = createSandbox({ '.env.example': 'ROOT=1\n' })
    const { copyEnvFiles } = await sandbox.import('copy-env.mjs')
    assert.deepEqual(copyEnvFiles(), ['.env'])
  })
})
