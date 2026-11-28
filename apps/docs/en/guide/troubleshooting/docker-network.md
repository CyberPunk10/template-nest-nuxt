# Docker network not created

## Docker isn't running

```
[predocker.mjs] ✗ network: Command failed: docker network create template-nest-nuxt_app
```

Most often Docker isn't running. Check:

```bash
docker info
```

Start Docker Desktop or the daemon (`sudo systemctl start docker`) and run `pnpm docker:up` again.

## Direct `docker compose up`

```
network template-nest-nuxt_app declared as external, but could not be found
```

The network is created by [`predocker.mjs`](../structure/scripts/predocker) before `pnpm docker:up` and by [`db.mjs`](../structure/scripts/db) before starting Postgres in `pnpm dev`. A direct `docker compose up` skips this step. Run it via `pnpm docker:up` or create the network manually:

```bash
docker network create template-nest-nuxt_app
```
