# Project structure

A monorepo of five packages: three applications in `apps/`, two shared libraries in `packages/`.

```
template-nest-nuxt/
├── apps/
│   ├── backend/          NestJS API
│   ├── frontend/         Nuxt 4
│   └── docs/             VitePress — these docs
├── packages/
│   ├── shared/           types (DTOs) and translations
│   └── ui/               Vue components
├── infra/
│   └── nginx/            reverse proxy: config and Dockerfile
├── scripts/              Node scripts behind the pnpm commands
├── .husky/               git hooks
├── docker-compose.yml
└── root configs          pnpm, TypeScript, ESLint
```

How the packages depend on each other — see [Architecture](../architecture).

## Configs

| File                    | Purpose                                                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm-workspace.yaml`   | Declares which directories are workspaces (`apps/*`, `packages/*`). Without it pnpm won't link the packages together                              |
| `tsconfig.base.json`    | Shared TypeScript settings: strictness and checks. Extended by the app configs                                                                    |
| `eslint.config.base.js` | The lint rules themselves: rules, style, globals                                                                                                  |
| `eslint.config.js`      | A one-line re-export of the base. Needed because ESLint looks for a standard filename at the root, while the apps import `base` directly          |
| `lint-staged.config.js` | What to run on staged files: `eslint --fix` for js/ts/vue                                                                                         |
| `.npmrc`                | `engine-strict=true` — `pnpm install` refuses to install on an unsupported Node version instead of breaking later at runtime                      |
| `.nvmrc`                | The Node version for `nvm use` — the counterpart to `engines` in the root `package.json`                                                          |
| `.dockerignore`         | What **doesn't** go into the build context: `node_modules`, build output, `.env` (except `.example`). Directly affects image size and build speed |
| `pnpm-lock.yaml`        | A single lockfile for the whole monorepo — a consequence of workspaces. Exact versions of every dependency, transitive ones included              |

TypeScript configs layer by layer — [tsconfig.base.json](./tsconfig-base).

## Where to put new things

| What                             | Where                                                                                              |
| -------------------------------- | -------------------------------------------------------------------------------------------------- |
| A frontend page                  | `apps/frontend/app/pages/` — the route is created from the filename                                |
| An API module                    | `apps/backend/src/modules/<name>/` plus registration in `app.module.ts`                            |
| A type both sides need           | `packages/shared/src/` — otherwise it ends up duplicated                                           |
| A type only one side needs       | inside that application, not in `shared`                                                           |
| A general-purpose Vue component  | `packages/ui/src/components/`                                                                      |
| A frontend-only component        | `apps/frontend/app/components/` — auto-imported by filename                                        |
| A Node script for a pnpm command | `scripts/` plus a line in the root `package.json`                                                  |
| A documentation page             | `apps/docs/guide/` plus the same file in `en/` and `th/` plus an entry in `.vitepress/config/*.ts` |
