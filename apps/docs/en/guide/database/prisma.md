# Prisma: schema and client

## Structure

```
apps/backend/
├── prisma/
│   ├── schema.prisma       ← models
│   ├── migrations/         ← migration history (committed to git)
│   └── seed.ts             ← creates the admin account
└── prisma.config.ts        ← Prisma configuration (datasource URL)
```

How to change the schema and work with `migrations/` — on the [Migrations](./migrations) page.

## Client generation

The client is a build artifact: Prisma builds it from `schema.prisma` into `src/generated/prisma`, and it isn't in the repository.

Usually there's no need to generate it by hand: `postinstall` in `apps/backend/package.json` does it during `pnpm install`. That's how the client appears on a fresh clone and in the Docker image.

By hand — when the schema has changed: after editing it or after a `git pull`. The client won't update on its own then: `migrate dev` only changes the database and doesn't generate it, and `pnpm install` with no new dependencies skips `postinstall`.

```bash
pnpm db:generate
```

## Generator settings

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

## Seed: the admin account

Regular registration (`POST /auth/register`) always creates a user with the `user` role (guaranteed by the schema — `role Role @default(user)`), so without a separate step the database would never have a single `admin`. That's what `prisma/seed.ts` is for — run it as a separate command, including right after `migrate reset`:

```bash
cd apps/backend
pnpm prisma migrate reset   # recreate the database (if needed)
pnpm prisma db seed         # optional: the next pnpm dev runs the seed too
```

`pnpm dev` runs the seed itself as a preparation step before starting, so you only need it manually when you want the admin right away. The script is idempotent: if a user with this email already exists, it does nothing and leaves the password alone. It reads its data from `ADMIN_EMAIL`/`ADMIN_PASSWORD` in `.env`.

Details (how it works, production notes) — in [Auth → Backend: Seed](../auth/backend#seed-creating-the-admin-account).
