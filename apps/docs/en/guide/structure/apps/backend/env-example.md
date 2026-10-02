# .env[.example]

| Variable                  | Value (dev)        | Comment                                                                                                                                                                                             |
| ------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                | `development`      | App mode. The current `docker-compose.yml` overrides it to `production` — images are built in a production configuration                                                                               |
| `APP_ENV`                 | `development`      | Application-level mode (`development`/`production`/`prod_qa`/`test`). `production` in Docker                                                                                                        |
| `SWAGGER_ENABLED`         | not set            | Whether to serve Swagger UI at `/api/docs`. When unset — enabled everywhere except `production`. Kept separate from `NODE_ENV` so you can open Swagger in prod for diagnostics, or hide it locally   |
| `PORT`                    | `3100`             | Backend port under `pnpm dev`. Overridden by `BACKEND_INTERNAL_PORT` from the root `.env` in Docker                                                                                                 |
| `CORS_ORIGIN`             | `http://localhost:3200` | The frontend origin that requests are allowed from. Overridden to `http://localhost` under Docker — [details](/en/guide/env-variables#cors-origin) |

## PostgreSQL

| Variable            | Value (dev) | Comment                                                                                                          |
| ------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------ |
| `POSTGRES_HOST`     | `localhost` | Required. Overridden to `postgres` inside a container — the service name on the network                            |
| `POSTGRES_PORT`     | `5432`      | Must match `POSTGRES_PORT` in the root `.env`, which sets the published host port. Always `5432` inside a container |
| `POSTGRES_USER`     | `postgres`  | Required. Inside a container it comes from the root `.env` — the same place the database container takes it from    |
| `POSTGRES_PASSWORD` | `postgres`  | Required, same source                                                                                              |
| `POSTGRES_DB`       | `template`  | Required, same source                                                                                              |

These values are duplicated in the root `.env` on purpose: that one is read by Compose, this one by Nest on the host. [Details](/en/guide/database/configuration#root-env).

## Authentication

| Variable                     | Value (dev) | Comment                                                                                                    |
| ---------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------ |
| `JWT_SECRET`                 | placeholder | Required, at least 32 characters. Signs the access token — **change before production**                      |
| `JWT_EXPIRES_IN`             | `15m`       | Access token lifetime, format `<number><s\|m\|h\|d>`                                                        |
| `REFRESH_TOKEN_SECRET`       | placeholder | Required, at least 32 characters. A secret separate from `JWT_SECRET` — **change before production**         |
| `REFRESH_TOKEN_EXPIRES_DAYS` | `7`         | Refresh token lifetime in days                                                                               |
| `BCRYPT_ROUNDS`              | `12`        | Password hashing cost, 4–20. Use ≥ 12 in production; dropping to 4 only makes sense in tests, for speed      |

## Other

| Variable         | Value (dev)         | Comment                                                                                                |
| ---------------- | ------------------- | -------------------------------------------------------------------------------------------------------- |
| `THROTTLE_TTL`   | `60000`             | Rate limiting window in milliseconds, per IP                                                             |
| `THROTTLE_LIMIT` | `100`               | Maximum requests per window                                                                              |
| `ADMIN_EMAIL`    | `admin@example.com` | The admin is created when the application starts. Leave it unset and creation is skipped                 |
| `ADMIN_PASSWORD` | `password`          | That admin's password. Hashed with `BCRYPT_ROUNDS`; a restart leaves an existing admin alone             |

## Links to other files

Some of these variables are tied to neighbouring applications:

- **`CORS_ORIGIN`** must match the frontend address, i.e. `PORT` in `apps/frontend/.env`. If it doesn't, the browser blocks API calls while the server still answers `200` and the logs stay clean.
- **`PORT`** — `NUXT_BACKEND_URL` in `apps/frontend/.env` points at it: that's the address Nuxt calls during server-side rendering.

Change a port and check both sides. [All the links](/en/guide/env-variables#linked-variables).

How to create a working `.env` — [ENV variables](/en/guide/env-variables#files).
