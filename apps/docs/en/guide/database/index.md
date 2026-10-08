# Database: PostgreSQL + Prisma

> **Branch:** this documentation applies only to the `postgres-prisma` branch.

## Stack

- **PostgreSQL 17** — spun up via Docker
- **Prisma 7** — ORM, migrations, client generation

## How it works

PostgreSQL always runs in a container — under both `pnpm dev` and `pnpm docker:up`. The database lives in the shared `docker-compose.yml` with no profile, while the application services sit behind the `app` profile. That way `docker compose up` only touches postgres, and the full stack comes up via `pnpm docker:up`.

Starting the project takes care of preparing the database: before starting, `pnpm dev` brings the container up, generates the Prisma client and applies migrations — [details](../structure/scripts/predev). In Docker mode the backend container applies migrations on startup.

To bring the database up or stop it on its own:

```bash
pnpm db:up     # start the container and wait until it's ready
pnpm db:down   # stop it; the data stays in the volume
```

## Core commands

`pnpm prisma ...` commands — from `apps/backend/`, `pnpm db:*` — from the root.

| Task                             | Command                                 |
| -------------------------------- | --------------------------------------- |
| Create and apply a migration     | `pnpm prisma migrate dev --name <name>` |
| Apply new migrations             | `pnpm db:migrate`                       |
| Regenerate the client            | `pnpm db:generate`                      |
| Prisma Studio (`localhost:5555`) | `pnpm prisma studio`                    |
