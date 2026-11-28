import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, it } from 'node:test'
import { NVM_INSTALL, nodeVersionError, nvmState } from '../check-node.mjs'
import { createSandbox } from './sandbox.mjs'

// Версия, до которой текущий Node заведомо не дотягивает: так проверяется
// путь с ошибкой на настоящем Node, без подмены process.versions.
const FUTURE = '99.1.0'

describe('[check-node.test.mjs] nodeVersionError — сравнение версий', () => {
  it('подходящая версия — ошибки нет', () => {
    assert.equal(nodeVersionError('24.22.1', '>=24.22.1', '24.22.1'), null)
    assert.equal(nodeVersionError('24.23.0', '>=24.22.1', '24.22.1'), null)
    assert.equal(nodeVersionError('26.0.0', '>=24.22.1', '24.22.1'), null)
  })

  it('версии сравниваются числами, а не строками', () => {
    // Строкой «24.22.10» < «24.22.9» и «24.9.0» > «24.22.1» — числами наоборот.
    assert.equal(nodeVersionError('24.22.10', '>=24.22.9', ''), null)
    assert.notEqual(nodeVersionError('24.9.0', '>=24.22.1', ''), null)
    assert.equal(nodeVersionError('25.0.0', '>=24.99.99', ''), null)
  })

  it('старая версия — ошибка с текущей и нужной версией', () => {
    const error = nodeVersionError('24.13.0', '>=24.22.1', '24.22.1')
    assert.match(error, /^Node\.js 24\.13\.0, but the project needs >=24\.22\.1\.$/m)
  })

  it('пробел после >= не мешает проверке', () => {
    assert.notEqual(nodeVersionError('24.13.0', '>= 24.22.1', ''), null)
  })

  it('диапазон другой формы не проверяется, чтобы не мешать запуску', () => {
    assert.equal(nodeVersionError('18.0.0', '^24.0.0', ''), null)
    assert.equal(nodeVersionError('18.0.0', '24.x', ''), null)
    assert.equal(nodeVersionError('18.0.0', undefined, ''), null)
  })
})

describe('[check-node.test.mjs] nodeVersionError — подсказка', () => {
  it('nvm и версия есть: nvm use обязательно, nvm alias default — по желанию', () => {
    const lines = nodeVersionError('22.11.0', '>=24.22.1', '24.30.0', 'ready').split('\n')
    assert.equal(lines.length, 3)
    assert.match(lines[1], /^ {2}Switch this terminal: +nvm use$/)
    assert.match(lines[2], /^ {2}Optional, for new terminals: +nvm alias default 24\.30\.0$/)
  })

  it('nvm есть, нужной версии нет — nvm install вместо nvm use', () => {
    const lines = nodeVersionError('24.13.0', '>=24.22.1', '24.22.1', 'no-version').split('\n')
    assert.equal(lines.length, 3)
    assert.match(lines[1], /^ {2}Install and switch: +nvm install$/)
    assert.match(lines[2], /^ {2}Optional, for new terminals: +nvm alias default 24\.22\.1$/)
  })

  it('nvm нет — команда установки nvm, затем nvm install', () => {
    const lines = nodeVersionError('24.13.0', '>=24.22.1', '24.22.1', 'missing').split('\n')
    assert.equal(lines.length, 4)
    assert.match(lines[1], /^ {2}Install nvm: +/)
    assert.ok(lines[1].endsWith(NVM_INSTALL))
    assert.match(lines[2], /^ {2}Then, in a new terminal: +nvm install$/)
    assert.match(lines[3], /^ {2}Optional, for new terminals: +nvm alias default 24\.22\.1$/)
  })

  it('во всех случаях команды начинаются в одной колонке', () => {
    for (const state of ['ready', 'no-version', 'missing']) {
      const lines = nodeVersionError('24.13.0', '>=24.22.1', '24.22.1', state).split('\n').slice(1)
      const columns = lines.map(line => line.search(/(nvm|curl) /))
      assert.equal(new Set(columns).size, 1, state)
    }
  })

  it('без .nvmrc подсказка берёт минимальную версию из engines', () => {
    assert.match(nodeVersionError('24.13.0', '>=24.22.1', ''), /nvm alias default 24\.22\.1$/)
  })

  it('вне терминала — без escape-кодов цвета', () => {
    // Тесты идут без терминала, как CI: command() из log.mjs цвет не добавляет.
    assert.ok(!nodeVersionError('24.13.0', '>=24.22.1', '24.22.1').includes('\u001b'))
  })

  it('команда установки nvm совпадает с документацией («Подготовка»)', () => {
    const pages = ['apps/docs/guide', 'apps/docs/en/guide', 'apps/docs/th/guide']
      .map(dir => `${dir}/getting-started/setup.md`)
    for (const page of pages) {
      assert.ok(readFileSync(new URL(`../../${page}`, import.meta.url), 'utf8').includes(NVM_INSTALL), page)
    }
  })
})

