# .env[.example]

| Variable                  | Value (dev)        | Comment                                                                                                                                                                                             |
| ------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                | `development`      | App mode. The current `docker-compose.yml` overrides it to `production` — images are built in a production configuration                                                                               |
| `APP_ENV`                 | `development`      | Application-level mode (`development`/`production`/`prod_qa`/`test`). `production` in Docker                                                                                                        |
| `SWAGGER_ENABLED`         | not set            | Whether to serve Swagger UI at `/api/docs`. When unset — enabled everywhere except `production`. Kept separate from `NODE_ENV` so you can open Swagger in prod for diagnostics, or hide it locally   |
| `PORT`                    | `3100`             | Backend port under `pnpm dev`. Overridden by `BACKEND_INTERNAL_PORT` from the root `.env` in Docker                                                                                                 |
| `CORS_ORIGIN`             | `http://localhost:3200` | The frontend origin that requests are allowed from. Overridden to `http://localhost` under Docker — [details](../../../env-variables#cors-origin) |

## Links to other files

Some of these variables are tied to neighbouring applications:

- **`CORS_ORIGIN`** must match the frontend address, i.e. `PORT` in `apps/frontend/.env`. If it doesn't, the browser blocks API calls while the server still answers `200` and the logs stay clean.
- **`PORT`** — `NUXT_BACKEND_URL` in `apps/frontend/.env` points at it: that's the address Nuxt calls during server-side rendering.

Change a port and check both sides. [All the links](../../../env-variables#linked-variables).

How to create a working `.env` — [ENV variables](../../../env-variables#files).
