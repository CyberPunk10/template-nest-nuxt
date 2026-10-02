# Migrations

A migration is an SQL file that moves the database from one schema state to the next. Migrations are created and applied by [Prisma Migrate](https://www.prisma.io/docs/orm/v7/prisma-migrate). This page covers how it's set up in the template and what to do in common situations.

## Cheat sheet

`pnpm prisma ...` commands run from `apps/backend/`, `pnpm db:*` commands run from the root.

| Task                                         | Command                                                                 |
| -------------------------------------------- | ----------------------------------------------------------------------- |
| Create and apply a migration                 | `pnpm prisma migrate dev --name <name>`                                 |
| Create a migration to edit, without applying | `pnpm prisma migrate dev --name <name> --create-only`                   |
| Apply new migrations                         | `pnpm db:migrate`                                                       |
| Regenerate the client                        | `pnpm db:generate`                                                      |
| What's applied and what isn't                | `pnpm prisma migrate status`                                            |
| Mark a failed migration                      | `pnpm prisma migrate resolve --rolled-back <name>` / `--applied <name>` |
| Recreate the local database                  | `pnpm prisma migrate reset`, then `pnpm prisma db seed`                 |

## How it works

The files live in `apps/backend/`, the log lives in the database itself:

| What                      | Where                                    | Role                                                                |
| ------------------------- | ---------------------------------------- | ------------------------------------------------------------------- |
| Schema                    | `prisma/schema.prisma`                   | What the database should look like. This is the only thing you edit |
| Migration history         | `prisma/migrations/`                     | A folder with a `migration.sql` per change. Committed in full       |
| Log of applied migrations | the `_prisma_migrations` table in the DB | Which migrations have been applied, and with which checksum         |
| Prisma client             | `src/generated/prisma`                   | Built from the schema, not in the repository                        |

The schema and the history are two separate sources. Only the history reaches the database: `migrate deploy` applies the files from `prisma/migrations/` and doesn't read the schema. The client, on the other hand, is built from the schema and knows nothing about migrations. That's why a schema change needs both steps: a migration for the database and generation for the client.

`prisma/migrations/migration_lock.toml` is committed too: Prisma uses it to notice an attempt to switch database providers.

## When migrations are applied automatically

The project is set up so that migrations are applied on their own on every start — you don't need to apply them by hand:

| Start            | Who applies them                                                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm dev`       | `predev.mjs`, the `migrations` step — [details](/en/guide/structure/scripts/predev)                                                              |
| `pnpm docker:up` | the backend container on startup, before the application starts — [details](/en/guide/structure/apps/backend/docker-image#migrations-on-startup) |

In both cases it's `prisma migrate deploy`. It applies only the migrations the database doesn't have yet, asks nothing, creates no new migrations and doesn't recreate the database. It skips migrations that are already applied, so running it again changes nothing. At the same time it runs `migration.sql` as is and doesn't warn about data loss — which is why the SQL is checked before committing.

`prisma migrate dev` is a tool for whoever changes the schema: it creates new migrations and may offer to recreate the database. It's only ever run by hand.

## From a schema edit to production

The full cycle of a schema change. The main rule: in production `migrate deploy` will run `migration.sql` as is, without asking, so everything that protects the data happens **before the commit** and **before the rollout**.

### Development

The database must be up — `pnpm dev` or `pnpm db:up` brings it up. `pnpm prisma ...` commands run from `apps/backend/`.

1. **Edit the schema** — `prisma/schema.prisma`.

2. **Create the migration without applying it:**

   ```bash
   pnpm prisma migrate dev --name add_task_priority --create-only
   ```

   This creates `prisma/migrations/<date>_add_task_priority/migration.sql`. The name briefly describes the change, in `snake_case`. If the change only adds something new (a table, an optional field), you can leave out `--create-only`: the migration is applied right away and step 4 is skipped.

3. **Read `migration.sql`.** Pay special attention to statements that can lose data or fail on a populated table:

   | In the SQL                                  | Why it's dangerous                                               | What to do                                                                     |
   | ------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------ |
   | `DROP COLUMN`, `DROP TABLE`                 | the data is deleted                                              | if it's a rename — [replace it with `RENAME`](#renaming-a-field-or-model)      |
   | `ADD COLUMN ... NOT NULL` without `DEFAULT` | the migration fails if the table has rows                        | [set a default or split it into steps](#a-required-field-on-a-table-with-data) |
   | `ALTER COLUMN ... TYPE`                     | fails on, or distorts, values that don't convert to the new type | test it on data, add `USING` if needed                                         |
   | `CREATE UNIQUE INDEX`                       | fails if the data already has duplicates                         | remove the duplicates first with an `UPDATE`/`DELETE` in the same migration    |

   Prisma warns about data loss itself as well — in a comment at the top of `migration.sql` and in the `migrate dev` output.

4. **Apply the migration:**

   ```bash
   pnpm prisma migrate dev
   ```

5. **Check the result.** Running `pnpm prisma migrate dev` again should answer `Already in sync, no schema change or pending migration was found.` — meaning the SQL brought the database exactly to the schema. If Prisma offers a new migration, the edit in step 3 is wrong. Prisma doesn't check the data: if you changed a table with data, put test rows into it beforehand and make sure they're still there after applying (`pnpm prisma studio`).

6. **Update the client** and the code that uses the changed fields:

   ```bash
   pnpm prisma generate   # from the root — pnpm db:generate
   ```

7. **Commit the schema and the migration folder together**, in one commit. In review, `migration.sql` is read as carefully as code.

::: info Shadow database
Before creating a migration, `migrate dev` replays the whole history on a temporary "shadow" database to make sure the history and the real database agree. For that the database user needs permission to create databases. The user from `docker-compose.yml` has it: the Postgres image creates `POSTGRES_USER` as a superuser.
:::

### Production

1. **Test the migration on a copy of production data** if it changes tables with data. A local database is usually small and clean, while production has `NULL`s, duplicates and values you don't know about. Restore a fresh copy of the production database (staging, or a dump taken as in step 2) and run `migrate deploy` against it.

2. **Back up** the production database before the rollout — from the project folder on the server:

   ```bash
   docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -Fc "$POSTGRES_DB"' > backup.dump
   ```

   To restore from it:

   ```bash
   docker compose exec -T postgres sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists' < backup.dump
   ```

3. **Roll out the new version.** The backend container applies the migrations itself on startup — before the new code starts, via `migrate deploy`. Nothing needs to be run by hand.

4. **If the old version of the application keeps running during the rollout** — several instances, a gradual rollout — a breaking change has to be split into compatible steps: [expand and contract](#without-downtime-expand-and-contract).

5. **If the migration fails**, the backend container won't start; the cause is in its logs (`docker compose logs backend`). What to do next is in [A migration failed](#a-migration-failed), the "if the data must be kept" option.

In production you never run `migrate dev`, `migrate reset` or `db push`: the first two can recreate the database, and `db push` changes it bypassing the migration history.

## After `git pull`

Nothing to do: `pnpm dev` generates the client and applies new migrations before starting.

If the applications are already running, restart `pnpm dev` or run the steps by hand (the database must be up):

```bash
# from the root
pnpm db:generate   # in apps/backend — pnpm prisma generate
pnpm db:migrate    # in apps/backend — pnpm prisma migrate deploy
```

## Breaking changes

Editing `migration.sql` is safe as long as the migration hasn't been applied. That's why it's created without applying, edited, and only then applied:

```bash
cd apps/backend
pnpm prisma migrate dev --name rename_bio --create-only   # create without applying
# edit prisma/migrations/<date>_rename_bio/migration.sql
pnpm prisma migrate dev                                   # apply
```

A committed migration is not changed: others may already have it applied, and Prisma will notice the edit by its checksum. The fix is a new migration. If the migration exists only on your machine, you can delete it and create it again.

### Renaming a field or model

Prisma Migrate doesn't record what exactly you did to the schema: it compares two snapshots, "before" and "after". All the snapshots show is that the field `bio` disappeared and the field `biography` appeared — from them a rename can't be told apart from removing one field and adding another. So Prisma generates the latter:

```sql
ALTER TABLE "Profile" DROP COLUMN "bio",
ADD COLUMN "biography" TEXT NOT NULL;
```

The column's data is lost in the process. Replace the SQL with a rename:

```sql
ALTER TABLE "Profile" RENAME COLUMN "bio" TO "biography";
```

The same goes for a model: `ALTER TABLE ... RENAME TO ...` instead of dropping and creating the table.

### A required field on a table with data

A `NOT NULL` column without a default can't be added to a table that already has rows — the migration fails. Options:

- set a default in the schema (`@default(...)`);
- split the migration into three steps in one `migration.sql`: add the column without `NOT NULL`, fill it with an `UPDATE`, then `ALTER COLUMN ... SET NOT NULL`.

### Without downtime: expand and contract

If the old version of the application works with the already updated database for a while — several instances, a gradual rollout — even a rename via `RENAME` will break it. Then the change is split into steps, each compatible with the current code:

1. **Expand**: add the new field; the application writes to both and reads from the old one.
2. Copy the data in a separate migration: `UPDATE "Profile" SET biography = bio;`.
3. The application reads from the new field, then stops writing to the old one.
4. **Contract**: remove the old field.

More in the [Prisma documentation](https://www.prisma.io/docs/orm/v7/prisma-migrate/workflows/customizing-migrations#example-use-the-expand-and-contract-pattern-to-evolve-the-schema-without-downtime).

## When something goes wrong

### A migration failed

`predev` stops at the `migrations` step, and Prisma reports the cause:

```
Error: P3018
A migration failed to apply. New migrations cannot be applied before the error is recovered from.
Migration name: 20261002000000_add_task_priority
Database error:
ERROR: column "priority" of relation "Task" contains null values
```

The failed migration is recorded in `_prisma_migrations`, and subsequent `deploy` runs refuse to work until it's dealt with:

```
Error: P3009
migrate found failed migrations in the target database, new migrations will not be applied.
```

**Locally, if the data isn't needed**: fix the cause — for example, the SQL in your own not-yet-committed migration — and [recreate the database](#recreating-the-local-database).

**If the data must be kept**: check the state and mark the migration by hand:

```bash
cd apps/backend
pnpm prisma migrate status                                    # what's applied, what failed
pnpm prisma migrate resolve --rolled-back "<migration name>"  # changes reverted by hand — apply again
pnpm prisma migrate resolve --applied "<migration name>"      # changes completed by hand — consider it applied
```

If the migration was partly executed, revert the steps already done by hand before `--rolled-back`. More in the [Prisma documentation](https://www.prisma.io/docs/orm/v7/prisma-migrate/workflows/patching-and-hotfixing#failed-migration).

### `migrate dev` offers to reset the database

Before creating a migration, `migrate dev` checks the history against the database and stops if they've diverged:

```
Drift detected: Your database schema is not in sync with your migration history.
```

Common causes:

- **Switching branches.** Another branch had a migration, it was applied to the local database, and the current branch doesn't have its file.
- **An already applied migration was edited.** Prisma stores a checksum for each migration and notices the edit.
- **The database was changed bypassing migrations** — by hand or via `prisma db push`.

The right fix is to remove the cause: bring back the missing file (switch back to the branch that has it) or revert the edit to the applied migration. If you don't need the local data, it's simpler to agree to the reset.

`migrate deploy`, which `pnpm dev` runs, doesn't look for such divergences: it only warns about an edited migration, and doesn't notice a missing one or manual changes to the database. To check the history by hand — `pnpm prisma migrate status` from `apps/backend`: it shows unapplied, failed and locally missing migrations.

### Recreating the local database

Recreate the database and apply all migrations from scratch — **all data will be deleted**:

```bash
cd apps/backend
pnpm prisma migrate reset   # asks for confirmation
pnpm prisma db seed         # seeding after a reset is run separately
```

The seed creates the admin account — [details](/en/guide/database/prisma#seed-the-admin-account).
