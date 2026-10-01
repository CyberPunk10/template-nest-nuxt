# ensure-network.mjs

Exports a single function — `ensureNetwork()`. It reads `COMPOSE_NETWORK_NAME` from the root `.env` and creates the Docker network if it doesn't exist yet. Repeat calls do nothing and return `created: false`.

The variable is mandatory: without it the function throws:

```
WARN[0000] The "COMPOSE_NETWORK_NAME" variable is not set. Defaulting to a blank string.
network  declared as external, but could not be found.
```

Called from [`predocker.mjs`](/en/guide/structure/scripts/predocker) — before `pnpm docker:up`, and from [`db.mjs`](/en/guide/structure/scripts/db) — before starting the database.

## Usage

There's no pnpm command of its own — it fires on `pnpm docker:up` and on `pnpm db:up` (including inside `pnpm dev`):

```js
import { ensureNetwork } from './ensure-network.mjs'

const { name, created } = ensureNetwork()   // created: true — network created, false — it already existed
```

The same by hand, if you need to bring the stack up with a plain `docker compose up`:

```bash
docker network create template-nest-nuxt_app
```
