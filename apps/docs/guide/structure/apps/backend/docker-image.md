# apps/backend

Собирает NestJS в `dist/`, разворачивает через `pnpm deploy --prod` — итоговый образ содержит только продовые `node_modules` и собранный код, без `pnpm`/исходников.

Все последующие команды выполнять **из корня монорепозитория**.

Собрать образ:

```bash
docker build -f apps/backend/Dockerfile -t backend-preview .
```

Запустить контейнер на порту 3100:

```bash
docker run -d -p 3100:3100 \
  -e PORT=3100 \
  -e CORS_ORIGIN=http://localhost:3200 \
  -e JWT_SECRET=change-me-to-a-random-string-of-at-least-32-characters \
  -e REFRESH_TOKEN_SECRET=change-me-to-another-random-string-of-at-least-32-chars \
  --name backend-preview backend-preview
```

Секреты обязательны: без них Nest не пройдёт валидацию переменных и упадёт на старте.

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
