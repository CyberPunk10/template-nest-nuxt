# .env[.example]

| Variable                         | Value (dev)                       | Comment                                                                                                                                          |
| -------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PORT`                           | `3200`                            | Frontend port under `pnpm dev`. Overridden by `FRONTEND_INTERNAL_PORT` from the root `.env` in Docker                                            |
| `NUXT_PUBLIC_API_BASE`           | `/api/backend`                    | Prefix for the server-side proxy to the backend (the browser hits this, not the backend directly)                                                |
| `NUXT_BACKEND_URL`               | `http://localhost:3100`           | Backend address for Nuxt SSR (server side). Overridden to `http://backend:${BACKEND_INTERNAL_PORT}` in Docker — by service name, `localhost` is unreachable inside the network |
| `NUXT_PUBLIC_APP_ENV`            | `development`                     | Environment mode on the client. `production` in Docker                                                                                           |
| `NUXT_PUBLIC_DOCS_URL`           | `http://localhost:5173/dev/docs/` | Link to the documentation (menu item, DevPanel). A relative `/dev/docs/` in Docker: the same proxy serves the docs, so the link points at the current origin |

The backend address for DevPanel links and the Swagger flag are **not** stored on the frontend: it asks the backend for both via `/dev/config`. Otherwise the same values would live in two places and need manual syncing — and the address also differs between `pnpm dev` and Docker.

## Links to other files

The frontend knows both neighbours' addresses, and they in turn reference its own port:

- **`PORT`** — `CORS_ORIGIN` in `apps/backend/.env` points at it (otherwise the backend rejects requests), and so does `DASHBOARD_URL` in `apps/docs/.env` (otherwise the "View demo" button leads nowhere).
- **`NUXT_BACKEND_URL`** must point at `PORT` from `apps/backend/.env` — otherwise SSR can't reach the API.
- **`NUXT_PUBLIC_DOCS_URL`** must point at `PORT` from `apps/docs/.env`, together with the `/dev/docs/` path.

Change a port and check both sides. [All the links](../../../env-variables#linked-variables).

How to create a working `.env` — [ENV variables](../../../env-variables#files).
