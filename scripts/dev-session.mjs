import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

// PID запущенного `pnpm dev`. dev.mjs записывает его при старте, а при конфликте
// портов прошлый запуск останавливается целиком — по этому PID, вместе с
// наблюдателями вроде `nest start --watch`. Убить только процесс на порту мало:
// наблюдатель поднял бы его снова.
// Файл лежит в node_modules/.cache — общем месте для служебных файлов
// инструментов, — в своей подпапке, чтобы не пересечься с чужими.
const PID_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'node_modules', '.cache', 'dev-session')
const PID_FILE = resolve(PID_DIR, 'dev-nest-nuxt.pid')

export function rememberDevSession() {
  mkdirSync(PID_DIR, { recursive: true })
  writeFileSync(PID_FILE, String(process.pid))
  process.on('exit', () => rmSync(PID_FILE, { force: true }))
}

// Останавливает прошлый `pnpm dev`, если он ещё работает. concurrently в dev.mjs
// на SIGTERM сам завершает все запущенные им процессы.
// Возвращает true, если было что останавливать.
export function stopDevSession() {
  if (!existsSync(PID_FILE)) return false
  const pid = Number(readFileSync(PID_FILE, 'utf8'))
  try {
    process.kill(pid, 'SIGTERM')
    return true
  } catch {
    // процесса уже нет — файл остался от запуска, завершённого аварийно
    return false
  }
}
