# .env[.example]

Variables for docker compose: the names and ports Compose needs to know **before** the containers start. The applications themselves don't read this file — they have their own `.env`. But when running through Docker, values from here reach the containers via `environment` in `docker-compose.yml`, which takes precedence over `apps/*/.env`.

| Variable                 | Value                    | Comment                                                                                                                                                                                                                                            |
| ------------------------ | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NGINX_HOST_PORT`        | `80`                     | The entry point for all application traffic                                                                                                                                                                                                        |
| `PUBLIC_ORIGIN`          | `http://localhost`       | The address the site is opened at. Passed to the backend as `CORS_ORIGIN`. On a server — `https://<domain>`                                                                                                                                        |
| `NGINX_INTERNAL_PORT`    | `80`                     | The port nginx listens on inside the container                                                                                                                                                                                                     |
| `BACKEND_INTERNAL_PORT`  | `3100`                   | Backend port **inside the container**; not published                                                                                                                                                                                               |
| `FRONTEND_INTERNAL_PORT` | `3200`                   | Frontend port inside the container; not published                                                                                                                                                                                                  |
| `COMPOSE_NETWORK_NAME`   | `template-nest-nuxt_app` | Name of the shared Docker network. Read by both `docker-compose.yml` and `ensure-network.mjs`. The network is declared `external` — Compose doesn't create it, `pnpm docker:up` does — [details](./docker-compose#network)       |
| `POSTGRES_USER`          | `postgres`               | Database user: created when the container initialises, and used by the backend to connect                                                                                                                                                          |
| `POSTGRES_PASSWORD`      | `postgres`               | Password for that user                                                                                                                                                                                                                             |
| `POSTGRES_DB`            | `template`               | Name of the database to create                                                                                                                                                                                                                     |
| `POSTGRES_PORT`          | `5432`                   | Host port of the database container. The only application port published besides the proxy — it's how you reach the database from the host under `pnpm dev`. Published on `127.0.0.1` only: on a server the database isn't reachable from outside. |

The documentation takes no port of its own — its static files are built straight into the reverse proxy image.

## Who reads this

Variables from here fan out to several consumers. Changing them is safer than it looks, since the value is set in one place.

- `BACKEND_INTERNAL_PORT` and `FRONTEND_INTERNAL_PORT` — into the containers' `expose`, into the applications' own `PORT`, into the `NUXT_BACKEND_URL` address for the frontend, and into the nginx config it proxies from.
- `NGINX_INTERNAL_PORT` — into the `listen` directive of the nginx config and into publishing the port outward.
- `POSTGRES_*` — into the database container, under `pnpm dev` too: Postgres always runs in a container, and Compose reads these variables from here. The same values are duplicated in `apps/backend/.env` — Nest reads them itself outside Docker — [details](../database/configuration#root-env).

Under `pnpm dev` the ports from here play no part: ports come from `PORT` in `apps/*/.env` — [both modes explained](../env-variables#ports).

[ENV variables](../env-variables#files).
