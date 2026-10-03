# package.json

The backend application's manifest. Its scripts work only inside their own workspace — from the root they're called through a filter (`pnpm --filter backend dev`) or transitively from the root commands.

| Script                             | Command              | What it does                                                                       |
| ---------------------------------- | -------------------- | ---------------------------------------------------------------------------------- |
| `dev`                              | `nest start --watch` | Local development with hot-reload                                                  |
| `build`                            | `nest build`         | Production build into `dist/`                                                      |
| `start`                            | `nest start`         | Runs the built `dist/` without watch mode                                          |
| `start:prod`                       | `node dist/main`     | Runs in production mode (what the `Dockerfile` uses)                               |
| `lint`                             | `eslint ... --fix`   | Linter with auto-fix                                                               |
| `type-check`                       | `tsc --noEmit`       | Type-checks without building                                                       |
| `start:debug`                      | `nest start --debug` | The same with the debugger port open                                               |
| `test` / `test:watch` / `test:cov` | `jest ...`           | Unit tests: once, in watch mode, with coverage                                     |
| `test:debug`                       | `node --inspect-brk` | Tests under the debugger, single-threaded (`--runInBand`)                          |
| `test:e2e`                         | `jest --config ...`  | E2E tests, own config `test/jest-e2e.json`                                         |
| `test:e2e:throttle`                | `jest --config ...`  | Rate limiting e2e — a separate config so one test's limits don't affect the others |

What lives where — [apps/backend](./).
