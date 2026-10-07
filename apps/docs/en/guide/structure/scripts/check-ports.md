# check-ports.mjs

A shared module with port-related utilities:

- `isPortFree(port)` — checks whether a port is free on `127.0.0.1`
- `killPort(port)` — kills the process holding a port (via `lsof`/`kill`, macOS/Linux only)
- `requirePort(envPath, key)` — reads a required port variable from `.env`, throwing a clear error naming the file if it's missing or invalid
- `checkPorts(services)` — checks a list of services (`{ name, envPath, key }`), and on conflict shows a dialog offering to kill the processes holding the ports or abort the run With the `{ stopDevSession: true }` option it first stops the previous `pnpm dev` entirely — only `predev.mjs` passes it.

[`predev.mjs`](./predev) and [`predocker.mjs`](./predocker) both use the same `checkPorts()`, passing it a different list of services — none of the dialog or process-killing logic is duplicated between the two scripts.

Killing just the process on the port is sometimes not enough: if `pnpm dev` is open in another terminal, its `nest start --watch` brings the killed backend back up as soon as it notices changes in `src`. So on a conflict `predev.mjs` first stops the previous run entirely — by the PID that [`dev.mjs`](./dev) wrote — and waits for the ports to be released. The rest — processes left over after a closed terminal, or unrelated programs — is handled by `killPort()`.

## Usage

There's no pnpm command of its own — other scripts import the module:

```js
import { checkPorts } from './check-ports.mjs'
import { BACKEND_ENV, FRONTEND_ENV } from './copy-env.mjs'

await checkPorts([
  { name: 'backend', envPath: BACKEND_ENV, key: 'PORT' },
  { name: 'frontend', envPath: FRONTEND_ENV, key: 'PORT' },
])
```

If every port is free the function returns silently. If not, it shows a dialog listing the busy ones.

The individual utilities are available on their own too:

```js
import { isPortFree, killPort, requirePort } from './check-ports.mjs'

const port = requirePort(BACKEND_ENV, 'PORT')   // 3100, or an error
if (!await isPortFree(port)) killPort(port)
```
