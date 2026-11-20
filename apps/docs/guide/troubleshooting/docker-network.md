# Не создана Docker-сеть

## Docker не запущен

```
[predocker.mjs] ✗ network: Command failed: docker network create template-nest-nuxt_app
```

Чаще всего не запущен Docker. Проверьте:

```bash
docker info
```

Запустите Docker Desktop или демон (`sudo systemctl start docker`) и повторите `pnpm docker:up`.

## Прямой `docker compose up`

```
network template-nest-nuxt_app declared as external, but could not be found
```

Сеть создают [`predocker.mjs`](../structure/scripts/predocker) перед `pnpm docker:up` и [`db.mjs`](../structure/scripts/db) перед запуском Postgres в `pnpm dev`. При прямом `docker compose up` этот шаг пропускается. Запускайте через `pnpm docker:up` или создайте сеть вручную:

```bash
docker network create template-nest-nuxt_app
```
