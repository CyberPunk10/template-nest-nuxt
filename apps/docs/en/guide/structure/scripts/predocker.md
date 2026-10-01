# predocker.mjs

Runs automatically before `pnpm docker:up` — via the npm `pre*` convention.

It does three things:

1. **Copies `.env.example` → `.env`** for all four files at once (root, `apps/backend`, `apps/frontend`, `apps/docs`) — via the shared `copyEnvFiles()` from [`copy-env.mjs`](/en/guide/structure/scripts/copy-env).
2. **Checks the port and resolves conflicts** — via the shared `checkPorts()` from [`check-ports.mjs`](/en/guide/structure/scripts/check-ports). On conflict it offers a dialog: kill the process holding the port or abort the run.
3. **Creates the Docker network** if it doesn't exist yet — via [`ensure-network.mjs`](/en/guide/structure/scripts/ensure-network). The name comes from `COMPOSE_NETWORK_NAME` in the root `.env` — the same source `docker-compose.yml` reads. Repeat runs do nothing.

The port checked is the single host one — `NGINX_HOST_PORT` from the root `.env`: only the reverse proxy is published, the other services live on the internal network and take no host ports.

::: warning
This only runs before `pnpm docker:up`, not before a direct `docker compose up`. If you call `docker compose up` directly, bypassing the npm wrapper, on a fresh clone without `.env` files — the command refuses to start: the port variables in `docker-compose.yml` have no defaults (`no port specified` without a root `.env`), and `env_file` for `apps/*/.env` is required by default (`env file ... not found`). There's also no explicit port-conflict check — if a host port is taken, you'll get a plain Docker `address already in use` error, with no dialog offering to free it up. Create the missing `.env` files ahead of time, without running anything: `pnpm env:copy`.
:::

The local-development counterpart — [`predev.mjs`](/en/guide/structure/scripts/predev).

## What it prints

Each step prints a line with its result:

```
[predocker.mjs] ✓ .env: files in place
[predocker.mjs] ✓ ports: nginx 80
[predocker.mjs] ✓ network: template-nest-nuxt_app created
```

If a step fails — a line with ✗ and the step name, and preparation stops there:

```
[predocker.mjs] ✗ network: Command failed: docker network create template-nest-nuxt_app
```

| Step      | What to check                                  | Repeat on its own                              |
| --------- | ---------------------------------------------- | ---------------------------------------------- |
| `.env`    | that `.env.example` exists next to the `.env`  | `pnpm env:copy`                                |
| `ports`   | the `NGINX_HOST_PORT` value in the root `.env` | `pnpm predocker:up`                            |
| `network` | that Docker is running                         | `docker network create template-nest-nuxt_app` |

## Usage

It runs on its own — no need to call it separately:

```bash
pnpm docker:up
```

npm sees the `predocker:up` script and runs it before `docker:up`. To run only the preparation, without starting the containers:

```bash
pnpm predocker:up
```
