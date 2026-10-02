# package.json

The monorepo's root manifest. Its scripts orchestrate the whole repository: `pnpm -r ...` across all workspaces, Docker, `.env` preparation.

| Script         | Command                         | What it does                                                                              |
| -------------- | ------------------------------- | ----------------------------------------------------------------------------------------- |
| `env:copy`     | `node scripts/copy-env-cli.mjs` | Creates any missing `.env` files from `.env.example` — doesn't run or check anything else |
| `env:copy:force` | `node scripts/copy-env-cli.mjs --force` | The same, but overwrites existing `.env` files — local edits are lost |
| `predev`       | `node scripts/predev.mjs`       | Runs automatically before `dev` (npm `pre*` convention)                                   |
| `dev`          | `node scripts/dev.mjs`          | Brings up backend, frontend, and docs in parallel (via `concurrently`)                    |
| `predocker:up` | `node scripts/predocker.mjs`    | Runs automatically before `docker:up`                                                     |
| `docker:up`    | `docker compose up`             | Brings up all three services in Docker                                                    |
| `build`        | `pnpm -r build`                 | Builds all workspace packages (runs `build` in each `apps/*`)                             |
| `test`         | `pnpm -r test`                  | Unit tests across workspaces (packages without `test` are skipped)                        |
| `test:e2e`     | `pnpm -r test:e2e`              | E2E tests — they boot the whole app, hence kept out of `test`                             |
| `lint`         | `pnpm -r lint`                  | Runs the linter across all workspace packages                                             |
| `type-check`   | `pnpm -r type-check`            | Type-checks all workspace packages                                                        |
| `reinstall`    | `node scripts/reinstall.mjs`    | Removes `node_modules`/`pnpm-lock.yaml` and reinstalls dependencies from scratch          |
| `deps:sync`    | `pnpm update -r`                | Aligns the ranges in `package.json` with the versions actually installed                  |
| `prepare`      | `husky`                         | Sets up git hooks (runs automatically on `pnpm install`)                                  |

These don't overlap with the application scripts: the root ones work across the whole monorepo, per-app ones only inside their own workspace and are called through a filter (`pnpm --filter backend dev`) or transitively from the root commands.

Most commands are backed by [Node scripts](./scripts/) in `scripts/`.

## Tooling versions

```json
"packageManager": "pnpm@11.27.1",
"engines": {
  "node": ">=24",
  "pnpm": ">=11",
  "npm": "please-use-pnpm"
}
```

`packageManager` pins the pnpm version through Corepack; `engines` together with `engine-strict=true` in `.npmrc` prevents installing dependencies on an unsupported Node version — [pnpm and Corepack](../pnpm).
