# Backend tests

The test stack is [Jest](https://jestjs.io/) as the runner, [ts-jest](https://kulshekhar.github.io/ts-jest/) for the TypeScript transform, `@nestjs/testing` for assembling modules and [Supertest](https://github.com/ladjs/supertest) for HTTP requests. All of it comes with `nest new` and needs no separate setup.

## Running

The commands below are written in their short form — the way they look from `apps/backend`. From the monorepo root, add `--filter @repo/backend` to any of them; see the [general section](./) for that and for running across all packages at once.

Beyond `test` and `test:e2e`, backend has commands for day-to-day work:

| Command           | What it does                                                     |
| ----------------- | ---------------------------------------------------------------- |
| `pnpm test:watch` | Re-runs affected tests whenever a file is saved                  |
| `pnpm test:cov`   | Measures coverage, writes the HTML report to `apps/backend/coverage/` |
| `pnpm test:debug` | Runs Jest under the Node inspector for debugging in an IDE       |

Running a single file or a single test:

```bash
pnpm test tasks.service                    # files whose path contains the string
pnpm test -t 'не затирает поля'            # tests whose name contains the string
pnpm test:e2e --testPathPatterns=tasks     # same for e2e

# the same from the monorepo root
pnpm --filter @repo/backend test tasks.service
```

Test names in this template are written in Russian, so `-t` takes a Russian substring — the runner matches the name as it is spelled in the spec file.

Flags are written without the `--` separator: pnpm already forwards arguments it does not recognise to the script, whereas an explicit `--` is passed along literally and Jest reads it as a file path.

## Three test suites

The suites are separated by location and by configuration.

|                | Unit tests                       | E2E tests                             | E2E rate limiting                  |
| -------------- | -------------------------------- | ------------------------------------- | ---------------------------------- |
| Command        | `pnpm test`                      | `pnpm test:e2e`                       | `pnpm test:e2e:throttle`           |
| Location       | `src/**/*.spec.ts`               | `test/default/*.e2e-spec.ts`          | `test/throttle/*.e2e-spec.ts`      |
| Configuration  | the `jest` section of `package.json` | `test/jest-e2e.json`              | `test/jest-e2e-throttle.json`      |
| What they load | a single class with stubs        | the whole application via `AppModule` | the application with the throttler on |
| Transport      | a direct method call             | HTTP through Supertest                | HTTP through Supertest             |

The file layout is shared across the repository ([Conventions](./#conventions)): `tasks.service.ts` → `tasks.service.spec.ts` next to it, e2e in `test/`.

What is specific to Jest here is that the suites need **separate configs** rather than one with several projects: their `rootDir` differs — the unit suite looks into `src`, e2e into the package root so it can see both `test/` and `src/`. Hence the different file-matching rules too (`testRegex` for the unit suite, `testMatch` for e2e): otherwise each suite would pick up the other's files.

The rate limiting tests are a third suite because of the environment. In the ordinary tests the throttler is disabled (`APP_ENV=test`), or accumulated counters would break neighbouring checks. The `429` test needs it enabled, so its `setupFiles` sets `APP_ENV=production` and lowers `THROTTLE_LIMIT` to `12` — a limit reachable in seconds. This can't share a config with the other e2e tests: the settings are applied before modules load and affect the whole run.

## Unit tests

The class under test is assembled through `Test.createTestingModule` — the same DI container as in production, only with substituted dependencies:

```ts
const module: TestingModule = await Test.createTestingModule({
  providers: [TasksService],
}).compile()

service = module.get<TasksService>(TasksService)
```

The module is recreated in `beforeEach`, not in `beforeAll`. `TasksService` keeps tasks in the memory of the instance itself, and a service shared across the file would mean tasks from one test are visible in the next: tests would start depending on execution order and failing one by one when reordered.

A dependency that plays no part in the behaviour under test is replaced with a stub. `AppController` reads config, but there is no need to start `ConfigModule` and parse `.env` for that:

```ts
{
  provide: ConfigService,
  useValue: { get: (key: string, defaultValue?: unknown) => env[key] ?? defaultValue },
}
```

The stub reproduces the real method's signature in full, including the second argument — the default value. A simplified `(key) => env[key]` stub would behave differently from the real `ConfigService`, and the test would start lying the moment the code relies on a default.

### Exercise the object the application will actually get

The difference between a literal and a DTO instance is not a formality. `ValidationPipe` with `transform: true` hands the service not the object that arrived in the request body, but an instance of the DTO class, where **every** declared field is present and the ones that were not sent equal `undefined`:

```ts
plainToInstance(UpdateTaskDto, { description: 'Новое' })
// UpdateTaskDto { title: undefined, description: 'Новое' }
// Object.keys(dto) → ['title', 'description']
```

A test passing the literal `{ description: 'Новое' }` into `service.update()` exercises a path that does not exist in the application. That is why in `tasks.service.spec.ts` the DTO for such checks is built exactly the way the pipe builds it — through `plainToInstance`.

## E2E tests

The application is assembled from the real `AppModule` and answers real HTTP requests:

```ts
const moduleFixture = await Test.createTestingModule({ imports: [AppModule] }).compile()
app = setupApp(moduleFixture.createNestApplication())
await app.init()
```

`app.init()` starts the application without taking a port — Supertest talks to the HTTP server directly via `app.getHttpServer()`. `PORT` stays free, so tests can run alongside `pnpm dev`.

The application must be closed in `afterAll`/`afterEach`: without `app.close()` Jest will not exit and will print a warning about open handles.

### The application's configuration is not duplicated in tests

Global middleware, pipes and filters are listed once — in `src/setup-app.ts`, which both `main.ts` and every e2e test call:

```ts
export function setupApp(app: INestApplication): INestApplication {
  app.use(cookieParser())
  app.useGlobalFilters(new HttpExceptionFilter())
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  return app
}
```

`JwtStrategy` reads the token from `req.cookies` — without `cookieParser` every protected route answers `401`, even when the request does carry the cookies.

`Test.createTestingModule` assembles modules only — everything attached in `main.ts` in production is absent from the test application. Copy-pasting that list into the test would leave e2e checking an application configured differently from production, and the two would drift apart at the first edit: drop `forbidNonWhitelisted` from `main.ts` and the tests stay green, because the setting is still there in their own copy. A shared function makes that drift impossible.

CORS, Swagger and `listen` are not part of `setupApp`: they have no bearing on the endpoint behaviour under test. CORS keys off the `Origin` header, which supertest never sends, Swagger mounts a separate route, and `listen` opens a port — in tests the application lives in memory.

### State between tests

`auth.e2e-spec.ts` starts the application once in `beforeAll` and isolation comes from the data: `beforeEach` calls `cleanupTestData()` and removes the test users. That is markedly cheaper than recreating the application for every test.

`app.e2e-spec.ts` has no state at all, so it uses `beforeAll` and starts the application once.

### Environment variables

`AppModule` calls `ConfigModule.forRoot()` right in the `@Module` decorator, which means the environment is validated **at the moment the module is imported**. Setting a variable inside `beforeAll` is already too late — the import has happened by then.

That is why the e2e config pulls in `test/setup-env.ts` through `setupFiles`: this hook runs before the test files are loaded.

```ts
process.env.CORS_ORIGIN ??= 'http://localhost:3200'
```

`CORS_ORIGIN` is the only variable without a default in the [Joi schema](../env-variables), and the application will not start without it. The `??=` operator does not overwrite a value that is already set: locally `.env` is picked up, in CI the fallback applies. The schema accepts `NODE_ENV=test` — Jest sets it on its own.

## What the tests cover

`pnpm test:cov` prints a coverage table. Excluded from the report are the specs themselves, `main.ts` (the bootstrap is covered end-to-end by e2e) and `src/generated/` — code generated by Prisma on the database branches: it would drag the overall figure down while having nothing to do with the project's own code. On why the coverage percentage means little by itself, see the [general section](./#worth-keeping-in-mind).

Currently in the template:

- **`tasks.service.spec.ts`** — CRUD through a mocked Prisma client: filtering by owner, partial updates that leave other fields intact, `NotFoundException` for an unknown `id` and `ForbiddenException` for someone else's task
- **`users.service.spec.ts`** — user CRUD: mapping Prisma codes onto HTTP exceptions — `P2025` → `NotFoundException`, `P2002` → `ConflictException` on a duplicate email
- **`app.controller.spec.ts`** — `/health` and `/dev/config`, including how `publicUrl` differs between dev and production
- **`http-exception.filter.spec.ts`** — normalising errors into a single JSON shape, and the fact that the text of an unexpected exception does not leak to the client
- **`auth.e2e-spec.ts`** — the full cycle: registration, login, refresh with token rotation, logout, reuse detection, access to protected routes
- **`app.e2e-spec.ts`** — `/`, `/health`, `/dev/config` and `404` for an unknown route
- **`throttle.e2e-spec.ts`** — `429` once the request limit is exceeded (a separate suite, see above)

## Adding tests

For a new module:

1. A unit test for the service — `src/modules/<name>/<name>.service.spec.ts`. Check the business logic: what is returned, which exceptions are thrown, what changes in the state
2. An e2e test for the controller — `test/default/<name>.e2e-spec.ts`. Check the HTTP contract: status codes, body shape, validation. Start the application through `setupApp` — otherwise validation and the exception filter are not in place, and the test will lock in status codes the live server does not return

A separate unit test for a controller is usually redundant: if the controller only delegates to a service, there is nothing to check in isolation — its whole point (routes, pipes, status codes) is visible only at the e2e level.
