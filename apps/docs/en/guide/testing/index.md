# Testing

Tests live inside the application they cover: every workspace package has its own runner, its own configuration and its own dependencies. There is no shared test package in the monorepo — NestJS and Nuxt applications are tested in different ways, and a shared config would have to branch on every one of those differences.

From the monorepo root the entry point is still a single command:

```bash
pnpm test         # unit tests across all packages
pnpm test:e2e     # e2e tests across all packages
```

Both run `pnpm -r`, walking every workspace package and invoking the script of that name. A package without such a script is skipped silently — giving a new application tests means adding a `test` script to its `package.json`, with nothing to change at the root.

A run can be narrowed to a single package without changing directory, using `--filter`:

```bash
pnpm --filter @repo/backend test           # backend unit tests only
pnpm --filter @repo/backend test:e2e       # backend e2e tests only
pnpm --filter @repo/backend test:watch     # any script of that package
```

`--filter` takes the package name from its `package.json`; the full name can be shortened (`backend`) or replaced with a path (`./apps/backend`). Arguments after the script name are passed through untouched, so runner flags work from here as well.

One quirk is worth knowing: if the selected package has no such script, pnpm exits **with code 0 and no output**. There is no error — in CI such a run is easy to mistake for a successful one, even though nothing ran at all.

## Two levels

The split into unit and e2e tests runs across the whole repository, whatever the runner.

**Unit tests** check a single unit of code in isolation: dependencies are replaced with stubs and nothing else is started. They are fast — milliseconds — which makes them comfortable to keep in watch mode while working.

**E2E tests** check the assembled application as a whole, reaching it from the outside the way a real client does.

The split is not a formality: the levels differ in where failures show up. Unit tests answer “does this function work correctly”, e2e — “is the application wired up correctly”. A fault in the wiring between layers — a global setting that was never registered, a contract that drifted apart between modules — cannot show up at the first level at all: each part is sound on its own.

So e2e neither replace unit tests nor are replaced by them. Unit tests cover logic with branches, e2e covers the application's contract to the outside world; there is no point duplicating every branch at the slower level.

## Conventions

Shared by all applications in the template:

- **Unit tests sit next to the file they cover**, distinguished by a suffix: `foo.ts` → `foo.spec.ts`. That way a test does not get lost when a module is moved, and it is visible in the project tree straight away
- **E2E tests go into a separate folder** of the application: they belong to the application as a whole rather than to any single file
- **Every test starts from a clean state.** Tests that depend on execution order start failing one by one when reordered or run in parallel — and runners are free to reorder files
- **A test exercises the same object the application will get.** An oversimplified stub, or a plain literal in place of the real data structure, yields a green test for a path that does not exist in the application

## By application

| Application                              | Stack             |
| ---------------------------------------- | ----------------- |
| [backend](./backend)     | Jest, Supertest   |

Frontend tests are not part of the template yet.

## Worth keeping in mind

Coverage is a guide, not a goal. A line the test executed but whose result it never checked still counts as covered, so a high percentage guarantees nothing on its own.

A more reliable check is mutation: introduce a fault into the code and make sure the test goes red. A test that stays green against broken code verifies nothing — and is worse than no test at all, because it creates a false sense of safety.
