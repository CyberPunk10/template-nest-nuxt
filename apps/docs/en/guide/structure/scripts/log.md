# log.mjs

Prefixes the scripts' own messages in `scripts/`.

```js
import { createLogger } from './log.mjs'

const log = createLogger('predev.mjs')

log.ok('ports: backend 3100')      // [predev.mjs] ✓ ports: backend 3100
log.error('ports: PORT=abc ...')   // [predev.mjs] ✗ ports: PORT=abc ...
log.log('Ports checked')           // [predev.mjs] Ports checked
```

`ok` marks a completed step (✓), `error` — an error (✗). The marks show without colour too — in CI logs and with `NO_COLOR`.

## Why

The scripts run `docker compose`, `pnpm install` and `concurrently`, and the output of those commands goes to the same terminal. Without a marker your own lines get lost in the common stream.

The format deliberately mirrors the `concurrently` prefixes (`[Nest]`, `[Nuxt]`) but takes its own colour — magenta for ordinary messages, red for errors; the ✓ tick is green. Red, yellow and cyan are taken by `concurrently` itself, see [dev.mjs](./dev).

## When colour is not emitted

Escape codes are emitted only when the output goes to a terminal. Redirected into a file or running in CI they would turn into `ESC[35m` noise, so `process.stdout.isTTY` is checked. The `NO_COLOR` variable disables colour explicitly — a widely followed convention.

```bash
pnpm docker:up                 # prefix in colour
pnpm docker:up > log.txt       # with no escape codes
NO_COLOR=1 pnpm docker:up      # the same, forced
```

