# apps/backend

Builds NestJS into `dist/` and deploys it with `pnpm deploy --prod` — the resulting image holds only production `node_modules` and compiled code, without `pnpm` or sources.

Run all the commands below **from the monorepo root** (no need to `cd` into /apps/backend).

Build the image:

```bash
docker build -f apps/backend/Dockerfile -t backend-preview .
```

## Migrations on startup

The image starts through `docker-entrypoint.sh` rather than the command directly: the script applies migrations and only then hands over to the application.

```sh
npx prisma migrate deploy
exec "$@"          # → node dist/main
```

`migrate deploy`, not `migrate dev`: only pending migrations are applied, with no interactive questions and no risk of recreating the database. That makes it safe on every container restart.

It follows that the container won't start without a reachable database — it dies on the migrations. For the same reason `prisma/` and `prisma.config.ts` are copied into the final image.

## Running it standalone

Bring the database up first, then attach the container to the same network:

```bash
pnpm db:up
```

```bash
docker run -d -p 3100:3100 \
  --network template-nest-nuxt_app \
  -e PORT=3100 \
  -e CORS_ORIGIN=http://localhost:3200 \
  -e POSTGRES_HOST=postgres \
  -e POSTGRES_PORT=5432 \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=template \
  -e JWT_SECRET=change-me-to-a-random-string-of-at-least-32-characters \
  -e REFRESH_TOKEN_SECRET=change-me-to-another-random-string-of-at-least-32-chars \
  --name backend-preview backend-preview
```

`POSTGRES_HOST=postgres` is the service name inside the network: for the container `localhost` means itself. The secrets are required — without them Nest fails env validation and dies on startup.

Check:

```bash
curl http://localhost:3100/health
```

Or via the built-in [HEALTHCHECK](../../../docker/dockerfiles#healthcheck) — Docker polls it on its own, you just read the result:

```bash
docker inspect --format='{{json .State.Health}}' backend-preview
```

Stop and clean up:

```bash
docker stop backend-preview
docker rm backend-preview
docker rmi backend-preview
```
