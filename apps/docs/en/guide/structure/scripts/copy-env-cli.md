# copy-env-cli.mjs

A thin CLI runner: it reads the `--force` flag from the arguments and calls `copyEnvFiles()`.

```js
import { copyEnvFiles } from './copy-env.mjs'
import { createLogger } from './log.mjs'

const log = createLogger('copy-env')
const force = process.argv.includes('--force')

const written = copyEnvFiles(force)
log.ok(written.length
  ? `${force ? 'overwritten' : 'created'}: ${written.join(', ')}`
  : 'all .env files already exist')
```

It reports what it did:

```
[copy-env] ✓ created: apps/backend/.env
[copy-env] ✓ all .env files already exist
```

Hence the two npm scripts:

```bash
pnpm env:copy          # node scripts/copy-env-cli.mjs
pnpm env:copy:force    # node scripts/copy-env-cli.mjs --force
```

It exists separately from [`copy-env.mjs`](./copy-env) so the module itself stays clean (no side effects on import) — all the side effect is concentrated in this file, which is only invoked from the npm scripts.
