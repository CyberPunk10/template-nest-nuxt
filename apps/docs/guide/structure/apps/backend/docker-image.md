# apps/backend

Собирает NestJS в `dist/`, разворачивает через `pnpm deploy --prod` — итоговый образ содержит только продовые `node_modules` и собранный код, без `pnpm`/исходников.

Все последующие команды выполнять **из корня монорепозитория**.

Собрать образ:

```bash
docker build -f apps/backend/Dockerfile -t backend-preview .
```

## Миграции при старте

Образ запускается через `docker-entrypoint.sh`, а не сразу командой: скрипт применяет миграции и только потом отдаёт управление приложению.

```sh
npx prisma migrate deploy
exec "$@"          # → node dist/main
```

Именно `migrate deploy`, а не `migrate dev`: применяются только pending-миграции, без интерактивных вопросов и без риска пересоздать базу. Поэтому команда безопасна при каждом рестарте контейнера.

Из этого следует, что без доступной БД контейнер не стартует — он упадёт на миграциях. По той же причине `prisma/` и `prisma.config.ts` копируются в финальный образ.

## Одиночный запуск

Сначала поднимаем БД, потом подключаем контейнер к той же сети:

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

`POSTGRES_HOST=postgres` — имя сервиса внутри сети: для контейнера `localhost` означает его самого. Секреты обязательны, без них Nest не пройдёт валидацию переменных и упадёт на старте.

Проверить:

```bash
curl http://localhost:3100/health
```

Или через встроенный [HEALTHCHECK](../../../docker/dockerfiles#healthcheck) — Docker опрашивает его сам, достаточно посмотреть результат:

```bash
docker inspect --format='{{json .State.Health}}' backend-preview
```

Остановить и убрать:

```bash
docker stop backend-preview
docker rm backend-preview
docker rmi backend-preview
```
