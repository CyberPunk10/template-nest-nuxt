import { copyEnvFiles } from './copy-env.mjs'
import { createLogger } from './log.mjs'

const log = createLogger('copy-env')
const force = process.argv.includes('--force')

const written = copyEnvFiles(force)

log.ok(written.length
  ? `${force ? 'overwritten' : 'created'}: ${written.join(', ')}`
  : 'all .env files already exist')
