import { createServer } from 'net'
import { execSync } from 'child_process'
import { intro, select, outro, cancel, isCancel } from '@clack/prompts'
import { relative } from 'path'
import { parseEnv } from './copy-env.mjs'
import { stopDevSession } from './dev-session.mjs'

// Проверяет, свободен ли порт
export function isPortFree(port) {
  return new Promise((resolve) => {
    const server = createServer()
    server.once('error', () => resolve(false))
    server.once('listening', () => server.close(() => resolve(true)))
    server.listen(port, '127.0.0.1')
  })
}

// Завершает процессы на указанном порту (только macOS/Linux — использует lsof)
export function killPort(port) {
  try {
    const pids = execSync(`lsof -ti :${port} 2>/dev/null`, { encoding: 'utf8' }).trim()
    if (pids) {
      pids.split('\n').forEach((pid) => {
        try {
          execSync(`kill ${pid}`)
        } catch {
          // процесс уже мог завершиться сам — не критично
        }
      })
      return true
    }
  } catch {
    // lsof недоступен или порт никем не занят — считаем порт свободным
  }
  return false
}

// Ждёт, пока порты освободятся: процессу нужно время, чтобы завершиться
async function waitForFreePorts(ports, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const free = await Promise.all(ports.map(isPortFree))
    if (free.every(Boolean)) return
    await new Promise(resolve => setTimeout(resolve, 250))
  }
}

// Читает обязательную переменную порта из .env, при отсутствии или некорректном значении — падает с понятной ошибкой
export function requirePort(envPath, key) {
  const env = parseEnv(envPath)
  // Путь в сообщении — от текущей папки (pnpm запускает скрипты из корня):
  // `apps/backend/.env` читается легче абсолютного пути.
  const file = relative(process.cwd(), envPath)
  if (!(key in env)) {
    throw new Error(`${key} not set in ${file} - check .env.example next to it`)
  }
  const port = Number(env[key])
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`${key}=${env[key]} in ${file} - not a valid port number (0-65535)`)
  }
  return port
}

// Проверяет порты нескольких сервисов, при конфликте предлагает диалог.
// services: [{ name, envPath, key }] — откуда и какую переменную порта читать для каждого.
// Возвращает проверенные порты: [{ name, port }] — чтобы вызывающий скрипт
// мог сообщить, на каких портах всё запустится.
// stopDevSession — при конфликте сначала остановить прошлый `pnpm dev`. Нужно
// только predev: он занимает те же порты. Перед `pnpm docker:up` работающий
// `pnpm dev` прокси не мешает, и останавливать его незачем.
export async function checkPorts(services, { stopDevSession: stopSession = false } = {}) {
  const ports = services.map(s => ({ ...s, port: requirePort(s.envPath, s.key) }))
  const result = ports.map(({ name, port }) => ({ name, port }))

  const free = await Promise.all(ports.map(s => isPortFree(s.port)))
  if (free.every(Boolean)) return result

  const busy = ports.filter((_, i) => !free[i])
  intro(`Port conflict: ${busy.map(s => `${s.name}=${s.port}`).join(', ')}`)

  const answer = await select({
    message: 'What would you like to do?',
    options: [
      { label: `Kill existing processes and use same ports (${ports.map(s => s.port).join(', ')})`, value: 'kill' },
      { label: 'Abort', value: 'abort' },
    ],
  })

  if (isCancel(answer) || answer === 'abort') {
    cancel('Aborted.')
    process.exit(1)
  }

  // Сначала останавливаем прошлый `pnpm dev` целиком и ждём, пока он отпустит порты.
  // Затем добиваем то, что всё ещё держит порты: процессы, оставшиеся после
  // закрытого терминала, или посторонние программы.
  if (stopSession && stopDevSession()) await waitForFreePorts(busy.map(s => s.port))
  busy.forEach(s => killPort(s.port))
  outro('Ports freed')
  return result
}
