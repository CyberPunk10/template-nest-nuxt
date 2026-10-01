# Running with Docker

The applications run in containers behind a single entry point — the same images that go to deploy.

These are production builds, there is no hot reload, a code change shows up only after a rebuild. For working on the code use [`pnpm dev`](/en/guide/getting-started/run-pnpm).

Before the first run — [Setup](/en/guide/getting-started/setup).

## Cheat sheet

| Task                                                | Command                                                   |
| --------------------------------------------------- | --------------------------------------------------------- |
| First start, and start after code changes           | `pnpm docker:up --build`                                  |
| Start without rebuilding — images are already built | `pnpm docker:up`                                          |
| Start in the background                             | `pnpm docker:up --build -d`                               |
| What's running and in what state                    | `docker compose ps`                                       |
| Follow a service's logs                             | `docker compose logs -f backend`                          |
| Stop                                                | `Ctrl+C`, or `docker compose down` for a background start |

Flags after `pnpm docker:up` are passed to `docker compose up` as is.

::: tip
Without `--build` compose uses the images it already has — fresh code changes won't get into the container. If changes "don't show up", rebuild first.
:::

## Start

```bash
pnpm docker:up --build
```

`pnpm docker:up` isn't just an alias for `docker compose up`: before starting, [`predocker.mjs`](/en/guide/structure/scripts/predocker) runs and creates missing `.env` files, checks the proxy port and sets up the Docker network. That's why the command works right after cloning.

Under the hood it's `docker compose --profile app up`: the application services carry the `app` profile, while the database has none and always comes up — see [profiles](/en/guide/structure/docker-compose#profiles).

Only the reverse proxy faces outward — everything arrives on a single port (`NGINX_HOST_PORT`, `80` by default):

- Application: [http://localhost/](http://localhost/)
- Documentation: [http://localhost/dev/docs/](http://localhost/dev/docs/)
- Swagger UI: [http://localhost/api/docs](http://localhost/api/docs) (when enabled — see `SWAGGER_ENABLED`)

The backend and frontend take no host ports of their own: they aren't reachable from outside, only through the proxy — [why](/en/guide/reverse-proxy#why-the-app-ports-are-closed).

::: warning
Calling Compose directly, bypassing `pnpm docker:up`, works too, but it needs the profile and skips the prep: `docker compose up` without `--profile app` brings up only the database, without the root `.env` it refuses to start (`no port specified`), without `apps/*/.env` it also refuses (`env file ... not found`). If the port is taken, you get a plain Docker `address already in use` error, with no dialog.
:::

## Stopping

```bash
docker compose --profile app down
```

The profile is needed here as well: without it Compose doesn't see the application services and only shuts the database down. To do the opposite — stop the applications and leave the database running:

```bash
docker compose --profile app stop nginx backend frontend
```

The `template-nest-nuxt_app` network survives — it's `external`, compose didn't create it. Remove it manually if you no longer need it:

```bash
docker network rm template-nest-nuxt_app
```

::: warning
`docker compose down --remove-orphans` will also remove containers from neighbouring compose files attached to the same network — for example postgres on the database branches. The data stays in its volume, but the container has to be brought back up.
:::

## A single service

Build and run one container without compose — for a spot check of a single image. Per-service commands are in the [Docker](/en/guide/docker/) section.

## What next

- [Docker](/en/guide/docker/) — how the images are built, `env_file` versus `environment`, `HEALTHCHECK`, `USER node`
- [Reverse proxy](/en/guide/reverse-proxy) — routing, the nginx config, security headers
