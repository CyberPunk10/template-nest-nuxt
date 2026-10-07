# predev.mjs

Runs automatically before `pnpm dev` — via the npm `pre*` convention.

Before starting, it runs these steps in order:

1. **Copies `.env.example` → `.env`** for all four files at once (root, `apps/backend`, `apps/frontend`, `apps/docs`) — via the shared `copyEnvFiles()` from [`copy-env.mjs`](./copy-env). Not just "its own": even running before local development, it also creates the root `.env` if it's missing.
2. **Checks ports and resolves conflicts** — via the shared `checkPorts()` from [`check-ports.mjs`](./check-ports). On conflict it offers a dialog: kill the process holding the port or abort the run.
3. **Brings the database up** — via `dbUp()` from [`db.mjs`](./db). Under `pnpm dev` the applications run locally, but Postgres is needed from Docker. Calling it again on an already running container changes nothing. Before that it checks that `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD` and `POSTGRES_DB` match in the root `.env` and `apps/backend/.env`: the container reads them from the first, the backend from the second. The check runs only when the backend uses the local database (`POSTGRES_HOST` is `localhost`); with a remote database different values are legitimate.
4. **Generates the Prisma client** — via `dbGenerate()`. `postinstall` already did it after `pnpm install`, but the schema may have changed since: after an edit or a `git pull`.
5. **Applies new migrations** — via `dbMigrate()` (`prisma migrate deploy`). Only migrations the database doesn't have yet are applied; no new ones are created and the database isn't recreated.
6. **Creates the admin if it doesn't exist yet** — via `dbSeed()` (`prisma db seed`) from `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `apps/backend/.env`. The seed leaves an existing user alone and doesn't overwrite its password. Development only: in production the admin is created with a separate command.

The ports checked are the dev ones: `PORT` from `apps/backend/.env`, `apps/frontend/.env` and `apps/docs/.env`.

The database port isn't on that list: the check can only kill processes on the host, and this port is held by Docker. Step 3 checks it instead, while the database container isn't running: if the port is taken by something else — for example, a PostgreSQL installed on the system — preparation stops with a hint to change `POSTGRES_PORT` in both `.env` files.

[`predocker.mjs`](./predocker) does the same — differing in the list of ports and in not starting the database separately: `docker compose` brings it up along with the other services.

## What it prints

Each step prints a line with its result:

```
[predev.mjs] ✓ .env: created apps/backend/.env from .env.example
[predev.mjs] ✓ ports: backend 3100 · frontend 3200 · docs 5173
[predev.mjs] ✓ db: postgres is up
[predev.mjs] ✓ client: generated from schema.prisma
[predev.mjs] ✓ migrations: database is up to date
[predev.mjs] ✓ admin: in place
```

If a step fails — a line with ✗ and the step name, and preparation stops there:

```
[predev.mjs] ✗ ports: PORT=abc in apps/backend/.env - not a valid port number (0-65535)
```

| Step         | What to check                                                                            | Repeat on its own  |
| ------------ | ---------------------------------------------------------------------------------------- | ------------------ |
| `.env`       | that `.env.example` exists next to the `.env`                                            | `pnpm env:copy`    |
| `ports`      | the `PORT` value in the named `.env`                                                     | `pnpm predev`      |
| `db`         | that Docker is running and `POSTGRES_*` match in the root `.env` and `apps/backend/.env` | `pnpm db:up`       |
| `client`     | the Prisma error above — usually a typo in `schema.prisma`                               | `pnpm db:generate` |
| `migrations` | the Prisma error above, and that `POSTGRES_*` in `apps/backend/.env` match the root ones | `pnpm db:migrate`  |
| `admin`      | the error above; without `ADMIN_*` in `apps/backend/.env` the seed is skipped               | `pnpm db:seed`     |

## Usage

It runs on its own — no need to call it separately:

```bash
pnpm dev
```

npm sees the `predev` script and runs it before `dev`. To run only the preparation, without starting the applications:

```bash
pnpm predev
```
