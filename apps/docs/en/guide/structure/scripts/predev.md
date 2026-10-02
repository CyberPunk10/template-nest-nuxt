# predev.mjs

Runs automatically before `pnpm dev` — via the npm `pre*` convention.

Before starting, it runs these steps in order:

1. **Copies `.env.example` → `.env`** for all four files at once (root, `apps/backend`, `apps/frontend`, `apps/docs`) — via the shared `copyEnvFiles()` from [`copy-env.mjs`](/en/guide/structure/scripts/copy-env). Not just "its own": even running before local development, it also creates the root `.env` if it's missing.
2. **Checks ports and resolves conflicts** — via the shared `checkPorts()` from [`check-ports.mjs`](/en/guide/structure/scripts/check-ports). On conflict it offers a dialog: kill the process holding the port or abort the run.
3. **Brings the database up** — via `dbUp()` from [`db.mjs`](/en/guide/structure/scripts/db). Under `pnpm dev` the applications run locally, but Postgres is needed from Docker. Calling it again on an already running container changes nothing.
4. **Generates the Prisma client** — via `dbGenerate()`. `postinstall` already did it after `pnpm install`, but the schema may have changed since: after an edit or a `git pull`.
5. **Applies new migrations** — via `dbMigrate()` (`prisma migrate deploy`). Only migrations the database doesn't have yet are applied; no new ones are created and the database isn't recreated.

The ports checked are the dev ones: `PORT` from `apps/backend/.env`, `apps/frontend/.env` and `apps/docs/.env`.

The database port isn't on that list: the check can only kill processes on the host, and this port is held by Docker. Step 3 catches it instead — Docker says `address already in use`.

[`predocker.mjs`](/en/guide/structure/scripts/predocker) does the same — differing in the list of ports and in not starting the database separately: `docker compose` brings it up along with the other services.

## What it prints

Each step prints a line with its result:

```
[predev.mjs] ✓ .env: created apps/backend/.env from .env.example
[predev.mjs] ✓ ports: backend 3100 · frontend 3200 · docs 5173
[predev.mjs] ✓ db: postgres is up
[predev.mjs] ✓ client: generated from schema.prisma
[predev.mjs] ✓ migrations: database is up to date
```

If a step fails — a line with ✗ and the step name, and preparation stops there:

```
[predev.mjs] ✗ ports: PORT=abc in apps/backend/.env - not a valid port number (0-65535)
```

| Step         | What to check                                                                            | Repeat on its own  |
| ------------ | ---------------------------------------------------------------------------------------- | ------------------ |
| `.env`       | that `.env.example` exists next to the `.env`                                            | `pnpm env:copy`    |
| `ports`      | the `PORT` value in the named `.env`                                                     | `pnpm predev`      |
| `db`         | that Docker is running and `POSTGRES_*` are set in the root `.env`                       | `pnpm db:up`       |
| `client`     | the Prisma error above — usually a typo in `schema.prisma`                               | `pnpm db:generate` |
| `migrations` | the Prisma error above, and that `POSTGRES_*` in `apps/backend/.env` match the root ones | `pnpm db:migrate`  |

## Usage

It runs on its own — no need to call it separately:

```bash
pnpm dev
```

npm sees the `predev` script and runs it before `dev`. To run only the preparation, without starting the applications:

```bash
pnpm predev
```
