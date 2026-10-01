import { ROOT_ENV, copyEnvFiles } from './copy-env.mjs'
import { checkPorts } from './check-ports.mjs'
import { ensureNetwork } from './ensure-network.mjs'
import { createLogger } from './log.mjs'

const log = createLogger('predocker.mjs')

// Каждый шаг пишет строку о результате (✓), а при ошибке — какой шаг
// не выполнен (✗): так по выводу `pnpm docker:up` видно, что произошло, и
// понятно, какую часть повторить вручную.
let step = ''

async function main() {
  // Шаг 1: создать .env из .env.example если отсутствует
  step = '.env'
  const created = copyEnvFiles()
  log.ok(created.length ? `.env: created ${created.join(', ')} from .env.example` : '.env: files in place')

  // Шаг 2: проверить хост-порты и разрешить конфликты
  // Проверять нужно только порт reverse proxy: наружу публикуется он один,
  // остальные сервисы живут во внутренней сети и хост-портов не занимают.
  step = 'ports'
  const ports = await checkPorts([
    { name: 'nginx', envPath: ROOT_ENV, key: 'NGINX_HOST_PORT' },
  ])
  log.ok(`ports: ${ports.map(p => `${p.name} ${p.port}`).join(' · ')}`)

  // Шаг 3: создать Docker-сеть, если её ещё нет
  step = 'network'
  const network = ensureNetwork()
  log.ok(`network: ${network.name} ${network.created ? 'created' : 'exists'}`)
}

main().catch((e) => {
  log.error(`${step}: ${e.message}`)
  process.exit(1)
})
