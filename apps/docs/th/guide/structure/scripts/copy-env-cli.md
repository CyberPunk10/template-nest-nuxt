# copy-env-cli.mjs

CLI runner แบบบาง: อ่าน flag `--force` จาก argument แล้วเรียก `copyEnvFiles()`

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

แจ้งว่าทำอะไรไป:

```
[copy-env] ✓ created: apps/backend/.env
[copy-env] ✓ all .env files already exist
```

จึงมี npm script สองตัว:

```bash
pnpm env:copy          # node scripts/copy-env-cli.mjs
pnpm env:copy:force    # node scripts/copy-env-cli.mjs --force
```

แยกออกจาก [`copy-env.mjs`](./copy-env) เพื่อให้ตัว module เองสะอาด (ไม่มี side effect ตอน import) — side effect ทั้งหมดอยู่ในไฟล์นี้ไฟล์เดียว ซึ่งถูกเรียกจาก npm script เท่านั้น
