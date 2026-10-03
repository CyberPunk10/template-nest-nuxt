# db.mjs

Manages the database: the container, the Prisma client and migrations. Works both as a CLI (`pnpm db:*`) and as a module — its functions are called from [`predev.mjs`](./predev).

The database lives in the shared `docker-compose.yml` with no profile, while the application services sit behind the `app` profile. That's why a command without a profile only touches `postgres` — more in [docker-compose.yml](../docker-compose#profiles).

## Commands

| Command            | What it does                                                               |
| ------------------ | -------------------------------------------------------------------------- |
| `pnpm db:up`       | Creates the network if needed, starts `postgres` and waits for healthcheck |
| `pnpm db:down`     | Stops `postgres`; the data stays in its volume                             |
| `pnpm db:generate` | Generates the Prisma client from the schema (`prisma generate`)            |
| `pnpm db:migrate`  | Applies migrations the database doesn't have yet (`prisma migrate deploy`) |

You rarely need these commands on their own: `pnpm dev` runs them itself. They help when the applications are already running or aren't needed — to apply migrations after a `git pull`, say, or to connect to the database with a client.

## Waiting for readiness

`up` passes the `--wait` flag: the command returns not when the container has been created, but when its healthcheck turns `healthy`. Without it Nest starts connecting before Postgres accepts connections and dies on startup.

```js
compose(['up', '-d', '--wait', 'postgres'])
```

The healthcheck is declared on the `postgres` service and relies on `pg_isready`.

## Why `down` only stops

`dbDown()` calls `docker compose stop`, not `down`. The consequences differ: `down` removes the container, and `down -v` removes the volume with the data too. Deleting data is deliberately not wrapped in a pnpm command, so it can't happen out of habit:

```bash
docker compose down -v   # drops the database along with its data
```

## Using it as a module

```js
import { dbUp, dbGenerate, dbMigrate } from './db.mjs'

dbUp()         // network + postgres + waiting for healthcheck
dbGenerate()   // prisma generate in apps/backend
dbMigrate()    // prisma migrate deploy in apps/backend
```
