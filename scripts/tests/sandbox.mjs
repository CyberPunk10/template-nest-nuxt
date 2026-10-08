// Тесты скриптов из scripts/. Запуск — тот же, что в CI:
//   node --test "scripts/tests/*.test.mjs"
// Тесты проверяют сам шаблон: create-nest-nuxt убирает эту папку из проекта.
//
// Песочница для тестов скриптов. Скрипты вычисляют корень проекта от своего
// расположения, поэтому их копия во временной папке работает с .env, pid-файлом
// и прочим этой папки и не трогает настоящие файлы проекта.
//
// Пакеты, которые импортируют скрипты, подключаются ссылками по одному. Ссылку на
// весь node_modules делать нельзя: dev-session.mjs пишет pid-файл в
// node_modules/.cache, и тест задел бы файл настоящего `pnpm dev`.

import { spawn, spawnSync } from 'child_process'
import { cpSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'fs'
import { createServer } from 'net'
import { tmpdir } from 'os'
import { dirname, join, resolve } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const SCRIPTS = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const REPO = resolve(SCRIPTS, '..')
const PACKAGES = ['concurrently', '@clack/prompts']

// Нажатия клавиш так, как их передаёт терминал
export const KEYS = { enter: '\r', down: '\x1b[B', ctrlC: '\x03' }

// files: { 'путь/от/корня': 'содержимое' } — что положить в песочницу сразу
export function createSandbox(files = {}) {
  const root = mkdtempSync(join(tmpdir(), 'scripts-test-'))
  cpSync(SCRIPTS, join(root, 'scripts'), {
    recursive: true,
    filter: src => !src.startsWith(join(SCRIPTS, 'tests')),
  })
  for (const name of PACKAGES) {
    const link = join(root, 'node_modules', name)
    mkdirSync(dirname(link), { recursive: true })
    symlinkSync(join(REPO, 'node_modules', name), link)
  }

  function write(path, content) {
    const file = join(root, path)
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, content)
  }
  for (const [path, content] of Object.entries(files)) write(path, content)

  const processes = []

  return {
    root,
    path: p => join(root, p),
    write,
    // Импорт скрипта из песочницы: у каждой песочницы свой путь, поэтому модуль
    // загружается заново, а не берётся из кеша прошлого теста
    import: name => import(pathToFileURL(join(root, 'scripts', name)).href),
    // Запуск скрипта отдельным процессом, как его запускает pnpm
    run: (script, args = [], env = {}) => spawnSync(process.execPath, [join(root, 'scripts', script), ...args], {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, ...env },
    }),
    // Запуск долгоживущего процесса. cleanup гасит его, даже если тест упал
    // раньше: живой дочерний процесс не дал бы node --test завершиться
    start: (args, env = {}) => {
      const child = spawn(process.execPath, args, { cwd: root, stdio: 'ignore', env: { ...process.env, ...env } })
      processes.push(child)
      return child
    },
    // Запуск скрипта с ответом на диалог @clack/prompts: как только в выводе
    // появится текст prompt, в stdin уходят нажатия клавиш. Затем stdin
    // закрывается — иначе открытый поток не дал бы процессу завершиться
    answer: (script, args, keys, { prompt, timeoutMs = 5000 }) => new Promise((done, fail) => {
      const child = spawn(process.execPath, [join(root, 'scripts', script), ...args], { cwd: root })
      processes.push(child)
      let stdout = ''
      let stderr = ''
      child.stdout.on('data', (chunk) => {
        stdout += chunk
        if (stdout.includes(prompt) && child.stdin.writable) child.stdin.end(keys)
      })
      child.stderr.on('data', chunk => (stderr += chunk))
      const timer = setTimeout(() => fail(new Error(`${script} не завершился за ${timeoutMs} мс:\n${stdout}${stderr}`)), timeoutMs)
      child.on('exit', (status) => {
        clearTimeout(timer)
        done({ status, stdout, stderr })
      })
    }),
    // Папку удаляем после выхода процессов: живой процесс мог бы дописать в неё файл
    cleanup: async () => {
      await Promise.all(processes.map((child) => {
        if (child.exitCode !== null || child.signalCode !== null) return
        const exited = new Promise(done => child.once('exit', done))
        child.kill('SIGTERM')
        return exited
      }))
      rmSync(root, { recursive: true, force: true })
    },
  }
}

// Занимает свободный порт на 127.0.0.1 — так же, как его проверяет isPortFree.
// unref: если тест упадёт до close, открытый порт не помешает node --test завершиться
export async function occupyPort() {
  const server = createServer()
  await new Promise(done => server.listen(0, '127.0.0.1', done))
  server.unref()
  return {
    port: server.address().port,
    close: () => new Promise(done => server.close(done)),
  }
}

// Ждёт, пока условие станет истинным, или падает по таймауту
export async function waitFor(check, { timeoutMs = 5000, message = 'условие выполнится' } = {}) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await check()) return
    await new Promise(done => setTimeout(done, 100))
  }
  throw new Error(`не дождались за ${timeoutMs} мс: ${message}`)
}

// Жив ли процесс
export function isAlive(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}
