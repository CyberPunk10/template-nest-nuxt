# apps/

Three self-contained applications. Each has its own `package.json`, its own `.env` and its own `Dockerfile` — they know nothing about each other beyond HTTP addresses.

```
apps/
├── backend/     NestJS — REST API
├── frontend/    Nuxt 4 — UI and BFF proxy
└── docs/        VitePress — these docs
```

| Application | Dev port | Role |
| --- | --- | --- |
| [backend](./backend/) | `3100` | API, Swagger, environment validation |
| [frontend](./frontend/) | `3200` | SSR interface, proxies API calls |
| [docs](./docs/) | `5173` | Static site; under Docker it's built into the nginx image |

The backend doesn't know about the frontend at all — the link is one-way and HTTP-only. The frontend depends on `@repo/shared` and `@repo/ui`, the backend only on `@repo/shared`.

A neighbour's address depends on how you start things. Under `pnpm dev` all three processes live on the host and find each other by port: Nuxt calls `http://localhost:3100`. Under Docker each sits in its own container, where `localhost` is itself, so it goes by service name: `http://backend:3100`. The swap is done by `environment` in `docker-compose.yml` — the code knows nothing about it.

Only one port faces the outside — the reverse proxy's — see [Reverse proxy](../../reverse-proxy).
