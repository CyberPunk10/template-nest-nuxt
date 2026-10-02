# .env[.example]

Variables for docker compose: the names and ports Compose needs to know **before** the containers start. The applications themselves don't read this file — they have their own `.env`. But when running through Docker, values from here reach the containers via `environment` in `docker-compose.yml`, which takes precedence over `apps/*/.env`.

| Variable                 | Value                    | Comment                                                                                                                                                                                                                                            |
| ------------------------ | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NGINX_HOST_PORT`        | `80`                     | The entry point for all application traffic                                                                                                                                                                                                        |
| `PUBLIC_ORIGIN`          | `http://localhost`       | The address the site is opened at. Passed to the backend as `CORS_ORIGIN`. On a server — `https://<domain>`                                                                                                                                        |
| `NGINX_INTERNAL_PORT`    | `80`                     | The port nginx listens on inside the container                                                                                                                                                                                                     |
| `BACKEND_INTERNAL_PORT`  | `3100`                   | Backend port **inside the container**; not published                                                                                                                                                                                               |
| `FRONTEND_INTERNAL_PORT` | `3200`                   | Frontend port inside the container; not published                                                                                                                                                                                                  |
| `COMPOSE_NETWORK_NAME`   | `template-nest-nuxt_app` | Name of the shared Docker network. Read by both `docker-compose.yml` and `ensure-network.mjs`. The network is declared `external` — Compose doesn't create it, `pnpm docker:up` does — [details](/en/guide/structure/docker-compose#network)       |
| `POSTGRES_USER`          | `postgres`               | Database user: created when the container initialises, and used by the backend to connect                                                                                                                                                          |
| `POSTGRES_PASSWORD`      | `postgres`               | Password for that user                                                                                                                                                                                                                             |
| `POSTGRES_DB`            | `template`               | Name of the database to create                                                                                                                                                                                                                     |
| `POSTGRES_PORT`          | `5432`                   | Host port of the database container. The only application port published besides the proxy — it's how you reach the database from the host under `pnpm dev`. Published on `127.0.0.1` only: on a server the database isn't reachable from outside. |

The documentation takes no port of its own — its static files are built straight into the reverse proxy image.

## What from this file is used under `pnpm dev`

Ports — no: the applications run directly on the host, without containers, and read `PORT` from their own `apps/*/.env` — [more on the two modes](/en/guide/env-variables#ports).

`POSTGRES_*` — yes: Postgres always runs in a container, and Compose reads these variables from here. The same values are duplicated in `apps/backend/.env` because Nest reads them itself outside Docker — [details](/en/guide/database/configuration#root-env).

[ENV variables](/en/guide/env-variables#files).
