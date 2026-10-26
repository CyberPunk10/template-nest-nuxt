# apps/backend

A NestJS application. Entry point — `src/main.ts`.

```
apps/backend/
├── src/
│   ├── common/
│   │   ├── filters/            global exception filters
│   │   └── transforms/         DTO transformers
│   ├── config/
│   │   └── env.validation.ts   Joi schema for environment variables
│   ├── modules/
│   │   ├── auth/               registration, login, refresh, sessions
│   │   ├── tasks/              task CRUD
│   │   └── users/              users
│   ├── app.controller.ts       /, /health, /dev/config
│   ├── app.module.ts           root module
│   ├── app.service.ts
│   ├── setup-app.ts            shared global setup for main and e2e
│   └── main.ts                 bootstrap: CORS, Swagger, ValidationPipe
├── test/                       e2e tests: default/ and throttle/, each with its own config
├── nest-cli.json
├── tsconfig.json               for the IDE and type-check (noEmit)
└── tsconfig.build.json         for nest build — produces a clean dist/
```

## Nest conventions

Nest has no strict requirements about where files go — everything is wired through decorators and modules. The layout used here:

- **`modules/<name>/`** — one self-contained feature: controller, service, DTOs. Every module is registered in `app.module.ts`
- **`common/`** — things that apply application-wide: filters, guards, interceptors. This is where the filter that normalises every error into a single JSON shape lives
- **`config/`** — environment validation. The schema runs at startup: a missing required variable means the app won't boot

## Two tsconfigs

`tsconfig.json` runs with `noEmit` — it serves the IDE and the `type-check` command. Building is `tsconfig.build.json`'s job, where `rootDir: ./src` is set: without it `dist/` would mirror the `apps/backend/src/...` path and the entry point would move away from `dist/main.js`.

More on the configs — [tsconfig.base.json](../../tsconfig-base).

Application scripts — [package.json](./package-json).