describe('[check-node.test.mjs] nvmState — что есть из nvm', () => {
  let dir
  afterEach(() => dir && rmSync(dir, { recursive: true, force: true }))

  // Папка вида ~/.nvm: nvm.sh и установленные версии в versions/node/v*.
  function fakeNvm({ script = true, versions = [] } = {}) {
    dir = mkdtempSync(join(tmpdir(), 'fake-nvm-'))
    if (script) writeFileSync(join(dir, 'nvm.sh'), '')
    for (const v of versions) mkdirSync(join(dir, 'versions/node', `v${v}`), { recursive: true })
    return dir
  }

  it('пустой NVM_DIR — nvm нет', () => {
    // Без второго аргумента берётся настоящий NVM_DIR, поэтому «переменной
    // нет» здесь — пустая строка; так её и передаёт predev при NVM_DIR=.
    assert.equal(nvmState('24.22.1', ''), 'missing')
  })

  it('NVM_DIR есть, но nvm.sh в нём нет — nvm нет', () => {
    assert.equal(nvmState('24.22.1', fakeNvm({ script: false, versions: ['24.22.1'] })), 'missing')
  })

  it('nvm есть, версия установлена — ready', () => {
    assert.equal(nvmState('24.22.1', fakeNvm({ versions: ['24.22.1'] })), 'ready')
  })

  it('nvm есть, установлена другая версия — no-version', () => {
    assert.equal(nvmState('24.22.1', fakeNvm({ versions: ['24.13.0'] })), 'no-version')
  })

  it('версия в .nvmrc с префиксом v находится так же', () => {
    assert.equal(nvmState('v24.22.1', fakeNvm({ versions: ['24.22.1'] })), 'ready')
  })

  it('алиас в .nvmrc (lts/*) по папкам не проверить — no-version, то есть nvm install', () => {
    assert.equal(nvmState('lts/*', fakeNvm({ versions: ['24.22.1'] })), 'no-version')
  })
})

