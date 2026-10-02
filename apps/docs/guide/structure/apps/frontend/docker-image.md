# apps/frontend

Собирает Nuxt в `.output/`. Nitro standalone-сервер — уже включает всё нужное для запуска, отдельный `node_modules` не копируется.

Все последующие команды выполнять **из корня монорепозитория**.

## Только frontend

Самый быстрый способ проверить, что образ собирается и поднимается:

```bash
docker build -f apps/frontend/Dockerfile -t frontend-preview .

docker run -d -p 3200:3200 \
  -e PORT=3200 \
  -e NUXT_PUBLIC_API_BASE=/api/backend \
  --name frontend-preview frontend-preview
```

Проверить:

```bash
curl http://localhost:3200/api/health
```

Или откройте: [http://localhost:3200](http://localhost:3200)

Ещё вариант — посмотреть результат встроенного [HEALTHCHECK](../../../docker/dockerfiles#healthcheck), Docker опрашивает его сам:

```bash
docker inspect --format='{{json .State.Health}}' frontend-preview
```

Убрать:

```bash
docker stop frontend-preview
docker rm -f frontend-preview
docker rmi frontend-preview
```

::: warning
Если бэкенд нигде не поднят, запросы к API просто не пройдут — сам frontend при этом работает. Эндпоинты самого frontend (`/api/health`) при этом отвечают.

Чтобы посмотреть приложение целиком, поднимите связку с backend — [см. ниже](#связка-с-backend).
:::

## Связка с backend

Адрес бэкенда Nuxt берёт из `NUXT_BACKEND_URL` — в `apps/frontend/.env` там записан `http://localhost:3100`. Для `pnpm dev` это верно: оба процесса запущены на вашей машине.

В контейнере тот же адрес не сработает: `localhost` внутри контейнера указывает на сам контейнер, а не на вашу машину. Поэтому контейнеры должны подключаться к общей сети — в ней они находят друг друга по имени, и адрес становится `http://backend-preview:3100`.

Сборка, создание сети и запуск обоих контейнеров:

```bash
# образы
docker build -f apps/backend/Dockerfile -t backend-preview .
docker build -f apps/frontend/Dockerfile -t frontend-preview .

# сеть
docker network create my-app

# backend — порт наружу не публикуем, он нужен только фронтенду
docker run -d --network my-app --name backend-preview \
  -e PORT=3100 -e CORS_ORIGIN=http://localhost:3200 backend-preview

# frontend — его порт публикуем, через него и проверяем
docker run -d --network my-app -p 3200:3200 --name frontend-preview \
  -e PORT=3200 -e NUXT_BACKEND_URL=http://backend-preview:3100 frontend-preview
```

Проверить оба пути:

```bash
curl http://localhost:3200/api/health           # сам frontend
curl http://localhost:3200/api/backend/health   # через BFF-прокси до backend
```

Или откройте [http://localhost:3200](http://localhost:3200)

Убрать всё, включая сеть:

```bash
docker rm -f frontend-preview backend-preview
docker network rm my-app
docker rmi frontend-preview backend-preview
```

::: tip
Для повседневной работы это делать не нужно — [docker compose](../../docker-compose) поднимает ту же связку одной командой, с готовой сетью и адресами.
:::
