# package.json

The backend application's manifest. Its scripts work only inside their own workspace — from the root they're called through a filter (`pnpm --filter backend dev`) or transitively from the root commands.

| Script                                          | Command              | What it does                                         |
| ----------------------------------------------- | -------------------- | ---------------------------------------------------- |
| `dev`                                           | `nest start --watch` | Local development with hot-reload                    |
| `build`                                         | `nest build`         | Production build into `dist/`                        |
| `start`                                         | `nest start`         | Runs the built `dist/` without watch mode            |
| `start:prod`                                    | `node dist/main`     | Runs in production mode (what the `Dockerfile` uses) |
| `lint`                                          | `eslint ... --fix`   | Linter with auto-fix                                 |
| `type-check`                                    | `tsc --noEmit`       | Type-checks without building                         |
| `start:debug`                                   | `nest start --debug` | The same with the debugger port open                  |
| `test` / `test:watch` / `test:cov`              | `jest ...`           | Unit tests: once, in watch mode, with coverage        |
| `test:debug`                                    | `node --inspect-brk` | Tests under the debugger, single-threaded (`--runInBand`) |
| `test:e2e`                                      | `jest --config ...`  | E2E tests, own config `test/jest-e2e.json`            |

## Dependencies

| Package | Why |
| --- | --- |
| `@nestjs/core`, `@nestjs/common` | The NestJS core: modules, controllers, dependency injection |
| `@nestjs/platform-express` | The Express HTTP server under NestJS |
| `reflect-metadata`, `rxjs` | Required by NestJS: decorator metadata and streams |
| `@nestjs/config` | Reads `.env` and exposes settings through `ConfigService` |
| `joi` | Validates environment variables on startup (`src/config/env.validation.ts`) |
| `@nestjs/swagger` | Swagger UI and the API description from decorators, outside production only |
| `class-validator`, `class-transformer` | Validate and transform request bodies into DTOs |
| `@repo/shared` | Types shared with the frontend from `packages/shared` |

| Dev package | Why |
| --- | --- |
| `@nestjs/cli` | The `nest start` and `nest build` commands |
| `@nestjs/schematics` | `nest generate` generators (module, controller, service) |
| `typescript` | The TypeScript compiler |
| `jest`, `ts-jest`, `@types/jest` | Tests in TypeScript without a separate build |
| `@nestjs/testing` | The NestJS testing module with dependency overrides |
| `supertest`, `@types/supertest` | HTTP requests to the app in E2E tests |
| `@types/node`, `@types/express` | Node.js and Express types |

What lives where — [apps/backend](./).
