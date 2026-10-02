# Database: PostgreSQL + Prisma

> **Branch:** this documentation applies only to the `postgres-prisma` branch.

## Stack

- **PostgreSQL 17** — spun up via Docker
- **Prisma 7** — ORM, migrations, client generation

---

## Running locally

> **When switching branches**, your local `.env` is not updated automatically — it may be missing variables required by the new branch. Compare it against `.env.example` and add whatever is missing. For example, when switching from `main` to `postgres-prisma`, the `POSTGRES_*` variables may be absent from `apps/backend/.env`. Copy them from `apps/backend/.env.example`.

Spin up PostgreSQL via Docker:

```bash
pnpm db:up
```

You rarely need the command on its own: `pnpm dev` brings the database up itself. Stop the container with `pnpm db:down` (data stays in the volume).

The database lives in the shared `docker-compose.yml` with no profile, while the application services sit behind the `app` profile. That way `docker compose up` only touches postgres, and the full stack comes up via `pnpm docker:up`.

`pnpm dev` applies migrations before starting. To run them by hand, use the command below; the database must be up (`pnpm db:up`):

```bash
pnpm db:migrate
```

---

## Configuration

### `apps/backend/.env`

Database connection parameters for Prisma and the application:

```
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=template
```

### Root `.env`

Database container parameters — read by Docker Compose:

```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=template
POSTGRES_PORT=5432
```

The user, password and database name are duplicated across two files on purpose: the root `.env` is read by Compose, `apps/backend/.env` by Nest when it runs on the host. A containerised backend receives the same values from the root `.env` (see `environment` in `docker-compose.yml`), so they can only drift for the host run.

### If port 5432 is taken

Change it in two files — to the same value:

```
.env                  POSTGRES_PORT=5435
apps/backend/.env     POSTGRES_PORT=5435
```

The root `.env` sets the port the database container is published on, on the host machine. The second one is needed when the backend runs through `pnpm dev`: it tells Nest and Prisma which port to connect to.

When the backend itself runs in a container, that second file isn't used at all: compose gives it `postgres:5432`, the service name and port inside the network. The host mapping plays no part there.

---

## Prisma

### Structure

```
apps/backend/
├── prisma/
│   ├── schema.prisma       ← models
│   ├── migrations/         ← migration history (committed to git)
│   └── seed.ts             ← creates the admin account
└── prisma.config.ts        ← Prisma configuration (datasource URL)
```

### Core commands

`pnpm prisma ...` commands — from `apps/backend/`, `pnpm db:*` — from the root.

| Task                             | Command                                 |
| -------------------------------- | --------------------------------------- |
| Create and apply a migration     | `pnpm prisma migrate dev --name <name>` |
| Apply new migrations             | `pnpm db:migrate`                       |
| Regenerate the client            | `pnpm db:generate`                      |
| Prisma Studio (`localhost:5555`) | `pnpm prisma studio`                    |

More on migrations — on the [Migrations](/en/guide/migrations) page.

### Client generation

The client is a build artifact: Prisma builds it from `schema.prisma` into `src/generated/prisma`, and it isn't in the repository.

Usually there's no need to generate it by hand: `postinstall` in `apps/backend/package.json` does it during `pnpm install`. That's how the client appears on a fresh clone, in CI and in the Docker image.

By hand — when the schema has changed: after editing it or after a `git pull`. The client won't update on its own then: `migrate dev` only changes the database and doesn't generate it, and `pnpm install` with no new dependencies skips `postinstall`.

```bash
pnpm db:generate
```

The generator is set to CommonJS:

```prisma
generator client {
  provider            = "prisma-client"
  output              = "../src/generated/prisma"
  moduleFormat        = "cjs"
  importFileExtension = ""
}
```

Both settings match how the code is actually executed in this template.

`moduleFormat = "cjs"` — because Nest compiles to CommonJS while the generator emits ESM by default. Without it the built client carries `import.meta`, which makes Node treat the file as an ES module and fail on `exports`:

```
ReferenceError: exports is not defined in ES module scope
```

This only shows up in the built image. Under `pnpm dev` Nest recompiles on the fly and runs the result from `dist/` in the same process, so the mismatch never surfaces.

`importFileExtension = ""` — because the generator emits `.ts` files only, yet by default references them as `.js`. TypeScript accepts such imports, Jest does not:

```
Cannot find module './internal/class.js' from 'generated/prisma/client.ts'
```

An empty value drops the extension from the imports, so the client resolves both for the build and for the tests.

### Seed: the admin account

Regular registration (`POST /auth/register`) always creates a user with the `user` role (guaranteed by the schema — `role Role @default(user)`), so without a separate step the database would never have a single `admin`. That's what `prisma/seed.ts` is for — run it as a separate command, including right after `migrate reset`:

```bash
cd apps/backend
pnpm prisma migrate reset   # recreate the database (if needed)
pnpm prisma db seed         # then explicitly seed the admin account
```

The script is idempotent (upsert by email) and reads its data from `ADMIN_EMAIL`/`ADMIN_PASSWORD` in `.env`.

Details (how it works, production notes) — in [Auth → Backend: Seed](./auth/backend.md#seed-creating-the-admin-account).

---

## Migrations

How migrations work, how to change the schema, and what to do if a migration fails or Prisma offers to reset the database — on a separate page, [Migrations](/en/guide/migrations).

---

## Prisma error codes

Prisma normalizes PostgreSQL errors into its own codes via `PrismaClientKnownRequestError`. This lets you handle errors without parsing the driver's text messages.

The most common codes:

| Code    | Meaning                                                     | Typical response                    |
| ------- | ----------------------------------------------------------- | ----------------------------------- |
| `P2002` | Unique constraint violation (e.g. email already taken)      | `409 Conflict`                      |
| `P2025` | Record not found on `update`, `delete`, `findUniqueOrThrow` | `404 Not Found`                     |
| `P2003` | Foreign key constraint violation                            | `409 Conflict` or `400 Bad Request` |

The idiomatic pattern is to go straight for `update`/`delete` and catch P2025, instead of a preliminary `findUniqueOrThrow`.

::: tip TOCTOU (Time-Of-Check Time-Of-Use)
A class of bugs where there is a window between checking a condition and acting on it in which the state can change. Here: between `findUniqueOrThrow` (the check) and `update`/`delete` (the use), another process manages to delete the record.
:::

❌ **Two queries with a TOCTOU window:**

```typescript
// Query 1: check that the record exists
await this.prisma.user.findUniqueOrThrow({ where: { id } }).catch(() => {
  throw new NotFoundException() // handled
})
// ← another process may delete the record here
// Query 2: update — throws an unhandled P2025 → 500
return await this.prisma.user.update({ where: { id }, data: dto })
```

✅ **One query, P2025 handled explicitly:**

```typescript
try {
  return await this.prisma.user.update({ where: { id }, data: dto })
} catch (e) {
  if (e instanceof PrismaClientKnownRequestError) {
    if (e.code === 'P2025') throw new NotFoundException()
    if (e.code === 'P2002') throw new ConflictException()
  }
  throw e
}
```

This eliminates the TOCTOU window between the two queries and halves the number of database round-trips.

Full list of codes: [Prisma Error Reference](https://www.prisma.io/docs/orm/reference/error-reference)
