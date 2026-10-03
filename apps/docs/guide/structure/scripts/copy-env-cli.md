# copy-env-cli.mjs

Тонкий CLI-раннер: читает флаг `--force` из аргументов и вызывает `copyEnvFiles()`.

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

Сообщает, что сделал:

```
[copy-env] ✓ created: apps/backend/.env
[copy-env] ✓ all .env files already exist
```

Отсюда два npm-скрипта:

```bash
pnpm env:copy          # node scripts/copy-env-cli.mjs
pnpm env:copy:force    # node scripts/copy-env-cli.mjs --force
```

Существует отдельно от [`copy-env.mjs`](./copy-env), чтобы сам модуль оставался чистым (без побочных эффектов при импорте) — весь сайд-эффект сосредоточен в этом файле, который вызывается только из npm-скриптов.
