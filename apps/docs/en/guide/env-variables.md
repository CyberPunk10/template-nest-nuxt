# ENV variables

## Files

Four independent `.env` files — one per application plus a root one for Docker:

```
template-nest-nuxt/
├── .env[.example]            ← read by docker-compose.yml
├── apps/
│   ├── backend/
│   │   └── .env[.example]    ← read by NestJS directly
│   ├── frontend/
│   │   └── .env[.example]    ← read by Nuxt directly
│   └── docs/
│       └── .env[.example]    ← VitePress (dotenv in config.ts)
└── ...
```

Each application reads **only its own** `.env`, unaware the others exist. The root `.env` is for docker-compose.

The repository holds only `.env.example` files. Working `.env` files have to be created, and there are three ways:

- **automatically** — the first `pnpm dev` or `pnpm docker:up` creates them under the hood via [`predev.mjs` / `predocker.mjs`](./structure/scripts/);
- **by command** — `pnpm env:copy` creates all four at once without starting anything;
- **by hand** — copy `.env.example` → `.env` in the root and in every `apps/*/`.

Existing files are **never overwritten**: the command only creates the missing ones.

If you specifically want the original values back:

```bash
pnpm env:copy:force
```

::: warning
`pnpm env:copy:force` overwrites `.env` files **entirely** rather than filling in missing lines. Anything you changed by hand is lost.
:::

## Variables by file

- [`.env`](./structure/env-example) — the root one, for docker compose
- [`apps/backend/.env`](./structure/apps/backend/env-example)
- [`apps/frontend/.env`](./structure/apps/frontend/env-example)
- [`apps/docs/.env`](./structure/apps/docs/env-example)

## Ports

The project runs in two ways, and ports mean different things in each.

**`pnpm dev`** — three processes straight on your machine, each with its own port:

```
localhost:3100   backend
localhost:3200   frontend
localhost:5173   docs
```

You open whichever address you need directly. The ports come from `PORT` — one in each `apps/*/.env`.

**Docker** — the same applications in containers, but only **one** port faces outward: the reverse proxy on `80`. It routes requests to the services:

```
localhost/            → frontend
localhost/api/docs    → backend (Swagger)
localhost/dev/docs/   → documentation static files
```

Inside the network the applications still listen on ports, but they're addressed by service name — `http://backend:3100`. From outside those ports are unreachable. They're set in the root `.env`, because Docker Compose needs them, not the applications themselves.

### Summary

| Variable          | File          | What it sets                              |
| ----------------- | ------------- | ----------------------------------------- |
| `PORT`            | `apps/*/.env` | The process port under `pnpm dev`         |
| `*_INTERNAL_PORT` | `.env` (root) | The process port inside the container     |
| `NGINX_HOST_PORT` | `.env` (root) | The only outward-facing port under Docker |

The documentation has no `*_INTERNAL_PORT`: under Docker its static files sit inside the proxy image, so there's no separate process. In dev, VitePress runs its own server — hence `PORT=5173`.

### Why the values can't be merged

The numbers match (3100 and 3200 in both modes), but they mean different things. In dev the port is taken on your machine and another application can claim it. In a container the port lives in an isolated network namespace: nothing to clash with, and it isn't visible from outside anyway.

Practical consequence: if your local 3200 is taken, change `PORT` in `apps/frontend/.env` — Docker is unaffected.

### Why backend and frontend have no host port

`docker-compose.yml` uses `expose` for them rather than `ports`: the port is declared but not forwarded to the host. They're reachable only through the reverse proxy — [why that is](./reverse-proxy#why-the-app-ports-are-closed).

### Why `PORT` from `apps/*/.env` doesn't apply under Docker

The file does reach the container — through `env_file` in compose. But the `environment: PORT` line overrides it at startup: in Compose, `environment` always beats `env_file`.

That's deliberate. Otherwise a local `PORT`, tweaked for your own needs, would travel into the container and break the link with nginx. [Detailed breakdown](./structure/docker-compose#internal-ports).

## CORS_ORIGIN

Of all the variables, this one causes non-obvious breakage most often.

A browser won't let a page on one address read responses from another unless the server explicitly allows it. The permission comes as an `Access-Control-Allow-Origin` header, and the backend takes its value from `CORS_ORIGIN`. The comparison is strict and character-by-character.

The breakage is silent: the server responds **200**, the logs look fine, but in the browser the request is marked as failed and the data never reaches the application. It's easy to hunt through code when the cause is one line in `.env`.

### What the value must match

| Mode       | Value                   | Matches                            |
| ---------- | ----------------------- | ---------------------------------- |
| `pnpm dev` | `http://localhost:3200` | `PORT` in `apps/frontend/.env`     |
| Docker     | `http://localhost`      | `PUBLIC_ORIGIN` in the root `.env` |

Change the frontend port in dev — fix `CORS_ORIGIN` in `apps/backend/.env`. Change the proxy port or deploy to a server — fix `PUBLIC_ORIGIN` in the root `.env` (on a server it's `https://<domain>`).

### Why there's no port under Docker

The browser **omits the standard port**: `:80` for http, `:443` for https. Opening `http://localhost`, it sends `Origin: http://localhost` — no port. A stored `http://localhost:80` wouldn't match, and every API call would be blocked.

### In production the port doesn't participate

Once the frontend and backend move to separate domains:

```
frontend:  https://app.example.com    ← this is what the browser sends
backend:   https://api.example.com
CORS_ORIGIN=https://app.example.com
```

The addresses differ by domain, the port is standard and never appears in the header. `PORT` in `apps/frontend/.env` hasn't gone anywhere — Nuxt still listens on 3200, just behind a proxy.

So the "`CORS_ORIGIN` ↔ frontend port" link only exists while both are on `localhost`.

### How to check

```bash
curl -sI -H "Origin: http://localhost:3200" http://localhost:3100/health | grep -i access-control
```

No `Access-Control-Allow-Origin` with your address means the value is wrong.

## Linked variables

Some variables point at a neighbouring application's port. Change a port — fix whatever looks at it.

**Frontend port** (`PORT` in `apps/frontend/.env`)

- `CORS_ORIGIN` in `apps/backend/.env` — otherwise the backend rejects requests from a different origin
- `DASHBOARD_URL` in `apps/docs/.env` — otherwise the "View demo" button leads nowhere

**Backend port** (`PORT` in `apps/backend/.env`)

- `NUXT_BACKEND_URL` in `apps/frontend/.env` — otherwise SSR can't reach the API

::: tip No links under Docker
There, addresses are service names (`http://backend:3100`), not host ports. Ports only need checking for `pnpm dev`.
:::

## Empty values

Backend variables with defaults (`NODE_ENV`, `APP_ENV`, `PORT`, `SWAGGER_ENABLED`) are marked `.empty('')` in the Joi schema. Writing `FOO=` — the usual way to clear a variable in compose or CI — is treated as "not set", and the default applies.

The required `CORS_ORIGIN` deliberately has no such mark: an empty origin is a configuration error, and the application should fail at startup.
