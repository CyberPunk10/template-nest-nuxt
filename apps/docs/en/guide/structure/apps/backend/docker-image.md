# apps/backend

Builds NestJS into `dist/` and deploys it with `pnpm deploy --prod` — the resulting image holds only production `node_modules` and compiled code, without `pnpm` or sources.

Run all the commands below **from the monorepo root** (no need to `cd` into /apps/backend).

Build the image:

```bash
docker build -f apps/backend/Dockerfile -t backend-preview .
```

Run the container on port 3100:

```bash
docker run -d -p 3100:3100 \
  -e PORT=3100 \
  -e CORS_ORIGIN=http://localhost:3200 \
  --name backend-preview backend-preview
```

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
