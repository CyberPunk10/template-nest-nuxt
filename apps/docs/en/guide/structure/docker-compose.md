# docker compose

`docker-compose.yml` brings up `nginx`, `backend` and `frontend` on a shared network.

The documentation isn't a service of its own: `docs-builder` compiles its static output and the same `nginx` serves it — more in [apps/docs](./apps/docs/docker-image).

## Start

The usual way is the standard Compose command:

```bash
docker compose up
```

On a fresh clone it won't work right away, though: the `.env` files and the Docker network are missing, and the proxy port may be taken.

To avoid doing that by hand, there's a script:

```bash
pnpm docker:up
```

Before starting it calls [`predocker.mjs`](./scripts/predocker), which creates the missing `.env` files, checks the proxy port and sets up the network — and then hands over to the same `docker compose up`. That's why one command is enough right after cloning.

Once the environment is prepared there's no difference: you can use `docker compose` directly. Commands run **from the monorepo root**, and the `--build` flag rebuilds the images before starting.

After startup everything is available on a single port:

- Application: [http://localhost/](http://localhost/)
- Documentation: [http://localhost/dev/docs/](http://localhost/dev/docs/)
- Swagger UI: [http://localhost/api/docs](http://localhost/api/docs) (when enabled — see `SWAGGER_ENABLED`)

## Network

The network is declared `external: true` — `docker compose` **does not create** it, it expects it to exist:

```bash
docker network create template-nest-nuxt_app
```

Without it, a plain `docker compose up` fails with `network ... declared as external, but could not be found`. When started via `pnpm docker:up`, the network is created automatically.

The name comes from `COMPOSE_NETWORK_NAME` in the root `.env` — read by both `docker-compose.yml` and `ensure-network.mjs`. If the variable is missing, both sides say so explicitly.

Why external instead of Compose-managed: containers from **other** compose files attach to it — for example `docker-compose.dev.yml` with postgres on the database branches. No single file owns the network, so it's created from outside; otherwise startup order would start to matter.

## Stopping

```bash
docker compose down
```

The `template-nest-nuxt_app` network survives this (it's `external`; compose didn't create it, so it won't remove it). Delete it manually if you no longer need it:

```bash
docker network rm template-nest-nuxt_app
```

::: warning
`docker compose down --remove-orphans` will also remove containers from neighbouring compose files attached to the same network — for example postgres on the database branches. The data stays in its volume, but the container has to be brought back up.
:::

## All .env files are mandatory

Without the root `.env`, `docker compose up` refuses to start (`no port specified`). Without `apps/backend/.env`/`apps/frontend/.env` — it also refuses, with `env file ... not found`. Neither is silently defaulted — that's a deliberate choice, not forgotten defaults.

The repo holds only `.env.example` files. The working `.env` files can be created by hand or with a command:

```bash
pnpm env:copy
```

More detail — see [ENV variables](../env-variables#files).

## `env_file` and overrides

`backend` and `frontend` pull in their `apps/*/.env` via `env_file:` — the same file `pnpm dev` uses.

```yaml
backend:
  env_file: apps/backend/.env
```

The `.env` files are mandatory — without them `docker compose up` refuses to start (`env file ... not found`).

Sometimes a value must **differ** under Docker — take `NUXT_BACKEND_URL`: in `apps/frontend/.env` it's `http://localhost:3100` (correct for `pnpm dev`, where everything runs on the host), but inside the Docker network `localhost` for the frontend container is the container itself, not the backend. For such cases `environment:` in `docker-compose.yml` **explicitly overrides** the file value — `environment:` always beats `env_file:`:

```yaml
frontend:
  env_file: apps/frontend/.env
  environment:
    NUXT_BACKEND_URL: http://backend:3100   # overrides localhost:3100 from .env
```

The same mechanism switches the Docker run into production mode:

```yaml
backend:
  environment:
    NODE_ENV: production   # apps/backend/.env holds development — that's for pnpm dev
```

For details on which variables match and which get overridden — see [ENV variables](../env-variables).

## Internal ports

Only the proxy publishes a host port. The applications have just an internal one — it comes from the root `.env`:

```yaml
backend:
  expose:
    - '${BACKEND_INTERNAL_PORT}'
  env_file: apps/backend/.env
  environment:
    PORT: '${BACKEND_INTERNAL_PORT}'   # overrides PORT from .env
```

It looks odd: `PORT` is already in `apps/backend/.env`, so why set it a second time through `BACKEND_INTERNAL_PORT`?

The reason is that Compose and the container read variables at different times:

| Who reads               | From                       | When                                            |
| ----------------------- | -------------------------- | ----------------------------------------------- |
| Compose                 | the root `.env`            | while reading `docker-compose.yml` — before startup |
| The process in the container | `env_file` + `environment` | when the container starts                   |

Compose substitutes `${BACKEND_INTERNAL_PORT}` at a moment when the container doesn't exist yet — which means it can't see the contents of `apps/backend/.env` either: that file goes inside later. So everything Compose itself needs lives in the root `.env`.

**What this means in practice.** The container port is set in the root `.env`:

```bash
BACKEND_INTERNAL_PORT=3100
```

And `PORT` in `apps/backend/.env` has no effect under Docker: the `environment: PORT` line overrides it at startup, because `environment` in Compose always beats `env_file`. That `PORT` serves a different purpose — running via `pnpm dev`, where Docker isn't involved.