// checkNodeVersion на настоящих файлах: package.json, .nvmrc и NVM_DIR
// в песочнице, запуск отдельным процессом.
describe('[check-node.test.mjs] checkNodeVersion — файлы проекта и окружение', () => {
  let sandbox
  afterEach(() => sandbox?.cleanup())

  const CHECK = `import { checkNodeVersion } from './check-node.mjs'
try {
  console.log('ok ' + checkNodeVersion())
} catch (e) {
  console.log(e.message)
}
`
  function setup({ engines, nvmrc, nvm }) {
    const files = { 'scripts/check.mjs': CHECK, 'package.json': JSON.stringify({ engines }) }
    if (nvmrc !== undefined) files['.nvmrc'] = `${nvmrc}\n`
    if (nvm?.script) files['nvm/nvm.sh'] = ''
    for (const v of nvm?.versions ?? []) files[`nvm/versions/node/v${v}/.keep`] = ''
    sandbox = createSandbox(files)
    return sandbox.run('check.mjs', [], { NVM_DIR: nvm ? sandbox.path('nvm') : '' }).stdout
  }

  it('подходящий Node — возвращает версию', () => {
    assert.equal(setup({ engines: { node: '>=1.0.0' } }).trim(), `ok ${process.versions.node}`)
  })

  it('без engines.node — не мешает запуску', () => {
    assert.equal(setup({ engines: {} }).trim(), `ok ${process.versions.node}`)
  })

  it('старый Node, nvm и версия есть — nvm use и версия из .nvmrc', () => {
    const out = setup({ engines: { node: `>=${FUTURE}` }, nvmrc: FUTURE, nvm: { script: true, versions: [FUTURE] } })
    assert.match(out, new RegExp(`^Node\\.js ${process.versions.node.replaceAll('.', '\\.')}, but the project needs >=99\\.1\\.0\\.`))
    assert.match(out, /Switch this terminal: +nvm use/)
    assert.match(out, /nvm alias default 99\.1\.0/)
  })

  it('старый Node, версия в nvm не установлена — nvm install', () => {
    const out = setup({ engines: { node: `>=${FUTURE}` }, nvmrc: FUTURE, nvm: { script: true, versions: ['24.0.0'] } })
    assert.match(out, /Install and switch: +nvm install/)
  })

  it('старый Node, nvm нет — команда установки nvm', () => {
    const out = setup({ engines: { node: `>=${FUTURE}` }, nvmrc: FUTURE })
    assert.ok(out.includes(NVM_INSTALL))
  })

  it('без .nvmrc версия для подсказки и поиска в nvm — из engines', () => {
    const out = setup({ engines: { node: '>=99.0.0' }, nvm: { script: true, versions: ['99.0.0'] } })
    assert.match(out, /Switch this terminal: +nvm use/)
    assert.match(out, /nvm alias default 99\.0\.0/)
  })
})

describe('[check-node.test.mjs] predev.mjs — проверка Node первым шагом', () => {
  let sandbox
  afterEach(() => sandbox?.cleanup())

  it('старый Node — одна ошибка ✗ node, код 1, до создания .env', () => {
    // .env.example лежат на месте: если бы проверка шла не первой, predev
    // успел бы создать .env.
    sandbox = createSandbox({
      'package.json': JSON.stringify({ engines: { node: `>=${FUTURE}` } }),
      '.env.example': 'X=1\n',
      'apps/backend/.env.example': 'PORT=1\n',
      'apps/frontend/.env.example': 'PORT=2\n',
      'apps/docs/.env.example': 'PORT=3\n',
    })
    const result = sandbox.run('predev.mjs', [], { NVM_DIR: '' })
    assert.equal(result.status, 1)
    assert.equal(result.stdout, '')
    assert.equal(result.stderr.match(/✗/g)?.length, 1)
    assert.match(result.stderr, /^\[predev\.mjs\] ✗ node: Node\.js .+, but the project needs >=99\.1\.0\./)
    for (const env of ['.env', 'apps/backend/.env', 'apps/frontend/.env', 'apps/docs/.env']) {
      assert.equal(existsSync(sandbox.path(env)), false, env)
    }
  })
})

describe('[check-node.test.mjs] dev.mjs — ошибки приложений без трассировки Node', () => {
  let sandbox
  afterEach(() => sandbox?.cleanup())

  it('приложения не запустились — код 1, без UnhandledPromiseRejection', () => {
    sandbox = createSandbox()
    // PATH без pnpm: все три команды падают с «pnpm: not found».
    const result = sandbox.run('dev.mjs', [], { PATH: sandbox.path('no-bin') })
    assert.equal(result.status, 1)
    assert.match(result.stdout, /exited with code/)
    assert.doesNotMatch(result.stderr + result.stdout, /UnhandledPromiseRejection|ERR_UNHANDLED_REJECTION/)
  })
})
