import { createServer } from 'net'
import { execSync } from 'child_process'
import { intro, select, outro, cancel, isCancel } from '@clack/prompts'
import { relative } from 'path'
import { parseEnv } from './copy-env.mjs'

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
export async function checkPorts(services) {
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

  busy.forEach(s => killPort(s.port))
  outro('Ports freed')
  return result
}
