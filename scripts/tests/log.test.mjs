import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'
import { createSandbox } from './sandbox.mjs'

let sandbox
afterEach(() => sandbox?.cleanup())

describe('createLogger', () => {
  it('добавляет к сообщениям префикс с именем скрипта, вне терминала — без цвета', () => {
    sandbox = createSandbox({
      'scripts/demo.mjs': `import { createLogger } from './log.mjs'
const log = createLogger('demo.mjs')
log.log('plain')
log.ok('done')
log.error('failed')
`,
    })
    // spawnSync не даёт процессу терминал — как при выводе в файл или в CI
    const result = sandbox.run('demo.mjs')
    assert.equal(result.stdout, '[demo.mjs] plain\n[demo.mjs] ✓ done\n')
    assert.equal(result.stderr, '[demo.mjs] ✗ failed\n')
  })
})
