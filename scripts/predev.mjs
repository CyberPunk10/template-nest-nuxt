import { createServer } from 'net'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { intro, select, outro, cancel, isCancel } from '@clack/prompts'
import { execSync } from 'child_process'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const BACKEND_ENV = resolve(ROOT, 'apps/backend/.env')
const BACKEND_ENV_EXAMPLE = resolve(ROOT, 'apps/backend/.env.example')
const FRONTEND_ENV = resolve(ROOT, 'apps/frontend/.env')
const FRONTEND_ENV_EXAMPLE = resolve(ROOT, 'apps/frontend/.env.example')

// Парсит .env файл в объект { KEY: 'value' }
function parseEnv(filePath) {
  if (!existsSync(filePath)) return {}
  return Object.fromEntries(
    readFileSync(filePath, 'utf8')
      .split('\n')
      .filter((l) => l && !l.startsWith('#') && l.includes('='))
      .map((l) => {
        const idx = l.indexOf('=')
        return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()]
      }),
  )
}

// Копирует .env.example → .env если .env отсутствует
function copyEnvExample(envPath, examplePath) {
  if (!existsSync(envPath) && existsSync(examplePath)) {
    writeFileSync(envPath, readFileSync(examplePath, 'utf8'))
  }
}

// Проверяет, свободен ли порт
function isPortFree(port) {
  return new Promise((resolve) => {
    const server = createServer()
    server.once('error', () => resolve(false))
    server.once('listening', () => server.close(() => resolve(true)))
    server.listen(port, '127.0.0.1')
  })
}

// Завершает процессы на указанном порту (только macOS/Linux — использует lsof)
function killPort(port) {
  try {
    const pids = execSync(`lsof -ti :${port} 2>/dev/null`, { encoding: 'utf8' }).trim()
    if (pids) {
      pids.split('\n').forEach((pid) => {
        try { execSync(`kill ${pid}`) } catch {}
      })
      return true
    }
  // eslint-disable-next-line no-empty
  } catch {}
  return false
}

// Проверяет порты backend и frontend, при конфликте предлагает диалог
async function checkPorts() {
  const backendPort = parseInt(parseEnv(BACKEND_ENV).PORT ?? '3001')
  const frontendPort = parseInt(parseEnv(FRONTEND_ENV).PORT ?? '3000')

  const [backendFree, frontendFree] = await Promise.all([
    isPortFree(backendPort),
    isPortFree(frontendPort),
  ])

  if (backendFree && frontendFree) return

  const busyPorts = [
    !backendFree && `backend=${backendPort}`,
    !frontendFree && `frontend=${frontendPort}`,
  ].filter(Boolean).join(', ')

  intro(`Port conflict: ${busyPorts}`)

  const answer = await select({
    message: 'What would you like to do?',
    options: [
      { label: `Kill existing processes and use same ports (${backendPort}, ${frontendPort})`, value: 'kill' },
      { label: 'Abort', value: 'abort' },
    ],
  })

  if (isCancel(answer) || answer === 'abort') {
    cancel('Aborted.')
    process.exit(1)
  }

  if (!backendFree) killPort(backendPort)
  if (!frontendFree) killPort(frontendPort)
  outro('Ports freed')
}

async function main() {
  // Шаг 1: создать .env из .env.example если отсутствует
  copyEnvExample(BACKEND_ENV, BACKEND_ENV_EXAMPLE)
  copyEnvExample(FRONTEND_ENV, FRONTEND_ENV_EXAMPLE)

  // Шаг 2: проверить порты и разрешить конфликты
  await checkPorts()
}

main().catch((e) => {
  console.error('predev failed:', e.message)
  process.exit(1)
})
