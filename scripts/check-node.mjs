import { existsSync, readFileSync } from 'fs'
import { command } from './log.mjs'

// Проверка версии Node до запуска приложений. Без неё pnpm отказывается
// запускать каждое приложение по отдельности (ERR_PNPM_UNSUPPORTED_ENGINE) —
// одна и та же ошибка приходит трижды и без подсказки, что делать.

// Сравнивает версии вида 24.22.1 по числам.
function isAtLeast(current, required) {
  const a = current.split('.').map(Number)
  const b = required.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) > (b[i] ?? 0)
  }
  return true
}

// Установщик nvm — та же команда, что на странице «Подготовка» документации
// (guide/getting-started/setup.md): обновляя версию, поменяйте и там.
export const NVM_INSTALL = 'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.5/install.sh | bash'

// Возвращает текст ошибки, если current не подходит под range, иначе null.
// range — значение engines.node из package.json; понимает только «>=x.y.z»,
// как в этом проекте: другие формы не проверяет, чтобы не мешать запуску.
// nvmrc — версия из .nvmrc для подсказки: `nvm use` и `nvm install` возьмут
// её из файла сами, а `nvm alias default` нужна явно.
// nvm — что есть на машине: 'ready' — nvm и нужная версия Node;
// 'no-version' — nvm есть, версии нет; 'missing' — nvm нет.
export function nodeVersionError(current, range, nvmrc, nvm = 'ready') {
  const match = /^>=\s*(\d+\.\d+\.\d+)$/.exec(range?.trim() ?? '')
  if (!match || isAtLeast(current, match[1])) return null
  const target = nvmrc || match[1]
  // Сначала — зачем команда, потом сама команда; команды — в одну колонку.
  // Обязательные шаги идут по порядку, последний — по желанию: так и подписано.
  const hints = {
    ready: [['Switch this terminal:', 'nvm use']],
    'no-version': [['Install and switch:', 'nvm install']],
    missing: [
      ['Install nvm:', NVM_INSTALL],
      ['Then, in a new terminal:', 'nvm install'],
    ],
  }[nvm]
  hints.push(['Optional, for new terminals:', `nvm alias default ${target}`])
  const width = Math.max(...hints.map(([label]) => label.length)) + 1
  return [
    `Node.js ${current}, but the project needs ${range}.`,
    ...hints.map(([label, cmd]) => `  ${label.padEnd(width)}${command(cmd)}`),
  ].join('\n')
}

// Что есть из nvm: сам nvm (функция оболочки — видна только по NVM_DIR и
// nvm.sh) и установленная в нём версия target. В .nvmrc бывает и «v24.22.1»,
// и алиас вроде «lts/*»: алиас по папкам не проверить, и тогда подсказка —
// nvm install, она верна в обоих случаях (если версия есть, nvm просто
// переключится на неё).
export function nvmState(target, dir = process.env.NVM_DIR) {
  if (!dir || !existsSync(`${dir}/nvm.sh`)) return 'missing'
  const version = target.replace(/^v/, '')
  if (!/^\d+\.\d+\.\d+$/.test(version)) return 'no-version'
  return existsSync(`${dir}/versions/node/v${version}`) ? 'ready' : 'no-version'
}

// Проверяет версию текущего Node по package.json и .nvmrc в папке root.
// Возвращает версию или бросает ошибку с подсказкой.
export function checkNodeVersion(root = '.') {
  const range = JSON.parse(readFileSync(`${root}/package.json`, 'utf8')).engines?.node
  let nvmrc = ''
  try {
    nvmrc = readFileSync(`${root}/.nvmrc`, 'utf8').trim()
  } catch {
    // Без .nvmrc подсказка возьмёт минимальную версию из engines.
  }
  const target = nvmrc || /\d+\.\d+\.\d+/.exec(range ?? '')?.[0] || ''
  const error = nodeVersionError(process.versions.node, range, nvmrc, nvmState(target))
  if (error) throw new Error(error)
  return process.versions.node
}
