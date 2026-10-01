import { BACKEND_ENV, FRONTEND_ENV, DOCS_ENV, copyEnvFiles } from './copy-env.mjs'
import { checkPorts } from './check-ports.mjs'
import { createLogger } from './log.mjs'

const log = createLogger('predev.mjs')

// Каждый шаг пишет строку о результате (✓), а при ошибке — какой шаг
// не выполнен (✗): так по выводу `pnpm dev` видно, что произошло, и
// понятно, какую часть повторить вручную.
let step = ''

async function main() {
  // Шаг 1: создать .env из .env.example если отсутствует
  step = '.env'
  const created = copyEnvFiles()
  log.ok(created.length ? `.env: created ${created.join(', ')} from .env.example` : '.env: files in place')

  // Шаг 2: проверить порты и разрешить конфликты
  step = 'ports'
  const ports = await checkPorts([
    { name: 'backend', envPath: BACKEND_ENV, key: 'PORT' },
    { name: 'frontend', envPath: FRONTEND_ENV, key: 'PORT' },
    { name: 'docs', envPath: DOCS_ENV, key: 'PORT' },
  ])
  log.ok(`ports: ${ports.map(p => `${p.name} ${p.port}`).join(' · ')}`)
}

main().catch((e) => {
  log.error(`${step}: ${e.message}`)
  process.exit(1)
})
