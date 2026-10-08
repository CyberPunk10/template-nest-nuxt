# Configuration

Database settings live in two `.env` files: the root one is read by Docker Compose, `apps/backend/.env` by Nest and Prisma when running locally.

## `apps/backend/.env`

Database connection parameters for Prisma and the application:

```
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=template
```

## Root `.env`

Database container parameters — read by Docker Compose:

```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=template
POSTGRES_PORT=5432
```

The user, password and database name are duplicated across two files on purpose: the root `.env` is read by Compose, `apps/backend/.env` by Nest when it runs on the host. A containerised backend receives the same values from the root `.env` (see `environment` in `docker-compose.yml`), so they can only drift for the host run.

## If port 5432 is taken

Change it in two files — to the same value:

```
.env                  POSTGRES_PORT=5435
apps/backend/.env     POSTGRES_PORT=5435
```

The root `.env` sets the port the database container is published on, on the host machine. The second one is needed when the backend runs through `pnpm dev`: it tells Nest and Prisma which port to connect to.

When the backend itself runs in a container, that second file isn't used at all: compose gives it `postgres:5432`, the service name and port inside the network. The host mapping plays no part there.
