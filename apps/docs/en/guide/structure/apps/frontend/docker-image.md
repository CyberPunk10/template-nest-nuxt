# apps/frontend

Builds Nuxt into `.output/`. The Nitro standalone server already bundles everything needed to run, so no separate `node_modules` is copied.

All commands below are run **from the monorepo root**.

## Frontend only

The quickest way to check the image builds and starts:

```bash
docker build -f apps/frontend/Dockerfile -t frontend-preview .

docker run -d -p 3200:3200 \
  -e PORT=3200 \
  -e NUXT_PUBLIC_API_BASE=/api/backend \
  --name frontend-preview frontend-preview
```

Check:

```bash
curl http://localhost:3200/api/health
```

Or open: [http://localhost:3200](http://localhost:3200)

Another option is the built-in [HEALTHCHECK](../../../docker/dockerfiles#healthcheck) — Docker polls it on its own:

```bash
docker inspect --format='{{json .State.Health}}' frontend-preview
```

Clean up:

```bash
docker stop frontend-preview
docker rm -f frontend-preview
docker rmi frontend-preview
```

::: warning
With no backend running anywhere, API calls simply won't go through — the frontend itself still works. The frontend's own endpoints (`/api/health`) keep responding.

To see the whole application, bring up the pair with the backend — [see below](#pairing-with-the-backend).
:::

## Pairing with the backend

Nuxt takes the backend address from `NUXT_BACKEND_URL` — in `apps/frontend/.env` it's `http://localhost:3100`. That's correct for `pnpm dev`: both processes run on your machine.

Inside a container the same address won't work: `localhost` there points at the container itself, not at your machine. So the containers have to join a shared network — on it they find each other by name, and the address becomes `http://backend-preview:3100`.

Building the images, creating the network and starting both containers:

```bash
# images
docker build -f apps/backend/Dockerfile -t backend-preview .
docker build -f apps/frontend/Dockerfile -t frontend-preview .

# network
docker network create my-app

# backend — no published port, only the frontend needs it
docker run -d --network my-app --name backend-preview \
  -e PORT=3100 -e CORS_ORIGIN=http://localhost:3200 backend-preview

# frontend — its port is published, that's what we check through
docker run -d --network my-app -p 3200:3200 --name frontend-preview \
  -e PORT=3200 -e NUXT_BACKEND_URL=http://backend-preview:3100 frontend-preview
```

Check both paths:

```bash
curl http://localhost:3200/api/health           # the frontend itself
curl http://localhost:3200/api/backend/health   # through the BFF proxy to the backend
```

Or open [http://localhost:3200](http://localhost:3200)

Clean up everything, network included:

```bash
docker rm -f frontend-preview backend-preview
docker network rm my-app
docker rmi frontend-preview backend-preview
```

::: tip
You don't need any of this for day-to-day work — [docker compose](../../docker-compose) brings up the same pair with one command, with the network and addresses already set up.
:::
